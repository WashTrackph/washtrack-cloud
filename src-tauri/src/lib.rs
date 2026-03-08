use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct EmailPayload {
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_user: String,
    pub smtp_pass: String,
    pub from_name: String,
    pub from_email: String,
    pub to_email: String,
    pub subject: String,
    pub body_html: String,
}

#[tauri::command]
fn send_email(payload: EmailPayload) -> Result<String, String> {
    let from = format!("{} <{}>", payload.from_name, payload.from_email);
    let email = Message::builder()
        .from(
            from.parse()
                .map_err(|e| format!("Invalid from address: {e}"))?,
        )
        .to(payload
            .to_email
            .parse()
            .map_err(|e| format!("Invalid to address: {e}"))?)
        .subject(&payload.subject)
        .header(ContentType::TEXT_HTML)
        .body(payload.body_html)
        .map_err(|e| format!("Failed to build email: {e}"))?;

    let creds = Credentials::new(payload.smtp_user.clone(), payload.smtp_pass.clone());

    let mailer = if payload.smtp_port == 465 {
        // Port 465 = implicit TLS (SSL)
        SmtpTransport::relay(&payload.smtp_host)
            .map_err(|e| format!("SMTP relay error: {e}"))?
            .port(465)
            .credentials(creds)
            .build()
    } else {
        // Port 587 (or other) = STARTTLS
        SmtpTransport::starttls_relay(&payload.smtp_host)
            .map_err(|e| format!("SMTP STARTTLS error: {e}"))?
            .port(payload.smtp_port)
            .credentials(creds)
            .build()
    };

    mailer
        .send(&email)
        .map_err(|e| format!("Failed to send email: {e}"))?;

    Ok("Email sent successfully".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_printer::init())
        .invoke_handler(tauri::generate_handler![
            send_email,
            semaphore_sms::tauri_commands::send_sms,
            semaphore_sms::tauri_commands::send_priority_sms,
            semaphore_sms::tauri_commands::send_otp_sms,
            semaphore_sms::tauri_commands::get_sms_messages,
            semaphore_sms::tauri_commands::get_sms_message_by_id,
            semaphore_sms::tauri_commands::get_sms_account,
            semaphore_sms::tauri_commands::get_sms_transactions,
            semaphore_sms::tauri_commands::get_sms_sender_names,
            semaphore_sms::tauri_commands::get_sms_users,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
