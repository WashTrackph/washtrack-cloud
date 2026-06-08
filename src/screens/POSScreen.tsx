import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { openReceiptWindow, printBluetoothReceipt, hasBtPrinter } from "../lib/utils";
import { ReceiptPreview } from "../components/ReceiptPreview";
import { SEED_PAYMETHODS } from "../data/seeds";

export function POSScreen({ setScreen }: { setScreen: (s: string) => void }) {
  const { shop, services, customers, orders, setOrders, setCustomers, orderCounter, setOrderCounter,
    currentStaff, notify, addAudit, sendSms, smsTemplates, calcPrice, genId, genOrderNum, payMethods,
    inventory, setInventory, supplyRules, fmt } = useApp();

  const [step, setStep] = useState("customer");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [express, setExpress] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [cashTendered, setCashTendered] = useState("");
  const [selectedPayMethod, setSelectedPayMethod] = useState<any>(null);
  const [receiptPreview, setReceiptPreview] = useState<any>(null);
  const [btPrinting, setBtPrinting] = useState(false);

  const activePM = (payMethods || SEED_PAYMETHODS).filter((p: any) => p.active).sort((a: any, b: any) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    const cash = activePM.find((p: any) => p.isCash);
    if (cash) setSelectedPayMethod(cash);
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  ).slice(0, 6);

  const subtotal = cartItems.reduce((s: number, i: any) => s + i.subtotal, 0);
  const total = Math.max(0, subtotal - discount);
  const isCash = selectedPayMethod?.isCash ?? true;
  const change = isCash ? Math.max(0, (parseFloat(cashTendered) || 0) - total) : 0;

  const addToCart = (service: any) => {
    const existing = cartItems.find((i) => i.serviceId === service.id && i.express === express);
    if (existing) {
      if (service.pricingType === "PER_KG") {
        setCartItems((prev) => prev.map((i) =>
          i.id === existing.id ? { ...i, kg: i.kg + 1, subtotal: calcPrice(service, i.kg + 1, express) } : i
        ));
      } else {
        const newQty = existing.qty + 1;
        setCartItems((prev) => prev.map((i) =>
          i.id === existing.id ? { ...i, qty: newQty, subtotal: calcPrice(service, i.kg, i.express) * newQty } : i
        ));
      }
      return;
    }
    const kg = (service.pricingType === "PER_KG") ? Math.max(service.minKg, 4) :
      (service.pricingType === "FIXED_LOAD") ? service.minKg : 0;
    setCartItems((prev) => [...prev, {
      id: genId(), serviceId: service.id, serviceName: service.name,
      pricingType: service.pricingType, minKg: service.minKg, kg, qty: 1, express,
      unitPrice: service.basePrice, subtotal: calcPrice(service, kg, express),
      color: service.color,
    }]);
  };

  const updateCartQty = (itemId: string, newQty: number) => {
    if (newQty < 1) { removeCartItem(itemId); return; }
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;
    const svc = services.find((s) => s.id === item.serviceId);
    if (!svc) return;
    setCartItems((prev) => prev.map((i) => i.id === itemId ? { ...i, qty: newQty, subtotal: calcPrice(svc, i.kg, i.express) * newQty } : i));
  };

  const updateCartKg = (itemId: string, kg: number) => {
    const svc = services.find((s) => s.id === cartItems.find((i) => i.id === itemId)?.serviceId);
    if (!svc || svc.pricingType !== "PER_KG") return;
    const newKg = Math.max(svc.minKg || 1, kg);
    setCartItems((prev) => prev.map((i) => i.id === itemId ? { ...i, kg: newKg, subtotal: calcPrice(svc, newKg, i.express) } : i));
  };

  const removeCartItem = (id: string) => setCartItems((prev) => prev.filter((i) => i.id !== id));

  const completeOrder = (payLater = false) => {
    if (!selectedCustomer && !newName) { notify("Customer name required", "error"); return; }
    if (cartItems.length === 0) { notify("Add at least one service", "error"); return; }
    if (!payLater && !selectedPayMethod) { notify("Please select a payment method", "error"); return; }

    let customer = selectedCustomer;
    if (!customer) {
      customer = { id: genId(), name: newName, phone: newPhone, visits: 0, totalSpend: 0, lastVisit: Date.now(), promoOptIn: true };
      setCustomers((prev) => [...prev, customer]);
    } else {
      setCustomers((prev) => prev.map((c) => c.id === customer.id
        ? { ...c, visits: c.visits + 1, totalSpend: c.totalSpend + total, lastVisit: Date.now() } : c));
    }

    const orderNum = genOrderNum(orderCounter);
    setOrderCounter((n: number) => n + 1);
    const order: any = {
      id: genId(), orderNum,
      customerId: customer.id, customerName: customer.name, customerPhone: customer.phone,
      items: cartItems, subtotal, discount, total, notes, express,
      paymentMethod: payLater ? "Pay Later" : selectedPayMethod.label,
      paymentMethodId: payLater ? "" : selectedPayMethod.id,
      isCashPayment: payLater ? false : isCash,
      cashTendered: (!payLater && isCash) ? (parseFloat(cashTendered) || 0) : null,
      change: (!payLater && isCash) ? change : null,
      paid: !payLater,
      ...(!payLater ? { paidAt: Date.now(), paidBy: currentStaff?.id, paidByName: currentStaff?.name } : {}),
      statusId: 1, statusLabel: "Received",
      createdAt: Date.now(), statusUpdatedAt: Date.now(),
      createdBy: currentStaff?.id, createdByName: currentStaff?.name,
      voided: false,
    };
    setOrders((prev) => [order, ...prev]);

    if (supplyRules && supplyRules.length > 0) {
      const deductions: Record<string, number> = {};
      cartItems.forEach((item: any) => {
        supplyRules.forEach((rule) => {
          const applies = rule.appliesTo.includes("all") || rule.appliesTo.includes(item.serviceId);
          if (!applies) return;
          if (!deductions[rule.invId]) deductions[rule.invId] = 0;
          if (item.pricingType === "PER_KG" && rule.perKg > 0) deductions[rule.invId] += rule.perKg * item.kg;
          if ((item.pricingType === "FIXED_LOAD" || item.pricingType === "FLAT") && rule.perLoad > 0) deductions[rule.invId] += rule.perLoad * (item.qty || 1);
          if (rule.perOrder > 0) deductions[rule.invId] += rule.perOrder;
        });
      });
      if (Object.keys(deductions).length > 0) {
        setInventory((prev) => prev.map((invItem) => {
          const ded = deductions[invItem.id];
          if (!ded) return invItem;
          return { ...invItem, qty: Math.max(0, parseFloat((invItem.qty - ded).toFixed(3))) };
        }));
      }
    }

    if (shop.autoSmsReceipt && customer.phone) {
      const totalKg = cartItems.filter((i: any) => i.pricingType === "PER_KG").reduce((s: number, i: any) => s + i.kg, 0);
      sendSms(customer.phone, smsTemplates.receipt, { name: customer.name, order: orderNum, shop: shop.name, kg: totalKg, total }, order.id);
    }

    const payLabel = payLater ? "Pay Later" : selectedPayMethod.label;
    addAudit("ORDER_CREATED", `${orderNum} for ${customer.name} \u2014 ${fmt(total)} via ${payLabel}`);
    notify(`Order ${orderNum} created! ${fmt(total)} via ${payLabel}`);
    if (hasBtPrinter(shop)) {
      setReceiptPreview(order);
    } else {
      openReceiptWindow(order, shop);
    }
    setScreen("orders");
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, overflow: "auto", padding: 20, borderRight: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 0, marginBottom: 20 }}>
          {["customer", "items", "payment"].map((s, i) => (
            <div key={s}
              style={{ flex: 1, padding: "8px 0", textAlign: "center", cursor: "pointer",
                borderBottom: `2px solid ${step === s ? "var(--accent)" : "var(--border-dark)"}`,
                color: step === s ? "var(--accent)" : "var(--muted)", fontSize: 12, fontWeight: 700 }}
              onClick={() => { if (i === 0 || (i === 1 && selectedCustomer) || (i === 2 && cartItems.length > 0)) setStep(s); }}>
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
          ))}
        </div>

        {step === "customer" && (
          <div>
            <h3 style={{ margin: "0 0 12px", color: "var(--text)", fontSize: 15 }}>Find or Add Customer</h3>
            <button onClick={() => { setNewCustomerMode(true); setSelectedCustomer(null); }}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px dashed var(--border-dark)", background: "transparent", color: "var(--accent)", cursor: "pointer", fontSize: 13, marginBottom: 12 }}>
              + New Customer
            </button>
            {newCustomerMode && (
              <div style={{ marginBottom: 12, padding: 16, background: "var(--card)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full Name *" className="input" style={{ marginBottom: 8 }} autoFocus />
                <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone number" className="input" />
              </div>
            )}
            <input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Search by name or phone…" className="input" style={{ marginBottom: 12 }} />
            {filteredCustomers.map((c) => (
              <div key={c.id} onClick={() => { setSelectedCustomer(c); setNewCustomerMode(false); setStep("items"); }}
                style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 6, cursor: "pointer",
                  border: `1px solid ${selectedCustomer?.id === c.id ? "var(--accent)" : "var(--border)"}`,
                  background: selectedCustomer?.id === c.id ? "color-mix(in srgb, var(--accent) 10%, var(--card))" : "var(--card)" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.phone} {"\u00B7"} {c.visits} visits {"\u00B7"} {fmt(c.totalSpend)}</div>
              </div>
            ))}
            {(selectedCustomer || newName) && (
              <button onClick={() => setStep("items")} className="btn-primary" style={{ width: "100%", marginTop: 16 }}>Continue {"\u2192"}</button>
            )}
          </div>
        )}

        {step === "items" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: "var(--text)", fontSize: 15 }}>Select Services</h3>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: express ? "var(--warning)" : "var(--subtext)" }}>
                <div style={{ width: 36, height: 20, borderRadius: 10, background: express ? "var(--warning)" : "var(--border-dark)", position: "relative", cursor: "pointer" }} onClick={() => setExpress((e) => !e)}>
                  <div style={{ position: "absolute", top: 2, left: express ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "var(--white)", transition: "left 0.2s" }} />
                </div>
                {"\u26A1"} Express
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
              {services.filter((s) => s.active).sort((a, b) => a.sortOrder - b.sortOrder).map((svc) => (
                <button key={svc.id} onClick={() => addToCart(svc)}
                  style={{ padding: "14px 12px", borderRadius: 10, border: `1px solid ${svc.color}30`, background: `${svc.color}15`, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 3 }}>{svc.name}</div>
                  <div style={{ fontSize: 12, color: svc.color }}>{fmt(svc.basePrice)}{svc.pricingType === "PER_KG" ? "/kg" : svc.pricingType === "FLAT" ? " flat" : " fixed"}</div>
                </button>
              ))}
            </div>
            {cartItems.length > 0 && (
              <button onClick={() => setStep("payment")} className="btn-primary" style={{ width: "100%" }}>Continue to Payment {"\u2192"}</button>
            )}
          </div>
        )}

        {step === "payment" && (
          <div>
            <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: 15 }}>{"💳"} Payment</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--subtext)", display: "block", marginBottom: 8, fontWeight: 600 }}>Select Payment Method</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {activePM.map((pm: any) => (
                  <button key={pm.id} onClick={() => { setSelectedPayMethod(pm); setCashTendered(""); }}
                    style={{ padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                      border: `2px solid ${selectedPayMethod?.id === pm.id ? pm.color : "var(--border-dark)"}`,
                      background: selectedPayMethod?.id === pm.id ? pm.color + "25" : "transparent",
                      color: selectedPayMethod?.id === pm.id ? pm.color : "var(--muted)" }}>
                    {pm.icon} {pm.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "var(--subtext)" }}>Discount ({shop.currency})</label>
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))} className="input" placeholder="0" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--subtext)" }}>Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder="Special instructions…" />
            </div>
            <div style={{ padding: 16, background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--subtext)", marginBottom: 4 }}>
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--success)", marginBottom: 4 }}>
                  <span>Discount</span><span>-{fmt(discount)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 20, color: "var(--accent)", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}>
                <span>TOTAL</span><span>{fmt(total)}</span>
              </div>
            </div>
            {isCash && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "var(--subtext)" }}>Cash Tendered ({shop.currency})</label>
                <input type="number" value={cashTendered} onChange={(e) => setCashTendered(e.target.value)} className="input" placeholder="0" style={{ fontSize: 20, fontWeight: 700 }} />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {(shop.cashDenominations || [100, 200, 500, 1000]).map((d) => (
                    <button key={d} onClick={() => setCashTendered(String(d))}
                      style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border-dark)", background: parseFloat(cashTendered) === d ? "var(--border-dark)" : "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      {shop.currency}{d.toLocaleString()}
                    </button>
                  ))}
                  <button onClick={() => setCashTendered(String(total))}
                    style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--success)", background: "transparent", color: "var(--success)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    Exact {fmt(total)}
                  </button>
                </div>
                {parseFloat(cashTendered) > 0 && (
                  <div style={{ marginTop: 8, fontSize: 16, fontWeight: 700, color: "var(--success)" }}>Change: {fmt(change)}</div>
                )}
              </div>
            )}
            {selectedPayMethod && !isCash && (
              <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: selectedPayMethod.color + "15", border: `1px solid ${selectedPayMethod.color}40` }}>
                <div style={{ fontSize: 13, color: selectedPayMethod.color, fontWeight: 700 }}>{selectedPayMethod.icon} {selectedPayMethod.label} Payment</div>
                <div style={{ fontSize: 12, color: "var(--subtext)", marginTop: 4 }}>Ask customer to send <strong style={{ color: "var(--text)" }}>{fmt(total)}</strong> to your {selectedPayMethod.label} account</div>
              </div>
            )}
            <button onClick={() => completeOrder(false)} className="btn-success" style={{ width: "100%", fontSize: 17, padding: 16, fontWeight: 800 }}>
              {"\u2713"} Confirm Payment + Print Receipt {"🖨\uFE0F"}
            </button>
            <button onClick={() => completeOrder(true)} style={{ width: "100%", marginTop: 10, fontSize: 14, padding: 14, fontWeight: 700, borderRadius: 10, border: "1px solid var(--warning)", background: "color-mix(in srgb, var(--warning) 8%, transparent)", color: "var(--warning)", cursor: "pointer" }}>
              {"🕒"} Pay Later (Collect on Pickup)
            </button>
          </div>
        )}
      </div>

      {/* Right panel: Cart */}
      <div style={{ width: 280, background: "var(--sidebar)", display: "flex", flexDirection: "column", padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{selectedCustomer ? selectedCustomer.name : newName || "\u2014"}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{selectedCustomer ? (selectedCustomer.phone || "No phone") : (newPhone || "New Customer")}</div>
        </div>
        {express && <div style={{ background: "var(--warning-bg-dark)", border: "1px solid var(--warning)", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "var(--warning-light)", marginBottom: 10 }}>{"\u26A1"} Express pricing active</div>}
        <div style={{ flex: 1, overflow: "auto" }}>
          {cartItems.length === 0
            ? <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted-deep)", fontSize: 13 }}>No items yet</div>
            : cartItems.map((item) => (
              <div key={item.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.serviceName}{item.express ? " \u26A1" : ""}</div>
                  <button onClick={() => removeCartItem(item.id)} style={{ background: "transparent", border: "none", color: "var(--muted-deep)", cursor: "pointer", fontSize: 16 }}>{"\u00D7"}</button>
                </div>
                {item.pricingType === "PER_KG" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <button onClick={() => updateCartKg(item.id, item.kg - 1)} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border-dark)", background: "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 14 }}>-</button>
                    <span style={{ fontSize: 14, fontWeight: 700, minWidth: 30, textAlign: "center" }}>{item.kg}kg</span>
                    <button onClick={() => updateCartKg(item.id, item.kg + 1)} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border-dark)", background: "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 14 }}>+</button>
                    <span style={{ marginLeft: "auto", fontWeight: 700, color: "var(--accent)", fontSize: 14 }}>{fmt(item.subtotal)}</span>
                  </div>
                ) : (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{item.pricingType === "FIXED_LOAD" ? `${item.minKg || item.kg}kg load` : "Flat rate"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => updateCartQty(item.id, item.qty - 1)} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border-dark)", background: "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 14 }}>-</button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.qty}x</span>
                      <button onClick={() => updateCartQty(item.id, item.qty + 1)} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border-dark)", background: "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 14 }}>+</button>
                      <span style={{ marginLeft: "auto", fontWeight: 700, color: "var(--accent)", fontSize: 14 }}>{fmt(item.subtotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          }
        </div>
        {cartItems.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18, color: "var(--accent)" }}>
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>
        )}
      </div>

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
