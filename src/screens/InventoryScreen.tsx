import { useState } from "react";
import { useApp } from "../context/AppContext";

export function InventoryScreen() {
  const { inventory, setInventory, notify, addAudit, fmt } = useApp();
  const [filter, setFilter] = useState("all");
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState("");

  const filtered = inventory.filter((i) => {
    if (filter === "low") return i.qty > 0 && i.qty <= i.minQty;
    if (filter === "out") return i.qty === 0;
    return true;
  });

  const stockStatus = (item: any) => {
    if (item.qty === 0) return { label: "Out of Stock", color: "var(--danger)", bg: "var(--danger-bg-dark)", border: "color-mix(in srgb, var(--danger) 25%, transparent)" };
    if (item.qty <= item.minQty) return { label: "Low Stock", color: "var(--alert)", bg: "var(--alert-bg-dark)", border: "color-mix(in srgb, var(--alert) 20%, transparent)" };
    return { label: "In Stock", color: "var(--success)", bg: "var(--success-bg-dark)", border: "color-mix(in srgb, var(--success) 20%, transparent)" };
  };

  const doRestock = (id: string) => {
    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) { notify("Enter valid quantity", "error"); return; }
    setInventory((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty + qty, lastRestocked: Date.now() } : i));
    const item = inventory.find((i) => i.id === id);
    addAudit("INVENTORY", `Restocked ${item?.name} +${qty} ${item?.unit}`);
    notify(`Restocked ${item?.name} \u00D7${qty}`);
    setRestockId(null); setRestockQty("");
  };

  const totalValue = inventory.reduce((s, i) => s + i.qty * i.costPerUnit, 0);
  const outCount = inventory.filter((i) => i.qty === 0).length;
  const lowCount = inventory.filter((i) => i.qty > 0 && i.qty <= i.minQty).length;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{"\uD83D\uDCE6"} Inventory</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Items", value: inventory.length, color: "var(--accent)" },
          { label: "Out of Stock", value: outCount, color: "var(--danger)" },
          { label: "Low Stock", value: lowCount, color: "var(--alert)" },
          { label: "Stock Value", value: fmt(totalValue), color: "var(--success)" },
        ].map((k, i) => (
          <div key={i} className="card" style={{ borderLeft: `3px solid ${k.color}`, padding: "12px 16px" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {([["all", "All Items"], ["low", "Low Stock"], ["out", "Out of Stock"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${filter === v ? "var(--accent)" : "var(--border-dark)"}`, background: filter === v ? "color-mix(in srgb, var(--accent) 15%, var(--card))" : "transparent", color: filter === v ? "var(--accent)" : "var(--muted)", cursor: "pointer", fontSize: 13 }}>{l}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((item) => {
          const st = stockStatus(item);
          const pct = Math.min(100, Math.round((item.qty / Math.max(item.minQty * 2, 1)) * 100));
          return (
            <div key={item.id} className="card" style={{ border: `1px solid ${st.border}`, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{item.name}</span>
                    <span style={{ padding: "1px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3 }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: item.qty === 0 ? "var(--danger)" : item.qty <= item.minQty ? "var(--alert)" : "var(--success)" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{item.qty} {item.unit}</span>
                  </div>
                </div>
                <button onClick={() => { setRestockId(restockId === item.id ? null : item.id); setRestockQty(""); }}
                  style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--success)", background: restockId === item.id ? "color-mix(in srgb, var(--success) 12%, transparent)" : "transparent", color: "var(--success)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                  + Restock
                </button>
              </div>
              {restockId === item.id && (
                <div style={{ marginTop: 12, padding: "12px", background: "var(--bg)", borderRadius: 8, border: "1px solid color-mix(in srgb, var(--success) 20%, transparent)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "var(--success-light)" }}>Add qty:</span>
                  <input type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="e.g. 10" className="input" style={{ width: 100, marginBottom: 0 }} />
                  <button onClick={() => doRestock(item.id)} className="btn-success" style={{ padding: "6px 16px", fontSize: 13 }}>{"\u2713"} Confirm</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
