import { PinDots, PinPad } from "../components/PinPad";
import type { Staff, Shop } from "../lib/types";

interface LoginScreenProps {
  staff: Staff[];
  selectedStaff: Staff | null;
  setSelectedStaff: (s: Staff | null) => void;
  pinBuffer: string;
  pinError: string;
  handlePinDigit: (d: string) => void;
  handlePinBackspace: () => void;
  shop: Shop;
}

export function LoginScreen({ staff, selectedStaff, setSelectedStaff, pinBuffer, pinError, handlePinDigit, handlePinBackspace, shop }: LoginScreenProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--bg) 0%, var(--sidebar) 50%, var(--bg) 100%)" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{"\uD83E\uDEE7"}</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: -1 }}>{shop.name}</h1>
        <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14 }}>Laundry POS System</p>
      </div>

      {!selectedStaff ? (
        <div>
          <p style={{ textAlign: "center", color: "var(--subtext)", fontSize: 14, marginBottom: 16 }}>Select your account</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 400 }}>
            {staff.filter((s) => s.active).map((s) => (
              <button key={s.id} onClick={() => setSelectedStaff(s)} className="staff-tile">
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, margin: "0 auto 8px" }}>{s.avatar}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>{s.role}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, margin: "0 auto 12px" }}>{selectedStaff.avatar}</div>
          <h3 style={{ margin: "0 0 4px", color: "var(--text)" }}>{selectedStaff.name}</h3>
          <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: 13 }}>Enter your 4-digit PIN</p>
          <PinDots count={pinBuffer.length} />
          {pinError && <p style={{ color: "var(--danger-text)", fontSize: 13, marginTop: 8 }}>{pinError}</p>}
          <PinPad onDigit={handlePinDigit} onBack={handlePinBackspace} />
          <button onClick={() => setSelectedStaff(null)} style={{ marginTop: 12, background: "transparent", border: "none", color: "var(--subtext)", cursor: "pointer", fontSize: 13 }}>{"\u2190"} Back</button>
        </div>
      )}
    </div>
  );
}
