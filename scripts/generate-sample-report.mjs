// Run with: node scripts/generate-sample-report.mjs
// Generates a sample WashTrack email report with fake data → sample-report.html

import { writeFileSync } from "fs";

// ─── Paste of buildReportHTML (inline to avoid TS imports) ────────────────────
// We replicate the template logic here in plain JS with fake data.

const data = {
  shop: { name: "Malinis Laundry Shop", address: "123 Rizal St, Brgy. San Isidro, Quezon City", phone: "0917-555-1234", currency: "₱", locale: "en-PH" },
  period: "today",
  periodLabel: "Monday, June 2, 2026",
  periodFrom: Date.now() - 86400000,
  periodTo: Date.now(),
  generatedAt: Date.now(),
  revenue: {
    total: 3250,
    orderCount: 12,
    avgOrder: 271,
    totalKg: 68.5,
    pickupsToday: 9,
    pendingPickup: 3,
    newCustomers: 2,
    prevTotal: 2980,
    prevOrderCount: 11,
    prevAvgOrder: 271,
    prevKg: 62,
  },
  paymentBreakdown: [
    { method: "Cash",        color: "10B981", amount: 1950, count: 7, pct: 60 },
    { method: "GCash",       color: "3B82F6", amount: 1000, count: 4, pct: 31 },
    { method: "Maya",        color: "8B5CF6", amount: 300,  count: 1, pct: 9  },
  ],
  serviceBreakdown: [
    { name: "Wash & Dry",    color: "3B82F6", qty: 6, kg: 38.5, revenue: 1750 },
    { name: "Wash Only",     color: "10B981", qty: 4, kg: 22.0, revenue: 880  },
    { name: "Dry Clean",     color: "8B5CF6", qty: 1, kg: 5.0,  revenue: 420  },
    { name: "Press/Iron",    color: "F59E0B", qty: 1, kg: 3.0,  revenue: 200  },
  ],
  serviceTotal: { qty: 12, kg: 68.5, revenue: 3250 },
  customers: {
    totalInDatabase: 214,
    served: 11,
    newCount: 2,
    returning: 9,
    repeatRate: 81.8,
    top5: [
      { name: "Maria Santos",    orders: 2, spend: 580, isNew: false, isLoyal: true  },
      { name: "Juan dela Cruz",  orders: 1, spend: 420, isNew: false, isLoyal: true  },
      { name: "Ana Reyes",       orders: 1, spend: 350, isNew: false, isLoyal: false },
      { name: "Carlo Mendoza",   orders: 1, spend: 300, isNew: true,  isLoyal: false },
      { name: "Lita Bautista",   orders: 1, spend: 270, isNew: false, isLoyal: true  },
    ],
  },
  staffPerformance: [
    { name: "Owner (Rico)",  role: "OWNER",   ordersCreated: 5, revenue: 1380 },
    { name: "Ate Nena",      role: "MANAGER", ordersCreated: 4, revenue: 1100 },
    { name: "Kuya Mark",     role: "STAFF",   ordersCreated: 3, revenue: 770  },
  ],
  pipeline: [
    { stageId: 1, label: "Received",  icon: "📥", color: "64748B", count: 1 },
    { stageId: 2, label: "Washing",   icon: "🌊", color: "3B82F6", count: 2 },
    { stageId: 3, label: "Drying",    icon: "💨", color: "06B6D4", count: 1 },
    { stageId: 4, label: "Folding",   icon: "👕", color: "8B5CF6", count: 1 },
    { stageId: 5, label: "Ready",     icon: "✅", color: "10B981", count: 3 },
    { stageId: 6, label: "Claimed",   icon: "🎉", color: "F59E0B", count: 9  },
  ],
  overstayAlerts: [
    { orderNum: "WT-0041", customerName: "Pedro Lim",    hours: 52, level: "alert"    },
    { orderNum: "WT-0038", customerName: "Rosa Garcia",  hours: 28, level: "warn"     },
  ],
  voidedOrders: [
    { orderNum: "WT-0029", reason: "Customer cancelled", staffName: "Ate Nena" },
  ],
  inventoryAlerts: [
    { name: "Detergent Powder",  icon: "🧴", category: "Detergents",  qty: 2,  minQty: 5,  unit: "kg"  },
    { name: "Fabric Conditioner",icon: "🌸", category: "Conditioners",qty: 1,  minQty: 3,  unit: "L"   },
  ],
  inventoryAll: [
    { name: "Detergent Powder",   icon: "🧴", category: "Detergents",  qty: 2,  minQty: 5,  unit: "kg",  isLow: true  },
    { name: "Fabric Conditioner", icon: "🌸", category: "Conditioners",qty: 1,  minQty: 3,  unit: "L",   isLow: true  },
    { name: "Bleach",             icon: "🫧", category: "Chemicals",   qty: 8,  minQty: 4,  unit: "L",   isLow: false },
    { name: "Dryer Sheets",       icon: "📄", category: "Supplies",    qty: 45, minQty: 20, unit: "pcs", isLow: false },
  ],
  sms: { total: 34, receipts: 18, readyAlerts: 12, reminders: 4, delivered: 32, failed: 2 },
  audit: {
    ordersCreated: 34,
    pickupsLogged: 28,
    voidCount: 1,
    stageChanges: 47,
    entries: [
      { time: "6:12 PM", type: "ORDER_CREATE",  desc: "New order WT-0047 — Maria Santos — ₱550" },
      { time: "5:58 PM", type: "PICKUP",        desc: "WT-0035 picked up — Juan dela Cruz" },
      { time: "5:41 PM", type: "STAGE_CHANGE",  desc: "WT-0044 → Ready for pickup" },
      { time: "5:30 PM", type: "SMS",           desc: "Ready alert sent to Ana Reyes — 09171234567" },
      { time: "4:55 PM", type: "ORDER_VOID",    desc: "WT-0029 voided — Customer cancelled (Ate Nena)" },
      { time: "4:20 PM", type: "ORDER_CREATE",  desc: "New order WT-0046 — Carlo Mendoza — ₱850" },
      { time: "3:44 PM", type: "PICKUP",        desc: "WT-0031 picked up — Lita Bautista" },
      { time: "2:15 PM", type: "STAGE_CHANGE",  desc: "WT-0040 → Folding" },
    ],
  },
};

// ─── Inline template (simplified version of reportTemplate.ts) ───────────────

function fmt(amount) { return `₱${Number(amount).toLocaleString("en-PH")}`; }
function pctChange(cur, prev) {
  if (prev === 0 && cur === 0) return { text: "No change", cls: "neutral" };
  if (prev === 0) return { text: "+100%", cls: "up" };
  const p = Math.round(((cur - prev) / prev) * 100);
  if (p > 0) return { text: `▲ ${p}% vs prior`, cls: "up" };
  if (p < 0) return { text: `▼ ${Math.abs(p)}% vs prior`, cls: "down" };
  return { text: "No change", cls: "neutral" };
}
function changeColor(cls) {
  return cls === "up" ? "#10B981" : cls === "down" ? "#EF4444" : "#64748B";
}
function auditColor(type) {
  const t = type.toUpperCase();
  if (t.includes("VOID"))   return { bg: "#FEE2E2", color: "#991B1B", label: "VOID" };
  if (t.includes("PICKUP")) return { bg: "#DCFCE7", color: "#166534", label: "PICKUP" };
  if (t.includes("ORDER"))  return { bg: "#DBEAFE", color: "#1E40AF", label: "ORDER" };
  if (t.includes("STAGE"))  return { bg: "#FEF3C7", color: "#92400E", label: "STAGE" };
  if (t.includes("SMS"))    return { bg: "#EDE9FE", color: "#5B21B6", label: "SMS" };
  return { bg: "#F1F5F9", color: "#475569", label: type.slice(0, 8) };
}

const r = data.revenue;
const revChange     = pctChange(r.total,      r.prevTotal);
const orderChange   = pctChange(r.orderCount, r.prevOrderCount);
const avgChange     = pctChange(r.avgOrder,   r.prevAvgOrder);
const kgChange      = pctChange(r.totalKg,    r.prevKg);
const genTime       = new Date(data.generatedAt).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true });

const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>WashTrack Report — ${data.periodLabel}</title></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,sans-serif;">
<div style="max-width:680px;margin:32px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#1E3A5F,#2563EB);padding:32px 36px 24px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:22px;font-weight:900;color:#FFFFFF;letter-spacing:-0.5px;">🧺 ${data.shop.name}</div>
        <div style="font-size:13px;color:#93C5FD;margin-top:2px;">${data.shop.address}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#93C5FD;">Daily Report</div>
        <div style="font-size:13px;color:#FFFFFF;margin-top:2px;">${data.periodLabel}</div>
        <div style="font-size:11px;color:#60A5FA;margin-top:2px;">Generated ${genTime}</div>
      </div>
    </div>
  </div>

  <!-- REVENUE SNAPSHOT -->
  <div style="padding:28px 32px;border-bottom:1px solid #F1F5F9;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:16px;">💰 Revenue Snapshot</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        ${[
          { label: "Total Revenue",   val: fmt(r.total),      change: revChange   },
          { label: "Orders",          val: r.orderCount,      change: orderChange },
          { label: "Avg Order Value", val: fmt(r.avgOrder),   change: avgChange   },
          { label: "Total KG",        val: r.totalKg + " kg", change: kgChange    },
        ].map(k => `
        <td style="padding:4px;width:25%;">
          <div style="text-align:center;padding:14px 8px;border-radius:10px;background:#F8FAFC;border:1px solid #E2E8F0;">
            <div style="font-size:24px;font-weight:800;color:#0F172A;">${k.val}</div>
            <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin:2px 0;">${k.label}</div>
            <div style="font-size:11px;font-weight:600;color:${changeColor(k.change.cls)};">${k.change.text}</div>
          </div>
        </td>`).join("")}
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:10px;">
      <tr>
        ${[
          { label: "Pickups Today",   val: r.pickupsToday,  color: "#10B981" },
          { label: "Pending Pickup",  val: r.pendingPickup, color: "#F59E0B" },
          { label: "New Customers",   val: r.newCustomers,  color: "#3B82F6" },
        ].map(k => `
        <td style="padding:4px;width:33%;">
          <div style="text-align:center;padding:10px 8px;border-radius:8px;background:${k.color}12;border:1px solid ${k.color}30;">
            <div style="font-size:20px;font-weight:800;color:${k.color};">${k.val}</div>
            <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">${k.label}</div>
          </div>
        </td>`).join("")}
      </tr>
    </table>
  </div>

  <!-- PAYMENT BREAKDOWN -->
  <div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:14px;">💳 Payment Breakdown</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
      <tr style="background:#F8FAFC;">
        <th style="text-align:left;padding:8px 12px;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Method</th>
        <th style="text-align:right;padding:8px 12px;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Amount</th>
        <th style="text-align:right;padding:8px 12px;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Orders</th>
        <th style="text-align:right;padding:8px 12px;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Share</th>
      </tr>
      ${data.paymentBreakdown.map((p, i) => `
      <tr style="background:${i % 2 ? "#F8FAFC" : "#FFFFFF"};">
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#${p.color};margin-right:8px;vertical-align:middle;"></span>
          <strong>${p.method}</strong>
        </td>
        <td style="padding:10px 12px;text-align:right;font-weight:700;color:#0F172A;border-bottom:1px solid #F1F5F9;">${fmt(p.amount)}</td>
        <td style="padding:10px 12px;text-align:right;color:#475569;border-bottom:1px solid #F1F5F9;">${p.count}</td>
        <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #F1F5F9;">
          <span style="background:#${p.color}20;color:#${p.color};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;">${p.pct}%</span>
        </td>
      </tr>`).join("")}
    </table>
  </div>

  <!-- SERVICE BREAKDOWN -->
  <div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:14px;">🧺 Service Breakdown</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
      <tr style="background:#F8FAFC;">
        <th style="text-align:left;padding:8px 12px;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Service</th>
        <th style="text-align:right;padding:8px 12px;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Orders</th>
        <th style="text-align:right;padding:8px 12px;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">KG</th>
        <th style="text-align:right;padding:8px 12px;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Revenue</th>
      </tr>
      ${data.serviceBreakdown.map((s, i) => `
      <tr style="background:${i % 2 ? "#F8FAFC" : "#FFFFFF"};">
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#${s.color};margin-right:8px;vertical-align:middle;"></span>
          <strong>${s.name}</strong>
        </td>
        <td style="padding:10px 12px;text-align:right;color:#475569;border-bottom:1px solid #F1F5F9;">${s.qty}</td>
        <td style="padding:10px 12px;text-align:right;color:#475569;border-bottom:1px solid #F1F5F9;">${s.kg} kg</td>
        <td style="padding:10px 12px;text-align:right;font-weight:700;color:#0F172A;border-bottom:1px solid #F1F5F9;">${fmt(s.revenue)}</td>
      </tr>`).join("")}
    </table>
  </div>

  <!-- CUSTOMER INSIGHTS -->
  <div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:16px;">👥 Customer Insights</div>
    <div style="display:inline-block;background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:1px solid #BFDBFE;border-radius:10px;padding:12px 20px;margin-bottom:14px;">
      <span style="font-size:26px;font-weight:800;color:#1E40AF;">${data.customers.totalInDatabase}</span>
      <span style="font-size:12px;color:#3B82F6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-left:8px;">Total Customers in Database</span>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        ${[
          { label: "Served Today",   val: data.customers.served },
          { label: "New Customers",  val: data.customers.newCount },
          { label: "Returning",      val: data.customers.returning },
        ].map(k => `
        <td style="padding:4px;width:25%;">
          <div style="text-align:center;padding:12px 8px;border-radius:8px;background:#F8FAFC;border:1px solid #E2E8F0;">
            <div style="font-size:22px;font-weight:800;color:#0F172A;">${k.val}</div>
            <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">${k.label}</div>
          </div>
        </td>`).join("")}
        <td style="padding:4px;width:25%;">
          <div style="text-align:center;padding:12px 8px;border-radius:8px;background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border:1px solid #BBF7D0;">
            <div style="font-size:22px;font-weight:800;color:#0F172A;">${data.customers.repeatRate}%</div>
            <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">Repeat Rate</div>
          </div>
        </td>
      </tr>
    </table>
    <p style="font-size:13px;font-weight:600;color:#475569;margin:16px 0 8px;">Top 5 Customers</p>
    <table width="100%" style="border-collapse:collapse;font-size:13px;">
      <tr>
        <th style="text-align:left;padding:8px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">#</th>
        <th style="text-align:left;padding:8px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Customer</th>
        <th style="text-align:right;padding:8px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Orders</th>
        <th style="text-align:right;padding:8px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Spend</th>
      </tr>
      ${data.customers.top5.map((c, i) => `
      <tr style="background:${i % 2 ? "#F8FAFC" : "#FFFFFF"};">
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#64748B;font-weight:700;">${i + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;">
          <strong style="color:#0F172A;">${c.name}</strong>
          ${c.isNew   ? ' <span style="background:#DBEAFE;color:#1E40AF;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:700;">NEW</span>' : ""}
          ${c.isLoyal ? ' <span style="background:#FEF3C7;color:#92400E;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:700;">⭐ LOYAL</span>' : ""}
        </td>
        <td style="padding:10px 12px;text-align:right;color:#475569;border-bottom:1px solid #F1F5F9;">${c.orders}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:700;color:#0F172A;border-bottom:1px solid #F1F5F9;">${fmt(c.spend)}</td>
      </tr>`).join("")}
    </table>
  </div>

  <!-- STAFF PERFORMANCE -->
  <div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:14px;">👨‍💼 Staff Performance</div>
    <table width="100%" style="border-collapse:collapse;font-size:13px;">
      <tr>
        <th style="text-align:left;padding:8px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Staff</th>
        <th style="text-align:left;padding:8px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Role</th>
        <th style="text-align:right;padding:8px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Orders</th>
        <th style="text-align:right;padding:8px 12px;background:#F8FAFC;color:#64748B;font-weight:600;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Revenue</th>
      </tr>
      ${data.staffPerformance.map((s, i) => `
      <tr style="background:${i % 2 ? "#F8FAFC" : "#FFFFFF"};">
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;"><strong>${s.name}</strong></td>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;"><span style="background:#EFF6FF;color:#2563EB;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700;">${s.role}</span></td>
        <td style="padding:10px 12px;text-align:right;color:#475569;border-bottom:1px solid #F1F5F9;">${s.ordersCreated}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:700;color:#0F172A;border-bottom:1px solid #F1F5F9;">${fmt(s.revenue)}</td>
      </tr>`).join("")}
    </table>
  </div>

  <!-- ORDER PIPELINE -->
  <div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:14px;">📋 Order Pipeline</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        ${data.pipeline.map(p => `
        <td style="padding:4px;text-align:center;">
          <div style="padding:10px 6px;border-radius:8px;background:#${p.color}18;border:1px solid #${p.color}40;">
            <div style="font-size:16px;">${p.icon}</div>
            <div style="font-size:20px;font-weight:800;color:#${p.color};">${p.count}</div>
            <div style="font-size:10px;color:#64748B;margin-top:2px;">${p.label}</div>
          </div>
        </td>`).join("")}
      </tr>
    </table>
    ${data.overstayAlerts.length > 0 ? `
    <div style="margin-top:14px;">
      <div style="font-size:12px;font-weight:700;color:#92400E;margin-bottom:8px;">⚠️ Overstay Alerts</div>
      ${data.overstayAlerts.map(a => `
      <div style="display:flex;justify-content:space-between;padding:8px 12px;border-radius:6px;background:${a.level === "alert" ? "#FEF3C7" : "#FFF7ED"};border:1px solid ${a.level === "alert" ? "#F59E0B" : "#FB923C"};margin-bottom:6px;font-size:13px;">
        <span><strong>${a.orderNum}</strong> — ${a.customerName}</span>
        <span style="font-weight:700;color:${a.level === "alert" ? "#92400E" : "#C2410C"};">Ready ${a.hours} hrs</span>
      </div>`).join("")}
    </div>` : ""}
  </div>

  <!-- INVENTORY ALERTS -->
  ${data.inventoryAlerts.length > 0 ? `
  <div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:14px;">📦 Inventory Alerts</div>
    ${data.inventoryAlerts.map(i => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-radius:8px;background:#FEF2F2;border:1px solid #FECACA;margin-bottom:8px;">
      <span style="font-size:13px;"><strong>${i.icon} ${i.name}</strong> <span style="color:#64748B;">(${i.category})</span></span>
      <span style="font-size:13px;font-weight:700;color:#DC2626;">${i.qty} ${i.unit} left <span style="color:#94A3B8;font-weight:400;">(min: ${i.minQty})</span></span>
    </div>`).join("")}
  </div>` : ""}

  <!-- SMS ACTIVITY -->
  <div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:14px;">💬 SMS Activity</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        ${[
          { label: "Total Sent",    val: data.sms.total,       color: "6366F1" },
          { label: "Delivered",     val: data.sms.delivered,   color: "10B981" },
          { label: "Ready Alerts",  val: data.sms.readyAlerts, color: "3B82F6" },
          { label: "Failed",        val: data.sms.failed,      color: "EF4444" },
        ].map(k => `
        <td style="padding:4px;width:25%;">
          <div style="text-align:center;padding:12px 8px;border-radius:8px;background:#${k.color}12;border:1px solid #${k.color}30;">
            <div style="font-size:22px;font-weight:800;color:#${k.color};">${k.val}</div>
            <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">${k.label}</div>
          </div>
        </td>`).join("")}
      </tr>
    </table>
  </div>

  <!-- AUDIT LOG -->
  <div style="padding:24px 32px;border-bottom:1px solid #F1F5F9;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748B;margin-bottom:14px;">📝 Today's Activity</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        ${[
          { label: "Orders Created", val: data.audit.ordersCreated },
          { label: "Pickups",        val: data.audit.pickupsLogged },
          { label: "Voids",          val: data.audit.voidCount     },
          { label: "Stage Changes",  val: data.audit.stageChanges  },
        ].map(k => `
        <td style="padding:4px;width:25%;">
          <div style="text-align:center;padding:10px 8px;border-radius:8px;background:#F8FAFC;border:1px solid #E2E8F0;">
            <div style="font-size:20px;font-weight:800;color:#0F172A;">${k.val}</div>
            <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">${k.label}</div>
          </div>
        </td>`).join("")}
      </tr>
    </table>
    <table width="100%" style="border-collapse:collapse;font-size:13px;margin-top:14px;">
      ${data.audit.entries.map(a => {
        const badge = auditColor(a.type);
        return `
      <tr>
        <td style="padding:7px 8px;border-bottom:1px solid #F1F5F9;color:#94A3B8;font-size:11px;white-space:nowrap;width:60px;">${a.time}</td>
        <td style="padding:7px 8px;border-bottom:1px solid #F1F5F9;width:80px;">
          <span style="background:${badge.bg};color:${badge.color};padding:2px 6px;border-radius:6px;font-size:10px;font-weight:700;">${badge.label}</span>
        </td>
        <td style="padding:7px 8px;border-bottom:1px solid #F1F5F9;color:#334155;">${a.desc}</td>
      </tr>`;
      }).join("")}
    </table>
  </div>

  <!-- FOOTER -->
  <div style="padding:20px 32px;background:#F8FAFC;text-align:center;">
    <div style="font-size:12px;color:#94A3B8;">
      WashTrack POS · ${data.shop.name} · ${data.shop.phone}<br>
      <span style="color:#CBD5E1;">Auto-generated report · ${data.periodLabel}</span>
    </div>
  </div>

</div>
</body>
</html>`;

writeFileSync("C:/Users/Chessa Code/Desktop/WashTrack-Sample-Report.html", html, "utf8");
console.log("✅ Report saved to Desktop: WashTrack-Sample-Report.html");
