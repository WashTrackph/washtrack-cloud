//! Tauri command wrappers for the Semaphore SMS client.
//!
//! These are feature-gated behind `features = ["tauri"]` and designed to be
//! registered directly in the Tauri app's `invoke_handler`.

use serde::Deserialize;

use crate::client::SemaphoreClient;
use crate::models::{GetMessagesQuery, PaginationQuery};

// ---------------------------------------------------------------------------
// Payload structs (received from the TypeScript frontend)
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct SendSmsPayload {
    pub api_key: String,
    /// Comma-separated or single phone number(s).
    pub number: String,
    pub message: String,
    pub sender_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SendOtpPayload {
    pub api_key: String,
    pub number: String,
    pub message: String,
    pub sender_name: Option<String>,
    /// Optional custom OTP code. If omitted, Semaphore generates one.
    pub code: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GetMessagesPayload {
    pub api_key: String,
    pub limit: Option<u32>,
    pub page: Option<u32>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub network: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GetMessageByIdPayload {
    pub api_key: String,
    pub message_id: u64,
}

#[derive(Debug, Deserialize)]
pub struct AccountPayload {
    pub api_key: String,
}

#[derive(Debug, Deserialize)]
pub struct PaginatedAccountPayload {
    pub api_key: String,
    pub limit: Option<u32>,
    pub page: Option<u32>,
}

// ---------------------------------------------------------------------------
// Helper to build a client from a payload
// ---------------------------------------------------------------------------

fn build_client(api_key: &str, sender_name: Option<&str>) -> SemaphoreClient {
    let mut client = SemaphoreClient::new(api_key);
    if let Some(name) = sender_name {
        client = client.with_sender_name(name);
    }
    client
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

/// Send a regular SMS to one or more PH numbers.
#[tauri::command]
pub async fn send_sms(payload: SendSmsPayload) -> Result<String, String> {
    let client = build_client(&payload.api_key, payload.sender_name.as_deref());

    let numbers: Vec<&str> = payload.number.split(',').map(|s| s.trim()).collect();

    let responses = client
        .send_message(&numbers, &payload.message)
        .await
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&responses).map_err(|e| e.to_string())
}

/// Send a priority SMS (bypasses default queue, 2 credits per 160 chars).
#[tauri::command]
pub async fn send_priority_sms(payload: SendSmsPayload) -> Result<String, String> {
    let client = build_client(&payload.api_key, payload.sender_name.as_deref());

    let numbers: Vec<&str> = payload.number.split(',').map(|s| s.trim()).collect();

    let responses = client
        .send_priority(&numbers, &payload.message)
        .await
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&responses).map_err(|e| e.to_string())
}

/// Send an OTP SMS. Use `{otp}` in the message as a placeholder.
#[tauri::command]
pub async fn send_otp_sms(payload: SendOtpPayload) -> Result<String, String> {
    let client = build_client(&payload.api_key, payload.sender_name.as_deref());

    let responses = if let Some(ref code) = payload.code {
        client
            .send_otp_with_code(&payload.number, &payload.message, code)
            .await
    } else {
        client.send_otp(&payload.number, &payload.message).await
    };

    let responses = responses.map_err(|e| e.to_string())?;
    serde_json::to_string(&responses).map_err(|e| e.to_string())
}

/// Retrieve outgoing SMS messages with optional filters.
#[tauri::command]
pub async fn get_sms_messages(payload: GetMessagesPayload) -> Result<String, String> {
    let client = SemaphoreClient::new(&payload.api_key);

    let query = GetMessagesQuery {
        limit: payload.limit,
        page: payload.page,
        start_date: payload.start_date,
        end_date: payload.end_date,
        network: payload.network,
        status: payload.status,
    };

    let messages = client
        .get_messages(&query)
        .await
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&messages).map_err(|e| e.to_string())
}

/// Retrieve a single SMS message by its ID.
#[tauri::command]
pub async fn get_sms_message_by_id(payload: GetMessageByIdPayload) -> Result<String, String> {
    let client = SemaphoreClient::new(&payload.api_key);

    let message = client
        .get_message(payload.message_id)
        .await
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&message).map_err(|e| e.to_string())
}

/// Retrieve basic account information (balance, status).
#[tauri::command]
pub async fn get_sms_account(payload: AccountPayload) -> Result<String, String> {
    let client = SemaphoreClient::new(&payload.api_key);

    let account = client.get_account().await.map_err(|e| e.to_string())?;

    serde_json::to_string(&account).map_err(|e| e.to_string())
}

/// Retrieve account transactions.
#[tauri::command]
pub async fn get_sms_transactions(payload: PaginatedAccountPayload) -> Result<String, String> {
    let client = SemaphoreClient::new(&payload.api_key);

    let query = PaginationQuery {
        limit: payload.limit,
        page: payload.page,
    };

    let transactions = client
        .get_transactions(&query)
        .await
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&transactions).map_err(|e| e.to_string())
}

/// Retrieve sender names associated with the account.
#[tauri::command]
pub async fn get_sms_sender_names(payload: PaginatedAccountPayload) -> Result<String, String> {
    let client = SemaphoreClient::new(&payload.api_key);

    let query = PaginationQuery {
        limit: payload.limit,
        page: payload.page,
    };

    let names = client
        .get_sender_names(&query)
        .await
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&names).map_err(|e| e.to_string())
}

/// Retrieve users associated with the account.
#[tauri::command]
pub async fn get_sms_users(payload: PaginatedAccountPayload) -> Result<String, String> {
    let client = SemaphoreClient::new(&payload.api_key);

    let query = PaginationQuery {
        limit: payload.limit,
        page: payload.page,
    };

    let users = client
        .get_users(&query)
        .await
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&users).map_err(|e| e.to_string())
}
