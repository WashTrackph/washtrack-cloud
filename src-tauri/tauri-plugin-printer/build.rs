const COMMANDS: &[&str] = &["print_receipt"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}
