import { useState, useRef } from "react";
import { PinDots, PinPad } from "./PinPad";
import type { Staff, Shop } from "../lib/types";
import { isLegacyPin, verifyPin } from "../lib/crypto";

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
  const checking = useRef(false);

  const handleDigit = (d: string) => {
    const next = buf + d;
    setBuf(next);
    if (next.length >= 4 && !checking.current) {
      checking.current = true;
      (async () => {
        let valid = false;
        if (pinModal.role === "OWNER") {
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
          pinModal.onSuccess();
        } else {
          setErr("Incorrect PIN");
          setTimeout(() => { setBuf(""); setErr(""); }, 800);
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
        <PinPad onDigit={handleDigit} onBack={() => setBuf((b) => b.slice(0, -1))} />
        <button onClick={() => setPinModal(null)} style={{ marginTop: 12, background: "transparent", border: "none", color: "var(--subtext)", cursor: "pointer", fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}
