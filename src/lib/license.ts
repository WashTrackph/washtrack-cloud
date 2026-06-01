/**
 * WashTrack License System
 * ─────────────────────────
 * You (the developer) generate keys and give them to laundry shop owners.
 * If they stop paying, don't give them a new key — their app locks out.
 *
 * Key format:  WT-NNN-YYYYMMDD-XXXXXX
 *   WT       = WashTrack prefix
 *   NNN      = 3-char shop code (e.g. "JOE", "SM1", "LPG")
 *   YYYYMMDD = expiry date
 *   XXXXXX   = 6-char checksum (prevents tampering)
 *
 * Example:  WT-JOE-20261231-A3F7C2
 *
 * DEVELOPER TOOLS (run in browser console):
 *   import { generateLicenseKey } from '@/lib/license';
 *   generateLicenseKey('2026-12-31', 'JOE')  →  "WT-JOE-20261231-A3F7C2"
 *
 * PLAN DURATIONS (helper):
 *   generateLicenseKey(addMonths(new Date(), 1), 'JOE')  → monthly
 *   generateLicenseKey(addMonths(new Date(), 3), 'JOE')  → 3-month
 *   generateLicenseKey(addMonths(new Date(), 6), 'JOE')  → 6-month
 *   generateLicenseKey(addMonths(new Date(), 12), 'JOE') → yearly
 */

// ── Secret ──────────────────────────────────────────────────────────────────
const SECRET = 'WT-PH-2025-SterlingDev-XK92';

// ── Hash ────────────────────────────────────────────────────────────────────
function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(16).toUpperCase().padStart(8, '0');
}

function checksum(code: string, date: string): string {
  return djb2(code + date + SECRET).slice(0, 6);
}

// ── Types ────────────────────────────────────────────────────────────────────
export type LicenseStatus =
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'invalid'
  | 'trial'
  | 'trial_expired';

export interface LicenseInfo {
  status: LicenseStatus;
  expiry: Date | null;
  daysLeft: number;
  shopCode: string;
  message: string;
}

// ── Trial & grace ────────────────────────────────────────────────────────────
export const TRIAL_DAYS = 30;
export const GRACE_DAYS = 5;

// ── Date helper (developer use) ──────────────────────────────────────────────
export function addMonths(from: Date, months: number): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ── Generate a key (developer use) ──────────────────────────────────────────
export function generateLicenseKey(expiryDate: string, shopCode = 'STD'): string {
  const date = expiryDate.replace(/-/g, '');
  const code = shopCode.toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(3, 'X').slice(0, 3);
  const cs   = checksum(code, date);
  return `WT-${code}-${date}-${cs}`;
}

// ── Validate a key ──────────────────────────────────────────────────────────
export function validateLicenseKey(key: string): { ok: boolean; expiry: Date | null; code: string } {
  const clean = key.trim().toUpperCase().replace(/\s+/g, '');
  const match = clean.match(/^WT-?([A-Z0-9]{3})-?(\d{8})-?([A-F0-9]{6})$/);
  if (!match) return { ok: false, expiry: null, code: '' };

  const [, code, dateStr, cs] = match;
  if (cs !== checksum(code, dateStr)) return { ok: false, expiry: null, code: '' };

  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  const expiry = new Date(y, m, d, 23, 59, 59);

  return { ok: true, expiry, code };
}

// ── Get full license info ────────────────────────────────────────────────────
export function getLicenseInfo(licenseKey: string, trialStartDate: string): LicenseInfo {
  const now = new Date();

  if (licenseKey) {
    const { ok, expiry, code } = validateLicenseKey(licenseKey);
    if (!ok) {
      return {
        status: 'invalid',
        expiry: null,
        daysLeft: 0,
        shopCode: '',
        message: 'Invalid license key. Please contact WashTrack support.',
      };
    }

    const daysLeft = Math.ceil((expiry!.getTime() - now.getTime()) / 86_400_000);

    if (daysLeft > 7) {
      return {
        status: 'active',
        expiry: expiry!,
        daysLeft,
        shopCode: code,
        message: `License active · expires ${expiry!.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      };
    }
    if (daysLeft >= 0) {
      return {
        status: 'expiring_soon',
        expiry: expiry!,
        daysLeft,
        shopCode: code,
        message: `License expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — contact WashTrack to renew.`,
      };
    }
    if (daysLeft >= -GRACE_DAYS) {
      return {
        status: 'expiring_soon',
        expiry: expiry!,
        daysLeft,
        shopCode: code,
        message: `License expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} ago. Grace period ends soon — renew now.`,
      };
    }
    return {
      status: 'expired',
      expiry: expiry!,
      daysLeft,
      shopCode: code,
      message: 'License has expired. Please contact WashTrack to renew your subscription.',
    };
  }

  // No key — check trial
  if (!trialStartDate) {
    return {
      status: 'trial',
      expiry: null,
      daysLeft: TRIAL_DAYS,
      shopCode: 'TRIAL',
      message: `Free trial — ${TRIAL_DAYS} days remaining.`,
    };
  }

  const trialStart  = new Date(trialStartDate);
  const trialExpiry = new Date(trialStart.getTime() + TRIAL_DAYS * 86_400_000);
  const daysLeft    = Math.ceil((trialExpiry.getTime() - now.getTime()) / 86_400_000);

  if (daysLeft > 0) {
    return {
      status: 'trial',
      expiry: trialExpiry,
      daysLeft,
      shopCode: 'TRIAL',
      message: `Free trial — ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining.`,
    };
  }

  return {
    status: 'trial_expired',
    expiry: trialExpiry,
    daysLeft,
    shopCode: 'TRIAL',
    message: 'Your free trial has ended. Please contact WashTrack to activate your license.',
  };
}

// ── Is the app allowed to run? ───────────────────────────────────────────────
export function isLicenseAllowed(info: LicenseInfo): boolean {
  return info.status === 'active' || info.status === 'expiring_soon' || info.status === 'trial';
}
