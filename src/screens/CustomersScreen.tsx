import { useState } from "react";
import { useApp } from "../context/AppContext";

export function CustomersScreen() {
  const { customers, orders, notify, fmt } = useApp();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  if (selected) {
    const customer = customers.find((c) => c.id === selected);
    if (!customer) { setSelected(null); return null; }
    const customerOrders = orders.filter((o) => o.customerId === customer.id && !o.voided).slice(0, 10);
    return (
      <div style={{ padding: 24, maxWidth: 600 }}>
        <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, marginBottom: 16 }}>{"\u2190"} Back</button>
        <div className="card">
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, flexShrink: 0 }}>{customer.name[0]}</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{customer.name}</h2>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{customer.phone}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total Visits", value: customer.visits, color: "var(--accent)" },
              { label: "Total Spend", value: fmt(customer.totalSpend), color: "var(--success)" },
              { label: "Last Visit", value: customer.lastVisit ? `${Math.floor((Date.now() - customer.lastVisit) / 86400000)}d ago` : "\u2014", color: "var(--warning)" },
            ].map((s, i) => (
              <div key={i} style={{ background: "var(--bg)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "var(--subtext)" }}>Order History</h4>
          {customerOrders.length === 0 ? <div style={{ color: "var(--muted)", fontSize: 13 }}>No orders yet</div> : customerOrders.map((o) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{o.orderNum}</span>
              <span style={{ color: "var(--muted)" }}>{new Date(o.createdAt).toLocaleDateString()}</span>
              <span style={{ fontWeight: 700, color: "var(--accent)" }}>{fmt(o.total)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: "var(--text)" }}>Customers</h2>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers\u2026" className="input" style={{ marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        {filtered.map((c) => {
          const daysSince = c.lastVisit ? Math.floor((Date.now() - c.lastVisit) / 86400000) : 999;
          return (
            <div key={c.id} onClick={() => setSelected(c.id)}
              style={{ padding: 16, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>{c.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.phone}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>{c.visits} visits</span>
                <span style={{ fontSize: 12, color: "var(--subtext)" }}>{fmt(c.totalSpend)}</span>
                <span style={{ fontSize: 12, color: daysSince < 7 ? "var(--success)" : daysSince < 30 ? "var(--warning)" : "var(--danger)", marginLeft: "auto" }}>{daysSince}d ago</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
