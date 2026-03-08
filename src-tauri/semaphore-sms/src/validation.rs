use crate::error::SemaphoreError;

/// Maximum number of recipients allowed in a single API call.
pub const MAX_RECIPIENTS: usize = 1000;

/// Validate that the message body does not start with "TEST".
///
/// Semaphore silently drops messages whose first word is "TEST".
/// We reject these at the client level so the caller gets an explicit error.
pub fn validate_message(message: &str) -> Result<(), SemaphoreError> {
    if message.trim().is_empty() {
        return Err(SemaphoreError::Validation(
            "Message body cannot be empty".into(),
        ));
    }

    let first_word = message.trim().split_whitespace().next().unwrap_or_default();

    if first_word.eq_ignore_ascii_case("TEST") {
        return Err(SemaphoreError::Validation(
            "Messages starting with \"TEST\" are silently ignored by Semaphore. \
             Remove or change the first word."
                .into(),
        ));
    }

    Ok(())
}

/// Validate a list of recipient phone numbers.
///
/// Enforces:
/// - At least one recipient
/// - No more than [`MAX_RECIPIENTS`] (1000)
/// - Each number looks like a valid Philippine mobile number
pub fn validate_recipients(numbers: &[String]) -> Result<(), SemaphoreError> {
    if numbers.is_empty() {
        return Err(SemaphoreError::Validation(
            "At least one recipient number is required".into(),
        ));
    }
    if numbers.len() > MAX_RECIPIENTS {
        return Err(SemaphoreError::Validation(format!(
            "Too many recipients ({} supplied, maximum is {}). \
             Use send_bulk() to auto-chunk into batches.",
            numbers.len(),
            MAX_RECIPIENTS
        )));
    }
    for num in numbers {
        validate_phone_number(num)?;
    }
    Ok(())
}

/// Validate a single Philippine mobile phone number.
///
/// Accepted formats after stripping whitespace and dashes:
/// - `09XXXXXXXXX`  (11 digits, starts with 09)
/// - `639XXXXXXXXX` (12 digits, starts with 639)
/// - `+639XXXXXXXXX` (13 chars, starts with +639)
pub fn validate_phone_number(number: &str) -> Result<(), SemaphoreError> {
    let cleaned = sanitize_phone_number(number);
    let valid = match cleaned.len() {
        11 => cleaned.starts_with("09") && cleaned.chars().all(|c| c.is_ascii_digit()),
        12 => cleaned.starts_with("639") && cleaned.chars().all(|c| c.is_ascii_digit()),
        _ => false,
    };

    if !valid {
        return Err(SemaphoreError::Validation(format!(
            "Invalid Philippine mobile number: \"{number}\". \
             Expected format: 09XXXXXXXXX or 639XXXXXXXXX"
        )));
    }
    Ok(())
}

/// Strip whitespace, dashes, parentheses, and a leading '+' from a phone number.
pub fn sanitize_phone_number(number: &str) -> String {
    let stripped: String = number
        .chars()
        .filter(|c| !c.is_whitespace() && *c != '-' && *c != '(' && *c != ')')
        .collect();

    // Remove leading '+' (we keep the digits)
    stripped.strip_prefix('+').unwrap_or(&stripped).to_string()
}

/// Normalize a phone number to the `09XXXXXXXXX` format preferred by most PH APIs.
/// If already in that format, returns as-is.
pub fn normalize_phone_number(number: &str) -> String {
    let cleaned = sanitize_phone_number(number);
    if cleaned.starts_with("639") && cleaned.len() == 12 {
        format!("0{}", &cleaned[2..])
    } else {
        cleaned
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_messages() {
        assert!(validate_message("Hello world").is_ok());
        assert!(validate_message("Your order is ready").is_ok());
        assert!(validate_message("Testing something").is_ok()); // "Testing" != "TEST"
    }

    #[test]
    fn test_message_starting_with_test() {
        assert!(validate_message("TEST message").is_err());
        assert!(validate_message("test message").is_err());
        assert!(validate_message("Test message").is_err());
        assert!(validate_message("  TEST leading spaces").is_err());
    }

    #[test]
    fn test_empty_message() {
        assert!(validate_message("").is_err());
        assert!(validate_message("   ").is_err());
    }

    #[test]
    fn test_valid_phone_numbers() {
        assert!(validate_phone_number("09171234567").is_ok());
        assert!(validate_phone_number("639171234567").is_ok());
        assert!(validate_phone_number("+639171234567").is_ok());
        assert!(validate_phone_number("0917-123-4567").is_ok());
        assert!(validate_phone_number("0917 123 4567").is_ok());
    }

    #[test]
    fn test_invalid_phone_numbers() {
        assert!(validate_phone_number("1234567890").is_err());
        assert!(validate_phone_number("+14155551234").is_err()); // US number
        assert!(validate_phone_number("0812345678").is_err()); // wrong prefix
        assert!(validate_phone_number("").is_err());
    }

    #[test]
    fn test_sanitize() {
        assert_eq!(sanitize_phone_number("+639171234567"), "639171234567");
        assert_eq!(sanitize_phone_number("0917-123-4567"), "09171234567");
        assert_eq!(sanitize_phone_number("0917 123 4567"), "09171234567");
    }

    #[test]
    fn test_normalize() {
        assert_eq!(normalize_phone_number("639171234567"), "09171234567");
        assert_eq!(normalize_phone_number("+639171234567"), "09171234567");
        assert_eq!(normalize_phone_number("09171234567"), "09171234567");
    }

    #[test]
    fn test_recipient_limits() {
        let one = vec!["09171234567".to_string()];
        assert!(validate_recipients(&one).is_ok());

        let empty: Vec<String> = vec![];
        assert!(validate_recipients(&empty).is_err());

        let too_many: Vec<String> = (0..1001).map(|_| "09171234567".to_string()).collect();
        assert!(validate_recipients(&too_many).is_err());

        let at_limit: Vec<String> = (0..1000).map(|_| "09171234567".to_string()).collect();
        assert!(validate_recipients(&at_limit).is_ok());
    }
}
