use thiserror::Error;

/// Rate limit information extracted from Semaphore API response headers.
#[derive(Debug, Clone)]
pub struct RateLimitInfo {
    /// Maximum requests allowed per window.
    pub limit: Option<u64>,
    /// Remaining requests in the current window.
    pub remaining: Option<u64>,
    /// Seconds until the rate limit window resets.
    pub retry_after: Option<u64>,
}

/// All possible errors from the Semaphore SMS client.
#[derive(Debug, Error)]
pub enum SemaphoreError {
    /// Client-side validation failed before sending the request.
    /// This covers: "TEST" prefix, too many recipients, invalid phone numbers, etc.
    #[error("Validation error: {0}")]
    Validation(String),

    /// HTTP transport or connection error.
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    /// The API returned a non-2xx status code.
    #[error("API error (HTTP {status}): {body}")]
    Api { status: u16, body: String },

    /// The API returned HTTP 429 (Too Many Requests).
    #[error("Rate limited. Retry after {retry_after:?} seconds")]
    RateLimited { retry_after: Option<u64> },

    /// Failed to deserialize the JSON response.
    #[error("Deserialization error: {0}")]
    Deserialize(String),
}

impl RateLimitInfo {
    /// Parse rate limit info from HTTP response headers.
    pub fn from_headers(headers: &reqwest::header::HeaderMap) -> Self {
        Self {
            limit: headers
                .get("X-RateLimit-Limit")
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.parse().ok()),
            remaining: headers
                .get("X-RateLimit-Remaining")
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.parse().ok()),
            retry_after: headers
                .get("Retry-After")
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.parse().ok()),
        }
    }
}
