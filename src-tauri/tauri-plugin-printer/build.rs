const COMMANDS: &[&str] = &["print_receipt", "print_bluetooth", "list_bluetooth_printers"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}
