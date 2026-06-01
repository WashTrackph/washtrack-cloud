import { useState, useRef, useEffect } from "react";
import { PinDots, PinPad } from "./PinPad";
import type { Staff, Shop } from "../lib/types";
import { isLegacyPin, verifyPin } from "../lib/crypto";

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 30;

interface PinModalProps {
  pinModal: { role: string; onSuccess: () => void; message?: string };
  setPinModal: (v: any) => void;
  staff: Staff[];
  shop: Shop;
  notify: (msg: string, type?: string) => void;
}

async function checkPin(pin: string, stored: string | { hash: string; salt: string }): Promise<boolean> {
  if (isLegacyPin(stored)) return pin === stored;
  return verifyPin(pin, stored);
}

export function PinModalOverlay({ pinModal, setPinModal, staff, shop, notify }: PinModalProps) {
  const [buf, setBuf] = useState("");
  const [err, setErr] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockoutEnd, setLockoutEnd] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const checking = useRef(false);

  const isLocked = lockoutRemaining > 0;

  useEffect(() => {
    if (lockoutEnd <= Date.now()) return;
    const timer = setInterval(() => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutRemaining(0);
        setErr("");
        clearInterval(timer);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 200);
    return () => clearInterval(timer);
  }, [lockoutEnd]);

  const handleDigit = (d: string) => {
    if (isLocked) return;
    const next = buf + d;
    setBuf(next);
    if (next.length >= 4 && !checking.current) {
      checking.current = true;
      (async () => {
        let valid = false;
        if (pinModal.role === "SETTINGS") {
          valid = shop.settingsPin
            ? await checkPin(next, shop.settingsPin)
            : await checkPin(next, shop.ownerPin);
        } else if (pinModal.role === "OWNER") {
          valid = await checkPin(next, shop.ownerPin);
        } else if (pinModal.role === "MANAGER") {
          valid = await checkPin(next, shop.managerPin) || await checkPin(next, shop.ownerPin);
        } else {
          for (const s of staff.filter((s) => s.active)) {
            if (await checkPin(next, s.pin)) { valid = true; break; }
          }
        }

        if (valid) {
          setPinModal(null);
          setBuf("");
          setErr("");
          setAttempts(0);
          pinModal.onSuccess();
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          if (newAttempts >= MAX_ATTEMPTS) {
            const end = Date.now() + LOCKOUT_SECONDS * 1000;
            setLockoutEnd(end);
            setLockoutRemaining(LOCKOUT_SECONDS);
            setErr(`Too many attempts. Locked for ${LOCKOUT_SECONDS}s`);
            setBuf("");
            setAttempts(0);
          } else {
            setErr(`Incorrect PIN (${MAX_ATTEMPTS - newAttempts} attempts left)`);
            setTimeout(() => { setBuf(""); }, 800);
          }
        }
        checking.current = false;
      })();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setPinModal(null)}>
      <div style={{ background: "var(--card)", borderRadius: 16, padding: 32, width: 300, textAlign: "center", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>{"\uD83D\uDD10"}</div>
        <h3 style={{ margin: "0 0 4px", color: "var(--text)" }}>PIN Required</h3>
        <p style={{ margin: "0 0 20px", color: "var(--subtext)", fontSize: 13 }}>{pinModal.message || `Enter ${pinModal.role} PIN`}</p>
        <PinDots count={buf.length} />
        {err && <p style={{ color: "var(--danger-text)", fontSize: 13, marginTop: 8 }}>{err}</p>}
        {isLocked && <p style={{ color: "var(--warning)", fontSize: 12, marginTop: 4 }}>Try again in {lockoutRemaining}s</p>}
        <PinPad onDigit={handleDigit} onBack={() => !isLocked && setBuf((b) => b.slice(0, -1))} />
        <button onClick={() => setPinModal(null)} style={{ marginTop: 12, background: "transparent", border: "none", color: "var(--subtext)", cursor: "pointer", fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}
