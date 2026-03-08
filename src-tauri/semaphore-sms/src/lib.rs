//! # semaphore-sms
//!
//! Rust client for the [Semaphore.co](https://www.semaphore.co/) SMS API — a
//! Philippine SMS gateway service.
//!
//! ## Features
//!
//! - Full coverage of the Semaphore v4 API: send regular, priority, and OTP
//!   messages; retrieve messages and account info.
//! - Client-side validation that enforces Semaphore's rules:
//!   - Rejects messages starting with "TEST" (silently dropped by Semaphore).
//!   - Validates Philippine phone number formats.
//!   - Enforces the 1000-recipient-per-call limit.
//! - Auto-chunking bulk sends into 1000-recipient batches.
//! - Optional `tauri` feature for ready-to-use `#[tauri::command]` wrappers.
//!
//! ## Quick Start
//!
//! ```no_run
//! use semaphore_sms::SemaphoreClient;
//!
//! # async fn demo() -> Result<(), semaphore_sms::SemaphoreError> {
//! let client = SemaphoreClient::new("YOUR_API_KEY")
//!     .with_sender_name("MyApp");
//!
//! // Send to one number
//! let res = client.send_message(&["09171234567"], "Hello!").await?;
//!
//! // Send OTP
//! let otp = client.send_otp("09171234567", "Your code is {otp}").await?;
//!
//! // Check account balance
//! let acct = client.get_account().await?;
//! # Ok(())
//! # }
//! ```

pub mod client;
pub mod error;
pub mod models;
pub mod validation;

#[cfg(feature = "tauri")]
pub mod tauri_commands;

// Re-exports for convenience.
pub use client::SemaphoreClient;
pub use error::{RateLimitInfo, SemaphoreError};
pub use models::*;
pub use validation::{
    normalize_phone_number, sanitize_phone_number, validate_message, validate_phone_number,
    validate_recipients,
};
