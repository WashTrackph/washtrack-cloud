import { useState } from "react";
import { exportBackup, importBackup } from "../lib/backup";
import { getLicenseInfo, validateLicenseKey, generateLicenseKey, addMonths } from "../lib/license";
import { useApp } from "../context/AppContext";
import { ThemeCustomizer } from "../components/ThemeCustomizer";
import { createHashedPin } from "../lib/crypto";
import {
  EMAIL_PROVIDERS, SEED_SHOP, SEED_SERVICES, SEED_STAGES, SEED_SMS_TEMPLATES,
  SEED_STAFF, SEED_CUSTOMERS, SEED_INVENTORY, SEED_SUPPLY_RULES, SEED_PAYMETHODS,
  SEED_EMAIL_CONFIG, DEFAULT_THEME,
} from "../data/seeds";
import type { Service, Staff, SupplyRule, SmsTemplates, EmailProvider } from "../lib/types";

type TabId = "shop" | "theme" | "services" | "workflow" | "sms" | "email" | "staff" | "inventory" | "supplies" | "logs" | "smslog" | "printer" | "backup" | "license";

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "shop",      icon: "\uD83C\uDFEA", label: "Shop" },
  { id: "theme",     icon: "\uD83C\uDFA8", label: "Theme" },
  { id: "services",  icon: "\uD83E\uDDFA", label: "Services" },
  { id: "workflow",  icon: "\uD83D\uDD04", label: "Workflow" },
  { id: "sms",       icon: "\uD83D\uDCAC", label: "SMS" },
  { id: "email",     icon: "\uD83D\uDCE7", label: "Email" },
  { id: "staff",     icon: "\uD83D\uDC64", label: "Staff" },
  { id: "inventory", icon: "\uD83D\uDCE6", label: "Inventory" },
  { id: "supplies",  icon: "\uD83E\uDDF4", label: "Supplies" },
  { id: "logs",      icon: "\uD83D\uDCDC", label: "Audit Log" },
  { id: "smslog",    icon: "\uD83D\uDCF1", label: "SMS Log" },
  { id: "printer",   icon: "\uD83D\uDDA8\uFE0F", label: "Printer" },
  { id: "backup",    icon: "\uD83D\uDCBE", label: "Backup" },
  { id: "license",   icon: "\uD83D\uDD11", label: "License" },
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
    customers, setCustomers, orders, setOrders, inventory, setInventory,
    supplyRules, setSupplyRules, payMethods, setPayMethods,
    emailConfig, setEmailConfig,
    smsLog, setSmsLog, auditLog, setAuditLog, currentStaff, notify, addAudit, fmt, genId, theme, setTheme, promotions, checkSmsStatus, refreshAllSmsStatuses,
    licenseKey, setLicenseKey, trialStartDate, setTrialStartDate,
  } = useApp();

  const [tab, setTab] = useState<TabId>("shop");

  // Service CRUD state
  const [editId, setEditId] = useState<string | null>(null);
  const [svcForm, setSvcForm] = useState(EMPTY_SERVICE_FORM);
  const [showAddService, setShowAddService] = useState(false);

  // SMS test state
  const [smsTesting, setSmsTesting] = useState(false);
  const [smsTestNumber, setSmsTestNumber] = useState("");
  const [smsTestMessage, setSmsTestMessage] = useState("Hello from WashTrack POS! This is a test SMS.");

  // Email state
  const [emailTesting, setEmailTesting] = useState(false);

  // Staff CRUD state
  const [staffEditId, setStaffEditId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF_FORM);
  const [showAddStaff, setShowAddStaff] = useState(false);

  // SMS log filter
  const [smsLogFilter, setSmsLogFilter] = useState("all");

  // Printer state
  const [btDevices, setBtDevices] = useState<{ name: string; address: string }[]>([]);
  const [btScanning, setBtScanning] = useState(false);
  const [btTestPrinting, setBtTestPrinting] = useState(false);

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
    setStaffForm({ name: s.name, role: s.role, pin: "" });
  };

  const saveStaff = async () => {
    if (!staffForm.name.trim()) { notify("Name required", "error"); return; }
    const pinChanged = staffForm.pin.length > 0;
    if (pinChanged && !/^\d{4}$/.test(staffForm.pin)) { notify("PIN must be exactly 4 digits", "error"); return; }
    const hashedPin = pinChanged ? await createHashedPin(staffForm.pin) : null;
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staffEditId
          ? { ...s, name: staffForm.name, role: staffForm.role, ...(hashedPin ? { pin: hashedPin } : {}), avatar: staffForm.name[0]?.toUpperCase() || "?" }
          : s
      )
    );
    notify("Staff updated");
    addAudit("SETTINGS_CHANGED", `Staff updated: ${staffForm.name}`);
    setStaffEditId(null);
  };

  const addNewStaff = async () => {
    if (!staffForm.name.trim()) { notify("Name required", "error"); return; }
    if (!/^\d{4}$/.test(staffForm.pin)) { notify("PIN must be exactly 4 digits", "error"); return; }
    const hashedPin = await createHashedPin(staffForm.pin);
    const s: Staff = {
      id: genId(),
      name: staffForm.name,
      role: staffForm.role,
      pin: hashedPin,
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

  // ── SMS helpers ──
  const handleTestSms = async () => {
    if (!shop.smsApiKey) {
      notify("Please enter your Semaphore API key first", "error");
      return;
    }
    if (!smsTestNumber.trim()) {
      notify("Please enter a recipient phone number", "error");
      return;
    }
    setSmsTesting(true);
    try {
      if ((window as any).__TAURI_INTERNALS__) {
        const { invoke } = await import("@tauri-apps/api/core");
        const result = await invoke("send_sms", {
          payload: {
            api_key: shop.smsApiKey,
            number: smsTestNumber.trim(),
            message: smsTestMessage,
            sender_name: shop.smsSenderName || null,
          },
        });
        const parsed = JSON.parse(result as string);
        const status = parsed?.[0]?.status || "Unknown";
        const network = parsed?.[0]?.network || "Unknown";
        notify(`SMS sent! Status: ${status}, Network: ${network}`);
        addAudit("SMS_TEST", `Test SMS sent to ${smsTestNumber}`);
      } else {
        notify("SMS sending requires Tauri (not available in browser dev mode)", "error");
      }
    } catch (err: any) {
      notify(`SMS failed: ${err?.message || err}`, "error");
    } finally {
      setSmsTesting(false);
    }
  };

  // ── Email helpers ──
  const handleProviderChange = (providerId: EmailProvider) => {
    const provider = EMAIL_PROVIDERS.find((p) => p.id === providerId);
    if (provider) {
      setEmailConfig((prev) => ({
        ...prev,
        provider: providerId,
        smtpHost: provider.smtpHost || prev.smtpHost,
        smtpPort: provider.smtpPort || prev.smtpPort,
        testVerified: false,
      }));
    }
  };

  const handleTestEmail = async () => {
    if (!emailConfig.email || !emailConfig.password) {
      notify("Please enter your email and password first", "error");
      return;
    }
    const sendTo = emailConfig.reportTo || emailConfig.email;
    setEmailTesting(true);
    try {
      // Check if Tauri is available
      if ((window as any).__TAURI_INTERNALS__) {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("send_email", {
          payload: {
            smtp_host: emailConfig.smtpHost,
            smtp_port: emailConfig.smtpPort,
            smtp_user: emailConfig.smtpUser || emailConfig.email,
            smtp_pass: emailConfig.password,
            from_name: emailConfig.fromName || shop.name,
            from_email: emailConfig.email,
            to_email: sendTo,
            subject: `WashTrack POS - Test Email from ${shop.name}`,
            body_html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#38BDF8">WashTrack POS</h2>
              <p>This is a test email from <strong>${shop.name}</strong>.</p>
              <p>If you received this, your email configuration is working correctly.</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
              <p style="color:#94a3b8;font-size:12px">Sent via WashTrack POS email system</p>
            </div>`,
          },
        });
        setEmailConfig((prev) => ({ ...prev, testVerified: true }));
        notify("Test email sent successfully!");
        addAudit("EMAIL_TEST", `Test email sent to ${sendTo}`);
      } else {
        notify("Email sending requires Tauri (not available in browser dev mode)", "error");
      }
    } catch (err: any) {
      notify(`Email failed: ${err?.message || err}`, "error");
      setEmailConfig((prev) => ({ ...prev, testVerified: false }));
    } finally {
      setEmailTesting(false);
    }
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
          <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>{staffEditId ? "New PIN (leave blank to keep)" : "PIN (4 digits) *"}</label>
          <input
            type="password"
            value={staffForm.pin}
            onChange={(e) => setStaffForm((p) => ({ ...p, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
            placeholder={staffEditId ? "••••" : "0000"}
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
              {/* Periodic interval row */}
              <div
                onClick={() => setShop((p) => ({ ...p, autoEmailPeriodic: !p.autoEmailPeriodic }))}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 12,
                  border: `1px solid ${shop.autoEmailPeriodic ? "var(--accent)" : "var(--border)"}`,
                  background: shop.autoEmailPeriodic ? "color-mix(in srgb, var(--accent) 8%, var(--card))" : "var(--card)",
                }}
              >
                <span>⏱</span>
                <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>Every few hours (during work hours)</span>
                <div style={{ width: 34, height: 18, borderRadius: 9, background: shop.autoEmailPeriodic ? "var(--accent)" : "var(--border-dark)", position: "relative", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 2, left: shop.autoEmailPeriodic ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: "var(--white)", transition: "left 0.2s" }} />
                </div>
              </div>

              {shop.autoEmailPeriodic && (
                <div style={{ padding: "12px 14px", background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 12 }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>Send every</label>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[1, 2, 3, 4, 6, 8].map((h) => (
                        <button
                          key={h}
                          onClick={(e) => { e.stopPropagation(); setShop((p) => ({ ...p, periodicIntervalHours: h })); }}
                          style={{
                            padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none",
                            background: (shop.periodicIntervalHours || 4) === h ? "var(--accent)" : "var(--bg)",
                            color: (shop.periodicIntervalHours || 4) === h ? "#fff" : "var(--subtext)",
                          }}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 4 }}>Work hours start</label>
                      <input
                        type="time"
                        value={shop.workHoursStart || "08:00"}
                        onChange={(e) => setShop((p) => ({ ...p, workHoursStart: e.target.value }))}
                        className="input"
                        style={{ maxWidth: 120 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 4 }}>Work hours end</label>
                      <input
                        type="time"
                        value={shop.workHoursEnd || "22:00"}
                        onChange={(e) => setShop((p) => ({ ...p, workHoursEnd: e.target.value }))}
                        className="input"
                        style={{ maxWidth: 120 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
              )}

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

            {/* Settings PIN */}
            <div style={{ marginTop: 20, padding: 18, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>🔒 Settings PIN</h4>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--subtext)", lineHeight: 1.5 }}>
                A separate PIN just for Settings. If not set, the Owner PIN is used as fallback.
              </p>
              <SettingsPinField
                currentPin={shop.settingsPin}
                onSave={async (pin) => {
                  const hashed = await createHashedPin(pin);
                  setShop((p) => ({ ...p, settingsPin: hashed }));
                  notify("Settings PIN updated");
                  addAudit("SETTINGS_CHANGED", "Settings PIN updated");
                }}
                onClear={() => {
                  setShop((p) => ({ ...p, settingsPin: undefined }));
                  notify("Settings PIN removed — Owner PIN will be used");
                  addAudit("SETTINGS_CHANGED", "Settings PIN removed");
                }}
              />
            </div>

            <button
              onClick={() => { notify("Shop settings saved"); addAudit("SETTINGS_CHANGED", "Shop identity updated"); }}
              className="btn-primary"
              style={{ width: "100%", marginTop: 16 }}
            >
              Save Changes
            </button>

            {import.meta.env.DEV && (
              <div style={{ marginTop: 32, padding: 18, borderRadius: 10, background: "var(--danger-bg-dark)", border: "1px solid var(--danger)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--danger-text)", marginBottom: 4 }}>
                  DEV MODE — Reset to Seed Data
                </div>
                <div style={{ fontSize: 12, color: "var(--subtext)", marginBottom: 12 }}>
                  Replaces ALL data (shop, staff, services, customers, orders, inventory, SMS log, audit log) with seed defaults. This cannot be undone.
                </div>
                <button
                  onClick={() => {
                    if (!confirm("Reset ALL data to seed defaults? This cannot be undone.")) return;
                    setShop(SEED_SHOP);
                    setServices(SEED_SERVICES);
                    setStages(SEED_STAGES);
                    setSmsTemplates(SEED_SMS_TEMPLATES);
                    setStaff(SEED_STAFF);
                    setCustomers(SEED_CUSTOMERS);
                    setOrders([]);
                    setSmsLog([]);
                    setAuditLog([]);
                    setInventory(SEED_INVENTORY);
                    setSupplyRules(SEED_SUPPLY_RULES);
                    setPayMethods(SEED_PAYMETHODS);
                    setEmailConfig(SEED_EMAIL_CONFIG);
                    setTheme(DEFAULT_THEME);
                    notify("All data reset to seed defaults");
                    addAudit("SYSTEM", "Data reset to seed defaults (dev mode)");
                  }}
                  style={{
                    width: "100%", padding: 10, borderRadius: 8, cursor: "pointer",
                    background: "var(--danger)", color: "#fff", border: "none",
                    fontWeight: 700, fontSize: 13,
                  }}
                >Reset All Data to Defaults</button>
              </div>
            )}
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
              {"\uD83D\uDCAC"} SMS Configuration
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: "var(--muted)" }}>
              Powered by Semaphore.co &mdash; Philippine SMS gateway
            </p>

            {/* API Configuration */}
            <div style={{ marginBottom: 20, padding: 18, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>API Settings</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>Semaphore API Key *</label>
                  <input
                    type="password"
                    value={shop.smsApiKey || ""}
                    onChange={(e) => setShop((p) => ({ ...p, smsApiKey: e.target.value }))}
                    placeholder="Your API key from semaphore.co"
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>Sender Name</label>
                  <input
                    value={shop.smsSenderName || ""}
                    onChange={(e) => setShop((p) => ({ ...p, smsSenderName: e.target.value }))}
                    placeholder="SEMAPHORE"
                    className="input"
                  />
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>Must be registered at semaphore.co</div>
                </div>
              </div>
            </div>

            {/* Mock Mode Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 10, background: shop.smsMockMode ? "var(--warning-bg-dark)" : "var(--card)", border: `1px solid ${shop.smsMockMode ? "var(--warning)" : "var(--border)"}`, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Mock Mode {shop.smsMockMode ? "(ON)" : ""}</div>
                <div style={{ fontSize: 12, color: "var(--subtext)" }}>Simulate SMS without sending. Messages appear in SMS Log as MOCK.</div>
              </div>
              <div
                onClick={() => {
                  setShop((p) => ({ ...p, smsMockMode: !p.smsMockMode }));
                  notify(shop.smsMockMode ? "Mock mode OFF \u2014 SMS will send for real" : "Mock mode ON \u2014 SMS will be simulated");
                }}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative",
                  background: shop.smsMockMode ? "var(--warning)" : "var(--border-dark)",
                  transition: "background 0.2s",
                }}
              >
                <div style={{ position: "absolute", top: 3, left: shop.smsMockMode ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "var(--white)", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
            </div>

            {/* Test SMS */}
            <div style={{ marginBottom: 24, padding: 18, borderRadius: 10, background: "var(--bg)", border: "1px dashed var(--border)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Send Test SMS</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>
                {shop.smsMockMode ? "Mock mode is ON \u2014 test will be simulated, not sent." : "Sends a real SMS (costs 1 credit per 160 chars)."}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>Recipient Number *</label>
                  <input
                    value={smsTestNumber}
                    onChange={(e) => setSmsTestNumber(e.target.value)}
                    placeholder="09171234567"
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>Message</label>
                  <input
                    value={smsTestMessage}
                    onChange={(e) => setSmsTestMessage(e.target.value)}
                    placeholder="Your test message"
                    className="input"
                  />
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>{smsTestMessage.length} / 160 chars</div>
                </div>
              </div>
              <button
                onClick={handleTestSms}
                disabled={smsTesting || !shop.smsApiKey || !smsTestNumber.trim()}
                className="btn-primary"
                style={{
                  width: "100%",
                  opacity: (smsTesting || !shop.smsApiKey || !smsTestNumber.trim()) ? 0.5 : 1,
                  cursor: (smsTesting || !shop.smsApiKey || !smsTestNumber.trim()) ? "not-allowed" : "pointer",
                }}
              >
                {smsTesting ? "Sending..." : "Send Test SMS"}
              </button>
            </div>

            {/* Templates heading */}
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              Message Templates
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

        {/* 6. EMAIL */}
        {tab === "email" && (
          <div>
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
              {"\uD83D\uDCE7"} Email Configuration
            </h3>

            {/* Enable toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Enable Email</div>
                <div style={{ fontSize: 12, color: "var(--subtext)" }}>Send shift-end reports and receipt emails from this device</div>
              </div>
              <div
                onClick={() => setEmailConfig((p) => ({ ...p, enabled: !p.enabled, testVerified: false }))}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative",
                  background: emailConfig.enabled ? "var(--accent)" : "var(--border-dark)",
                  transition: "background 0.2s",
                }}
              >
                <div style={{ position: "absolute", top: 3, left: emailConfig.enabled ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "var(--white)", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
            </div>

            {emailConfig.enabled && (
              <>
                {/* Provider selection */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>Email Provider</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                    {EMAIL_PROVIDERS.map((prov) => {
                      const selected = emailConfig.provider === prov.id;
                      return (
                        <button
                          key={prov.id}
                          onClick={() => handleProviderChange(prov.id)}
                          style={{
                            padding: "10px 14px", borderRadius: 8, textAlign: "left", cursor: "pointer",
                            border: `1.5px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                            background: selected ? "color-mix(in srgb, var(--accent) 10%, var(--card))" : "var(--card)",
                            color: selected ? "var(--accent)" : "var(--text)",
                            fontWeight: selected ? 700 : 500, fontSize: 13,
                          }}
                        >
                          {prov.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Help text for selected provider */}
                {(() => {
                  const prov = EMAIL_PROVIDERS.find((p) => p.id === emailConfig.provider);
                  return prov ? (
                    <div style={{ padding: "12px 16px", borderRadius: 8, background: "color-mix(in srgb, var(--accent) 6%, var(--bg))", border: "1px solid color-mix(in srgb, var(--accent) 20%, var(--border))", marginBottom: 16, fontSize: 12, color: "var(--subtext)", lineHeight: 1.6 }}>
                      <strong style={{ color: "var(--accent)" }}>{"\u2139\uFE0F"} Setup:</strong> {prov.help}
                    </div>
                  ) : null;
                })()}

                {/* Credentials */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>Email Address *</label>
                    <input
                      type="email"
                      value={emailConfig.email}
                      onChange={(e) => setEmailConfig((p) => ({ ...p, email: e.target.value, testVerified: false }))}
                      placeholder="you@gmail.com"
                      className="input"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>
                      {emailConfig.provider === "custom" ? "SMTP Password *" : "App Password *"}
                    </label>
                    <input
                      type="password"
                      value={emailConfig.password}
                      onChange={(e) => setEmailConfig((p) => ({ ...p, password: e.target.value, testVerified: false }))}
                      placeholder={emailConfig.provider === "custom" ? "SMTP password" : "xxxx xxxx xxxx xxxx"}
                      className="input"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>From Name</label>
                    <input
                      value={emailConfig.fromName}
                      onChange={(e) => setEmailConfig((p) => ({ ...p, fromName: e.target.value }))}
                      placeholder={shop.name || "WashTrack POS"}
                      className="input"
                    />
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                      Defaults to shop name if empty
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>Send Reports To</label>
                    <input
                      type="email"
                      value={emailConfig.reportTo}
                      onChange={(e) => setEmailConfig((p) => ({ ...p, reportTo: e.target.value }))}
                      placeholder={emailConfig.email || "owner@example.com"}
                      className="input"
                    />
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                      Defaults to sender email if empty
                    </div>
                  </div>
                </div>

                {/* Custom SMTP settings — only shown for custom provider */}
                {emailConfig.provider === "custom" && (
                  <div style={{ padding: 16, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 20 }}>
                    <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                      SMTP Server Settings
                    </h4>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>SMTP Username</label>
                      <input
                        value={emailConfig.smtpUser}
                        onChange={(e) => setEmailConfig((p) => ({ ...p, smtpUser: e.target.value, testVerified: false }))}
                        placeholder={emailConfig.email || "Leave empty to use From email address"}
                        className="input"
                      />
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                        The login username for your SMTP server. Leave empty if same as the From email address above.
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>SMTP Host *</label>
                        <input
                          value={emailConfig.smtpHost}
                          onChange={(e) => setEmailConfig((p) => ({ ...p, smtpHost: e.target.value, testVerified: false }))}
                          placeholder="mail.yourdomain.com"
                          className="input"
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, color: "var(--subtext)", marginBottom: 6 }}>SMTP Port *</label>
                        <input
                          type="number"
                          value={emailConfig.smtpPort}
                          onChange={(e) => setEmailConfig((p) => ({ ...p, smtpPort: Number(e.target.value) || 587, testVerified: false }))}
                          className="input"
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                      Port 587 = STARTTLS (recommended), Port 465 = implicit TLS/SSL
                    </div>
                  </div>
                )}

                {/* Test button + status */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)" }}>
                  <button
                    onClick={handleTestEmail}
                    disabled={emailTesting || !emailConfig.email || !emailConfig.password}
                    className="btn-primary"
                    style={{
                      padding: "10px 24px", fontSize: 14, fontWeight: 700,
                      opacity: (emailTesting || !emailConfig.email || !emailConfig.password) ? 0.5 : 1,
                      cursor: (emailTesting || !emailConfig.email || !emailConfig.password) ? "not-allowed" : "pointer",
                    }}
                  >
                    {emailTesting ? "Sending..." : "\uD83D\uDCE8 Send Test Email"}
                  </button>
                  <div style={{ flex: 1 }}>
                    {emailConfig.testVerified ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "var(--success)", fontSize: 18 }}>{"\u2705"}</span>
                        <span style={{ color: "var(--success)", fontSize: 13, fontWeight: 700 }}>Verified</span>
                      </div>
                    ) : emailConfig.email && emailConfig.password ? (
                      <div style={{ color: "var(--warning)", fontSize: 12 }}>
                        {"\u26A0\uFE0F"} Not yet verified. Send a test email to confirm your settings work.
                      </div>
                    ) : (
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        Enter credentials above, then send a test email.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 7. STAFF */}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
                {"\uD83D\uDCF1"} SMS Log
              </h3>
              <div style={{ display: "flex", gap: 6 }}>
                {["all", "SENT", "FAILED", "MOCK", "PROMO"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSmsLogFilter(f)}
                    style={{
                      padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      background: smsLogFilter === f ? (f === "MOCK" ? "var(--warning)" : f === "FAILED" ? "var(--danger)" : "var(--accent)") : "var(--card)",
                      color: smsLogFilter === f ? "#fff" : "var(--text)",
                      border: `1px solid ${smsLogFilter === f ? "transparent" : "var(--border)"}`,
                    }}
                  >{f === "all" ? "All" : f}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                onClick={async () => { await refreshAllSmsStatuses(); notify("SMS statuses refreshed"); }}
                style={{
                  padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer",
                }}
              >{"\uD83D\uDD04"} Refresh Statuses</button>
              {smsLog.some((e) => e.status === "MOCK") && (
                <button
                  onClick={() => {
                    setSmsLog((prev) => prev.filter((e) => e.status !== "MOCK"));
                    notify("Mock SMS entries cleared");
                  }}
                  style={{
                    padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: "var(--danger)", color: "#fff", border: "none", cursor: "pointer",
                  }}
                >Clear Mock Entries</button>
              )}
            </div>
            {(() => {
              const filtered = smsLogFilter === "all" ? smsLog : smsLogFilter === "PROMO" ? smsLog.filter((e) => e.promoId) : smsLog.filter((e) => e.status.toUpperCase() === smsLogFilter || (smsLogFilter === "SENT" && ["Queued", "Pending", "SENDING"].includes(e.status)));
              const statusColor = (s: string) => s === "MOCK" ? "var(--warning)" : s === "FAILED" ? "var(--danger)" : s === "SENDING" ? "var(--accent)" : "var(--success)";
              const statusLabel = (s: string) => s === "MOCK" ? "\uD83E\uDDEA MOCK" : s === "FAILED" ? "\u2717 FAILED" : s === "SENDING" ? "\u23F3 SENDING" : `\u2713 ${s.toUpperCase()}`;
              return filtered.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  {smsLogFilter === "all" ? "No SMS sent yet" : `No ${smsLogFilter} messages`}
                </div>
              ) : (
                filtered.slice(0, 50).map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      padding: "10px 14px", borderRadius: 8, marginBottom: 6,
                      background: entry.status === "MOCK" ? "var(--warning-bg-dark)" : entry.status === "FAILED" ? "color-mix(in srgb, var(--danger) 8%, var(--card))" : "var(--card)",
                      border: `1px solid ${entry.status === "MOCK" ? "var(--warning)" : entry.status === "FAILED" ? "var(--danger)" : "var(--border)"}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{entry.phone}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(entry.status) }}>
                          {statusLabel(entry.status)}
                        </span>
                        {entry.messageId && (
                          <button
                            onClick={async (e) => { e.stopPropagation(); await checkSmsStatus(entry); notify("Status refreshed"); }}
                            style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid var(--border-dark)", background: "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 10, fontWeight: 600 }}
                          >{"\uD83D\uDD04"} Check</button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--subtext)", marginBottom: 4 }}>{entry.message}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted-deep)" }}>
                      <span>{entry.promoId ? `Promo: ${promotions.find((p) => p.id === entry.promoId)?.name || entry.promoId}` : entry.orderId ? `Order: ${entry.orderId}` : "No order"}{entry.network ? ` \u00B7 ${entry.network}` : ""}</span>
                      <span>{new Date(entry.at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              );
            })()}
          </div>
        )}

        {tab === "printer" && (
          <div>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
              {"\uD83D\uDDA8\uFE0F"} Bluetooth Thermal Printer
            </h3>

            {/* Current printer */}
            <div style={{ padding: 14, borderRadius: 8, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Current Printer</div>
              {shop.btPrinterAddress ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{shop.btPrinterName || "Unknown"}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{shop.btPrinterAddress}</div>
                  </div>
                  <button
                    onClick={() => {
                      setShop((s) => ({ ...s, btPrinterAddress: undefined, btPrinterName: undefined }));
                      notify("Printer disconnected");
                    }}
                    style={{ padding: "6px 12px", background: "var(--danger)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}
                  >Remove</button>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>No printer selected. Scan to find paired devices.</div>
              )}
            </div>

            {/* Paper width */}
            <div style={{ padding: 14, borderRadius: 8, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Paper Width</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[58, 80].map((w) => (
                  <button
                    key={w}
                    onClick={() => setShop((s) => ({ ...s, receiptPaperWidth: w }))}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14,
                      background: (shop.receiptPaperWidth || 58) === w ? "var(--accent)" : "var(--bg)",
                      color: (shop.receiptPaperWidth || 58) === w ? "#fff" : "var(--text)",
                      border: `2px solid ${(shop.receiptPaperWidth || 58) === w ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >{w}mm</button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                58mm = 32 chars/line (most common) | 80mm = 48 chars/line
              </div>
            </div>

            {/* Scan for printers */}
            <button
              onClick={async () => {
                setBtScanning(true);
                try {
                  const { invoke } = await import("@tauri-apps/api/core");
                  const result = await invoke<{ name: string; address: string }[]>("plugin:printer|list_bluetooth_printers");
                  setBtDevices(result);
                  if (result.length === 0) notify("No paired Bluetooth devices found. Pair your printer in Android Settings first.", "error");
                } catch (e: any) {
                  notify(`Scan failed: ${e?.message || e}`, "error");
                  setBtDevices([]);
                } finally {
                  setBtScanning(false);
                }
              }}
              disabled={btScanning}
              style={{
                width: "100%", padding: 12, marginBottom: 16, borderRadius: 8, cursor: "pointer",
                background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14,
                opacity: btScanning ? 0.6 : 1,
              }}
            >{btScanning ? "Scanning..." : "Scan for Paired Printers"}</button>

            {/* Device list */}
            {btDevices.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Paired Devices</div>
                {btDevices.map((d) => (
                  <div
                    key={d.address}
                    onClick={() => {
                      setShop((s) => ({ ...s, btPrinterAddress: d.address, btPrinterName: d.name }));
                      notify(`Printer set: ${d.name}`);
                    }}
                    style={{
                      padding: "10px 14px", borderRadius: 8, marginBottom: 6, cursor: "pointer",
                      background: shop.btPrinterAddress === d.address ? "var(--accent-bg)" : "var(--card)",
                      border: `1px solid ${shop.btPrinterAddress === d.address ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{d.address}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Test print */}
            {shop.btPrinterAddress && (
              <button
                onClick={async () => {
                  setBtTestPrinting(true);
                  try {
                    const { invoke } = await import("@tauri-apps/api/core");
                    await invoke("plugin:printer|print_bluetooth", {
                      order: {
                        orderNum: "TEST-001", customerName: "Test Customer", customerPhone: "09171234567",
                        items: [{ serviceName: "Regular Wash", pricingType: "PER_KG", kg: 5.0, unitPrice: 65, subtotal: 325, express: false }],
                        subtotal: 325, discount: 0, total: 325, express: false,
                        paymentMethod: "Cash", isCashPayment: true, cashTendered: 500, change: 175,
                        createdAt: Date.now(),
                      },
                      shop: { name: shop.name, address: shop.address, phone: shop.phone, currency: shop.currency || "\u20B1" },
                      printerAddress: shop.btPrinterAddress,
                      paperWidth: shop.receiptPaperWidth || 58,
                    });
                    notify("Test receipt sent!");
                  } catch (e: any) {
                    notify(`Test print failed: ${e?.message || e}`, "error");
                  } finally {
                    setBtTestPrinting(false);
                  }
                }}
                disabled={btTestPrinting}
                style={{
                  width: "100%", padding: 12, borderRadius: 8, cursor: "pointer",
                  background: "var(--success)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14,
                  opacity: btTestPrinting ? 0.6 : 1,
                }}
              >{btTestPrinting ? "Printing..." : "Test Print"}</button>
            )}
          </div>
        )}

        {/* BACKUP & RESTORE */}
        {tab === "backup" && <BackupTab notify={notify} />}

        {/* LICENSE */}
        {tab === "license" && (
          <LicenseTab
            licenseKey={licenseKey}
            trialStartDate={trialStartDate}
            onActivate={(key) => { setLicenseKey(key); notify("License activated!"); }}
            onTrialStart={setTrialStartDate}
            notify={notify}
          />
        )}
      </div>
    </div>
  );
}

// ─── Backup Tab ───────────────────────────────────────────────────────────────
function BackupTab({ notify }: { notify: (msg: string, type?: string) => void }) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await exportBackup();
      notify("Backup saved successfully!");
    } catch (e: any) {
      notify(`Export failed: ${e?.message || e}`, "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    setConfirmRestore(false);
    try {
      const result = await importBackup();
      if (!result.ok) {
        notify(result.message, "error");
      } else {
        notify(result.message);
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (e: any) {
      notify(`Restore failed: ${e?.message || e}`, "error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>💾 Backup & Restore</h3>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--subtext)" }}>
        Keep your data safe. Export a backup file and store it on USB, Google Drive, or email it to yourself.
        If the device is ever damaged or replaced, restore from that file.
      </p>

      {/* Export */}
      <div style={{ padding: 20, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ fontSize: 32 }}>📤</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Export Backup</div>
            <div style={{ fontSize: 13, color: "var(--subtext)", marginBottom: 14, lineHeight: 1.5 }}>
              Saves all your data — orders, customers, staff, services, inventory, settings — into a single <code>.json</code> file.
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{
                padding: "10px 20px", borderRadius: 8, border: "none", cursor: exporting ? "default" : "pointer",
                background: exporting ? "var(--border)" : "var(--accent)", color: "#fff",
                fontWeight: 700, fontSize: 14, opacity: exporting ? 0.7 : 1,
              }}
            >
              {exporting ? "Saving…" : "Save Backup File"}
            </button>
          </div>
        </div>
      </div>

      {/* Restore */}
      <div style={{ padding: 20, background: "var(--card)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ fontSize: 32 }}>📥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Restore from Backup</div>
            <div style={{ fontSize: 13, color: "var(--subtext)", marginBottom: 14, lineHeight: 1.5 }}>
              Loads a previously exported backup file. <strong style={{ color: "var(--danger)" }}>This will overwrite all current data</strong> and reload the app.
            </div>

            {!confirmRestore ? (
              <button
                onClick={() => setConfirmRestore(true)}
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "1px solid var(--danger)", cursor: "pointer",
                  background: "transparent", color: "var(--danger)", fontWeight: 700, fontSize: 14,
                }}
              >
                Restore Backup…
              </button>
            ) : (
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "var(--danger)", fontWeight: 600 }}>Are you sure? Current data will be replaced.</span>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  style={{
                    padding: "9px 18px", borderRadius: 8, border: "none", cursor: importing ? "default" : "pointer",
                    background: "var(--danger)", color: "#fff", fontWeight: 700, fontSize: 13, opacity: importing ? 0.7 : 1,
                  }}
                >
                  {importing ? "Restoring…" : "Yes, Restore"}
                </button>
                <button
                  onClick={() => setConfirmRestore(false)}
                  style={{
                    padding: "9px 18px", borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer",
                    background: "transparent", color: "var(--subtext)", fontWeight: 600, fontSize: 13,
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div style={{ marginTop: 20, padding: 16, background: "color-mix(in srgb, var(--accent) 6%, var(--bg))", borderRadius: 10, border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>💡 Backup Tips</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--subtext)", lineHeight: 1.8 }}>
          <li>Export a backup at the end of each week</li>
          <li>Store it on Google Drive, USB, or email it to yourself</li>
          <li>Backup file includes all orders, customers, staff, and settings</li>
          <li>To move to a new device: export on the old device, install WashTrack, then restore</li>
        </ul>
      </div>
    </div>
  );
}

// ─── License Tab ──────────────────────────────────────────────────────────────
function LicenseTab({ licenseKey, trialStartDate, onActivate, onTrialStart, notify }: {
  licenseKey: string;
  trialStartDate: string;
  onActivate: (key: string) => void;
  onTrialStart: (date: string) => void;
  notify: (msg: string, type?: string) => void;
}) {
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState("");

  if (!trialStartDate) onTrialStart(new Date().toISOString());

  const info = getLicenseInfo(licenseKey, trialStartDate);

  const statusColor =
    info.status === "active"         ? "var(--success)" :
    info.status === "expiring_soon"  ? "#F59E0B" :
    info.status === "trial"          ? "var(--accent)" :
    "var(--danger)";

  const statusBg =
    info.status === "active"         ? "color-mix(in srgb, var(--success) 8%, var(--card))" :
    info.status === "expiring_soon"  ? "color-mix(in srgb, #F59E0B 8%, var(--card))" :
    info.status === "trial"          ? "color-mix(in srgb, var(--accent) 8%, var(--card))" :
    "color-mix(in srgb, var(--danger) 8%, var(--card))";

  const statusLabel =
    info.status === "active"         ? "✓ Active" :
    info.status === "expiring_soon"  ? "⚠ Expiring Soon" :
    info.status === "trial"          ? "⏱ Free Trial" :
    info.status === "trial_expired"  ? "✕ Trial Expired" :
    info.status === "expired"        ? "✕ Expired" :
    "✕ Invalid";

  function handleActivate() {
    const trimmed = keyInput.trim();
    if (!trimmed) { setError("Please enter a license key."); return; }
    const { ok } = validateLicenseKey(trimmed);
    if (!ok) { setError("Invalid key — check and try again."); return; }
    setError("");
    setKeyInput("");
    onActivate(trimmed.toUpperCase());
  }

  // Dev helper shown only in browser (not Tauri)
  const isBrowser = !(window as any).__TAURI_INTERNALS__;

  return (
    <div>
      <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>🔑 License</h3>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--subtext)" }}>
        Your WashTrack license status and activation.
      </p>

      {/* Status card */}
      <div style={{ padding: 20, borderRadius: 14, background: statusBg, border: `1px solid ${statusColor}40`, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: statusColor, marginBottom: 4 }}>
              {statusLabel}
            </div>
            <div style={{ fontSize: 13, color: "var(--subtext)", lineHeight: 1.5 }}>{info.message}</div>
            {licenseKey && info.status !== "invalid" && (
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, fontFamily: "monospace", letterSpacing: 1 }}>
                Key: {licenseKey.slice(0, 10)}••••••
              </div>
            )}
          </div>
          <div style={{ textAlign: "center", minWidth: 80 }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: statusColor, lineHeight: 1 }}>
              {info.daysLeft > 0 ? info.daysLeft : 0}
            </div>
            <div style={{ fontSize: 11, color: "var(--subtext)", textTransform: "uppercase", letterSpacing: 0.5 }}>days left</div>
          </div>
        </div>
      </div>

      {/* Key entry */}
      <div style={{ padding: 18, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
          {licenseKey && info.status !== "invalid" ? "Update License Key" : "Enter License Key"}
        </div>
        <div style={{ fontSize: 12, color: "var(--subtext)", marginBottom: 12 }}>
          Contact WashTrack support to get a key. Paste it below to activate.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={keyInput}
            onChange={(e) => { setKeyInput(e.target.value.toUpperCase()); setError(""); }}
            placeholder="WT-XXX-YYYYMMDD-XXXXXX"
            className="input"
            style={{ flex: 1, minWidth: 200, letterSpacing: 1, fontFamily: "monospace" }}
            onKeyDown={(e) => e.key === "Enter" && handleActivate()}
          />
          <button
            onClick={handleActivate}
            disabled={!keyInput.trim()}
            className="btn-primary"
            style={{ opacity: keyInput.trim() ? 1 : 0.5 }}
          >
            Activate
          </button>
        </div>
        {error && <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--danger)", fontWeight: 600 }}>{error}</p>}
      </div>

      {/* Dev key generator — only visible in browser mode */}
      {isBrowser && (
        <div style={{ padding: 16, background: "var(--bg)", border: "1px dashed var(--border)", borderRadius: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>🛠 Developer Tools (browser only)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "1 Month",  months: 1 },
              { label: "3 Months", months: 3 },
              { label: "6 Months", months: 6 },
              { label: "1 Year",   months: 12 },
            ].map(({ label, months }) => {
              const key = generateLicenseKey(addMonths(new Date(), months), "DEV");
              return (
                <button
                  key={months}
                  onClick={() => { onActivate(key); notify(`Dev key activated: ${label}`); }}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--subtext)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings PIN Field ───────────────────────────────────────────────────────
function SettingsPinField({ currentPin, onSave, onClear }: {
  currentPin: string | object | undefined;
  onSave: (pin: string) => void;
  onClear: () => void;
}) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const isSet = !!currentPin;

  function handleSave() {
    if (!/^\d{4}$/.test(pin)) { setError("PIN must be exactly 4 digits"); return; }
    if (pin !== confirm) { setError("PINs don't match"); return; }
    setError("");
    setPin("");
    setConfirm("");
    onSave(pin);
  }

  return (
    <div>
      {isSet && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: "color-mix(in srgb, var(--success) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--success)" }}>✓ Settings PIN is set</span>
          <button onClick={onClear} style={{ fontSize: 12, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Remove</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>{isSet ? "New PIN" : "PIN (4 digits)"}</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }}
            placeholder="••••"
            className="input"
            style={{ maxWidth: 100, letterSpacing: 4, textAlign: "center" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--subtext)", marginBottom: 4 }}>Confirm PIN</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }}
            placeholder="••••"
            className="input"
            style={{ maxWidth: 100, letterSpacing: 4, textAlign: "center" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={handleSave}
            disabled={pin.length < 4 || confirm.length < 4}
            className="btn-primary"
            style={{ padding: "8px 16px", fontSize: 13, opacity: pin.length < 4 || confirm.length < 4 ? 0.5 : 1 }}
          >
            {isSet ? "Update PIN" : "Set PIN"}
          </button>
        </div>
      </div>
      {error && <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--danger)", fontWeight: 600 }}>{error}</p>}
    </div>
  );
}
