import { useState } from "react";
import { useApp } from "../context/AppContext";

export function ReportsScreen() {
  const { orders, services, customers, shop, notify, fmt, sendReportEmail, emailConfig } = useApp();
  const [range, setRange] = useState("today");
  const [emailing, setEmailing] = useState(false);

  const handleEmailReport = async () => {
    setEmailing(true);
    try {
      const period = range === "today" ? "today" : range === "week" ? "week" : "month";
      await sendReportEmail(period as "today" | "week" | "month");
    } finally {
      setEmailing(false);
    }
  };

  const now = Date.now();
  const ranges: Record<string, number> = {
    today: new Date().setHours(0, 0, 0, 0),
    week: now - 7 * 86400000,
    month: now - 30 * 86400000,
  };
  const from = ranges[range];
  const filtered = orders.filter((o) => !o.voided && o.createdAt >= from);

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);
  const totalOrders = filtered.length;
  const totalKg = filtered.reduce((s, o) => s + o.items.reduce((a: number, i: any) => a + (i.pricingType === "PER_KG" ? i.kg : 0), 0), 0);
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const svcRevenue: Record<string, number> = {};
  filtered.forEach((o) => o.items.forEach((i: any) => {
    svcRevenue[i.serviceName] = (svcRevenue[i.serviceName] || 0) + i.subtotal;
  }));
  const svcData = Object.entries(svcRevenue).sort((a, b) => b[1] - a[1]);
  const maxSvc = svcData[0]?.[1] || 1;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text)" }}>Reports & Analytics</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {([["today", "Today"], ["week", "7 Days"], ["month", "30 Days"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setRange(v)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border-dark)", background: range === v ? "var(--accent-bg)" : "transparent", color: range === v ? "var(--accent)" : "var(--muted)", cursor: "pointer", fontSize: 13 }}>{l}</button>
          ))}
          <button
            onClick={handleEmailReport}
            disabled={emailing || !emailConfig.enabled || !emailConfig.testVerified}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border-dark)",
              background: emailing ? "var(--border)" : "var(--accent-bg)",
              color: emailing ? "var(--muted)" : "var(--accent)",
              cursor: (emailing || !emailConfig.enabled || !emailConfig.testVerified) ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 600, marginLeft: 8,
              opacity: (!emailConfig.enabled || !emailConfig.testVerified) ? 0.4 : 1,
            }}
            title={!emailConfig.enabled ? "Enable email in Settings first" : !emailConfig.testVerified ? "Verify email in Settings first" : "Email this report"}
          >
            {emailing ? "Sending..." : "\uD83D\uDCE7 Email Report"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Revenue", value: fmt(totalRevenue), icon: "\uD83D\uDCB0", color: "var(--accent)" },
          { label: "Orders", value: totalOrders, icon: "\uD83D\uDCCB", color: "var(--accent2-light)" },
          { label: "KG Processed", value: `${totalKg.toFixed(1)}kg`, icon: "\u2696", color: "var(--warning)" },
          { label: "Avg Order", value: fmt(avgOrder), icon: "\uD83D\uDCCA", color: "var(--success)" },
          { label: "Customers", value: customers.length, icon: "\uD83D\uDC65", color: "var(--success-light)" },
          { label: "Services", value: services.filter((s) => s.active).length, icon: "\uD83E\uDDFA", color: "var(--pink)" },
        ].map((k, i) => (
          <div key={i} className="card" style={{ borderLeft: `3px solid ${k.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
              <div style={{ fontSize: 28 }}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "var(--subtext)" }}>Revenue by Service</h3>
        {svcData.length === 0 ? <div style={{ color: "var(--muted-deep)", fontSize: 13 }}>No data for this period</div> : svcData.map(([name, rev], i) => {
          const svc = services.find((s) => s.name === name);
          return (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>{name}</span>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>{fmt(rev)}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--border)" }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${(rev / maxSvc) * 100}%`, background: `linear-gradient(to right, ${svc?.color || "var(--accent)"}, ${svc?.color || "var(--accent)"}80)`, transition: "width 0.5s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
