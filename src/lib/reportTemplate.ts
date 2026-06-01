// ─── Report HTML Email Template ──────────────────────────────────────────────
// Generates a fully inline-styled HTML email from ReportData.
// All styles are inline for maximum email client compatibility.

import type { ReportData } from "./reportBuilder";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string): string {
  return `${currency}${amount.toLocaleString("en-PH")}`;
}

function pctChange(current: number, previous: number): { text: string; cls: string } {
  if (previous === 0 && current === 0) return { text: "No change", cls: "neutral" };
  if (previous === 0) return { text: "+100%", cls: "up" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { text: `&#x25B2; ${pct}% vs prior`, cls: "up" };
  if (pct < 0) return { text: `&#x25BC; ${Math.abs(pct)}% vs prior`, cls: "down" };
  return { text: "No change", cls: "neutral" };
}

function diffChange(current: number, previous: number, unit: string): { text: string; cls: string } {
  const diff = current - previous;
  if (diff > 0) return { text: `&#x25B2; ${diff} more ${unit}`, cls: "up" };
  if (diff < 0) return { text: `&#x25BC; ${Math.abs(diff)} fewer ${unit}`, cls: "down" };
  return { text: `Same as prior`, cls: "neutral" };
}

function changeStyle(cls: string): string {
  if (cls === "up") return "color:#10B981;";
  if (cls === "down") return "color:#EF4444;";
  return "color:#64748B;";
}

function auditBadgeStyle(type: string): { bg: string; color: string; label: string } {
  const t = type.toUpperCase();
  if (t.includes("VOID")) return { bg: "#FEE2E2", color: "#991B1B", label: "VOID" };
  if (t.includes("PICKUP") || t.includes("PICKED")) return { bg: "#DCFCE7", color: "#166534", label: "PICKUP" };
  if (t.includes("ORDER") || t.includes("CREATE")) return { bg: "#DBEAFE", color: "#1E40AF", label: "ORDER" };
  if (t.includes("STAGE")) return { bg: "#FEF3C7", color: "#92400E", label: "STAGE" };
  if (t.includes("SMS") || t.includes("EMAIL")) return { bg: "#EDE9FE", color: "#5B21B6", label: "SMS" };
  return { bg: "#F1F5F9", color: "#475569", label: t.slice(0, 8) };
}

// ─── Main Template ───────────────────────────────────────────────────────────

export function buildReportHTML(data: ReportData): string {
  const c = data.shop.currency || "\u20B1";
  const periodTitle = data.period === "today" ? "Daily" : data.period === "week" ? "Weekly" : "Monthly";
  const genTime = new Date(data.generatedAt).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.shop.name} - ${periodTitle} Report</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#F1F5F9;color:#1E293B;">
<div style="max-width:680px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;">

<!-- ═══ HEADER ═══ -->
<div style="background:linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%);padding:32px 32px 28px;color:#FFFFFF;">
  <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${periodTitle} Owner Report</h1>
  <div style="font-size:15px;color:#94A3B8;margin-bottom:12px;">${data.shop.name}</div>
  <span style="display:inline-block;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);color:#38BDF8;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;">${data.periodLabel}</span>
  <div style="font-size:12px;color:#64748B;margin-top:10px;">Generated at ${genTime} &bull; ${data.shop.address}</div>
</div>

<!-- ═══ 1. REVENUE SNAPSHOT ═══ -->
<div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
  <div style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:16px;">&#x1F4B0; Revenue Snapshot</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      ${_kpiCell(fmt(data.revenue.total, c), "Total Revenue", pctChange(data.revenue.total, data.revenue.prevTotal), true)}
      ${_kpiCell(String(data.revenue.orderCount), "Orders", diffChange(data.revenue.orderCount, data.revenue.prevOrderCount, ""))}
      ${_kpiCell(fmt(data.revenue.avgOrder, c), "Avg Order", pctChange(data.revenue.avgOrder, data.revenue.prevAvgOrder))}
    </tr>
    <tr>
      ${_kpiCell(`${data.revenue.totalKg.toFixed(1)} kg`, "KG Processed", pctChange(data.revenue.totalKg, data.revenue.prevKg))}
      ${_kpiCell(String(data.revenue.pickupsToday), "Pickups Today", { text: `&#x25CF; ${data.revenue.pendingPickup} still pending`, cls: "neutral" })}
      ${_kpiCell(String(data.revenue.newCustomers), "New Customers", { text: "", cls: "neutral" })}
    </tr>
  </table>
</div>

<!-- ═══ 2. PAYMENT BREAKDOWN ═══ -->
<div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
  <div style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:16px;">&#x1F4B3; Revenue by Payment Method</div>
  ${data.paymentBreakdown.map(p => `
  <div style="margin-bottom:10px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="width:100px;font-size:13px;color:#334155;font-weight:500;text-align:right;padding-right:10px;">${p.method}</td>
      <td style="padding:0;">
        <div style="height:28px;background:#F1F5F9;border-radius:6px;overflow:hidden;">
          <div style="height:28px;border-radius:6px;background:${p.color};width:${Math.max(p.pct, 8)}%;line-height:28px;padding-left:10px;font-size:12px;font-weight:600;color:#FFF;">${p.pct}%</div>
        </div>
      </td>
      <td style="width:90px;font-size:13px;font-weight:600;color:#0F172A;text-align:right;padding-left:10px;">${fmt(p.amount, c)}</td>
    </tr></table>
  </div>`).join("")}
  <table width="100%" style="border-collapse:collapse;margin-top:8px;">
    <tr style="background:#F8FAFC;">
      <td style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;">Total</td>
      <td style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;text-align:center;">${data.paymentBreakdown.reduce((s, p) => s + p.count, 0)} transactions</td>
      <td style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;text-align:right;">${fmt(data.revenue.total, c)}</td>
    </tr>
  </table>
</div>

<!-- ═══ 3. SERVICE BREAKDOWN ═══ -->
<div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
  <div style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:16px;">&#x1F9FA; Service Breakdown</div>
  <table width="100%" style="border-collapse:collapse;font-size:13px;">
    <tr>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E2E8F0;">Service</th>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E2E8F0;">Qty</th>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E2E8F0;">KG</th>
      <th style="text-align:right;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E2E8F0;">Revenue</th>
    </tr>
    ${data.serviceBreakdown.map(s => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${s.color};margin-right:6px;vertical-align:middle;"></span>${s.name}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;">${s.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;">${s.kg > 0 ? `${s.kg.toFixed(1)} kg` : "&mdash;"}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;text-align:right;">${fmt(s.revenue, c)}</td>
    </tr>`).join("")}
    <tr style="background:#F8FAFC;">
      <td style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;">Total</td>
      <td style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;">${data.serviceTotal.qty} items</td>
      <td style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;">${data.serviceTotal.kg.toFixed(1)} kg</td>
      <td style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;text-align:right;">${fmt(data.serviceTotal.revenue, c)}</td>
    </tr>
  </table>
  <p style="font-size:11px;color:#94A3B8;margin-top:8px;">* Some orders have multiple services; item count may exceed order count.</p>
</div>

<!-- ═══ 4. CUSTOMER INSIGHTS ═══ -->
<div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
  <div style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:16px;">&#x1F465; Customer Insights</div>
  <div style="display:inline-block;background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:1px solid #BFDBFE;border-radius:10px;padding:12px 20px;margin-bottom:14px;">
    <span style="font-size:26px;font-weight:800;color:#1E40AF;">${data.customers.totalInDatabase}</span>
    <span style="font-size:12px;color:#3B82F6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-left:8px;">Total Customers in Database</span>
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      ${_kpiCellSimple(String(data.customers.served), "Customers Served")}
      ${_kpiCellSimple(String(data.customers.newCount), "New Customers")}
      ${_kpiCellSimple(String(data.customers.returning), "Returning")}
      <td style="padding:4px;width:25%;">
        <div style="text-align:center;padding:12px 8px;border-radius:8px;background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border:1px solid #BBF7D0;">
          <div style="font-size:22px;font-weight:800;color:#0F172A;">${data.customers.repeatRate}%</div>
          <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">Repeat Rate</div>
        </div>
      </td>
    </tr>
  </table>
  ${data.customers.top5.length > 0 ? `
  <p style="font-size:13px;font-weight:600;color:#475569;margin:16px 0 8px;">Top 5 Customers</p>
  <table width="100%" style="border-collapse:collapse;font-size:13px;">
    <tr>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">#</th>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Customer</th>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Orders</th>
      <th style="text-align:right;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Spend</th>
    </tr>
    ${data.customers.top5.map((c, i) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;">${i + 1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;">
        ${c.name}
        ${c.isLoyal ? ' <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:#EDE9FE;color:#5B21B6;">Loyal</span>' : ""}
        ${c.isNew ? ' <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:#DCFCE7;color:#166534;">New</span>' : ""}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;">${c.orders}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;text-align:right;">${fmt(c.spend, data.shop.currency)}</td>
    </tr>`).join("")}
  </table>` : ""}
</div>

<!-- ═══ 5. STAFF PERFORMANCE ═══ -->
<div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
  <div style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:16px;">&#x1F464; Staff On Duty</div>
  ${data.staffPerformance.length === 0 ? '<div style="font-size:13px;color:#94A3B8;">No staff activity this period</div>' : `
  <table width="100%" style="border-collapse:collapse;font-size:13px;">
    <tr>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Staff</th>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Role</th>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Orders</th>
      <th style="text-align:right;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Revenue</th>
    </tr>
    ${data.staffPerformance.map(s => {
      const roleBadge = s.role === "OWNER" ? "background:#FEF3C7;color:#92400E;"
        : s.role === "MANAGER" ? "background:#DBEAFE;color:#1E40AF;"
          : "background:#F1F5F9;color:#475569;";
      return `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;font-weight:600;">${s.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;">
        <span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;${roleBadge}">${s.role.charAt(0) + s.role.slice(1).toLowerCase()}</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;">${s.ordersCreated}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;text-align:right;">${fmt(s.revenue, c)}</td>
    </tr>`;}).join("")}
    <tr style="background:#F8FAFC;">
      <td colspan="2" style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;">Total</td>
      <td style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;">${data.staffPerformance.reduce((s, x) => s + x.ordersCreated, 0)}</td>
      <td style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;text-align:right;">${fmt(data.staffPerformance.reduce((s, x) => s + x.revenue, 0), c)}</td>
    </tr>
  </table>`}
</div>

<!-- ═══ 6. ORDER PIPELINE ═══ -->
<div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
  <div style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:16px;">&#x1F4E6; Pickups &amp; Order Pipeline</div>
  
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
    <tr>
      <td style="padding:4px;width:50%;">
        <div style="text-align:center;padding:16px;border-radius:10px;background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border:1px solid #BBF7D0;">
          <div style="font-size:24px;font-weight:800;color:#0F172A;">${data.revenue.pickupsToday}</div>
          <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Picked Up Today</div>
        </div>
      </td>
      <td style="padding:4px;width:50%;">
        <div style="text-align:center;padding:16px;border-radius:10px;background:linear-gradient(135deg,#FEF3C7,rgba(253,232,138,0.3));border:1px solid #FDE68A;">
          <div style="font-size:24px;font-weight:800;color:#0F172A;">${data.revenue.pendingPickup}</div>
          <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Pending Pickup</div>
        </div>
      </td>
    </tr>
  </table>

  <div style="font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Current Pipeline</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      ${data.pipeline.map(st => {
        const isReady = st.label === "Ready";
        const bg = isReady ? "background:#F0FDF4;border:1px solid #10B981;" : "background:#F8FAFC;border:1px solid #E2E8F0;";
        return `<td style="padding:3px;width:${Math.floor(100/data.pipeline.length)}%;text-align:center;">
          <div style="${bg}border-radius:8px;padding:10px 4px;">
            <div style="font-size:16px;">${st.icon}</div>
            <div style="font-size:20px;font-weight:800;color:#0F172A;">${st.count}</div>
            <div style="font-size:9px;color:#64748B;text-transform:uppercase;letter-spacing:0.3px;">${st.label}</div>
          </div>
        </td>`;
      }).join("")}
    </tr>
  </table>

  ${data.overstayAlerts.length > 0 ? `
  <div style="font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin:16px 0 10px;">&#x26A0;&#xFE0F; Overstay Alerts</div>
  ${data.overstayAlerts.map(a => {
    const isAlert = a.level === "critical" || a.level === "alert";
    const bg = isAlert ? "background:#FEE2E2;border:1px solid #FECACA;" : "background:#FEF3C7;border:1px solid #FDE68A;";
    const badge = isAlert
      ? '<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#FEE2E2;color:#991B1B;">Alert</span>'
      : '<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#FEF3C7;color:#92400E;">Warning</span>';
    return `<div style="${bg}border-radius:8px;padding:10px 14px;margin-bottom:6px;font-size:13px;">
      Order <strong>${a.orderNum}</strong> &mdash; ${a.customerName} &mdash; Ready for <strong>${a.hours} hrs</strong> ${badge}
    </div>`;
  }).join("")}` : ""}

  ${data.voidedOrders.length > 0 ? `
  <div style="font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin:16px 0 10px;">Voided Orders</div>
  ${data.voidedOrders.map(v => `<div style="background:#FEE2E2;border:1px solid #FECACA;border-radius:8px;padding:10px 14px;margin-bottom:6px;font-size:13px;">
    <strong>${v.orderNum}</strong> voided by ${v.staffName} &mdash; "${v.reason}"
  </div>`).join("")}` : ""}
</div>

<!-- ═══ 7. INVENTORY ALERTS ═══ -->
<div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
  <div style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:16px;">&#x1F4E6; Inventory Alerts</div>
  
  ${data.inventoryAlerts.length > 0 ? data.inventoryAlerts.map(i => `
  <div style="background:#FEE2E2;border:1px solid #FECACA;border-radius:8px;padding:10px 14px;margin-bottom:6px;font-size:13px;">
    ${i.icon} <strong>${i.name}</strong> &mdash; <strong>${i.qty} ${i.unit}s</strong> remaining (min: ${i.minQty})
    <span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#FEE2E2;color:#991B1B;float:right;">Low Stock</span>
  </div>`).join("") : '<div style="background:#DCFCE7;border:1px solid #BBF7D0;border-radius:8px;padding:10px 14px;font-size:13px;color:#166534;">All inventory levels are OK</div>'}

  <div style="font-size:12px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin:16px 0 10px;">All Inventory Levels</div>
  <table width="100%" style="border-collapse:collapse;font-size:13px;">
    <tr>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Item</th>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Category</th>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Stock</th>
      <th style="text-align:right;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Status</th>
    </tr>
    ${data.inventoryAll.map(i => {
      const rowBg = i.isLow ? "background:#FEF2F2;" : "";
      const badge = i.isLow
        ? '<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#FEE2E2;color:#991B1B;">LOW</span>'
        : '<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#DCFCE7;color:#166534;">OK</span>';
      return `
    <tr style="${rowBg}">
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;">${i.icon} ${i.isLow ? `<strong>${i.name}</strong>` : i.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;">${i.category}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;">${i.isLow ? `<strong>${i.qty} ${i.unit}s</strong>` : `${i.qty} ${i.unit}s`}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;text-align:right;">${badge}</td>
    </tr>`;}).join("")}
  </table>
</div>

<!-- ═══ 8. SMS ACTIVITY ═══ -->
<div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
  <div style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:16px;">&#x1F4F1; SMS Activity</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      ${_kpiCellSimple(String(data.sms.total), "Messages Sent")}
      ${_kpiCellSimple(String(data.sms.receipts), "Receipts")}
      ${_kpiCellSimple(String(data.sms.readyAlerts), "Ready Alerts")}
      ${_kpiCellSimple(String(data.sms.reminders), "Reminders")}
    </tr>
  </table>
  <table width="100%" style="border-collapse:collapse;font-size:13px;margin-top:12px;">
    <tr>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Type</th>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Delivered</th>
      <th style="text-align:left;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Failed</th>
      <th style="text-align:right;padding:10px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Total</th>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;">Receipt Confirmation</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;"><span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#DCFCE7;color:#166534;">${data.sms.receipts}</span></td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;"><span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#F1F5F9;color:#475569;">0</span></td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;text-align:right;">${data.sms.receipts}</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;">Ready for Pickup</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;"><span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#DCFCE7;color:#166534;">${data.sms.readyAlerts}</span></td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;"><span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;${data.sms.failed > 0 ? "background:#FEE2E2;color:#991B1B;" : "background:#F1F5F9;color:#475569;"}">${data.sms.failed}</span></td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;text-align:right;">${data.sms.readyAlerts + data.sms.failed}</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;">Overstay Reminder</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;"><span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#DCFCE7;color:#166534;">${data.sms.reminders}</span></td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;"><span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#F1F5F9;color:#475569;">0</span></td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;text-align:right;">${data.sms.reminders}</td>
    </tr>
    <tr style="background:#F8FAFC;">
      <td style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;">Total</td>
      <td style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;">${data.sms.delivered}</td>
      <td style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;">${data.sms.failed}</td>
      <td style="padding:10px 12px;font-weight:700;color:#0F172A;border-top:2px solid #E2E8F0;text-align:right;">${data.sms.total}</td>
    </tr>
  </table>
</div>

<!-- ═══ 9. AUDIT LOG ═══ -->
<div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
  <div style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:16px;">&#x1F4CB; Audit Log Highlights</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
    <tr>
      ${_kpiCellSimple(String(data.audit.ordersCreated), "Orders Created")}
      ${_kpiCellSimple(String(data.audit.pickupsLogged), "Pickups Logged")}
      ${_kpiCellSimple(String(data.audit.voidCount), "Voids")}
      ${_kpiCellSimple(String(data.audit.stageChanges), "Stage Changes")}
    </tr>
  </table>
  ${data.audit.entries.length > 0 ? data.audit.entries.map(e => {
    const badge = auditBadgeStyle(e.type);
    return `<div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:13px;">
      <span style="color:#94A3B8;font-size:12px;white-space:nowrap;min-width:60px;">${e.time}</span>
      <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${badge.bg};color:${badge.color};white-space:nowrap;">${badge.label}</span>
      <span style="color:#334155;flex:1;">${e.desc}</span>
    </div>`;
  }).join("") : '<div style="font-size:13px;color:#94A3B8;">No audit entries for this period</div>'}
</div>

<!-- ═══ FOOTER ═══ -->
<div style="padding:20px 32px;background:#F8FAFC;text-align:center;border-top:1px solid #E2E8F0;">
  <p style="font-size:12px;color:#94A3B8;line-height:1.6;margin:0;">
    <strong>${data.shop.name}</strong><br/>
    ${data.shop.address} &bull; ${data.shop.phone}
  </p>
  <p style="font-size:11px;color:#CBD5E1;margin:8px 0 0;">Powered by WashTrack POS</p>
</div>

</div>
</body>
</html>`;
}

// ─── KPI Cell Helpers (for table-based email layout) ─────────────────────────

function _kpiCell(value: string, label: string, change: { text: string; cls: string }, highlight = false): string {
  const bg = highlight
    ? "background:linear-gradient(135deg,#EFF6FF,#F0F9FF);border:1px solid #BFDBFE;"
    : "background:#F8FAFC;border:1px solid #E2E8F0;";
  return `<td style="padding:4px;width:33%;">
    <div style="text-align:center;padding:14px 8px;border-radius:10px;${bg}">
      <div style="font-size:22px;font-weight:800;color:#0F172A;line-height:1.2;">${value}</div>
      <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">${label}</div>
      ${change.text ? `<div style="font-size:11px;font-weight:600;margin-top:4px;${changeStyle(change.cls)}">${change.text}</div>` : ""}
    </div>
  </td>`;
}

function _kpiCellSimple(value: string, label: string): string {
  return `<td style="padding:4px;width:25%;">
    <div style="text-align:center;padding:12px 8px;border-radius:8px;background:#F8FAFC;border:1px solid #E2E8F0;">
      <div style="font-size:22px;font-weight:800;color:#0F172A;">${value}</div>
      <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">${label}</div>
    </div>
  </td>`;
}
