mod receipt_builder;

use base64::Engine;
use serde::{Deserialize, Serialize};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
#[cfg(target_os = "android")]
use tauri::{plugin::PluginHandle, Manager};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrintPayload {
    pub html: String,
    pub job_name: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct BtDevice {
    name: String,
    address: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct BtSendPayload {
    bytes: String,
    address: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct BtListResult {
    devices: Vec<BtDevice>,
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

#[tauri::command]
async fn list_bluetooth_printers<R: Runtime>(
    app: tauri::AppHandle<R>,
) -> Result<Vec<BtDevice>, String> {
    #[cfg(target_os = "android")]
    {
        let handle = app.state::<PrinterHandle<R>>();
        let result: BtListResult = handle
            .0
            .run_mobile_plugin("listBluetoothPrinters", &())
            .map_err(|e| format!("Failed to list BT printers: {e}"))?;
        return Ok(result.devices);
    }

    #[cfg(not(target_os = "android"))]
    {
        let _ = &app;
        Ok(vec![])
    }
}

#[tauri::command]
async fn print_bluetooth<R: Runtime>(
    app: tauri::AppHandle<R>,
    order: receipt_builder::OrderData,
    shop: receipt_builder::ShopData,
    printer_address: String,
    paper_width: Option<u8>,
) -> Result<String, String> {
    let width = paper_width.unwrap_or(58);
    let bytes = receipt_builder::build(&order, &shop, width);
    let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);

    #[cfg(target_os = "android")]
    {
        let handle = app.state::<PrinterHandle<R>>();
        let payload = BtSendPayload {
            bytes: encoded,
            address: printer_address,
        };
        handle
            .0
            .run_mobile_plugin::<serde_json::Value>("sendBluetoothData", &payload)
            .map(|v| v.to_string())
            .map_err(|e| format!("BT print failed: {e}"))?;
        return Ok("Receipt sent to printer".to_string());
    }

    #[cfg(not(target_os = "android"))]
    {
        let _ = &app;
        let _ = &printer_address;
        let _ = &encoded;
        Ok(format!("Desktop: generated {} ESC/POS bytes", bytes.len()))
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("printer")
        .invoke_handler(tauri::generate_handler![
            print_receipt,
            print_bluetooth,
            list_bluetooth_printers,
        ])
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
