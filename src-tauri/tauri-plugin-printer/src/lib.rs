use serde::{Deserialize, Serialize};
use tauri::{
    plugin::{Builder, PluginHandle, TauriPlugin},
    Manager, Runtime,
};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrintPayload {
    pub html: String,
    pub job_name: Option<String>,
}

#[cfg(target_os = "android")]
struct PrinterHandle<R: Runtime>(PluginHandle<R>);

#[tauri::command]
async fn print_receipt<R: Runtime>(
    app: tauri::AppHandle<R>,
    payload: PrintPayload,
) -> Result<String, String> {
    #[cfg(target_os = "android")]
    {
        let handle = app.state::<PrinterHandle<R>>();
        return handle
            .0
            .run_mobile_plugin::<serde_json::Value>("printReceipt", &payload)
            .map(|v| v.to_string())
            .map_err(|e| format!("Native print failed: {e}"));
    }

    #[cfg(not(target_os = "android"))]
    {
        let _ = &app;
        let _ = &payload;
        Ok("Desktop: use window.print() from frontend".to_string())
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("printer")
        .invoke_handler(tauri::generate_handler![print_receipt])
        .setup(|app, api| {
            #[cfg(target_os = "android")]
            {
                let handle = api.register_android_plugin(
                    "com.washtrack.plugin.printer",
                    "PrinterPlugin",
                )?;
                app.manage(PrinterHandle(handle));
            }
            let _ = (app, api);
            Ok(())
        })
        .build()
}
