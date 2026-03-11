import { useState } from "react";
import { useApp } from "../context/AppContext";
import { getOverstay, openReceiptWindow, printBluetoothReceipt, hasBtPrinter } from "../lib/utils";
import { ReceiptPreview } from "../components/ReceiptPreview";

export function OrdersScreen() {
  const { orders, setOrders, stages, shop, smsTemplates, sendSms, requirePin, currentStaff, notify, addAudit, fmt } = useApp();
  const [view, setView] = useState("kanban");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [showVoidFor, setShowVoidFor] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<any>(null);
  const [btPrinting, setBtPrinting] = useState(false);

  const activeOrders = orders.filter((o) => !o.voided);
  const stageOrders = stages.slice(0, 5).map((stage) => ({
    ...stage,
    orders: activeOrders.filter((o) => o.statusId === stage.id),
  }));

  const updateStatus = (orderId: string, newStatusId: number) => {
    const stage = stages.find((s) => s.id === newStatusId);
    if (!stage) return;
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, statusId: newStatusId, statusLabel: stage.label, statusUpdatedAt: Date.now() } : o));
    const order = orders.find((o) => o.id === orderId);
    addAudit("STATUS_CHANGED", `${order?.orderNum} \u2192 ${stage.label}`);
    if (newStatusId === 5 && shop.autoSmsReady && order) {
      sendSms(order.customerPhone, smsTemplates.ready, { name: order.customerName, order: order.orderNum, shop: shop.name }, orderId);
      notify(`SMS sent to ${order.customerName}`);
    }
    if (newStatusId === 6 && order) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, pickedUpAt: Date.now() } : o));
    }
    notify(`Status updated to ${stage.label}`);
  };

  const voidOrder = (order: any) => {
    if (!voidReason.trim()) { notify("Void reason required", "error"); return; }
    requirePin("MANAGER", () => {
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, voided: true, voidReason, voidedAt: Date.now(), voidedBy: currentStaff?.name } : o));
      addAudit("ORDER_VOIDED", `${order.orderNum} voided \u2014 ${voidReason}`);
      notify(`Order ${order.orderNum} voided`);
      setShowVoidFor(null); setVoidReason(""); setSelectedOrder(null);
    }, "Enter Manager PIN to void order");
  };

  if (selectedOrder) {
    const order = orders.find((o) => o.id === selectedOrder);
    if (!order) { setSelectedOrder(null); return null; }
    return (
      <div style={{ padding: 24, maxWidth: 600 }}>
        <button onClick={() => setSelectedOrder(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, marginBottom: 16 }}>{"\u2190"} Back to Orders</button>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{order.orderNum}</h2>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(order.createdAt).toLocaleString()}</div>
            </div>
            <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${stages.find((s) => s.id === order.statusId)?.color}20`, color: stages.find((s) => s.id === order.statusId)?.color }}>
              {stages.find((s) => s.id === order.statusId)?.icon} {order.statusLabel}
            </span>
          </div>
          <div style={{ marginBottom: 16, padding: 12, background: "var(--bg)", borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{order.customerName}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{order.customerPhone}</div>
          </div>
          {order.items.map((item: any) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <span style={{ color: "var(--text)" }}>{item.serviceName}{item.qty > 1 ? ` x${item.qty}` : ""} {item.express ? "\u26A1" : ""}</span>
              <span style={{ fontWeight: 700, color: "var(--accent)" }}>{fmt(item.subtotal)}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 20, color: "var(--accent)" }}>
            <span>Total</span><span>{fmt(order.total)}</span>
          </div>
          <button onClick={() => {
            if (hasBtPrinter(shop)) {
              setReceiptPreview(order);
            } else {
              openReceiptWindow(order, shop);
            }
          }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 12, padding: "9px 0", borderRadius: 8, border: "1px solid var(--accent)", background: "color-mix(in srgb, var(--accent) 6%, transparent)", color: "var(--accent)", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            {"\uD83D\uDDA8\uFE0F"} Reprint Receipt
          </button>
          {!order.voided && order.statusId < 6 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "var(--subtext)" }}>Update Status</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {stages.filter((s) => s.id > order.statusId && s.id <= 6).map((s) => (
                  <button key={s.id} onClick={() => updateStatus(order.id, s.id)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${s.color}`, background: `${s.color}15`, color: s.color, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{s.icon} {s.label}</button>
                ))}
              </div>
            </div>
          )}
          {!order.voided && (
            <div style={{ marginTop: 16 }}>
              {showVoidFor === order.id ? (
                <div>
                  <input value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Void reason (required)\u2026" className="input" style={{ marginBottom: 8 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => voidOrder(order)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid var(--danger)", background: "color-mix(in srgb, var(--danger) 8%, transparent)", color: "var(--danger)", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Confirm Void</button>
                    <button onClick={() => setShowVoidFor(null)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid var(--border-dark)", background: "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 13 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowVoidFor(order.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", cursor: "pointer", fontSize: 12 }}>Void Order</button>
              )}
            </div>
          )}
          {order.voided && <div style={{ marginTop: 12, padding: 10, background: "var(--danger-bg-dark)", borderRadius: 6, fontSize: 12, color: "var(--danger-light)" }}>{"\uD83D\uDEAB"} VOIDED \u2014 {order.voidReason}</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, height: "100%", overflow: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text)" }}>Orders</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {(["kanban", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border-dark)", background: view === v ? "var(--accent-bg)" : "transparent", color: view === v ? "var(--accent)" : "var(--muted)", cursor: "pointer", fontSize: 13 }}>{v === "kanban" ? "\u229E Board" : "\u2261 List"}</button>
          ))}
        </div>
      </div>

      {view === "kanban" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, height: "calc(100% - 60px)", overflow: "auto" }}>
          {stageOrders.map((stage) => (
            <div key={stage.id} style={{ background: "var(--sidebar)", borderRadius: 10, padding: 10, minHeight: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>{stage.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: stage.color }}>{stage.label}</span>
                <span style={{ marginLeft: "auto", background: `${stage.color}20`, color: stage.color, borderRadius: 10, fontSize: 11, padding: "1px 7px", fontWeight: 700 }}>{stage.orders.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stage.orders.map((order: any) => (
                  <div key={order.id} onClick={() => setSelectedOrder(order.id)}
                    style={{ padding: "10px", background: "var(--card)", borderRadius: 8, cursor: "pointer", borderLeft: `3px solid ${stage.color}`, transition: "all 0.15s" }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text)", marginBottom: 3 }}>{order.orderNum}</div>
                    <div style={{ fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>{order.customerName}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{fmt(order.total)}</span>
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>{Math.floor((Date.now() - order.createdAt) / 3600000)}h ago</span>
                    </div>
                    {order.express && <span style={{ fontSize: 10, color: "var(--warning)" }}>{"\u26A1"} Express</span>}
                  </div>
                ))}
                {stage.orders.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", fontSize: 12, color: "var(--border-dark)" }}>Empty</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {orders.slice(0, 50).map((order) => (
            <div key={order.id} onClick={() => setSelectedOrder(order.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, marginBottom: 6, background: "var(--card)", cursor: "pointer", border: `1px solid ${order.voided ? "color-mix(in srgb, var(--danger) 10%, transparent)" : "var(--border)"}`, opacity: order.voided ? 0.6 : 1 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{order.orderNum}</span>
                {order.voided && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--danger)", fontWeight: 700 }}>VOIDED</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--subtext)", minWidth: 120 }}>{order.customerName}</div>
              <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${stages.find((s) => s.id === order.statusId)?.color}20`, color: stages.find((s) => s.id === order.statusId)?.color }}>{order.statusLabel}</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", minWidth: 80, textAlign: "right" }}>{fmt(order.total)}</div>
            </div>
          ))}
        </div>
      )}
      {receiptPreview && (
        <ReceiptPreview
          order={receiptPreview}
          shop={shop}
          printing={btPrinting}
          onCancel={() => setReceiptPreview(null)}
          onPrint={async () => {
            setBtPrinting(true);
            try {
              await printBluetoothReceipt(receiptPreview, shop);
              notify("Receipt printed!");
              setReceiptPreview(null);
            } catch (e: any) {
              notify(`Print failed: ${e?.message || e}`, "error");
            } finally {
              setBtPrinting(false);
            }
          }}
        />
      )}
    </div>
  );
}
