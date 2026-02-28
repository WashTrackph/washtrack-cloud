import { useState } from "react";
import { useApp } from "../context/AppContext";
import { ThemeCustomizer } from "../components/ThemeCustomizer";
import type { Service, Staff, SupplyRule, SmsTemplates } from "../lib/types";

type TabId = "shop" | "theme" | "services" | "workflow" | "sms" | "staff" | "inventory" | "supplies" | "logs" | "smslog";

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "shop",      icon: "\uD83C\uDFEA", label: "Shop" },
  { id: "theme",     icon: "\uD83C\uDFA8", label: "Theme" },
  { id: "services",  icon: "\uD83E\uDDFA", label: "Services" },
  { id: "workflow",  icon: "\uD83D\uDD04", label: "Workflow" },
  { id: "sms",       icon: "\uD83D\uDCAC", label: "SMS" },
  { id: "staff",     icon: "\uD83D\uDC64", label: "Staff" },
  { id: "inventory", icon: "\uD83D\uDCE6", label: "Inventory" },
  { id: "supplies",  icon: "\uD83E\uDDF4", label: "Supplies" },
  { id: "logs",      icon: "\uD83D\uDCDC", label: "Audit Log" },
  { id: "smslog",    icon: "\uD83D\uDCF1", label: "SMS Log" },
];

const PRICING_OPTIONS: { value: Service["pricingType"]; label: string }[] = [
  { value: "PER_KG", label: "Per KG" },
  { value: "FLAT", label: "Flat Rate" },
  { value: "FIXED_LOAD", label: "Fixed Load" },
];

const ROLE_OPTIONS: Staff["role"][] = ["OWNER", "MANAGER", "STAFF"];

const SMS_TEMPLATE_FIELDS: { key: keyof SmsTemplates; label: string }[] = [
  { key: "receipt",  label: "\uD83D\uDCC4 Order Receipt" },
  { key: "ready",    label: "\u2705 Order Ready" },
  { key: "reminder", label: "\u23F0 Pickup Reminder" },
  { key: "promo",    label: "\uD83D\uDCE2 Promo Blast" },
];

const EMPTY_SERVICE_FORM = {
  name: "",
  pricingType: "PER_KG" as Service["pricingType"],
  basePrice: 65,
  minKg: 4,
  expressMultiplier: 1.5,
  color: "#38BDF8",
};

const EMPTY_STAFF_FORM = {
  name: "",
  role: "STAFF" as Staff["role"],
  pin: "",
};

export function SettingsScreen() {
  const {
    shop, setShop, services, setServices, stages, setStages,
    smsTemplates, setSmsTemplates, staff, setStaff,
    customers, orders, inventory, setInventory,
    supplyRules, setSupplyRules, payMethods, setPayMethods,
    smsLog, auditLog, currentStaff, notify, addAudit, fmt, genId, theme,
  } = useApp();

  const [tab, setTab] = useState<TabId>("shop");

  // Service CRUD state
  const [editId, setEditId] = useState<string | null>(null);
  const [svcForm, setSvcForm] = useState(EMPTY_SERVICE_FORM);
  const [showAddService, setShowAddService] = useState(false);

  // Staff CRUD state
  const [staffEditId, setStaffEditId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF_FORM);
  const [showAddStaff, setShowAddStaff] = useState(false);

  // ── Service helpers ──
  const startEditService = (svc: Service) => {
    setEditId(svc.id);
    setSvcForm({
      name: svc.name,
      pricingType: svc.pricingType,
      basePrice: svc.basePrice,
      minKg: svc.minKg,
      expressMultiplier: svc.expressMultiplier,
      color: svc.color,
    });
  };

  const saveService = () => {
    if (!svcForm.name.trim()) { notify("Name required", "error"); return; }
    setServices((prev) =>
      prev.map((s) =>
        s.id === editId
          ? { ...s, name: svcForm.name, pricingType: svcForm.pricingType, basePrice: svcForm.basePrice, minKg: svcForm.minKg, expressMultiplier: svcForm.expressMultiplier, color: svcForm.color }
          : s
      )
    );
    notify("Service updated");
    addAudit("SETTINGS_CHANGED", `Service updated: ${svcForm.name}`);
    setEditId(null);
  };

  const addNewService = () => {
    if (!svcForm.name.trim()) { notify("Name required", "error"); return; }
    const svc: Service = {
      id: genId(),
      name: svcForm.name,
      pricingType: svcForm.pricingType,
      basePrice: svcForm.basePrice,
      minKg: svcForm.minKg,
      expressMultiplier: svcForm.expressMultiplier,
      active: true,
      color: svcForm.color,
      sortOrder: services.length,
    };
    setServices((prev) => [...prev, svc]);
    notify("Service added");
    addAudit("SETTINGS_CHANGED", `Service added: ${svc.name}`);
    setShowAddService(false);
    setSvcForm(EMPTY_SERVICE_FORM);
  };

  const toggleService = (id: string) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
    const svc = services.find((s) => s.id === id);
    notify(`Service ${svc?.active ? "deactivated" : "activated"}`);
  };

  const deleteService = (id: string) => {
    const svc = services.find((s) => s.id === id);
    setServices((prev) => prev.filter((s) => s.id !== id));
    notify("Service deleted");
    addAudit("SETTINGS_CHANGED", `Service deleted: ${svc?.name}`);
  };

  // ── Staff helpers ──
  const startEditStaff = (s: Staff) => {
    setStaffEditId(s.id);
    setStaffForm({ name: s.name, role: s.role, pin: s.pin });
  };

  const saveStaff = () => {
    if (!staffForm.name.trim()) { notify("Name required", "error"); return; }
    if (!/^\d{4}$/.test(staffForm.pin)) { notify("PIN must be exactly 4 digits", "error"); return; }
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staffEditId
          ? { ...s, name: staffForm.name, role: staffForm.role, pin: staffForm.pin, avatar: staffForm.name[0]?.toUpperCase() || "?" }
          : s
      )
    );
    notify("Staff updated");
    addAudit("SETTINGS_CHANGED", `Staff updated: ${staffForm.name}`);
    setStaffEditId(null);
  };

  const addNewStaff = () => {
    if (!staffForm.name.trim()) { notify("Name required", "error"); return; }
    if (!/^\d{4}$/.test(staffForm.pin)) { notify("PIN must be exactly 4 digits", "error"); return; }
    const s: Staff = {
      id: genId(),
      name: staffForm.name,
      role: staffForm.role,
      pin: staffForm.pin,
      active: true,
      avatar: staffForm.name[0]?.toUpperCase() || "?",
    };
    setStaff((prev) => [...prev, s]);
    notify("Staff member added");
    addAudit("SETTINGS_CHANGED", `Staff added: ${s.name} (${s.role})`);
    setShowAddStaff(false);
    setStaffForm(EMPTY_STAFF_FORM);
  };

  const toggleStaffActive = (id: string) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
    notify("Staff status updated");
  };

  // ── Render helpers ──
  const renderServiceForm = (onSave: () => void, onCancel: () => void) => (
    <div style={{ padding: 16, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>Name *</label>
          <input value={svcForm.name} onChange={(e) => setSvcForm((p) => ({ ...p, name: e.target.value }))} className="input" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>Pricing</label>
          <select
            value={svcForm.pricingType}
            onChange={(e) => setSvcForm((p) => ({ ...p, pricingType: e.target.value as Service["pricingType"] }))}
            className="input"
          >
            {PRICING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>Base Price</label>
          <input type="number" value={svcForm.basePrice} onChange={(e) => setSvcForm((p) => ({ ...p, basePrice: Number(e.target.value) }))} className="input" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>Min KG</label>
          <input type="number" value={svcForm.minKg} onChange={(e) => setSvcForm((p) => ({ ...p, minKg: Number(e.target.value) }))} className="input" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>Express Multiplier</label>
          <input type="number" step="0.1" value={svcForm.expressMultiplier} onChange={(e) => setSvcForm((p) => ({ ...p, expressMultiplier: Number(e.target.value) }))} className="input" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>Color</label>
          <input type="color" value={svcForm.color} onChange={(e) => setSvcForm((p) => ({ ...p, color: e.target.value }))} className="input" style={{ padding: 4, height: 38 }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onSave} className="btn-primary" style={{ flex: 1, padding: 8, fontSize: 13 }}>Save</button>
        <button onClick={onCancel} style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 13 }}>
          Cancel
        </button>
      </div>
    </div>
  );

  const renderStaffForm = (onSave: () => void, onCancel: () => void) => (
    <div style={{ padding: 16, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>Name *</label>
          <input value={staffForm.name} onChange={(e) => setStaffForm((p) => ({ ...p, name: e.target.value }))} className="input" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>Role</label>
          <select value={staffForm.role} onChange={(e) => setStaffForm((p) => ({ ...p, role: e.target.value as Staff["role"] }))} className="input">
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>PIN (4 digits) *</label>
          <input
            value={staffForm.pin}
            onChange={(e) => setStaffForm((p) => ({ ...p, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
            placeholder="0000"
            maxLength={4}
            className="input"
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onSave} className="btn-primary" style={{ flex: 1, padding: 8, fontSize: 13 }}>Save</button>
        <button onClick={onCancel} style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 13 }}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Sidebar tab navigation */}
      <div style={{ width: 160, background: "var(--sidebar)", borderRight: "1px solid var(--border)", padding: "16px 8px" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 12px",
              borderRadius: 8,
              border: "none",
              background: tab === t.id ? "color-mix(in srgb, var(--accent) 15%, var(--sidebar))" : "transparent",
              color: tab === t.id ? "var(--accent)" : "var(--subtext)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: tab === t.id ? 700 : 500,
              textAlign: "left",
              marginBottom: 2,
            }}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>

        {/* 1. SHOP */}
        {tab === "shop" && (
          <div>
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
              {"\uD83C\uDFEA"} Shop Identity
            </h3>
            {([
              { key: "name" as const, label: "Shop Name", placeholder: "Your Laundry Shop" },
              { key: "address" as const, label: "Address", placeholder: "Street, Barangay, City" },
              { key: "phone" as const, label: "Contact Number", placeholder: "09XXXXXXXXX" },
            ]).map((f) => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>{f.label}</label>
                <input
                  value={shop[f.key] || ""}
                  onChange={(e) => setShop((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="input"
                />
              </div>
            ))}

            {/* SMS Toggles */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>SMS Receipt</label>
                <button
                  onClick={() => setShop((p) => ({ ...p, autoSmsReceipt: !p.autoSmsReceipt }))}
                  style={{
                    padding: "8px 16px", borderRadius: 8,
                    border: `1px solid ${shop.autoSmsReceipt ? "var(--success)" : "var(--border)"}`,
                    background: shop.autoSmsReceipt ? "color-mix(in srgb, var(--success) 8%, transparent)" : "transparent",
                    color: shop.autoSmsReceipt ? "var(--success)" : "var(--muted)",
                    cursor: "pointer", fontSize: 13, fontWeight: 700,
                  }}
                >
                  {shop.autoSmsReceipt ? "\u2713 Enabled" : "\u2717 Disabled"}
                </button>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>SMS Ready Notification</label>
                <button
                  onClick={() => setShop((p) => ({ ...p, autoSmsReady: !p.autoSmsReady }))}
                  style={{
                    padding: "8px 16px", borderRadius: 8,
                    border: `1px solid ${shop.autoSmsReady ? "var(--success)" : "var(--border)"}`,
                    background: shop.autoSmsReady ? "color-mix(in srgb, var(--success) 8%, transparent)" : "transparent",
                    color: shop.autoSmsReady ? "var(--success)" : "var(--muted)",
                    cursor: "pointer", fontSize: 13, fontWeight: 700,
                  }}
                >
                  {shop.autoSmsReady ? "\u2713 Enabled" : "\u2717 Disabled"}
                </button>
              </div>
            </div>

            {/* Email Report Settings */}
            <div style={{ marginTop: 20, padding: 18, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                {"\uD83D\uDCE7"} Email Report Settings
              </h4>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>Owner Email Address</label>
                <input
                  type="email"
                  value={shop.reportEmail || ""}
                  onChange={(e) => setShop((p) => ({ ...p, reportEmail: e.target.value }))}
                  placeholder="owner@example.com"
                  className="input"
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 8 }}>Auto-Send Schedule</label>
                {([
                  { key: "autoEmailEndOfShift" as const, label: "End of Shift", icon: "\uD83C\uDF19" },
                  { key: "autoEmailDaily" as const, label: "Daily (midnight)", icon: "\uD83D\uDCC5" },
                  { key: "autoEmailWeekly" as const, label: "Weekly (Sunday)", icon: "\uD83D\uDCC6" },
                  { key: "autoEmailMonthly" as const, label: "Monthly (1st)", icon: "\uD83D\uDDD3" },
                ]).map((opt) => (
                  <div
                    key={opt.key}
                    onClick={() => setShop((p) => ({ ...p, [opt.key]: !p[opt.key] }))}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 6,
                      border: `1px solid ${shop[opt.key] ? "var(--accent)" : "var(--border)"}`,
                      background: shop[opt.key] ? "color-mix(in srgb, var(--accent) 8%, var(--card))" : "var(--card)",
                    }}
                  >
                    <span>{opt.icon}</span>
                    <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{opt.label}</span>
                    <div style={{ width: 34, height: 18, borderRadius: 9, background: shop[opt.key] ? "var(--accent)" : "var(--border-dark)", position: "relative", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 2, left: shop[opt.key] ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: "var(--white)", transition: "left 0.2s" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>Shift End Time</label>
                <input
                  type="time"
                  value={shop.shiftEndTime || "22:00"}
                  onChange={(e) => setShop((p) => ({ ...p, shiftEndTime: e.target.value }))}
                  className="input"
                  style={{ maxWidth: 140 }}
                />
              </div>
            </div>

            <button
              onClick={() => { notify("Shop settings saved"); addAudit("SETTINGS_CHANGED", "Shop identity updated"); }}
              className="btn-primary"
              style={{ width: "100%", marginTop: 16 }}
            >
              Save Changes
            </button>
          </div>
        )}

        {/* 2. THEME */}
        {tab === "theme" && <ThemeCustomizer />}

        {/* 3. SERVICES */}
        {tab === "services" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
                {"\uD83E\uDDFA"} Service Catalog
              </h3>
              <button
                onClick={() => { setShowAddService(true); setSvcForm(EMPTY_SERVICE_FORM); }}
                className="btn-primary"
                style={{ padding: "8px 16px", fontSize: 13 }}
              >
                + Add Service
              </button>
            </div>

            {showAddService && renderServiceForm(addNewService, () => { setShowAddService(false); setSvcForm(EMPTY_SERVICE_FORM); })}

            {services.map((svc) => (
              <div
                key={svc.id}
                style={{
                  padding: 16, borderRadius: 10, background: "var(--card)", marginBottom: 10,
                  border: "1px solid var(--border)", opacity: svc.active ? 1 : 0.6,
                }}
              >
                {editId === svc.id ? (
                  renderServiceForm(saveService, () => setEditId(null))
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 12, height: 40, borderRadius: 3, background: svc.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>{svc.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {fmt(svc.basePrice)}{" "}
                        {svc.pricingType === "PER_KG" ? `/kg, min ${svc.minKg}kg` : svc.pricingType === "FLAT" ? "flat" : `fixed (${svc.minKg}kg load)`}
                        {svc.expressMultiplier > 1 ? `, ${svc.expressMultiplier}x express` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleService(svc.id)}
                      style={{
                        padding: "4px 12px", borderRadius: 6,
                        border: `1px solid ${svc.active ? "var(--success)" : "var(--border)"}`,
                        background: "transparent",
                        color: svc.active ? "var(--success)" : "var(--muted)",
                        cursor: "pointer", fontSize: 12,
                      }}
                    >
                      {svc.active ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => startEditService(svc)}
                      style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 12 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteService(svc.id)}
                      style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", cursor: "pointer", fontSize: 12 }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 4. WORKFLOW */}
        {tab === "workflow" && (
          <div>
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
              {"\uD83D\uDD04"} Workflow Stages
            </h3>
            {stages.map((stage) => (
              <div
                key={stage.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10,
                  background: "var(--card)", marginBottom: 10, border: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 20 }}>{stage.icon}</span>
                <input
                  value={stage.label}
                  onChange={(e) =>
                    setStages((prev) => prev.map((s) => (s.id === stage.id ? { ...s, label: e.target.value } : s)))
                  }
                  style={{
                    flex: 1, background: "transparent", border: "none", color: "var(--text)",
                    fontSize: 14, fontWeight: 600, outline: "none",
                  }}
                />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: stage.color, flexShrink: 0 }} />
              </div>
            ))}
            <button
              onClick={() => { notify("Workflow stages saved"); addAudit("SETTINGS_CHANGED", "Workflow stages updated"); }}
              className="btn-primary"
              style={{ width: "100%", marginTop: 8 }}
            >
              Save Stages
            </button>
          </div>
        )}

        {/* 5. SMS TEMPLATES */}
        {tab === "sms" && (
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
              {"\uD83D\uDCAC"} SMS Templates
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: "var(--muted)" }}>
              Tokens: {"{name}"} {"{order}"} {"{shop}"} {"{kg}"} {"{total}"} {"{address}"} {"{message}"}
            </p>

            {/* Token reference */}
            <div style={{ marginBottom: 20, padding: 14, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Available Tokens</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[
                  { token: "{name}", desc: "Customer name" },
                  { token: "{order}", desc: "Order number" },
                  { token: "{shop}", desc: "Shop name" },
                  { token: "{kg}", desc: "Total kilograms" },
                  { token: "{total}", desc: "Order total" },
                  { token: "{address}", desc: "Shop address" },
                  { token: "{message}", desc: "Custom message" },
                ].map((t) => (
                  <div key={t.token} style={{ fontSize: 12, color: "var(--subtext)" }}>
                    <code style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: 11 }}>{t.token}</code>{" "}
                    &mdash; {t.desc}
                  </div>
                ))}
              </div>
            </div>

            {SMS_TEMPLATE_FIELDS.map(({ key, label }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{label}</label>
                <textarea
                  value={smsTemplates[key]}
                  onChange={(e) => setSmsTemplates((p) => ({ ...p, [key]: e.target.value }))}
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 8,
                    border: "1px solid var(--border)", background: "var(--bg)",
                    color: "var(--text)", fontSize: 13, resize: "vertical", boxSizing: "border-box",
                  }}
                />
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{smsTemplates[key].length} chars</div>
              </div>
            ))}
            <button
              onClick={() => { notify("SMS templates saved"); addAudit("SETTINGS_CHANGED", "SMS templates updated"); }}
              className="btn-primary"
              style={{ width: "100%" }}
            >
              Save Templates
            </button>
          </div>
        )}

        {/* 6. STAFF */}
        {tab === "staff" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
                {"\uD83D\uDC64"} Staff Management
              </h3>
              <button
                onClick={() => { setShowAddStaff(true); setStaffForm(EMPTY_STAFF_FORM); }}
                className="btn-primary"
                style={{ padding: "8px 16px", fontSize: 13 }}
              >
                + Add Staff
              </button>
            </div>

            {showAddStaff && renderStaffForm(addNewStaff, () => { setShowAddStaff(false); setStaffForm(EMPTY_STAFF_FORM); })}

            {staff.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "12px 16px", borderRadius: 10, background: "var(--card)", marginBottom: 10,
                  border: "1px solid var(--border)", opacity: s.active ? 1 : 0.5,
                }}
              >
                {staffEditId === s.id ? (
                  renderStaffForm(saveStaff, () => setStaffEditId(null))
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 700, color: "var(--white)",
                      }}
                    >
                      {s.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {s.role} {s.id === currentStaff?.id ? "\u00B7 (you)" : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStaffActive(s.id)}
                      style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: s.active ? "color-mix(in srgb, var(--success) 12%, transparent)" : "color-mix(in srgb, var(--border-dark) 12%, transparent)",
                        color: s.active ? "var(--success)" : "var(--muted)",
                        border: "none", cursor: "pointer",
                      }}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => startEditStaff(s)}
                      style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 12 }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 7. INVENTORY */}
        {tab === "inventory" && (
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
              {"\uD83D\uDCE6"} Inventory Settings
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--muted)" }}>
              Configure overstay thresholds and manage stock from the dedicated Inventory screen.
            </p>

            {/* Overstay thresholds */}
            <div style={{ padding: 16, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                {"\u23F0"} Garment Overstay Thresholds
              </h4>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 14px" }}>
                Orders in the facility beyond these durations trigger visual warnings in the Orders board and Dashboard.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {([
                  { label: "\u26A0\uFE0F Warning", field: "overstayWarnHrs" as const, desc: "Yellow indicator", color: "var(--warning)" },
                  { label: "\uD83D\uDD36 Alert", field: "overstayAlertHrs" as const, desc: "Orange indicator", color: "var(--alert)" },
                  { label: "\uD83D\uDD34 Critical", field: "overstayCritHrs" as const, desc: "Red — escalate", color: "var(--danger)" },
                ]).map((t) => (
                  <div key={t.field} style={{ padding: "12px 14px", borderRadius: 8, background: "var(--bg)", border: `1px solid color-mix(in srgb, ${t.color} 20%, transparent)` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.color, marginBottom: 4 }}>{t.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="number"
                        min={1}
                        value={shop[t.field]}
                        onChange={(e) => setShop((p) => ({ ...p, [t.field]: Number(e.target.value) || 1 }))}
                        className="input"
                        style={{ width: 70, fontSize: 16, fontWeight: 800, textAlign: "center" }}
                      />
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>hours</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "var(--muted-deep)", margin: "12px 0 0" }}>
                Thresholds apply to ALL orders from the moment they were created, across all workflow stages.
              </p>
            </div>

            {/* Low stock quick overview */}
            <div style={{ padding: 16, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                {"\uD83D\uDCCB"} Quick Stock Overview
              </h4>
              {inventory.filter((i) => i.qty <= i.minQty).length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "var(--success)", fontSize: 14 }}>
                  {"\u2705"} All items are well stocked!
                </div>
              ) : (
                inventory.filter((i) => i.qty <= i.minQty).map((item) => {
                  const isEmpty = item.qty === 0;
                  return (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{item.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isEmpty ? "var(--danger)" : "var(--alert)" }}>
                        {isEmpty ? "OUT" : `${item.qty} ${item.unit}`}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>min: {item.minQty}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 8. SUPPLIES */}
        {tab === "supplies" && (
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
              {"\uD83E\uDDF4"} Supply Auto-Deduction Rules
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--subtext)" }}>
              Each rule automatically deducts inventory when an order is completed.
              Set <strong>per kg</strong> for wash services, <strong>per load</strong> for fixed loads, or <strong>per order</strong> for items used every time.
            </p>

            {supplyRules.map((rule) => {
              const invItem = inventory.find((i) => i.id === rule.invId);
              return (
                <div key={rule.id} style={{ padding: 16, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 14 }}>
                  {/* Header row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{invItem?.icon || "\uD83D\uDCE6"}</span>
                      <div>
                        <input
                          value={rule.name}
                          onChange={(e) => setSupplyRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, name: e.target.value } : r)))}
                          style={{ background: "transparent", border: "none", color: "var(--text)", fontSize: 14, fontWeight: 700, outline: "none", width: "100%" }}
                        />
                        <div style={{ fontSize: 12, color: "var(--subtext)" }}>
                          Linked:{" "}
                          <select
                            value={rule.invId}
                            onChange={(e) => setSupplyRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, invId: e.target.value } : r)))}
                            style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text)", fontSize: 12, padding: "2px 4px" }}
                          >
                            {inventory.map((inv) => (
                              <option key={inv.id} value={inv.id}>{inv.name}</option>
                            ))}
                          </select>
                          {invItem && (
                            <span style={{ marginLeft: 8, color: "var(--muted)" }}>
                              Stock: {parseFloat(invItem.qty.toFixed(2))} {invItem.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSupplyRules((prev) => prev.filter((r) => r.id !== rule.id));
                        notify("Supply rule deleted");
                        addAudit("SETTINGS_CHANGED", `Supply rule deleted: ${rule.name}`);
                      }}
                      style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", cursor: "pointer", fontSize: 12 }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Deduction amounts */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                    {([
                      { key: "perKg" as const, label: "Per KG (wash services)" },
                      { key: "perLoad" as const, label: "Per Load (fixed loads)" },
                      { key: "perOrder" as const, label: "Per Order (always)" },
                    ]).map((f) => (
                      <div key={f.key}>
                        <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>{f.label}</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={rule[f.key]}
                            onChange={(e) =>
                              setSupplyRules((prev) =>
                                prev.map((r) => (r.id === rule.id ? { ...r, [f.key]: parseFloat(e.target.value) || 0 } : r))
                              )
                            }
                            className="input"
                            style={{ fontSize: 13 }}
                          />
                          <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>{invItem?.unit || "unit"}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Applies to services */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 6 }}>Applies to Services</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <button
                        onClick={() => {
                          const isAll = rule.appliesTo.includes("all");
                          setSupplyRules((prev) =>
                            prev.map((r) => (r.id === rule.id ? { ...r, appliesTo: isAll ? [] : ["all"] } : r))
                          );
                        }}
                        style={{
                          padding: "4px 10px", borderRadius: 6,
                          border: `1px solid ${rule.appliesTo.includes("all") ? "var(--accent)" : "var(--border)"}`,
                          background: rule.appliesTo.includes("all") ? "color-mix(in srgb, var(--accent) 15%, var(--card))" : "transparent",
                          color: rule.appliesTo.includes("all") ? "var(--accent)" : "var(--subtext)",
                          cursor: "pointer", fontSize: 12, fontWeight: rule.appliesTo.includes("all") ? 700 : 400,
                        }}
                      >
                        All Services
                      </button>
                      {services.filter((s) => s.active).map((svc) => {
                        const sel = rule.appliesTo.includes(svc.id);
                        return (
                          <button
                            key={svc.id}
                            onClick={() => {
                              if (rule.appliesTo.includes("all")) return;
                              setSupplyRules((prev) =>
                                prev.map((r) => {
                                  if (r.id !== rule.id) return r;
                                  const next = sel ? r.appliesTo.filter((x) => x !== svc.id) : [...r.appliesTo, svc.id];
                                  return { ...r, appliesTo: next };
                                })
                              );
                            }}
                            style={{
                              padding: "4px 10px", borderRadius: 6,
                              border: `1px solid ${sel ? "var(--border)" : "var(--border)"}`,
                              background: sel ? `${svc.color}25` : "transparent",
                              color: sel ? svc.color : "var(--subtext)",
                              cursor: rule.appliesTo.includes("all") ? "default" : "pointer",
                              fontSize: 12,
                              opacity: rule.appliesTo.includes("all") ? 0.4 : 1,
                            }}
                          >
                            {svc.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add new rule */}
            <button
              onClick={() => {
                const newRule: SupplyRule = {
                  id: genId(),
                  name: "New Rule",
                  invId: inventory[0]?.id || "",
                  perKg: 0,
                  perLoad: 0,
                  perOrder: 0,
                  appliesTo: ["all"],
                };
                setSupplyRules((prev) => [...prev, newRule]);
                notify("Supply rule added");
              }}
              style={{
                width: "100%", padding: 12, borderRadius: 10, border: "1px dashed var(--border)",
                background: "transparent", color: "var(--accent)", cursor: "pointer", fontSize: 14, fontWeight: 700, marginBottom: 16,
              }}
            >
              + Add Supply Rule
            </button>

            {/* Explanation */}
            <div style={{ padding: 16, borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)", fontSize: 12, color: "var(--subtext)", lineHeight: 1.7 }}>
              <strong style={{ color: "var(--text)", display: "block", marginBottom: 6 }}>
                {"\u2139\uFE0F"} How deductions work
              </strong>
              <div>{"\u2022"} <strong>Per KG</strong> &mdash; deducted for every kg in a wash order</div>
              <div>{"\u2022"} <strong>Per Load</strong> &mdash; deducted once per fixed-load order (7kg/8kg loads)</div>
              <div>{"\u2022"} <strong>Per Order</strong> &mdash; deducted once per order regardless of size</div>
              <div style={{ marginTop: 6 }}>Changes are saved automatically. Deductions happen the moment an order is completed.</div>
            </div>
          </div>
        )}

        {/* 9. AUDIT LOG */}
        {tab === "logs" && (
          <div>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
              {"\uD83D\uDCDC"} Audit Log
            </h3>
            {auditLog.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>No activity yet</div>
            ) : (
              auditLog.slice(0, 50).map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: "10px 14px", borderRadius: 8, background: "var(--card)", marginBottom: 6,
                    borderLeft: `3px solid ${entry.type.includes("VOID") ? "var(--danger)" : entry.type.includes("CREATED") ? "var(--success)" : "var(--accent2)"}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{entry.desc}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(entry.at).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-deep)" }}>
                    {entry.type} {"\u00B7"} {new Date(entry.at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 10. SMS LOG */}
        {tab === "smslog" && (
          <div>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
              {"\uD83D\uDCF1"} SMS Log
            </h3>
            {smsLog.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>No SMS sent yet</div>
            ) : (
              smsLog.slice(0, 50).map((entry) => (
                <div
                  key={entry.id}
                  style={{ padding: "10px 14px", borderRadius: 8, background: "var(--card)", marginBottom: 6, border: "1px solid var(--border)" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{entry.phone}</span>
                    <span style={{ fontSize: 11, color: "var(--success)" }}>{"\u2713"} {entry.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--subtext)", marginBottom: 4 }}>{entry.message}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted-deep)" }}>
                    <span>{entry.orderId ? `Order: ${entry.orderId}` : "No order"}</span>
                    <span>{new Date(entry.at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
