use reqwest::Client;

use crate::error::{RateLimitInfo, SemaphoreError};
use crate::models::*;
use crate::validation::{sanitize_phone_number, validate_message, validate_recipients, MAX_RECIPIENTS};

const DEFAULT_BASE_URL: &str = "https://api.semaphore.co/api/v4";

/// Client for the Semaphore.co SMS API.
///
/// # Example
/// ```no_run
/// # async fn demo() -> Result<(), semaphore_sms::SemaphoreError> {
/// use semaphore_sms::SemaphoreClient;
///
/// let client = SemaphoreClient::new("YOUR_API_KEY")
///     .with_sender_name("MySender");
///
/// let responses = client
///     .send_message(&["09171234567"], "Hello from Rust!")
///     .await?;
///
/// println!("Sent: {:?}", responses);
/// # Ok(())
/// # }
/// ```
#[derive(Debug, Clone)]
pub struct SemaphoreClient {
    api_key: String,
    sender_name: Option<String>,
    http: Client,
    base_url: String,
}

impl SemaphoreClient {
    /// Create a new client with the given API key.
    pub fn new(api_key: impl Into<String>) -> Self {
        Self {
            api_key: api_key.into(),
            sender_name: None,
            http: Client::new(),
            base_url: DEFAULT_BASE_URL.to_string(),
        }
    }

    /// Set the default sender name for all messages.
    pub fn with_sender_name(mut self, name: impl Into<String>) -> Self {
        self.sender_name = Some(name.into());
        self
    }

    /// Override the base URL (useful for testing with a mock server).
    pub fn with_base_url(mut self, url: impl Into<String>) -> Self {
        self.base_url = url.into();
        self
    }

    /// Provide a custom `reqwest::Client` (e.g. with custom timeouts/proxy).
    pub fn with_http_client(mut self, client: Client) -> Self {
        self.http = client;
        self
    }

    // -----------------------------------------------------------------------
    // Sending messages
    // -----------------------------------------------------------------------

    /// Send a regular SMS to one or more recipients.
    ///
    /// - Validates the message body (rejects "TEST" prefix).
    /// - Validates all phone numbers (PH format).
    /// - Enforces the 1000-recipient limit per call.
    ///
    /// For more than 1000 recipients, use [`send_bulk`](Self::send_bulk).
    pub async fn send_message(
        &self,
        numbers: &[impl AsRef<str>],
        message: &str,
    ) -> Result<Vec<MessageResponse>, SemaphoreError> {
        self.send_message_impl(numbers, message, self.sender_name.as_deref(), false)
            .await
    }

    /// Send a regular SMS with a specific sender name (overrides the default).
    pub async fn send_message_with_sender(
        &self,
        numbers: &[impl AsRef<str>],
        message: &str,
        sender_name: &str,
    ) -> Result<Vec<MessageResponse>, SemaphoreError> {
        self.send_message_impl(numbers, message, Some(sender_name), false)
            .await
    }

    /// Send a priority SMS that bypasses the default queue.
    ///
    /// Costs 2 credits per 160-character segment.
    /// This endpoint is **not rate limited**.
    pub async fn send_priority(
        &self,
        numbers: &[impl AsRef<str>],
        message: &str,
    ) -> Result<Vec<MessageResponse>, SemaphoreError> {
        self.send_message_impl(numbers, message, self.sender_name.as_deref(), true)
            .await
    }

    /// Send to any number of recipients, auto-chunking into batches of 1000.
    ///
    /// This is the preferred method for large recipient lists. It avoids
    /// making one API call per recipient (which would hit rate limits).
    pub async fn send_bulk(
        &self,
        numbers: &[impl AsRef<str>],
        message: &str,
    ) -> Result<Vec<MessageResponse>, SemaphoreError> {
        validate_message(message)?;

        let sanitized: Vec<String> = numbers
            .iter()
            .map(|n| sanitize_phone_number(n.as_ref()))
            .collect();

        // Validate all numbers first
        for num in &sanitized {
            crate::validation::validate_phone_number(num)?;
        }

        let mut all_responses = Vec::new();

        for chunk in sanitized.chunks(MAX_RECIPIENTS) {
            let number_csv = chunk.join(",");
            let params = SendMessageParams {
                number: number_csv,
                message: message.to_string(),
                sendername: self.sender_name.clone(),
            };
            let mut responses: Vec<MessageResponse> = self
                .post_form(&format!("{}/messages", self.base_url), &params)
                .await?;
            all_responses.append(&mut responses);
        }

        Ok(all_responses)
    }

    /// Send an OTP message. Semaphore auto-generates the code.
    ///
    /// Use `{otp}` as a placeholder in the message body. If absent, the OTP
    /// is appended automatically.
    ///
    /// Costs 2 credits per 160-character segment.
    /// This endpoint is **not rate limited**.
    ///
    /// **Important:** Only use this for genuine OTP traffic.
    pub async fn send_otp(
        &self,
        number: &str,
        message: &str,
    ) -> Result<Vec<OtpMessageResponse>, SemaphoreError> {
        self.send_otp_impl(number, message, None).await
    }

    /// Send an OTP message with a custom code you supply.
    pub async fn send_otp_with_code(
        &self,
        number: &str,
        message: &str,
        code: &str,
    ) -> Result<Vec<OtpMessageResponse>, SemaphoreError> {
        self.send_otp_impl(number, message, Some(code)).await
    }

    // -----------------------------------------------------------------------
    // Retrieving messages
    // -----------------------------------------------------------------------

    /// Retrieve outgoing SMS messages with optional filters.
    ///
    /// Rate limited to **30 calls/minute**.
    pub async fn get_messages(
        &self,
        query: &GetMessagesQuery,
    ) -> Result<Vec<MessageResponse>, SemaphoreError> {
        let mut params: Vec<(String, String)> = vec![("apikey".into(), self.api_key.clone())];

        if let Some(limit) = query.limit {
            params.push(("limit".into(), limit.to_string()));
        }
        if let Some(page) = query.page {
            params.push(("page".into(), page.to_string()));
        }
        if let Some(ref start) = query.start_date {
            params.push(("startDate".into(), start.clone()));
        }
        if let Some(ref end) = query.end_date {
            params.push(("endDate".into(), end.clone()));
        }
        if let Some(ref network) = query.network {
            params.push(("network".into(), network.clone()));
        }
        if let Some(ref status) = query.status {
            params.push(("status".into(), status.clone()));
        }

        let resp = self
            .http
            .get(&format!("{}/messages", self.base_url))
            .query(&params)
            .send()
            .await?;

        self.handle_response(resp).await
    }

    /// Retrieve a single message by its unique ID.
    pub async fn get_message(&self, id: u64) -> Result<MessageResponse, SemaphoreError> {
        let resp = self
            .http
            .get(&format!("{}/messages/{}", self.base_url, id))
            .query(&[("apikey", &self.api_key)])
            .send()
            .await?;

        self.handle_response(resp).await
    }

    // -----------------------------------------------------------------------
    // Account endpoints
    // -----------------------------------------------------------------------

    /// Retrieve basic account information (balance, status, etc.).
    ///
    /// Rate limited to **2 calls/minute**.
    pub async fn get_account(&self) -> Result<AccountResponse, SemaphoreError> {
        let resp = self
            .http
            .get(&format!("{}/account", self.base_url))
            .query(&[("apikey", &self.api_key)])
            .send()
            .await?;

        self.handle_response(resp).await
    }

    /// Retrieve account transactions.
    ///
    /// Rate limited to **2 calls/minute**.
    pub async fn get_transactions(
        &self,
        query: &PaginationQuery,
    ) -> Result<Vec<TransactionResponse>, SemaphoreError> {
        self.get_paginated("account/transactions", query).await
    }

    /// Retrieve sender names associated with the account.
    ///
    /// Rate limited to **2 calls/minute**.
    pub async fn get_sender_names(
        &self,
        query: &PaginationQuery,
    ) -> Result<Vec<SenderNameResponse>, SemaphoreError> {
        self.get_paginated("account/sendernames", query).await
    }

    /// Retrieve users associated with the account.
    ///
    /// Rate limited to **2 calls/minute**.
    pub async fn get_users(
        &self,
        query: &PaginationQuery,
    ) -> Result<Vec<UserResponse>, SemaphoreError> {
        self.get_paginated("account/users", query).await
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    async fn send_message_impl(
        &self,
        numbers: &[impl AsRef<str>],
        message: &str,
        sender_name: Option<&str>,
        priority: bool,
    ) -> Result<Vec<MessageResponse>, SemaphoreError> {
        validate_message(message)?;

        let sanitized: Vec<String> = numbers
            .iter()
            .map(|n| sanitize_phone_number(n.as_ref()))
            .collect();

        validate_recipients(&sanitized)?;

        let number_csv = sanitized.join(",");
        let params = SendMessageParams {
            number: number_csv,
            message: message.to_string(),
            sendername: sender_name.map(String::from),
        };

        let endpoint = if priority { "priority" } else { "messages" };
        self.post_form(&format!("{}/{}", self.base_url, endpoint), &params)
            .await
    }

    async fn send_otp_impl(
        &self,
        number: &str,
        message: &str,
        code: Option<&str>,
    ) -> Result<Vec<OtpMessageResponse>, SemaphoreError> {
        validate_message(message)?;
        crate::validation::validate_phone_number(&sanitize_phone_number(number))?;

        let params = SendOtpParams {
            number: sanitize_phone_number(number),
            message: message.to_string(),
            sendername: self.sender_name.clone(),
            code: code.map(String::from),
        };

        self.post_form(&format!("{}/otp", self.base_url), &params)
            .await
    }

    /// POST a form-encoded body and deserialize the JSON response.
    async fn post_form<P: serde::Serialize, R: serde::de::DeserializeOwned>(
        &self,
        url: &str,
        params: &P,
    ) -> Result<R, SemaphoreError> {
        // Build the form body: start with apikey, then merge the struct fields.
        let mut form_params = vec![("apikey".to_string(), self.api_key.clone())];

        // Serialize the params struct to a flat key=value map via serde_json.
        let value = serde_json::to_value(params)
            .map_err(|e| SemaphoreError::Deserialize(e.to_string()))?;

        if let serde_json::Value::Object(map) = value {
            for (k, v) in map {
                let string_val = match v {
                    serde_json::Value::String(s) => s,
                    serde_json::Value::Null => continue,
                    other => other.to_string(),
                };
                form_params.push((k, string_val));
            }
        }

        let resp = self.http.post(url).form(&form_params).send().await?;

        self.handle_response(resp).await
    }

    /// Handle a response: check for rate limiting and errors, then deserialize.
    async fn handle_response<R: serde::de::DeserializeOwned>(
        &self,
        resp: reqwest::Response,
    ) -> Result<R, SemaphoreError> {
        let status = resp.status();
        let rate_limit = RateLimitInfo::from_headers(resp.headers());

        if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
            return Err(SemaphoreError::RateLimited {
                retry_after: rate_limit.retry_after,
            });
        }

        if !status.is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(SemaphoreError::Api {
                status: status.as_u16(),
                body,
            });
        }

        let body = resp.text().await?;
        serde_json::from_str(&body).map_err(|e| {
            SemaphoreError::Deserialize(format!("{e} — raw body: {body}"))
        })
    }

    /// GET a paginated account sub-endpoint.
    async fn get_paginated<R: serde::de::DeserializeOwned>(
        &self,
        path: &str,
        query: &PaginationQuery,
    ) -> Result<R, SemaphoreError> {
        let mut params: Vec<(String, String)> = vec![("apikey".into(), self.api_key.clone())];

        if let Some(limit) = query.limit {
            params.push(("limit".into(), limit.to_string()));
        }
        if let Some(page) = query.page {
            params.push(("page".into(), page.to_string()));
        }

        let resp = self
            .http
            .get(&format!("{}/{}", self.base_url, path))
            .query(&params)
            .send()
            .await?;

        self.handle_response(resp).await
    }
}
