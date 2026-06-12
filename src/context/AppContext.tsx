import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { DB, initDatabase } from "../lib/db";
import { genId, applyTheme, calcPrice, genOrderNum, formatCurrency } from "../lib/utils";
import { isLegacyPin, createHashedPin } from "../lib/crypto";
import {
  SEED_SHOP, SEED_SERVICES, SEED_STAGES, SEED_SMS_TEMPLATES, SEED_STAFF,
  SEED_CUSTOMERS, SEED_INVENTORY, SEED_SUPPLY_RULES, SEED_PAYMETHODS,
  DEFAULT_THEME, SEED_EMAIL_CONFIG,
} from "../data/seeds";
import type {
  Shop, Service, Stage, SmsTemplates, Staff, Customer, Order,
  InventoryItem, SupplyRule, PayMethod, SmsLogEntry, AuditLogEntry, ThemePreset, EmailConfig, Promotion,
} from "../lib/types";
import { checkAndSendReports, sendReport, EMPTY_LAST_SENT, type LastEmailSent } from "../lib/emailScheduler";

interface AppContextValue {
  shop: Shop;
  setShop: React.Dispatch<React.SetStateAction<Shop>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  stages: Stage[];
  setStages: React.Dispatch<React.SetStateAction<Stage[]>>;
  smsTemplates: SmsTemplates;
  setSmsTemplates: React.Dispatch<React.SetStateAction<SmsTemplates>>;
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  smsLog: SmsLogEntry[];
  setSmsLog: React.Dispatch<React.SetStateAction<SmsLogEntry[]>>;
  auditLog: AuditLogEntry[];
  setAuditLog: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>;
  orderCounter: number;
  setOrderCounter: React.Dispatch<React.SetStateAction<number>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  payMethods: PayMethod[];
  setPayMethods: React.Dispatch<React.SetStateAction<PayMethod[]>>;
  supplyRules: SupplyRule[];
  setSupplyRules: React.Dispatch<React.SetStateAction<SupplyRule[]>>;
  emailConfig: EmailConfig;
  setEmailConfig: React.Dispatch<React.SetStateAction<EmailConfig>>;
  promotions: Promotion[];
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  licenseKey: string;
  setLicenseKey: (key: string) => void;
  trialStartDate: string;
  setTrialStartDate: (date: string) => void;
  currentStaff: Staff | null;
  setCurrentStaff: React.Dispatch<React.SetStateAction<Staff | null>>;
  pinModal: any;
  setPinModal: React.Dispatch<React.SetStateAction<any>>;
  notify: (msg: string, type?: string) => void;
  addAudit: (type: string, desc: string, staffId?: string) => void;
  sendSms: (phone: string, template: string, vars: Record<string, any>, orderId: string | null, promoId?: string | null) => Promise<SmsLogEntry>;
  checkSmsStatus: (entry: SmsLogEntry) => Promise<void>;
  refreshAllSmsStatuses: () => Promise<void>;
  requirePin: (role: string, onSuccess: () => void, message?: string) => void;
  sendReportEmail: (period: "today" | "week" | "month") => Promise<void>;
  modal: any;
  setModal: React.Dispatch<React.SetStateAction<any>>;
  calcPrice: (service: Service, kg: number, express: boolean) => number;
  genId: () => string;
  genOrderNum: (n: number) => string;
  fmt: (amount: number) => string;
  theme: ThemePreset;
  setTheme: (t: ThemePreset) => void;
}

const AppCtx = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [theme, setThemeRaw] = useState<ThemePreset>(DEFAULT_THEME);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [pinModal, setPinModal] = useState<any>(null);

  // App State
  const [shop, setShop] = useState<Shop>(SEED_SHOP);
  const [services, setServices] = useState<Service[]>(SEED_SERVICES);
  const [stages, setStages] = useState<Stage[]>(SEED_STAGES);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplates>(SEED_SMS_TEMPLATES);
  const [staff, setStaff] = useState<Staff[]>(SEED_STAFF);
  const [customers, setCustomers] = useState<Customer[]>(SEED_CUSTOMERS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [smsLog, setSmsLog] = useState<SmsLogEntry[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [orderCounter, setOrderCounter] = useState(1);
  const [inventory, setInventory] = useState<InventoryItem[]>(SEED_INVENTORY);
  const [supplyRules, setSupplyRules] = useState<SupplyRule[]>(SEED_SUPPLY_RULES);
  const [payMethods, setPayMethods] = useState<PayMethod[]>(SEED_PAYMETHODS);
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(SEED_EMAIL_CONFIG);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [lastEmailSent, setLastEmailSent] = useState<LastEmailSent>(EMPTY_LAST_SENT);
  const [licenseKey, setLicenseKeyRaw] = useState('');
  const [trialStartDate, setTrialStartDateRaw] = useState('');

  // UI State
  const [notification, setNotification] = useState<{ msg: string; type: string; id: number } | null>(null);
  const [modal, setModal] = useState<any>(null);

  const setTheme = (t: ThemePreset) => {
    setThemeRaw(t);
    applyTheme(t);
    DB.set("wt:theme", t);
  };

  // Currency formatting shorthand
  const fmt = useCallback((amount: number) => formatCurrency(amount, shop), [shop]);

  // ── Initialize / Load ──
  useEffect(() => {
    (async () => {
      await initDatabase();

      const savedOrders = await DB.get("wt:orders");
      const savedCustomers = await DB.get("wt:customers");
      const savedShop = await DB.get("wt:shop");
      const savedServices = await DB.get("wt:services");
      const savedStages = await DB.get("wt:stages");
      const savedSmsTemplates = await DB.get("wt:smstemplates");
      const savedStaff = await DB.get("wt:staff");
      const savedSms = await DB.get("wt:smslog");
      const savedAudit = await DB.get("wt:audit");
      const savedCounter = await DB.get("wt:counter");
      const savedInventory = await DB.get("wt:inventory");
      const savedPayMethods = await DB.get("wt:paymethods");
      const savedSupplyRules = await DB.get("wt:supplyrules");
      const savedEmailConfig = await DB.get("wt:emailconfig");
      const savedPromotions = await DB.get("wt:promotions");
      const savedLastEmailSent = await DB.get("wt:lastEmailSent");
      const savedLicenseKey = await DB.get("wt:licenseKey");
      const savedTrialStartDate = await DB.get("wt:trialStartDate");

      if (savedOrders) setOrders(savedOrders);
      if (savedCustomers) setCustomers(savedCustomers);
      if (savedShop) setShop({ ...SEED_SHOP, ...savedShop });
      if (savedServices) setServices(savedServices);
      if (savedStages) {
        // Migration: ensure "Out for Delivery" stage exists
        const hasDelivery = savedStages.some((s: any) => s.label === "Out for Delivery");
        if (!hasDelivery) {
          const migrated = savedStages.map((s: any) => s.id === 6 ? { ...s, id: 7, order: 6 } : s);
          migrated.splice(migrated.findIndex((s: any) => s.id === 7), 0,
            { id: 6, label: "Out for Delivery", icon: "🚚", color: "#F97316", order: 5 }
          );
          setStages(migrated);
        } else {
          setStages(savedStages);
        }
      }
      if (savedSmsTemplates) {
        // Migration: ensure delivery template exists
        setSmsTemplates({ ...SEED_SMS_TEMPLATES, ...savedSmsTemplates });
      }
      if (savedStaff) setStaff(savedStaff);
      if (savedSms) setSmsLog(savedSms);
      if (savedAudit) setAuditLog(savedAudit);
      if (savedCounter) setOrderCounter(savedCounter);
      if (savedInventory) setInventory(savedInventory);
      if (savedPayMethods) setPayMethods(savedPayMethods);
      if (savedSupplyRules) setSupplyRules(savedSupplyRules);
      if (savedEmailConfig) setEmailConfig({ ...SEED_EMAIL_CONFIG, ...savedEmailConfig });
      if (savedPromotions) setPromotions(savedPromotions);
      if (savedLastEmailSent) setLastEmailSent(savedLastEmailSent);
      if (savedLicenseKey) setLicenseKeyRaw(savedLicenseKey);
      if (savedTrialStartDate) setTrialStartDateRaw(savedTrialStartDate);
      const savedTheme = await DB.get("wt:theme");
      if (savedTheme) { setThemeRaw(savedTheme); applyTheme(savedTheme); }
      else { applyTheme(DEFAULT_THEME); }

      // ── Migrate plaintext PINs to hashed ──
      const shopToMigrate = savedShop ? { ...SEED_SHOP, ...savedShop } : SEED_SHOP;
      let shopMigrated = false;
      const migratedShop = { ...shopToMigrate };
      if (isLegacyPin(migratedShop.ownerPin)) {
        migratedShop.ownerPin = await createHashedPin(migratedShop.ownerPin);
        shopMigrated = true;
      }
      if (isLegacyPin(migratedShop.managerPin)) {
        migratedShop.managerPin = await createHashedPin(migratedShop.managerPin);
        shopMigrated = true;
      }
      if (shopMigrated) {
        setShop(migratedShop);
        await DB.set("wt:shop", migratedShop);
      }

      const staffToMigrate: Staff[] = savedStaff || SEED_STAFF;
      let staffMigrated = false;
      const migratedStaff = await Promise.all(staffToMigrate.map(async (s) => {
        if (isLegacyPin(s.pin)) {
          staffMigrated = true;
          return { ...s, pin: await createHashedPin(s.pin) };
        }
        return s;
      }));
      if (staffMigrated) {
        setStaff(migratedStaff);
        await DB.set("wt:staff", migratedStaff);
      }

      setInitialized(true);
    })();
  }, []);

  // ── Persist ──
  useEffect(() => { if (initialized) DB.set("wt:orders", orders); }, [orders, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:customers", customers); }, [customers, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:shop", shop); }, [shop, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:services", services); }, [services, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:stages", stages); }, [stages, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:smstemplates", smsTemplates); }, [smsTemplates, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:staff", staff); }, [staff, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:smslog", smsLog); }, [smsLog, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:audit", auditLog); }, [auditLog, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:counter", orderCounter); }, [orderCounter, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:inventory", inventory); }, [inventory, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:paymethods", payMethods); }, [payMethods, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:supplyrules", supplyRules); }, [supplyRules, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:emailconfig", emailConfig); }, [emailConfig, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:promotions", promotions); }, [promotions, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:lastEmailSent", lastEmailSent); }, [lastEmailSent, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:licenseKey", licenseKey); }, [licenseKey, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:trialStartDate", trialStartDate); }, [trialStartDate, initialized]);

  // ── Helpers ──
  const notify = useCallback((msg: string, type = "success") => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const addAudit = useCallback((type: string, desc: string, staffId?: string) => {
    const entry: AuditLogEntry = { id: genId(), type, desc, staffId: staffId || currentStaff?.id || "", at: Date.now() };
    setAuditLog((prev) => [entry, ...prev].slice(0, 500));
  }, [currentStaff]);

  const sendSms = useCallback(async (phone: string, template: string, vars: Record<string, any>, orderId: string | null, promoId?: string | null): Promise<SmsLogEntry> => {
    let msg = template;
    const allVars = { facebook: shop.facebook || shop.name, ...vars };
    Object.entries(allVars).forEach(([k, v]) => { msg = msg.replaceAll(`{${k}}`, String(v)); });
    const isMock = shop.smsMockMode || !shop.smsApiKey;
    const entry: SmsLogEntry = { id: genId(), phone, message: msg, orderId, promoId: promoId || null, status: isMock ? "MOCK" : "SENDING", messageId: null, network: null, at: Date.now() };
    setSmsLog((prev) => [entry, ...prev]);

    if (!isMock) {
      if (!(window as any).__TAURI_INTERNALS__) {
        const mockEntry = { ...entry, status: "MOCK" };
        setSmsLog((prev) => prev.map((e) => e.id === entry.id ? mockEntry : e));
        return mockEntry;
      }
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const result = await invoke("send_sms", {
          payload: {
            api_key: shop.smsApiKey,
            number: phone.trim(),
            message: msg,
            sender_name: shop.smsSenderName || null,
          },
        });
        const parsed = JSON.parse(result as string);
        const resp = parsed?.[0];
        const updatedEntry = { ...entry, status: resp?.status || "SENT", messageId: resp?.message_id || null, network: resp?.network || null };
        setSmsLog((prev) => prev.map((e) => e.id === entry.id ? updatedEntry : e));
        // Background check after 15s to get final delivery status
        if (updatedEntry.messageId) {
          setTimeout(async () => {
            try {
              const result2 = await invoke("get_sms_message_by_id", {
                payload: { api_key: shop.smsApiKey, message_id: updatedEntry.messageId },
              });
              const p = JSON.parse(result2 as string);
              const finalStatus = p?.status || updatedEntry.status;
              setSmsLog((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: finalStatus } : e));
              if (finalStatus === "Sent" || finalStatus === "sent") {
                notify(`SMS delivered to ${phone}`);
              } else if (finalStatus === "Failed" || finalStatus === "failed") {
                notify(`SMS to ${phone} failed`, "error");
              }
            } catch { /* silent — status stays as initial response */ }
          }, 15000);
        }
        return updatedEntry;
      } catch (err: any) {
        const failedEntry = { ...entry, status: "FAILED" };
        setSmsLog((prev) => prev.map((e) => e.id === entry.id ? failedEntry : e));
        notify(`SMS to ${phone} failed to send`, "error");
        return failedEntry;
      }
    }
    return entry;
  }, [shop.smsMockMode, shop.smsApiKey, shop.smsSenderName]);

  const checkSmsStatus = useCallback(async (entry: SmsLogEntry): Promise<void> => {
    if (!entry.messageId || !shop.smsApiKey || !(window as any).__TAURI_INTERNALS__) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke("get_sms_message_by_id", {
        payload: { api_key: shop.smsApiKey, message_id: entry.messageId },
      });
      const parsed = JSON.parse(result as string);
      const newStatus = parsed?.status || entry.status;
      setSmsLog((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: newStatus } : e));
    } catch { /* silently fail — status stays as-is */ }
  }, [shop.smsApiKey]);

  const refreshAllSmsStatuses = useCallback(async (): Promise<void> => {
    if (!shop.smsApiKey || !(window as any).__TAURI_INTERNALS__) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const today = new Date().toISOString().split("T")[0];
      const result = await invoke("get_sms_messages", {
        payload: { api_key: shop.smsApiKey, limit: 100, page: 1, start_date: today, end_date: today, network: null, status: null },
      });
      const messages: any[] = JSON.parse(result as string);
      if (!messages?.length) return;
      const statusMap = new Map<number, string>();
      messages.forEach((m: any) => { if (m.message_id && m.status) statusMap.set(m.message_id, m.status); });
      setSmsLog((prev) => prev.map((e) => {
        if (e.messageId && statusMap.has(e.messageId)) {
          return { ...e, status: statusMap.get(e.messageId)! };
        }
        return e;
      }));
    } catch { /* silent fail */ }
  }, [shop.smsApiKey]);

  const requirePin = (role: string, onSuccess: () => void, message?: string) => {
    setPinModal({ role, onSuccess, message });
  };

  // ── Email Scheduler (5-min interval) ──
  const schedulerRef = useRef({
    shop, emailConfig, orders, customers, staff, services, payMethods,
    stages, inventory, smsLog, auditLog, lastSent: lastEmailSent,
  });
  useEffect(() => {
    schedulerRef.current = {
      shop, emailConfig, orders, customers, staff, services, payMethods,
      stages, inventory, smsLog, auditLog, lastSent: lastEmailSent,
    };
  }, [shop, emailConfig, orders, customers, staff, services, payMethods, stages, inventory, smsLog, auditLog, lastEmailSent]);

  useEffect(() => {
    if (!initialized) return;
    const runCheck = async () => {
      const state = schedulerRef.current;
      if (!state.emailConfig.enabled || !state.emailConfig.testVerified) return;
      try {
        const result = await checkAndSendReports(state);
        if (result.sent.length > 0) {
          setLastEmailSent(result.updatedLastSent);
          result.sent.forEach(s => addAudit("EMAIL_REPORT", `Auto-sent: ${s}`));
          notify(`Report emailed: ${result.sent.join(", ")}`);
        }
        result.errors.forEach(e => {
          addAudit("EMAIL_FAIL", e);
        });
      } catch { /* silent - don't crash the app */ }
    };
    runCheck();
    const interval = setInterval(runCheck, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [initialized]);

  const sendReportEmail = useCallback(async (period: "today" | "week" | "month") => {
    if (!emailConfig.enabled || !emailConfig.testVerified) {
      notify("Email not configured or not verified. Check Settings > Email.", "error");
      return;
    }
    try {
      await sendReport(period, {
        shop, emailConfig, orders, customers, staff, services, payMethods, stages, inventory, smsLog, auditLog,
      });
      notify("Report emailed successfully!");
      addAudit("EMAIL_REPORT", `Manual send: ${period === "today" ? "Daily" : period === "week" ? "Weekly" : "Monthly"} report`);
    } catch (err: any) {
      notify(`Email failed: ${err?.message || err}`, "error");
      addAudit("EMAIL_FAIL", `Manual send failed: ${err?.message || err}`);
    }
  }, [shop, emailConfig, orders, customers, staff, services, payMethods, stages, inventory, smsLog, auditLog, notify, addAudit]);

  const setLicenseKey = useCallback((key: string) => {
    setLicenseKeyRaw(key);
    DB.set("wt:licenseKey", key);
  }, []);

  const setTrialStartDate = useCallback((date: string) => {
    setTrialStartDateRaw(date);
    DB.set("wt:trialStartDate", date);
  }, []);

  const ctx: AppContextValue = {
    shop, setShop, services, setServices, stages, setStages,
    smsTemplates, setSmsTemplates, staff, setStaff,
    customers, setCustomers, orders, setOrders,
    smsLog, setSmsLog, auditLog, setAuditLog, orderCounter, setOrderCounter,
    inventory, setInventory, payMethods, setPayMethods, supplyRules, setSupplyRules,
    emailConfig, setEmailConfig, promotions, setPromotions,
    licenseKey, setLicenseKey, trialStartDate, setTrialStartDate,
    currentStaff, setCurrentStaff, pinModal, setPinModal,
    notify, addAudit, sendSms, checkSmsStatus, refreshAllSmsStatuses, requirePin, sendReportEmail,
    modal, setModal, calcPrice, genId, genOrderNum, fmt, theme, setTheme,
  };

  if (!initialized) return (
    <div style={{ background: "var(--bg)", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div className="spin" style={{ width: 48, height: 48, border: "4px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--subtext)", fontFamily: "monospace" }}>Loading WashTrack POS...</p>
      </div>
    </div>
  );

  return (
    <AppCtx.Provider value={ctx}>
      {notification && (
        <div className={`notif notif-${notification.type}`} key={notification.id}>
          {notification.type === "success" ? "\u2713" : notification.type === "error" ? "\u2715" : "\u2139"} {notification.msg}
        </div>
      )}
      {children}
    </AppCtx.Provider>
  );
}
