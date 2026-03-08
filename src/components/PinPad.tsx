export function PinDots({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{
          width: 16, height: 16, borderRadius: "50%",
          background: i < count ? "var(--accent)" : "var(--border)",
          transition: "background 0.15s",
          boxShadow: i < count ? "0 0 8px var(--accent)" : "none",
        }} />
      ))}
    </div>
  );
}

export function PinPad({ onDigit, onBack }: { onDigit: (d: string) => void; onBack: () => void }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "\u232B"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, maxWidth: 240, margin: "0 auto" }}>
      {keys.map((k, i) => k === "" ? <div key={i} /> : (
        <button key={i} onClick={() => k === "\u232B" ? onBack() : onDigit(k)} className="pin-btn">
          {k}
        </button>
      ))}
    </div>
  );
}
