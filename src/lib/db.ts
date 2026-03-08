import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;
let useFallback = false;

// Detect if we're running inside Tauri or in a plain browser
function isTauri(): boolean {
  return !!(window as any).__TAURI_INTERNALS__;
}

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:washtrack.db");
  }
  return db;
}

// ─── Schema Initialization ───────────────────────────────────────────────────
export async function initDatabase(): Promise<void> {
  if (!isTauri()) {
    console.warn("[DB] Not running inside Tauri — using localStorage fallback");
    useFallback = true;
    return;
  }
  const conn = await getDb();

  // Create a simple key-value store table for all app data.
  // This mirrors the existing window.storage approach for maximum compatibility.
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS app_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

// ─── localStorage fallback (for browser dev) ─────────────────────────────────
const fallbackDB = {
  get: async (key: string): Promise<any> => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  set: async (key: string, val: any): Promise<boolean> => {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
  },
  del: async (key: string): Promise<boolean> => {
    try { localStorage.removeItem(key); return true; } catch { return false; }
  },
  list: async (prefix: string): Promise<string[]> => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    return keys;
  },
};

// ─── Storage Layer (drop-in replacement for window.storage) ──────────────────
// Uses SQLite inside Tauri, falls back to localStorage in browser
export const DB = {
  get: async (key: string): Promise<any> => {
    if (useFallback) return fallbackDB.get(key);
    try {
      const conn = await getDb();
      const rows: any[] = await conn.select("SELECT value FROM app_store WHERE key = $1", [key]);
      if (rows.length > 0) {
        return JSON.parse(rows[0].value);
      }
      return null;
    } catch {
      return null;
    }
  },

  set: async (key: string, val: any): Promise<boolean> => {
    if (useFallback) return fallbackDB.set(key, val);
    try {
      const conn = await getDb();
      const jsonVal = JSON.stringify(val);
      await conn.execute(
        "INSERT INTO app_store (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2",
        [key, jsonVal]
      );
      return true;
    } catch {
      return false;
    }
  },

  del: async (key: string): Promise<boolean> => {
    if (useFallback) return fallbackDB.del(key);
    try {
      const conn = await getDb();
      await conn.execute("DELETE FROM app_store WHERE key = $1", [key]);
      return true;
    } catch {
      return false;
    }
  },

  list: async (prefix: string): Promise<string[]> => {
    if (useFallback) return fallbackDB.list(prefix);
    try {
      const conn = await getDb();
      const rows: any[] = await conn.select(
        "SELECT key FROM app_store WHERE key LIKE $1",
        [prefix + "%"]
      );
      return rows.map((r) => r.key);
    } catch {
      return [];
    }
  },
};
