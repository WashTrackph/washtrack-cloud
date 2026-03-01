use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

/// Parameters for sending a regular or priority SMS.
#[derive(Debug, Clone, Serialize)]
pub struct SendMessageParams {
    /// Comma-separated recipient phone numbers (max 1000).
    pub number: String,
    /// Message body (auto-split at 160 ASCII characters by Semaphore).
    pub message: String,
    /// Sender name displayed to the recipient. Defaults to "SEMAPHORE" if omitted.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sendername: Option<String>,
}

/// Parameters for sending an OTP SMS.
#[derive(Debug, Clone, Serialize)]
pub struct SendOtpParams {
    /// Single recipient phone number.
    pub number: String,
    /// Message body. Use `{otp}` as a placeholder for the auto-generated code.
    /// If omitted, the OTP is appended automatically.
    pub message: String,
    /// Sender name displayed to the recipient.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sendername: Option<String>,
    /// Supply your own OTP code instead of using the auto-generated one.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
}

/// Query parameters for retrieving messages via GET /messages.
#[derive(Debug, Clone, Default, Serialize)]
pub struct GetMessagesQuery {
    /// Number of messages per page (default 100, max 1000).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<u32>,
    /// Page number (default 1).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub page: Option<u32>,
    /// Start date filter, format "YYYY-MM-DD".
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "startDate")]
    pub start_date: Option<String>,
    /// End date filter, format "YYYY-MM-DD".
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "endDate")]
    pub end_date: Option<String>,
    /// Filter by network (e.g. "globe", "smart"). Lowercase.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub network: Option<String>,
    /// Filter by status (e.g. "pending", "success"). Lowercase.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
}

/// Query parameters for paginated account sub-endpoints (transactions, sendernames, users).
#[derive(Debug, Clone, Default, Serialize)]
pub struct PaginationQuery {
    /// Number of results per page (default 100, max 1000).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<u32>,
    /// Page number (default 1).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub page: Option<u32>,
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

/// The status of an SMS message in the Semaphore system.
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub enum MessageStatus {
    Queued,
    Pending,
    Sent,
    Failed,
    Refunded,
    /// Catch-all for any status value not yet modelled.
    #[serde(untagged)]
    Other(String),
}

/// The type/queue of a message.
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub enum MessageType {
    Single,
    Bulk,
    Priority,
    /// Catch-all.
    #[serde(untagged)]
    Other(String),
}

/// A single message as returned by the Semaphore API.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct MessageResponse {
    pub message_id: u64,
    pub user_id: u64,
    pub user: String,
    pub account_id: u64,
    pub account: String,
    pub recipient: String,
    pub message: String,
    pub sender_name: String,
    pub network: String,
    pub status: MessageStatus,
    #[serde(rename = "type")]
    pub message_type: MessageType,
    pub source: String,
    pub created_at: String,
    pub updated_at: String,
}

/// A single OTP message response. Identical to [`MessageResponse`] plus the OTP code.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct OtpMessageResponse {
    pub message_id: u64,
    pub user_id: u64,
    pub user: String,
    pub account_id: u64,
    pub account: String,
    pub recipient: String,
    pub message: String,
    /// The OTP code (auto-generated or the one you supplied).
    pub code: serde_json::Value,
    pub sender_name: String,
    pub network: String,
    pub status: MessageStatus,
    #[serde(rename = "type")]
    pub message_type: MessageType,
    pub source: String,
    pub created_at: String,
    pub updated_at: String,
}

/// Account information returned by GET /account.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AccountResponse {
    pub account_id: u64,
    pub account_name: String,
    pub status: String,
    pub credit_balance: serde_json::Value,
}

/// A transaction record returned by GET /account/transactions.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct TransactionResponse {
    pub account_id: u64,
    pub account_name: String,
    pub status: String,
    pub credit_balance: serde_json::Value,
}

/// A sender name entry returned by GET /account/sendernames.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SenderNameResponse {
    pub name: String,
    pub status: String,
    pub created_at: String,
}

/// A user entry returned by GET /account/users.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct UserResponse {
    pub user_id: u64,
    pub email: String,
    pub role: String,
    pub status: String,
}
