// ─── Report Data Builder ─────────────────────────────────────────────────────
// Aggregates all app state into a structured report object for a given period.

import type {
  Shop, Order, Customer, Staff, Service, PayMethod, Stage,
  InventoryItem, SmsLogEntry, AuditLogEntry,
} from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReportPeriod = "today" | "week" | "month";

export interface ReportData {
  shop: Shop;
  period: ReportPeriod;
  periodLabel: string;
  periodFrom: number;
  periodTo: number;
  generatedAt: number;

  // 1. Revenue snapshot
  revenue: {
    total: number;
    orderCount: number;
    avgOrder: number;
    totalKg: number;
    pickupsToday: number;
    pendingPickup: number;
    newCustomers: number;
    // Comparison vs previous period
    prevTotal: number;
    prevOrderCount: number;
    prevAvgOrder: number;
    prevKg: number;
  };

  // 2. Payment method breakdown
  paymentBreakdown: {
    method: string;
    color: string;
    amount: number;
    count: number;
    pct: number;
  }[];

  // 3. Service breakdown
  serviceBreakdown: {
    name: string;
    color: string;
    qty: number;
    kg: number;
    revenue: number;
  }[];
  serviceTotal: { qty: number; kg: number; revenue: number };

  // 4. Customer insights
  customers: {
    served: number;
    newCount: number;
    returning: number;
    repeatRate: number;
    top5: { name: string; orders: number; spend: number; isNew: boolean; isLoyal: boolean }[];
  };

  // 5. Staff performance
  staffPerformance: {
    name: string;
    role: string;
    ordersCreated: number;
    revenue: number;
  }[];

  // 6. Order pipeline
  pipeline: {
    stageId: number;
    label: string;
    icon: string;
    color: string;
    count: number;
  }[];
  overstayAlerts: {
    orderNum: string;
    customerName: string;
    hours: number;
    level: "warn" | "alert" | "critical";
  }[];
  voidedOrders: {
    orderNum: string;
    reason: string;
    staffName: string;
  }[];

  // 7. Inventory alerts
  inventoryAlerts: {
    name: string;
    icon: string;
    category: string;
    qty: number;
    minQty: number;
    unit: string;
  }[];
  inventoryAll: {
    name: string;
    icon: string;
    category: string;
    qty: number;
    minQty: number;
    unit: string;
    isLow: boolean;
  }[];

  // 8. SMS activity
  sms: {
    total: number;
    receipts: number;
    readyAlerts: number;
    reminders: number;
    delivered: number;
    failed: number;
  };

  // 9. Audit highlights
  audit: {
    ordersCreated: number;
    pickupsLogged: number;
    voidCount: number;
    stageChanges: number;
    entries: {
      time: string;
      type: string;
      desc: string;
    }[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfDay(ts?: number): number {
  const d = ts ? new Date(ts) : new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getPeriodRange(period: ReportPeriod): { from: number; to: number; prevFrom: number; prevTo: number; label: string } {
  const now = Date.now();
  const todayStart = startOfDay();
  const DAY = 86400000;

  switch (period) {
    case "today": {
      const label = new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      return { from: todayStart, to: now, prevFrom: todayStart - DAY, prevTo: todayStart, label };
    }
    case "week": {
      const from = todayStart - 6 * DAY;
      const label = `${new Date(from).toLocaleDateString("en-PH", { month: "short", day: "numeric" })} - ${new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`;
      return { from, to: now, prevFrom: from - 7 * DAY, prevTo: from, label };
    }
    case "month": {
      const from = todayStart - 29 * DAY;
      const label = `${new Date(from).toLocaleDateString("en-PH", { month: "short", day: "numeric" })} - ${new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`;
      return { from, to: now, prevFrom: from - 30 * DAY, prevTo: from, label };
    }
  }
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true });
}

// ─── Main Builder ────────────────────────────────────────────────────────────

export function buildReportData(
  period: ReportPeriod,
  shop: Shop,
  orders: Order[],
  customers: Customer[],
  staff: Staff[],
  services: Service[],
  payMethods: PayMethod[],
  stages: Stage[],
  inventory: InventoryItem[],
  smsLog: SmsLogEntry[],
  auditLog: AuditLogEntry[],
): ReportData {
  const { from, to, prevFrom, prevTo, label } = getPeriodRange(period);

  // ── Filter orders ──
  const periodOrders = orders.filter(o => !o.voided && o.createdAt >= from && o.createdAt <= to);
  const prevOrders = orders.filter(o => !o.voided && o.createdAt >= prevFrom && o.createdAt < prevTo);
  const voidedInPeriod = orders.filter(o => o.voided && o.voidedAt && o.voidedAt >= from && o.voidedAt <= to);

  // ── 1. Revenue Snapshot ──
  const total = periodOrders.reduce((s, o) => s + o.total, 0);
  const orderCount = periodOrders.length;
  const avgOrder = orderCount > 0 ? Math.round(total / orderCount) : 0;
  const totalKg = periodOrders.reduce((s, o) =>
    s + o.items.reduce((a, i) => a + (i.pricingType === "PER_KG" ? i.kg : i.pricingType === "FIXED_LOAD" ? i.minKg : 0), 0), 0);

  const todayStart = startOfDay();
  const pickupsToday = orders.filter(o => o.pickedUpAt && o.pickedUpAt >= todayStart).length;
  const readyOrders = orders.filter(o => !o.voided && o.statusId === 5);
  const pendingPickup = readyOrders.length;

  // New customers: customers whose first order in our data falls within this period
  const customerFirstOrder: Record<string, number> = {};
  orders.filter(o => !o.voided).forEach(o => {
    if (!customerFirstOrder[o.customerId] || o.createdAt < customerFirstOrder[o.customerId]) {
      customerFirstOrder[o.customerId] = o.createdAt;
    }
  });
  const newCustomerIds = new Set(
    Object.entries(customerFirstOrder)
      .filter(([, firstAt]) => firstAt >= from && firstAt <= to)
      .map(([id]) => id)
  );

  const prevTotal = prevOrders.reduce((s, o) => s + o.total, 0);
  const prevOrderCount = prevOrders.length;
  const prevAvgOrder = prevOrderCount > 0 ? Math.round(prevTotal / prevOrderCount) : 0;
  const prevKg = prevOrders.reduce((s, o) =>
    s + o.items.reduce((a, i) => a + (i.pricingType === "PER_KG" ? i.kg : i.pricingType === "FIXED_LOAD" ? i.minKg : 0), 0), 0);

  // ── 2. Payment Breakdown ──
  const payMap: Record<string, { amount: number; count: number; color: string }> = {};
  payMethods.filter(p => p.active).forEach(p => { payMap[p.label] = { amount: 0, count: 0, color: p.color }; });
  periodOrders.forEach(o => {
    const key = o.paymentMethod || "Cash";
    if (!payMap[key]) payMap[key] = { amount: 0, count: 0, color: "#6B7280" };
    payMap[key].amount += o.total;
    payMap[key].count += 1;
  });
  const paymentBreakdown = Object.entries(payMap)
    .filter(([, v]) => v.count > 0)
    .map(([method, v]) => ({
      method,
      color: v.color,
      amount: v.amount,
      count: v.count,
      pct: total > 0 ? Math.round((v.amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // ── 3. Service Breakdown ──
  const svcMap: Record<string, { name: string; color: string; qty: number; kg: number; revenue: number }> = {};
  periodOrders.forEach(o => o.items.forEach(i => {
    if (!svcMap[i.serviceId]) {
      const svc = services.find(s => s.id === i.serviceId);
      svcMap[i.serviceId] = { name: i.serviceName, color: svc?.color || i.color, qty: 0, kg: 0, revenue: 0 };
    }
    svcMap[i.serviceId].qty += i.pricingType === "PER_KG" ? 1 : (i.qty || 1);
    svcMap[i.serviceId].kg += i.pricingType === "PER_KG" ? i.kg : (i.pricingType === "FIXED_LOAD" ? (i.minKg * (i.qty || 1)) : 0);
    svcMap[i.serviceId].revenue += i.subtotal;
  }));
  const serviceBreakdown = Object.values(svcMap).sort((a, b) => b.revenue - a.revenue);
  const serviceTotal = {
    qty: serviceBreakdown.reduce((s, v) => s + v.qty, 0),
    kg: serviceBreakdown.reduce((s, v) => s + v.kg, 0),
    revenue: serviceBreakdown.reduce((s, v) => s + v.revenue, 0),
  };

  // ── 4. Customer Insights ──
  const uniqueCustomerIds = new Set(periodOrders.map(o => o.customerId));
  const served = uniqueCustomerIds.size;
  const newCount = [...uniqueCustomerIds].filter(id => newCustomerIds.has(id)).length;
  const returning = served - newCount;
  const repeatRate = served > 0 ? Math.round((returning / served) * 1000) / 10 : 0;

  const custSpend: Record<string, { name: string; orders: number; spend: number; id: string }> = {};
  periodOrders.forEach(o => {
    if (!custSpend[o.customerId]) {
      custSpend[o.customerId] = { name: o.customerName, orders: 0, spend: 0, id: o.customerId };
    }
    custSpend[o.customerId].orders += 1;
    custSpend[o.customerId].spend += o.total;
  });
  const top5 = Object.values(custSpend)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5)
    .map(c => {
      const cust = customers.find(x => x.id === c.id);
      return {
        name: c.name,
        orders: c.orders,
        spend: c.spend,
        isNew: newCustomerIds.has(c.id),
        isLoyal: (cust?.visits ?? 0) >= 10,
      };
    });

  // ── 5. Staff Performance ──
  const staffMap: Record<string, { name: string; role: string; ordersCreated: number; revenue: number }> = {};
  periodOrders.forEach(o => {
    const sid = o.createdBy;
    if (!staffMap[sid]) {
      const s = staff.find(x => x.id === sid);
      staffMap[sid] = { name: s?.name || o.createdByName || "Unknown", role: s?.role || "STAFF", ordersCreated: 0, revenue: 0 };
    }
    staffMap[sid].ordersCreated += 1;
    staffMap[sid].revenue += o.total;
  });
  const staffPerformance = Object.values(staffMap).sort((a, b) => b.revenue - a.revenue);

  // ── 6. Pipeline ──
  const activeOrders = orders.filter(o => !o.voided);
  const pipeline = stages.map(st => ({
    stageId: st.id,
    label: st.label,
    icon: st.icon,
    color: st.color,
    count: st.id === 6
      ? (period === "today" ? pickupsToday : periodOrders.filter(o => o.statusId === 6).length)
      : activeOrders.filter(o => o.statusId === st.id).length,
  }));

  // Overstay
  const overstayAlerts = readyOrders
    .map(o => {
      const hrs = Math.floor((Date.now() - o.statusUpdatedAt) / 3600000);
      const level = hrs >= (shop.overstayCritHrs || 72) ? "critical" as const
        : hrs >= (shop.overstayAlertHrs || 48) ? "alert" as const
          : hrs >= (shop.overstayWarnHrs || 24) ? "warn" as const
            : null;
      return level ? { orderNum: o.orderNum, customerName: o.customerName, hours: hrs, level } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.hours - a.hours);

  const voidedOrders = voidedInPeriod.map(o => {
    const s = staff.find(x => x.id === o.voidedBy);
    return { orderNum: o.orderNum, reason: o.voidReason || "No reason", staffName: s?.name || "Unknown" };
  });

  // ── 7. Inventory ──
  const inventoryAlerts = inventory
    .filter(i => i.qty <= i.minQty)
    .map(i => ({ name: i.name, icon: i.icon, category: i.category, qty: i.qty, minQty: i.minQty, unit: i.unit }));

  const inventoryAll = inventory.map(i => ({
    name: i.name, icon: i.icon, category: i.category,
    qty: i.qty, minQty: i.minQty, unit: i.unit,
    isLow: i.qty <= i.minQty,
  }));

  // ── 8. SMS Activity ──
  const periodSms = smsLog.filter(s => s.at >= from && s.at <= to);
  const smsTotal = periodSms.length;
  const smsFailed = periodSms.filter(s => s.status === "FAILED").length;
  // Categorize by message content heuristics
  const receipts = periodSms.filter(s => s.message.toLowerCase().includes("received") || s.message.toLowerCase().includes("order #")).length;
  const readyAlerts = periodSms.filter(s => s.message.toLowerCase().includes("ready")).length;
  const reminders = periodSms.filter(s => s.message.toLowerCase().includes("reminder")).length;

  // ── 9. Audit ──
  const periodAudit = auditLog.filter(a => a.at >= from && a.at <= to);
  const ordersCreated = periodAudit.filter(a => a.type === "ORDER_CREATE" || a.type === "ORDER").length;
  const pickupsLogged = periodAudit.filter(a => a.type === "PICKUP" || a.type === "ORDER_PICKUP" || a.desc.toLowerCase().includes("picked up")).length;
  const voidCount = periodAudit.filter(a => a.type === "VOID" || a.type === "ORDER_VOID").length;
  const stageChanges = periodAudit.filter(a => a.type === "STAGE" || a.type === "STAGE_CHANGE" || a.type === "ORDER_STAGE").length;

  const auditEntries = periodAudit.slice(0, 15).map(a => ({
    time: fmtTime(a.at),
    type: a.type,
    desc: a.desc,
  }));

  return {
    shop,
    period,
    periodLabel: label,
    periodFrom: from,
    periodTo: to,
    generatedAt: Date.now(),
    revenue: {
      total, orderCount, avgOrder, totalKg,
      pickupsToday, pendingPickup, newCustomers: newCount,
      prevTotal, prevOrderCount, prevAvgOrder, prevKg,
    },
    paymentBreakdown,
    serviceBreakdown,
    serviceTotal,
    customers: { served, newCount, returning, repeatRate, top5 },
    staffPerformance,
    pipeline,
    overstayAlerts,
    voidedOrders,
    inventoryAlerts,
    inventoryAll,
    sms: { total: smsTotal, receipts, readyAlerts, reminders, delivered: smsTotal - smsFailed, failed: smsFailed },
    audit: { ordersCreated, pickupsLogged, voidCount, stageChanges, entries: auditEntries },
  };
}
