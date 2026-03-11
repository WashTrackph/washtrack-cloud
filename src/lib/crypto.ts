// ─── PIN Hashing Utilities ───────────────────────────────────────────────────
// Uses Web Crypto API (crypto.subtle) for SHA-256 hashing with per-user salt.
// Available in all Tauri v2 webviews (Chromium/WebKit).

export interface HashedPin {
  hash: string;
  salt: string;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Generate a random 16-byte salt as hex string. */
export function generateSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

/** Hash a PIN with the given salt using SHA-256. */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return toHex(hashBuffer);
}

/** Hash a raw PIN and return the full HashedPin object. */
export async function createHashedPin(pin: string): Promise<HashedPin> {
  const salt = generateSalt();
  const hash = await hashPin(pin, salt);
  return { hash, salt };
}

/** Verify a PIN against a stored hash+salt. */
export async function verifyPin(pin: string, stored: HashedPin): Promise<boolean> {
  const hash = await hashPin(pin, stored.salt);
  // Constant-length comparison (both are always 64-char hex strings)
  if (hash.length !== stored.hash.length) return false;
  let result = 0;
  for (let i = 0; i < hash.length; i++) {
    result |= hash.charCodeAt(i) ^ stored.hash.charCodeAt(i);
  }
  return result === 0;
}

/** Check if a pin value is a legacy plaintext PIN (4 digits) vs hashed object. */
export function isLegacyPin(pin: string | HashedPin): pin is string {
  return typeof pin === "string";
}
