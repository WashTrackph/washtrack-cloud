use serde::Deserialize;

// ─── ESC/POS Constants ──────────────────────────────────────────────────────
const ESC: u8 = 0x1B;
const GS: u8 = 0x1D;
const LF: u8 = 0x0A;

// ─── Data types mirroring frontend TS types ─────────────────────────────────
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShopData {
    pub name: String,
    pub address: String,
    pub phone: String,
    pub currency: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CartItemData {
    pub service_name: String,
    pub pricing_type: String,
    pub kg: f64,
    pub unit_price: f64,
    pub subtotal: f64,
    pub express: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderData {
    pub order_num: String,
    pub customer_name: String,
    pub customer_phone: String,
    pub items: Vec<CartItemData>,
    pub subtotal: f64,
    pub discount: f64,
    pub total: f64,
    pub express: bool,
    pub payment_method: String,
    pub is_cash_payment: bool,
    pub cash_tendered: Option<f64>,
    pub change: Option<f64>,
    pub created_at: f64,
}

// ─── Builder ────────────────────────────────────────────────────────────────
pub fn build(order: &OrderData, shop: &ShopData, paper_width: u8) -> Vec<u8> {
    let line_width: usize = if paper_width >= 80 { 48 } else { 32 };
    let mut buf: Vec<u8> = Vec::with_capacity(1024);

    // ── Init ──
    cmd(&mut buf, &[ESC, b'@']); // ESC @ — initialize printer

    // ── Shop header (centered, bold, 2x size) ──
    cmd(&mut buf, &[ESC, b'a', 1]); // center align
    cmd(&mut buf, &[ESC, b'E', 1]); // bold on
    cmd(&mut buf, &[GS, b'!', 0x11]); // double width + double height
    text(&mut buf, &shop.name);
    cmd(&mut buf, &[GS, b'!', 0x00]); // normal size
    cmd(&mut buf, &[ESC, b'E', 0]); // bold off
    text(&mut buf, &shop.address);
    text(&mut buf, &shop.phone);
    separator(&mut buf, line_width);

    // ── Order info (left aligned) ──
    cmd(&mut buf, &[ESC, b'a', 0]); // left align
    text(&mut buf, &format!("Order #: {}", order.order_num));
    text(&mut buf, &format!("Customer: {}", order.customer_name));
    if !order.customer_phone.is_empty() {
        text(&mut buf, &format!("Phone: {}", order.customer_phone));
    }
    // Format date from timestamp (ms)
    let secs = (order.created_at / 1000.0) as i64;
    let date_str = format_timestamp(secs);
    text(&mut buf, &format!("Date: {}", date_str));
    if order.express {
        cmd(&mut buf, &[ESC, b'E', 1]);
        text(&mut buf, "*** EXPRESS ORDER ***");
        cmd(&mut buf, &[ESC, b'E', 0]);
    }
    separator(&mut buf, line_width);

    // ── Items ──
    let price_col = 10; // width for price column
    let name_col = line_width - price_col;

    for item in &order.items {
        let mut name = item.service_name.clone();
        if item.express {
            name.push_str(" [E]");
        }
        match item.pricing_type.as_str() {
            "PER_KG" => {
                name.push_str(&format!(" {:.1}kg", item.kg));
            }
            "FIXED_LOAD" => {
                name.push_str(" (fixed)");
            }
            _ => {}
        }

        let price = format!("{}{:.0}", shop.currency, item.subtotal);
        let row = format_row(&name, &price, name_col, price_col);
        text(&mut buf, &row);
    }
    separator(&mut buf, line_width);

    // ── Totals ──
    if order.discount > 0.0 {
        let disc = format!("-{}{:.0}", shop.currency, order.discount);
        text(&mut buf, &format_row("Discount", &disc, name_col, price_col));
    }

    cmd(&mut buf, &[ESC, b'E', 1]); // bold on
    let total_str = format!("{}{:.0}", shop.currency, order.total);
    text(&mut buf, &format_row("TOTAL", &total_str, name_col, price_col));
    cmd(&mut buf, &[ESC, b'E', 0]); // bold off

    // ── Payment info ──
    text(&mut buf, &format_row("Paid via", &order.payment_method, name_col, price_col));
    if order.is_cash_payment {
        if let Some(cash) = order.cash_tendered {
            let cash_str = format!("{}{:.0}", shop.currency, cash);
            text(&mut buf, &format_row("Cash", &cash_str, name_col, price_col));
        }
        if let Some(change) = order.change {
            let change_str = format!("{}{:.0}", shop.currency, change);
            text(&mut buf, &format_row("Change", &change_str, name_col, price_col));
        }
    }
    separator(&mut buf, line_width);

    // ── Footer ──
    cmd(&mut buf, &[ESC, b'a', 1]); // center
    text(&mut buf, &format!("Thank you for choosing"));
    text(&mut buf, &format!("{}!", shop.name));
    text(&mut buf, "Keep this receipt for reference");

    // Feed and cut
    cmd(&mut buf, &[ESC, b'd', 3]); // feed 3 lines
    cmd(&mut buf, &[GS, b'V', 0]); // full cut

    buf
}

// ─── Helpers ────────────────────────────────────────────────────────────────

fn cmd(buf: &mut Vec<u8>, bytes: &[u8]) {
    buf.extend_from_slice(bytes);
}

fn text(buf: &mut Vec<u8>, s: &str) {
    buf.extend_from_slice(s.as_bytes());
    buf.push(LF);
}

fn separator(buf: &mut Vec<u8>, width: usize) {
    let line: String = "-".repeat(width);
    text(buf, &line);
}

fn format_row(left: &str, right: &str, left_width: usize, right_width: usize) -> String {
    let left_truncated = if left.len() > left_width {
        &left[..left_width]
    } else {
        left
    };
    let padding = left_width.saturating_sub(left_truncated.len());
    format!(
        "{}{:>pad$}{:>width$}",
        left_truncated,
        "",
        right,
        pad = padding,
        width = right_width
    )
}

fn format_timestamp(secs: i64) -> String {
    // Simple UTC timestamp formatting without chrono dependency
    let days_since_epoch = secs / 86400;
    let time_of_day = secs % 86400;
    let hours = time_of_day / 3600;
    let minutes = (time_of_day % 3600) / 60;

    // Calculate year/month/day from days since 1970-01-01
    let mut remaining_days = days_since_epoch;
    let mut year = 1970i64;

    loop {
        let days_in_year = if is_leap_year(year) { 366 } else { 365 };
        if remaining_days < days_in_year {
            break;
        }
        remaining_days -= days_in_year;
        year += 1;
    }

    let month_days = if is_leap_year(year) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };

    let mut month = 1u32;
    for &d in &month_days {
        if remaining_days < d {
            break;
        }
        remaining_days -= d;
        month += 1;
    }
    let day = remaining_days + 1;

    format!(
        "{:04}-{:02}-{:02} {:02}:{:02}",
        year, month, day, hours, minutes
    )
}

fn is_leap_year(y: i64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)
}
