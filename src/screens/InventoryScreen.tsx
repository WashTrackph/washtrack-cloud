import { useState } from "react";
import { useApp } from "../context/AppContext";

const ICONS = ["🧴","🫧","🧪","🛍","📌","🪝","🧾","💧","🧹","🪣","🧽","🧻","📦","🔧","⚙️","🪤","🎀","🧯","🫙","🗑️"];
const CATEGORIES = ["Consumable", "Packaging", "Equipment", "Other"];

function AddSupplyModal({ onSave, onClose }: { onSave: (item: any) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Consumable");
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState("0");
  const [minQty, setMinQty] = useState("5");
  const [costPerUnit, setCostPerUnit] = useState("0");
  const [icon, setIcon] = useState("📦");
  const [err, setErr] = useState("");

  const handleSave = () => {
    if (!name.trim()) { setErr("Name is required"); return; }
    if (!unit.trim()) { setErr("Unit is required (e.g. bag, bottle, pc)"); return; }
    onSave({
      id: "inv" + Date.now(),
      name: name.trim(),
      category,
      unit: unit.trim(),
      qty: parseInt(qty) || 0,
      minQty: parseInt(minQty) || 5,
      costPerUnit: parseFloat(costPerUnit) || 0,
      icon,
      lastRestocked: Date.now(),
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440, border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: "var(--text)" }}>➕ Add New Supply</h3>

        {/* Icon picker */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Icon</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ICONS.map((ic) => (
              <button key={ic} onClick={() => setIcon(ic)} style={{ fontSize: 20, padding: "4px 8px", borderRadius: 8, border: `2px solid ${icon === ic ? "var(--accent)" : "var(--border)"}`, background: icon === ic ? "color-mix(in srgb, var(--accent) 15%, var(--card))" : "transparent", cursor: "pointer" }}>{ic}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Item Name *</div>
            <input value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} placeholder="e.g. Detergent (Ariel 2kg)" className="input" style={{ marginBottom: 0, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Category</div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input" style={{ marginBottom: 0, width: "100%" }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Unit *</div>
            <input value={unit} onChange={(e) => { setUnit(e.target.value); setErr(""); }} placeholder="e.g. bag, bottle, pc" className="input" style={{ marginBottom: 0, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Starting Qty</div>
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="input" style={{ marginBottom: 0, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Low Stock Alert (min)</div>
            <input type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} className="input" style={{ marginBottom: 0, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Cost per Unit (₱)</div>
            <input type="number" value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} className="input" style={{ marginBottom: 0, width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>

        {err && <p style={{ color: "var(--danger)", fontSize: 13, margin: "0 0 12px", fontWeight: 600 }}>{err}</p>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Add Supply</button>
        </div>
      </div>
    </div>
  );
}

export function InventoryScreen() {
  const { inventory, setInventory, notify, addAudit, fmt } = useApp();
  const [filter, setFilter] = useState("all");
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [showAdd, setShowAdd] = useState(false);

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
    notify(`Restocked ${item?.name} ×${qty}`);
    setRestockId(null); setRestockQty("");
  };

  const doAddSupply = (item: any) => {
    setInventory((prev) => [...prev, item]);
    addAudit("INVENTORY", `Added new supply: ${item.name}`);
    notify(`${item.name} added to inventory`);
    setShowAdd(false);
  };

  const totalValue = inventory.reduce((s, i) => s + i.qty * i.costPerUnit, 0);
  const outCount = inventory.filter((i) => i.qty === 0).length;
  const lowCount = inventory.filter((i) => i.qty > 0 && i.qty <= i.minQty).length;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{"📦"} Inventory</h2>
        <button onClick={() => setShowAdd(true)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + Add Supply
        </button>
      </div>

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
                  <button onClick={() => doRestock(item.id)} className="btn-success" style={{ padding: "6px 16px", fontSize: 13 }}>{"✓"} Confirm</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && <AddSupplyModal onSave={doAddSupply} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
