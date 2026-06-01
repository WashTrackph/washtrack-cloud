// ─── WashTrack Backup & Restore ──────────────────────────────────────────────
// All app data lives in DB under wt:* keys.
// Export = dump every key to a JSON file the user saves anywhere.
// Restore = read that file back and write every key to DB, then reload.

import { DB } from "./db";

const WT_KEYS = [
  "wt:shop", "wt:services", "wt:stages", "wt:smstemplates",
  "wt:staff", "wt:customers", "wt:orders", "wt:smslog",
  "wt:audit", "wt:counter", "wt:inventory", "wt:paymethods",
  "wt:supplyrules", "wt:emailconfig", "wt:promotions",
  "wt:lastEmailSent", "wt:theme", "wt:licenseKey", "wt:trialStartDate",
];

export interface BackupFile {
  version: 1;
  app: "washtrack";
  exportedAt: string;
  data: Record<string, any>;
}

// ─── Export ──────────────────────────────────────────────────────────────────
export async function exportBackup(): Promise<void> {
  const data: Record<string, any> = {};

  for (const key of WT_KEYS) {
    const val = await DB.get(key);
    if (val !== null) data[key] = val;
  }

  const backup: BackupFile = {
    version: 1,
    app: "washtrack",
    exportedAt: new Date().toISOString(),
    data,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const date = new Date().toISOString().slice(0, 10);
  const filename = `washtrack-backup-${date}.json`;

  // Try native File System Access API (works in Tauri's Chromium webview)
  if ("showSaveFilePicker" in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "WashTrack Backup", accept: { "application/json": [".json"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e: any) {
      // User cancelled — abort silently
      if (e?.name === "AbortError") return;
      // Fall through to download fallback
    }
  }

  // Fallback: trigger browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Restore ─────────────────────────────────────────────────────────────────
export async function importBackup(): Promise<{ ok: boolean; message: string }> {
  let json: string;

  // Try native file picker first
  if ("showOpenFilePicker" in window) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: "WashTrack Backup", accept: { "application/json": [".json"] } }],
        multiple: false,
      });
      const file = await handle.getFile();
      json = await file.text();
    } catch (e: any) {
      if (e?.name === "AbortError") return { ok: false, message: "Cancelled." };
      return { ok: false, message: `Could not open file: ${e?.message || e}` };
    }
  } else {
    // Fallback: hidden <input type="file">
    json = await new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";
      input.onchange = async () => {
        if (!input.files?.[0]) { reject(new Error("No file selected")); return; }
        resolve(await input.files[0].text());
      };
      input.click();
    }).catch(() => "");
    if (!json) return { ok: false, message: "No file selected." };
  }

  // Validate
  let backup: BackupFile;
  try {
    backup = JSON.parse(json);
  } catch {
    return { ok: false, message: "Invalid file — could not parse JSON." };
  }

  if (backup.app !== "washtrack" || backup.version !== 1 || !backup.data) {
    return { ok: false, message: "This doesn't look like a WashTrack backup file." };
  }

  // Write all keys back
  for (const [key, val] of Object.entries(backup.data)) {
    await DB.set(key, val);
  }

  return { ok: true, message: `Restored from backup (${backup.exportedAt.slice(0, 10)}). Reloading…` };
}
