import type { Shop, Service, Order, Overstay, ThemePreset } from "./types";

// ─── Formatting ──────────────────────────────────────────────────────────────
export function formatCurrency(amount: number, shop: Shop): string {
  return `${shop.currency}${amount.toLocaleString(shop.locale || "en-PH")}`;
}

export function fmtDate(ts: number, shop: Shop, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(ts).toLocaleDateString(shop.locale || "en-PH", opts);
}

export function fmtDateTime(ts: number, shop: Shop): string {
  return new Date(ts).toLocaleString(shop.locale || "en-PH");
}

// ─── ID / Order Number Generators ────────────────────────────────────────────
export function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function genOrderNum(n: number): string {
  const d = new Date();
  return `ORD-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(n).padStart(3, "0")}`;
}

// ─── Price Calculation ───────────────────────────────────────────────────────
export function calcPrice(service: Service, kg: number, express: boolean): number {
  if (service.pricingType === "FLAT") return service.basePrice;
  if (service.pricingType === "FIXED_LOAD")
    return express ? Math.round(service.basePrice * service.expressMultiplier) : service.basePrice;
  const effectiveKg = Math.max(kg, service.minKg);
  const mul = express ? service.expressMultiplier : 1.0;
  return Math.round(effectiveKg * service.basePrice * mul);
}

// ─── Overstay Detection ──────────────────────────────────────────────────────
export function getOverstay(order: Order, shop?: Shop): Overstay | null {
  if (order.voided || order.statusId === 6) return null;
  const warn = shop?.overstayWarnHrs ?? 24;
  const alert = shop?.overstayAlertHrs ?? 48;
  const crit = shop?.overstayCritHrs ?? 72;
  const hrs = (Date.now() - order.createdAt) / 3600000;
  if (hrs >= crit) return { hrs: Math.floor(hrs), level: "critical", color: "var(--danger)", label: "3+ days in facility!" };
  if (hrs >= alert) return { hrs: Math.floor(hrs), level: "alert", color: "var(--alert)", label: "2+ days in facility" };
  if (hrs >= warn) return { hrs: Math.floor(hrs), level: "warn", color: "var(--warning)", label: "1+ day in facility" };
  return null;
}

// ─── Theme Application ───────────────────────────────────────────────────────
export function applyTheme(theme: ThemePreset): void {
  const r = document.documentElement.style;
  // Core palette
  r.setProperty("--bg", theme.bg);
  r.setProperty("--sidebar", theme.sidebar);
  r.setProperty("--card", theme.card);
  r.setProperty("--border", theme.border);
  r.setProperty("--accent", theme.accent);
  r.setProperty("--accent2", theme.accent2);
  r.setProperty("--text", theme.text);
  r.setProperty("--subtext", theme.subtext);
  r.setProperty("--muted", theme.muted);
  r.setProperty("--mode", theme.mode);

  // Derived semantic colors based on mode
  const isDark = theme.mode === "dark";
  r.setProperty("--success",          "#10B981");
  r.setProperty("--danger",           "#EF4444");
  r.setProperty("--warning",          "#F59E0B");
  r.setProperty("--alert",            "#F97316");
  r.setProperty("--white",            "#fff");
  r.setProperty("--pink",             "#EC4899");

  r.setProperty("--border-dark",      isDark ? "#334155" : "#CBD5E1");
  r.setProperty("--muted-deep",       isDark ? "#475569" : "#64748B");
  r.setProperty("--accent-bg",        isDark ? "#1E3A5F" : "#DBEAFE");

  r.setProperty("--success-light",    isDark ? "#6EE7B7" : "#059669");
  r.setProperty("--danger-light",     isDark ? "#FCA5A5" : "#B91C1C");
  r.setProperty("--danger-text",      isDark ? "#F87171" : "#DC2626");
  r.setProperty("--warning-light",    isDark ? "#FCD34D" : "#B45309");
  r.setProperty("--alert-light",      isDark ? "#FDBA74" : "#C2410C");
  r.setProperty("--accent2-light",    isDark ? "#818CF8" : "#4F46E5");

  r.setProperty("--success-bg-dark",  isDark ? "#052e16" : "#DCFCE7");
  r.setProperty("--danger-bg-dark",   isDark ? "#450a0a" : "#FEE2E2");
  r.setProperty("--alert-bg-dark",    isDark ? "#431407" : "#FFEDD5");
  r.setProperty("--warning-bg-dark",  isDark ? "#451a03" : "#FEF3C7");

  r.setProperty("--success-border",   isDark ? "#16a34a" : "#22C55E");
  r.setProperty("--success-bright",   isDark ? "#86efac" : "#15803D");
  r.setProperty("--success-text",     isDark ? "#4ade80" : "#16A34A");
}

// ─── Receipt Printing ────────────────────────────────────────────────────────
export function buildReceiptHTML(order: Order, shop: Shop): string {
  const c = shop.currency || "\u20B1";
  const loc = shop.locale || "en-PH";
  const itemRows = order.items
    .map((i) => {
      let desc = "";
      if (i.pricingType === "PER_KG") desc = ` (${i.kg}kg \u00D7 ${c}${i.unitPrice})`;
      if (i.pricingType === "FIXED_LOAD") desc = ` (${i.minKg || i.kg}kg fixed load)`;
      const express = i.express ? " \u26A1" : "";
      return `<tr>
      <td style="padding:2px 0;border-bottom:1px dashed #ddd">${i.serviceName}${express}${desc}</td>
      <td style="padding:2px 0;border-bottom:1px dashed #ddd;text-align:right;font-weight:600">${c}${i.subtotal.toLocaleString(loc)}</td>
    </tr>`;
    })
    .join("");

  const payInfo =
    order.isCashPayment && order.cashTendered
      ? `<tr><td style="padding:2px 0;color:#555">Cash Tendered</td><td style="text-align:right">${c}${(order.cashTendered || 0).toLocaleString(loc)}</td></tr>
       <tr><td style="padding:2px 0;color:#555">Change</td><td style="text-align:right">${c}${(order.change || 0).toLocaleString(loc)}</td></tr>`
      : `<tr><td colspan="2" style="padding:2px 0;color:#555">Paid via ${order.paymentMethod || "Cash"}</td></tr>`;

  return `<!DOCTYPE html><html><head><title>Receipt ${order.orderNum}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: monospace; font-size:9px; color:#111; padding:8px; max-width:280px; margin:0 auto; }
    .shop-name { font-size:12px; font-weight:800; margin-bottom:1px; }
    .divider { border:none; border-top:1px dashed #aaa; margin:4px 0; }
    table { width:100%; border-collapse:collapse; }
    .total-row td { font-size:11px; font-weight:800; padding-top:4px; }
    .footer { text-align:center; font-size:8px; color:#777; margin-top:6px; line-height:1.4; }
    .print-btn { display:block; width:100%; margin-top:8px; padding:8px; background:#2563EB; color:#fff; border:none; border-radius:6px; cursor:pointer; font-family:monospace; font-size:11px; font-weight:700; }
    @media print { .print-btn { display:none; } @page { margin:2mm; } }
  </style></head><body>
  <div style="text-align:center;margin-bottom:4px">
    <div class="shop-name">${shop.name}</div>
    <div style="font-size:8px;color:#555">${shop.address}</div>
    <div style="font-size:8px;color:#555">${shop.phone}</div>
  </div>
  <hr class="divider"/>
  <table style="margin-bottom:4px">
    <tr><td style="color:#555">Order #</td><td style="text-align:right;font-weight:700">${order.orderNum}</td></tr>
    <tr><td style="color:#555">Customer</td><td style="text-align:right">${order.customerName}</td></tr>
    <tr><td style="color:#555">Phone</td><td style="text-align:right">${order.customerPhone}</td></tr>
    <tr><td style="color:#555">Date</td><td style="text-align:right">${new Date(order.createdAt).toLocaleString(loc)}</td></tr>
    ${order.express ? `<tr><td colspan="2" style="color:#d97706;font-weight:700">\u26A1 Express Order</td></tr>` : ""}
  </table>
  <hr class="divider"/>
  <table>${itemRows}</table>
  <hr class="divider"/>
  <table>
    ${order.discount > 0 ? `<tr><td style="color:#16a34a">Discount</td><td style="text-align:right;color:#16a34a">-${c}${order.discount.toLocaleString(loc)}</td></tr>` : ""}
    <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${c}${order.total.toLocaleString(loc)}</td></tr>
    ${payInfo}
  </table>
  <hr class="divider"/>
  <div class="footer">
    Thank you for choosing ${shop.name}!<br/>
    Please keep this receipt for reference.
  </div>
  <button class="print-btn" onclick="window.print()">\uD83D\uDDA8\uFE0F Print Receipt</button>
  </body></html>`;
}

export async function printBluetoothReceipt(order: Order, shop: Shop): Promise<void> {
  if (!(window as any).__TAURI_INTERNALS__ || !shop.btPrinterAddress) {
    throw new Error("Bluetooth printing not available");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("plugin:printer|print_bluetooth", {
    order: {
      orderNum: order.orderNum,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items.map((i) => ({
        serviceName: i.serviceName,
        pricingType: i.pricingType,
        kg: i.kg,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
        express: i.express,
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      express: order.express,
      paymentMethod: order.paymentMethod || "Cash",
      isCashPayment: order.isCashPayment,
      cashTendered: order.cashTendered,
      change: order.change,
      createdAt: order.createdAt,
    },
    shop: {
      name: shop.name,
      address: shop.address,
      phone: shop.phone,
      currency: shop.currency || "\u20B1",
    },
    printerAddress: shop.btPrinterAddress,
    paperWidth: shop.receiptPaperWidth || 58,
  });
}

export function hasBtPrinter(shop: Shop): boolean {
  return !!(shop.btPrinterAddress && (window as any).__TAURI_INTERNALS__);
}

export async function openReceiptWindow(order: Order, shop: Shop): Promise<void> {
  const html = buildReceiptHTML(order, shop);

  // On Tauri (Android) without BT printer, use native print dialog
  if ((window as any).__TAURI_INTERNALS__) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("plugin:printer|print_receipt", {
        payload: { html, jobName: `Receipt #${order.id}` },
      });
      return;
    } catch (e) {
      console.warn("Native print failed, falling back to window.print():", e);
    }
  }

  // Fallback: hidden iframe + window.print() (desktop browsers & Tauri desktop)
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  // Wait for content to render, then trigger print
  iframe.onload = () => {
    try {
      iframe.contentWindow?.print();
    } catch (_) {
      // Fallback: open in new window if iframe print fails
      const win = window.open("", "_blank", "width=420,height=700,toolbar=0,menubar=0");
      if (win) { win.document.write(html); win.document.close(); }
    }
    // Clean up iframe after a delay
    setTimeout(() => document.body.removeChild(iframe), 5000);
  };
}
