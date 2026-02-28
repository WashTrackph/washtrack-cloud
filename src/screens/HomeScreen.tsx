import { useApp } from "../context/AppContext";
import { getOverstay } from "../lib/utils";

export function HomeScreen({ setScreen }: { setScreen: (s: string) => void }) {
  const { orders, customers, shop, inventory, fmt } = useApp();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => !o.voided && o.createdAt >= today.getTime());
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const activeOrders = orders.filter((o) => !o.voided && o.statusId < 6);
  const readyOrders = orders.filter((o) => !o.voided && o.statusId === 5);
  const overdueOrders = orders.filter((o) => {
    if (o.voided || o.statusId !== 5) return false;
    return (Date.now() - o.statusUpdatedAt) > 48 * 3600000;
  });

  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
  const weekOrders = orders.filter((o) => !o.voided && o.createdAt >= weekStart.getTime());
  const weekRevenue = weekOrders.reduce((s, o) => s + o.total, 0);

  const criticalStock = inventory.filter((i) => i.qty === 0);
  const lowStock = inventory.filter((i) => i.qty > 0 && i.qty <= i.minQty);

  const overstayOrders = orders
    .map((o) => ({ ...o, overstay: getOverstay(o) }))
    .filter((o) => o.overstay)
    .sort((a, b) => (b.overstay?.hrs || 0) - (a.overstay?.hrs || 0))
    .slice(0, 5);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{shop.name}</h2>
        <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>{new Date().toLocaleDateString(shop.locale || "en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {(criticalStock.length > 0 || overstayOrders.filter((o) => o.overstay?.level === "critical").length > 0) && (
        <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 10, background: "var(--danger-bg-dark)", border: "1px solid var(--danger)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18 }}>{"\uD83D\uDEA8"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--danger-light)" }}>Action Required</div>
            <div style={{ fontSize: 12, color: "var(--danger-text)" }}>
              {criticalStock.length > 0 && `${criticalStock.length} item(s) out of stock. `}
              {overstayOrders.filter((o) => o.overstay?.level === "critical").length > 0 && `${overstayOrders.filter((o) => o.overstay?.level === "critical").length} order(s) in facility 3+ days.`}
            </div>
          </div>
          <button onClick={() => setScreen("inventory")} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--danger)", background: "transparent", color: "var(--danger-light)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>View Inventory</button>
        </div>
      )}

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Today's Revenue", value: fmt(todayRevenue), sub: `${todayOrders.length} orders`, color: "var(--accent)", icon: "\uD83D\uDCB0" },
          { label: "Week Revenue", value: fmt(weekRevenue), sub: `${weekOrders.length} orders`, color: "var(--accent2-light)", icon: "\uD83D\uDCC8" },
          { label: "Active Orders", value: activeOrders.length, sub: "in progress", color: "var(--warning)", icon: "\uD83D\uDD04" },
          { label: "Ready for Pickup", value: readyOrders.length, sub: overdueOrders.length > 0 ? `${overdueOrders.length} overdue` : "awaiting customer", color: "var(--success)", icon: "\u2705" },
        ].map((k, i) => (
          <div key={i} className="card" style={{ borderLeft: `3px solid ${k.color}`, background: "var(--card)", borderTop: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{k.sub}</div>
              </div>
              <div style={{ fontSize: 24 }}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        <button onClick={() => setScreen("pos")} className="action-btn primary">
          <span style={{ fontSize: 28 }}>{"\uFF0B"}</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>New Order</span>
        </button>
        <button onClick={() => setScreen("orders")} className="action-btn secondary">
          <span style={{ fontSize: 28 }}>{"\uD83D\uDCCB"}</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Manage Orders</span>
          {activeOrders.length > 0 && <span style={{ background: "var(--danger)", color: "var(--white)", borderRadius: 12, fontSize: 12, padding: "2px 8px" }}>{activeOrders.length}</span>}
        </button>
        <button onClick={() => setScreen("inventory")} className="action-btn secondary" style={{ position: "relative" }}>
          <span style={{ fontSize: 28 }}>{"\uD83D\uDCE6"}</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Inventory</span>
          {lowStock.length + criticalStock.length > 0 && (
            <span style={{ background: "var(--alert)", color: "var(--white)", borderRadius: 12, fontSize: 12, padding: "2px 8px" }}>
              {lowStock.length + criticalStock.length} low
            </span>
          )}
        </button>
        <button onClick={() => setScreen("customers")} className="action-btn secondary">
          <span style={{ fontSize: 28 }}>{"\uD83D\uDC65"}</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Customers</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{customers.length} registered</span>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {readyOrders.length > 0 && (
          <div className="card">
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "var(--success)" }}>{"\u2705"} Ready for Pickup</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {readyOrders.slice(0, 5).map((o) => {
                const hoursWaiting = Math.floor((Date.now() - o.statusUpdatedAt) / 3600000);
                const aging = hoursWaiting >= 48 ? "red" : hoursWaiting >= 24 ? "orange" : "green";
                const agingColors: any = { green: "var(--success)", orange: "var(--warning)", red: "var(--danger)" };
                return (
                  <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "var(--bg)", borderRadius: 8, borderLeft: `3px solid ${agingColors[aging]}` }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{o.orderNum}</span>
                      <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{o.customerName}</span>
                    </div>
                    <span style={{ fontSize: 12, color: agingColors[aging] }}>{hoursWaiting}h waiting</span>
                    <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: 13 }}>{fmt(o.total)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(lowStock.length > 0 || criticalStock.length > 0) && (
          <div className="card" style={{ borderColor: "color-mix(in srgb, var(--alert) 20%, transparent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--alert)" }}>{"\uD83D\uDCE6"} Stock Alerts</h3>
              <button onClick={() => setScreen("inventory")} style={{ background: "transparent", border: "none", color: "var(--alert)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>View all {"\u2192"}</button>
            </div>
            {criticalStock.map((i) => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--danger-bg-dark)", borderRadius: 6, marginBottom: 6, border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}>
                <span>{i.icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: "var(--danger-light)", fontWeight: 600 }}>{i.name}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--danger)" }}>OUT OF STOCK</span>
              </div>
            ))}
            {lowStock.map((i) => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--alert-bg-dark)", borderRadius: 6, marginBottom: 6, border: "1px solid color-mix(in srgb, var(--alert) 20%, transparent)" }}>
                <span>{i.icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: "var(--alert-light)" }}>{i.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--alert)" }}>{i.qty} {i.unit} left</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
