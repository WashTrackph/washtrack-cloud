import { useState, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { getOverstay, openReceiptWindow, printBluetoothReceipt, hasBtPrinter } from "../lib/utils";
import { ReceiptPreview } from "../components/ReceiptPreview";
import { SEED_PAYMETHODS } from "../data/seeds";

// ── Pointer-event drag state (works on desktop + touch/Android) ──
interface DragState {
  orderId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean; // true once moved past threshold
  ghostEl: HTMLDivElement | null;
}

const DRAG_THRESHOLD = 8; // px before drag activates (prevents accidental drags on tap)

export function OrdersScreen() {
  const { orders, setOrders, stages, shop, smsTemplates, sendSms, requirePin, currentStaff, notify, addAudit, fmt, payMethods } = useApp();
  const [view, setView] = useState("kanban");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [showVoidFor, setShowVoidFor] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<any>(null);
  const [btPrinting, setBtPrinting] = useState(false);
  const [showCollectPay, setShowCollectPay] = useState(false);
  const [collectPayMethod, setCollectPayMethod] = useState<any>(null);
  const [collectCash, setCollectCash] = useState("");
  const [dragOverStage, setDragOverStage] = useState<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const columnRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const setColumnRef = useCallback((stageId: number, el: HTMLDivElement | null) => {
    if (el) columnRefs.current.set(stageId, el);
    else columnRefs.current.delete(stageId);
  }, []);

  const getStageAtPoint = useCallback((x: number, y: number): number | null => {
    for (const [stageId, el] of columnRefs.current.entries()) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return stageId;
      }
    }
    return null;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, orderId: string) => {
    // Only primary button (left click / single touch)
    if (e.button !== 0) return;
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
    dragRef.current = {
      orderId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
      ghostEl: null,
    };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    drag.currentX = e.clientX;
    drag.currentY = e.clientY;

    // Check threshold
    if (!drag.isDragging) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      drag.isDragging = true;

      // Create ghost element
      const source = e.currentTarget as HTMLDivElement;
      const ghost = document.createElement("div");
      ghost.style.cssText = `
        position: fixed; pointer-events: none; z-index: 10000;
        width: ${source.offsetWidth}px; opacity: 0.85;
        background: var(--card); border-radius: 8px; padding: 10px;
        border-left: 3px solid var(--accent); box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        transform: rotate(2deg); transition: none;
      `;
      ghost.innerHTML = source.innerHTML;
      document.body.appendChild(ghost);
      drag.ghostEl = ghost;
    }

    // Update ghost position
    if (drag.ghostEl) {
      drag.ghostEl.style.left = `${e.clientX - 60}px`;
      drag.ghostEl.style.top = `${e.clientY - 20}px`;
    }

    // Highlight drop target
    const hoverStage = getStageAtPoint(e.clientX, e.clientY);
    setDragOverStage(hoverStage);
  }, [getStageAtPoint]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    // Clean up ghost
    if (drag.ghostEl) {
      drag.ghostEl.remove();
    }

    // If we were actually dragging, do the drop
    if (drag.isDragging) {
      const targetStage = getStageAtPoint(e.clientX, e.clientY);
      if (targetStage !== null) {
        const order = orders.find((o) => o.id === drag.orderId);
        if (order && order.statusId !== targetStage) {
          updateStatus(drag.orderId, targetStage);
        }
      }
    } else {
      // Wasn't a drag — treat as click
      setSelectedOrder(drag.orderId);
    }

    setDragOverStage(null);
    dragRef.current = null;
  }, [getStageAtPoint, orders]);

  const activePM = (payMethods || SEED_PAYMETHODS).filter((p: any) => p.active).sort((a: any, b: any) => a.sortOrder - b.sortOrder);

  const collectPayment = (order: any) => {
    if (!collectPayMethod) { notify("Select a payment method", "error"); return; }
    const isCash = collectPayMethod.isCash;
    const tendered = isCash ? (parseFloat(collectCash) || 0) : 0;
    if (isCash && tendered < order.total) { notify("Cash tendered is less than total", "error"); return; }
    const change = isCash ? Math.max(0, tendered - order.total) : 0;
    setOrders((prev) => prev.map((o) => o.id === order.id ? {
      ...o, paid: true, paidAt: Date.now(), paidBy: currentStaff?.id, paidByName: currentStaff?.name,
      paymentMethod: collectPayMethod.label, paymentMethodId: collectPayMethod.id,
      isCashPayment: isCash, cashTendered: isCash ? tendered : null, change: isCash ? change : null,
    } : o));
    addAudit("PAYMENT_COLLECTED", `${order.orderNum} \u2014 ${fmt(order.total)} via ${collectPayMethod.label}`);
    notify(`Payment collected for ${order.orderNum}! ${fmt(order.total)} via ${collectPayMethod.label}`);
    setShowCollectPay(false); setCollectPayMethod(null); setCollectCash("");
  };

  const activeOrders = orders.filter((o) => !o.voided);
  const q = search.trim().toLowerCase();
  const filteredOrders = q
    ? activeOrders.filter((o) =>
        o.customerName.toLowerCase().includes(q) ||
        o.orderNum.toLowerCase().includes(q) ||
        (o.customerPhone || "").includes(q)
      )
    : activeOrders;
  const stageOrders = stages.slice(0, 5).map((stage) => ({
    ...stage,
    orders: filteredOrders.filter((o) => o.statusId === stage.id),
  }));

  const updateStatus = (orderId: string, newStatusId: number) => {
    const stage = stages.find((s) => s.id === newStatusId);
    if (!stage) return;
    const order = orders.find((o) => o.id === orderId);
    if (newStatusId === 6 && order && order.paid === false) {
      setSelectedOrder(orderId);
      setShowCollectPay(true);
      notify("Payment required before pickup", "error");
      return;
    }
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, statusId: newStatusId, statusLabel: stage.label, statusUpdatedAt: Date.now() } : o));
    addAudit("STATUS_CHANGED", `${order?.orderNum} \u2192 ${stage.label}`);
    if (newStatusId === 5 && shop.autoSmsReady && order && order.customerPhone && !order.readySmsSent) {
      sendSms(order.customerPhone, smsTemplates.ready, { name: order.customerName, order: order.orderNum, shop: shop.name }, orderId);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, readySmsSent: true } : o));
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
          {order.paid === false && !order.voided && (
            <div style={{ marginTop: 12 }}>
              <div style={{ padding: "8px 14px", borderRadius: 8, background: "color-mix(in srgb, var(--warning) 12%, transparent)", border: "1px solid var(--warning)", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--warning)" }}>{"🕒"} Payment Pending</div>
                <div style={{ fontSize: 12, color: "var(--subtext)", marginTop: 2 }}>Customer will pay on pickup</div>
              </div>
              {!showCollectPay ? (
                <button onClick={() => setShowCollectPay(true)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--success)", background: "color-mix(in srgb, var(--success) 8%, transparent)", color: "var(--success)", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  {"💰"} Collect Payment
                </button>
              ) : (
                <div style={{ padding: 14, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <label style={{ fontSize: 12, color: "var(--subtext)", fontWeight: 600, display: "block", marginBottom: 8 }}>Payment Method</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {activePM.map((pm: any) => (
                      <button key={pm.id} onClick={() => { setCollectPayMethod(pm); setCollectCash(""); }}
                        style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
                          border: `2px solid ${collectPayMethod?.id === pm.id ? pm.color : "var(--border-dark)"}`,
                          background: collectPayMethod?.id === pm.id ? pm.color + "25" : "transparent",
                          color: collectPayMethod?.id === pm.id ? pm.color : "var(--muted)" }}>
                        {pm.icon} {pm.label}
                      </button>
                    ))}
                  </div>
                  {collectPayMethod?.isCash && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 12, color: "var(--subtext)" }}>Cash Tendered ({shop.currency})</label>
                      <input type="number" value={collectCash} onChange={(e) => setCollectCash(e.target.value)} className="input" placeholder="0" style={{ fontSize: 18, fontWeight: 700 }} />
                      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                        {(shop.cashDenominations || [100, 200, 500, 1000]).map((d) => (
                          <button key={d} onClick={() => setCollectCash(String(d))}
                            style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border-dark)", background: parseFloat(collectCash) === d ? "var(--border-dark)" : "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                            {shop.currency}{d.toLocaleString()}
                          </button>
                        ))}
                        <button onClick={() => setCollectCash(String(order.total))}
                          style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--success)", background: "transparent", color: "var(--success)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                          Exact {fmt(order.total)}
                        </button>
                      </div>
                      {parseFloat(collectCash) > order.total && (
                        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: "var(--success)" }}>Change: {fmt(Math.max(0, parseFloat(collectCash) - order.total))}</div>
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => collectPayment(order)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "var(--success)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                      {"\u2713"} Confirm Payment
                    </button>
                    <button onClick={() => { setShowCollectPay(false); setCollectPayMethod(null); setCollectCash(""); }} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border-dark)", background: "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 13 }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {order.paid !== false && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
              Paid via {order.paymentMethod}{order.paidAt ? ` \u2014 ${new Date(order.paidAt).toLocaleString()}` : ""}
              {order.pickedUpAt && <> &middot; Picked up {new Date(order.pickedUpAt).toLocaleString()}</>}
            </div>
          )}
          <button onClick={() => {
            if (hasBtPrinter(shop)) {
              setReceiptPreview(order);
            } else {
              openReceiptWindow(order, shop);
            }
          }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 12, padding: "9px 0", borderRadius: 8, border: "1px solid var(--accent)", background: "color-mix(in srgb, var(--accent) 6%, transparent)", color: "var(--accent)", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            {"🖨\uFE0F"} Reprint Receipt
          </button>
          {!order.voided && order.statusId < 7 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "var(--subtext)" }}>Update Status</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {stages.filter((s) => s.id > order.statusId && s.id <= 7).map((s) => (
                  <button key={s.id} onClick={() => updateStatus(order.id, s.id)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${s.color}`, background: `${s.color}15`, color: s.color, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{s.icon} {s.label}</button>
                ))}
              </div>
            </div>
          )}
          {!order.voided && (
            <div style={{ marginTop: 16 }}>
              {showVoidFor === order.id ? (
                <div>
                  <input value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Void reason (required)…" className="input" style={{ marginBottom: 8 }} />
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
          {order.voided && <div style={{ marginTop: 12, padding: 10, background: "var(--danger-bg-dark)", borderRadius: 6, fontSize: 12, color: "var(--danger-light)" }}>{"🚫"} VOIDED \u2014 {order.voidReason}</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, height: "100%", overflow: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text)" }}>Orders</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--muted)", pointerEvents: "none" }}>{"\ud83d\udd0d"}</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, order #, phone..."
              style={{
                paddingLeft: 32, paddingRight: search ? 28 : 10, paddingTop: 7, paddingBottom: 7,
                borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)",
                color: "var(--text)", fontSize: 13, width: 220, outline: "none",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>\u2715</button>
            )}
          </div>
          {(["kanban", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border-dark)", background: view === v ? "var(--accent-bg)" : "transparent", color: view === v ? "var(--accent)" : "var(--muted)", cursor: "pointer", fontSize: 13 }}>{v === "kanban" ? "\u229E Board" : "\u2261 List"}</button>
          ))}
        </div>
      </div>

      {view === "kanban" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, height: "calc(100% - 60px)", overflow: "auto" }}>
          {stageOrders.map((stage) => (
            <div
              key={stage.id}
              ref={(el) => setColumnRef(stage.id, el)}
              style={{
                background: dragOverStage === stage.id ? `color-mix(in srgb, ${stage.color} 8%, var(--sidebar))` : "var(--sidebar)",
                borderRadius: 10, padding: 10, minHeight: 200, transition: "background 0.15s",
                outline: dragOverStage === stage.id ? `2px dashed ${stage.color}` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>{stage.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: stage.color }}>{stage.label}</span>
                <span style={{ marginLeft: "auto", background: `${stage.color}20`, color: stage.color, borderRadius: 10, fontSize: 11, padding: "1px 7px", fontWeight: 700 }}>{stage.orders.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stage.orders.map((order: any) => (
                  <div key={order.id}
                    onPointerDown={(e) => handlePointerDown(e, order.id)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={(e) => {
                      if (dragRef.current?.ghostEl) dragRef.current.ghostEl.remove();
                      dragRef.current = null;
                      setDragOverStage(null);
                    }}
                    style={{ padding: "10px", background: order.paid === false ? "var(--warning-bg-dark)" : "var(--card)", borderRadius: 8, cursor: "grab", borderLeft: `3px solid ${order.paid === false ? "var(--warning)" : stage.color}`, transition: "all 0.15s", touchAction: "none", userSelect: "none", border: order.paid === false ? "1px solid var(--warning)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: "var(--text)" }}>{order.orderNum}</span>
                      {order.paid === false && <span style={{ fontSize: 9, fontWeight: 800, color: "var(--warning-light)", background: "var(--warning-bg-dark)", padding: "1px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5, border: "1px solid var(--warning)" }}>Unpaid</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>{order.customerName}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{fmt(order.total)}</span>
                      {(() => {
                        const overstay = getOverstay(order, shop);
                        const hrs = Math.floor((Date.now() - order.createdAt) / 3600000);
                        return <span style={{ fontSize: 10, color: overstay?.color || "var(--muted)", fontWeight: overstay ? 700 : 400 }}>{hrs}h ago</span>;
                      })()}
                    </div>
                    {order.express && <div style={{ marginTop: 4 }}><span style={{ fontSize: 10, color: "var(--warning)" }}>{"\u26A1"} Express</span></div>}
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
                {!order.voided && order.paid === false && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--warning)", fontWeight: 700 }}>{"🕒"} Unpaid</span>}
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
