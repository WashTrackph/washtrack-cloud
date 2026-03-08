package com.washtrack.plugin.printer

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.os.Handler
import android.os.Looper
import android.print.PrintAttributes
import android.print.PrintManager
import android.util.Base64
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

@InvokeArg
internal class PrintReceiptArgs {
    lateinit var html: String
    var jobName: String? = null
}

@InvokeArg
internal class SendBluetoothDataArgs {
    lateinit var bytes: String
    lateinit var address: String
}

@TauriPlugin
class PrinterPlugin(private val activity: android.app.Activity) : Plugin(activity) {

    companion object {
        private const val TAG = "PrinterPlugin"
        private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    }

    @Command
    fun listBluetoothPrinters(invoke: Invoke) {
        try {
            val adapter = BluetoothAdapter.getDefaultAdapter()
            if (adapter == null) {
                invoke.resolve(JSObject().apply { put("devices", JSONArray()) })
                return
            }

            val devices = JSONArray()
            try {
                adapter.bondedDevices?.forEach { device: BluetoothDevice ->
                    devices.put(JSONObject().apply {
                        put("name", device.name ?: "Unknown")
                        put("address", device.address)
                    })
                }
            } catch (se: SecurityException) {
                Log.w(TAG, "Bluetooth permission not granted", se)
            }

            invoke.resolve(JSObject().apply { put("devices", devices) })
        } catch (e: Exception) {
            Log.e(TAG, "listBluetoothPrinters failed", e)
            invoke.reject("Failed to list BT devices: ${e.message}")
        }
    }

    @Command
    fun sendBluetoothData(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(SendBluetoothDataArgs::class.java)
            val data = Base64.decode(args.bytes, Base64.DEFAULT)
            val address = args.address

            Thread {
                var socket: BluetoothSocket? = null
                try {
                    val adapter = BluetoothAdapter.getDefaultAdapter()
                        ?: throw Exception("No Bluetooth adapter")
                    val device = adapter.getRemoteDevice(address)
                    socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                    socket.connect()
                    socket.outputStream.write(data)
                    socket.outputStream.flush()

                    activity.runOnUiThread {
                        invoke.resolve(JSObject().apply {
                            put("success", true)
                            put("bytesWritten", data.size)
                        })
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "BT send failed", e)
                    activity.runOnUiThread {
                        invoke.reject("BT send failed: ${e.message}")
                    }
                } finally {
                    try { socket?.close() } catch (_: Exception) {}
                }
            }.start()
        } catch (e: Exception) {
            Log.e(TAG, "sendBluetoothData failed", e)
            invoke.reject("Failed to parse args: ${e.message}")
        }
    }

    @Command
    fun printReceipt(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(PrintReceiptArgs::class.java)
            val html = args.html
            val jobName = args.jobName ?: "WashTrack Receipt"

            Log.d(TAG, "HTML length: ${html.length}, jobName: $jobName")

            if (html.isEmpty()) {
                invoke.reject("Empty HTML content")
                return
            }

            activity.runOnUiThread {
                try {
                    val webView = WebView(activity)
                    webView.settings.javaScriptEnabled = true

                    // Attach to view hierarchy so WebView actually renders
                    val decorView = activity.window.decorView as ViewGroup
                    webView.visibility = View.INVISIBLE
                    webView.layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    decorView.addView(webView)

                    webView.webViewClient = object : WebViewClient() {
                        override fun onPageFinished(view: WebView?, url: String?) {
                            Log.d(TAG, "onPageFinished, triggering print after delay")

                            Handler(Looper.getMainLooper()).postDelayed({
                                try {
                                    val printManager = activity.getSystemService(
                                        android.content.Context.PRINT_SERVICE
                                    ) as PrintManager

                                    val adapter = webView.createPrintDocumentAdapter(jobName)

                                    val attrs = PrintAttributes.Builder()
                                        .setMediaSize(PrintAttributes.MediaSize.ISO_A7)
                                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                                        .build()

                                    printManager.print(jobName, adapter, attrs)

                                    invoke.resolve(JSObject().apply {
                                        put("success", true)
                                        put("message", "Print dialog opened")
                                    })
                                } catch (e: Exception) {
                                    Log.e(TAG, "Print failed", e)
                                    decorView.removeView(webView)
                                    invoke.reject("Print failed: ${e.message}")
                                }
                            }, 1000)
                        }
                    }

                    webView.loadDataWithBaseURL(
                        null, html, "text/html", "UTF-8", null
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "WebView creation failed", e)
                    invoke.reject("WebView creation failed: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse args", e)
            invoke.reject("Failed to parse args: ${e.message}")
        }
    }
}
