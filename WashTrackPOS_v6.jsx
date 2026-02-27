
import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";

// ─── STORAGE LAYER ──────────────────────────────────────────────────────────
const DB = {
  get: async (key) => {
    try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  },
  set: async (key, val) => {
    try { await window.storage.set(key, JSON.stringify(val)); return true; }
    catch { return false; }
  },
  list: async (prefix) => {
    try { const r = await window.storage.list(prefix); return r ? r.keys : []; }
    catch { return []; }
  },
  del: async (key) => {
    try { await window.storage.delete(key); return true; }
    catch { return false; }
  }
};

// ─── DEFAULT SEED DATA ───────────────────────────────────────────────────────
const SEED_SHOP = {
  name: "Malinis Laundry Shop",
  address: "123 Rizal St, Brgy. San Isidro, Quezon City",
  phone: "0917-555-1234",
  logo: null,
  ownerPin: "1234",
  managerPin: "5678",
  currency: "₱",
  autoSmsReady: true,
  autoSmsReceipt: true,
  reportEmail: "",
  autoEmailEndOfShift: false,
  autoEmailDaily: false,
  autoEmailWeekly: false,
  autoEmailMonthly: false,
  shiftEndTime: "22:00",
};

const SEED_PAYMETHODS = [
  { id: "pm1", label: "Cash",        icon: "💵", isCash: true,  color: "#10B981", active: true, sortOrder: 0 },
  { id: "pm2", label: "GCash",       icon: "📱", isCash: false, color: "#3B82F6", active: true, sortOrder: 1 },
  { id: "pm3", label: "Maya",        icon: "💜", isCash: false, color: "#8B5CF6", active: true, sortOrder: 2 },
  { id: "pm4", label: "Credit Card", icon: "💳", isCash: false, color: "#F59E0B", active: true, sortOrder: 3 },
];

const SEED_SERVICES = [
  { id: "s1", name: "Wash & Dry",   pricingType: "PER_KG",    basePrice: 65,  minKg: 4, expressMultiplier: 1.5, active: true, color: "#3B82F6", sortOrder: 0 },
  { id: "s2", name: "Wash Only",    pricingType: "PER_KG",    basePrice: 40,  minKg: 4, expressMultiplier: 1.5, active: true, color: "#10B981", sortOrder: 1 },
  { id: "s3", name: "Dry Only",     pricingType: "PER_KG",    basePrice: 30,  minKg: 4, expressMultiplier: 1.5, active: true, color: "#8B5CF6", sortOrder: 2 },
  { id: "s4", name: "Premium Wash", pricingType: "PER_KG",    basePrice: 95,  minKg: 3, expressMultiplier: 2.0, active: true, color: "#F59E0B", sortOrder: 3 },
  { id: "s5", name: "Folding",      pricingType: "FLAT",       basePrice: 50,  minKg: 0, expressMultiplier: 1.0, active: true, color: "#EC4899", sortOrder: 4 },
  { id: "s6", name: "7kg Load",     pricingType: "FIXED_LOAD", basePrice: 120, minKg: 7, expressMultiplier: 1.5, active: true, color: "#06B6D4", sortOrder: 5 },
  { id: "s7", name: "8kg Load",     pricingType: "FIXED_LOAD", basePrice: 135, minKg: 8, expressMultiplier: 1.5, active: true, color: "#F97316", sortOrder: 6 },
];

const SEED_STAGES = [
  { id: 1, label: "Received",   icon: "📥", color: "#6B7280", order: 0 },
  { id: 2, label: "Washing",    icon: "🫧", color: "#3B82F6", order: 1 },
  { id: 3, label: "Drying",     icon: "💨", color: "#F59E0B", order: 2 },
  { id: 4, label: "Folding",    icon: "👕", color: "#8B5CF6", order: 3 },
  { id: 5, label: "Ready",      icon: "✅", color: "#10B981", order: 4 },
  { id: 6, label: "Picked Up",  icon: "🎉", color: "#6B7280", order: 5 },
];

const SEED_SMS_TEMPLATES = {
  receipt:  "Hi {name}! Order #{order} received at {shop}. {kg}kg, Total: ₱{total}. We'll text you when ready!",
  ready:    "Hi {name}! Your laundry at {shop} is READY for pickup. Order #{order}. Thank you!",
  reminder: "{name}, reminder: Order #{order} at {shop} is ready. Please pick up soon!",
  promo:    "Hi {name}! {shop} special: {message}. Visit us at {address}!",
};

const SEED_STAFF = [
  { id: "u1", name: "Owner",  role: "OWNER",   pin: "1234", active: true, avatar: "O" },
  { id: "u2", name: "Maria",  role: "MANAGER", pin: "5678", active: true, avatar: "M" },
  { id: "u3", name: "Juan",   role: "STAFF",   pin: "0000", active: true, avatar: "J" },
];

const SEED_CUSTOMERS = [
  { id: "c1", name: "Ana Reyes",    phone: "09171234001", visits: 12, totalSpend: 3840, lastVisit: Date.now() - 86400000 * 2,  promoOptIn: true },
  { id: "c2", name: "Ben Santos",   phone: "09281234002", visits: 5,  totalSpend: 1500, lastVisit: Date.now() - 86400000 * 7,  promoOptIn: true },
  { id: "c3", name: "Cita Dela Cruz",phone:"09181234003", visits: 23, totalSpend: 7820, lastVisit: Date.now() - 86400000 * 1,  promoOptIn: false },
  { id: "c4", name: "Dino Garcia",  phone: "09271234004", visits: 3,  totalSpend: 870,  lastVisit: Date.now() - 86400000 * 14, promoOptIn: true },
];

// ─── INVENTORY SEED DATA ─────────────────────────────────────────────────────
const SEED_INVENTORY = [
  { id: "inv1", name: "Detergent (Ariel 2kg)",    category: "Consumable", unit: "bag",    qty: 24, minQty: 5,  costPerUnit: 95,  icon: "🧴", lastRestocked: Date.now() - 86400000 * 3 },
  { id: "inv2", name: "Fabric Softener (Downy 1L)",category: "Consumable", unit: "bottle", qty: 12, minQty: 4,  costPerUnit: 85,  icon: "🫧", lastRestocked: Date.now() - 86400000 * 5 },
  { id: "inv3", name: "Bleach (Pride 1L)",          category: "Consumable", unit: "bottle", qty: 8,  minQty: 4,  costPerUnit: 35,  icon: "🧪", lastRestocked: Date.now() - 86400000 * 7 },
  { id: "inv4", name: "Plastic Bags (Large)",       category: "Packaging",  unit: "pc",     qty: 150,minQty: 30, costPerUnit: 2,   icon: "🛍", lastRestocked: Date.now() - 86400000 * 2 },
  { id: "inv5", name: "Laundry Pins",               category: "Equipment",  unit: "pack",   qty: 3,  minQty: 5,  costPerUnit: 45,  icon: "📌", lastRestocked: Date.now() - 86400000 * 20 },
  { id: "inv6", name: "Hangers (Metal)",            category: "Equipment",  unit: "pc",     qty: 80, minQty: 20, costPerUnit: 8,   icon: "🪝", lastRestocked: Date.now() - 86400000 * 14 },
  { id: "inv7", name: "Receipt Paper (58mm)",       category: "Consumable", unit: "roll",   qty: 6,  minQty: 3,  costPerUnit: 25,  icon: "🧾", lastRestocked: Date.now() - 86400000 * 10 },
  { id: "inv8", name: "Stain Remover Spray",        category: "Consumable", unit: "bottle", qty: 4,  minQty: 3,  costPerUnit: 120, icon: "💧", lastRestocked: Date.now() - 86400000 * 8 },
];


// ─── SUPPLY DEDUCTION RULES ──────────────────────────────────────────────────
// Each rule defines how much of an inventory item gets used per order.
// perKg   = deducted per KG of laundry (for PER_KG services like Wash & Dry)
// perLoad = deducted per fixed-load order (for 7kg/8kg loads)
// perOrder= deducted once per order regardless of kg (e.g. plastic bags)
// appliesTo: array of service IDs, or ["all"] for every order
const SEED_SUPPLY_RULES = [
  { id: "sr1", name: "Detergent per kg",     invId: "inv1", perKg: 0.05,  perLoad: 0.35, perOrder: 0,   appliesTo: ["s1","s2","s4","s6","s7"] },
  { id: "sr2", name: "Fabric Softener per kg",invId: "inv2", perKg: 0.03,  perLoad: 0.25, perOrder: 0,   appliesTo: ["s1","s4","s6","s7"] },
  { id: "sr3", name: "Plastic Bag per order", invId: "inv4", perKg: 0,     perLoad: 0,    perOrder: 1,   appliesTo: ["all"] },
];

// ─── THEME SYSTEM ────────────────────────────────────────────────────────────
const THEME_PRESETS = [
  { id:"dark-ocean",  name:"Dark Ocean",   bg:"#0F172A", sidebar:"#0B1120", card:"#131B2E", border:"#1E293B", accent:"#38BDF8", accent2:"#6366F1", text:"#F1F5F9", subtext:"#94A3B8", muted:"#64748B", mode:"dark"  },
  { id:"midnight",    name:"Midnight",     bg:"#0D0D0D", sidebar:"#111111", card:"#1A1A1A", border:"#2A2A2A", accent:"#A78BFA", accent2:"#EC4899", text:"#F8F8F8", subtext:"#A0A0A0", muted:"#666666", mode:"dark"  },
  { id:"forest",      name:"Forest",       bg:"#0A1A10", sidebar:"#071410", card:"#0F2018", border:"#1A3525", accent:"#4ADE80", accent2:"#34D399", text:"#F0FDF4", subtext:"#86EFAC", muted:"#4ADE8080", mode:"dark"  },
  { id:"sunset",      name:"Sunset",       bg:"#1A0A00", sidebar:"#140800", card:"#241006", border:"#3D1A0A", accent:"#FB923C", accent2:"#F43F5E", text:"#FFF7ED", subtext:"#FCD34D", muted:"#FB923C80", mode:"dark"  },
  { id:"royal",       name:"Royal Blue",   bg:"#0A0F1E", sidebar:"#060B18", card:"#0F1830", border:"#1A2A4A", accent:"#60A5FA", accent2:"#818CF8", text:"#EFF6FF", subtext:"#93C5FD", muted:"#60A5FA70", mode:"dark"  },
  { id:"rose-gold",   name:"Rose Gold",    bg:"#1A0F0F", sidebar:"#140A0A", card:"#231515", border:"#3A2020", accent:"#FB7185", accent2:"#F9A8D4", text:"#FFF1F2", subtext:"#FDA4AF", muted:"#FB718570", mode:"dark"  },
  { id:"light-clean", name:"Light Clean",  bg:"#F8FAFC", sidebar:"#F1F5F9", card:"#FFFFFF", border:"#E2E8F0", accent:"#0284C7", accent2:"#6366F1", text:"#0F172A", subtext:"#475569", muted:"#94A3B8", mode:"light" },
  { id:"light-warm",  name:"Light Warm",   bg:"#FFFBF5", sidebar:"#FEF3E2", card:"#FFFFFF", border:"#FDE8C8", accent:"#D97706", accent2:"#DC2626", text:"#1C1410", subtext:"#78350F", muted:"#A16207", mode:"light" },
  { id:"light-sage",  name:"Light Sage",   bg:"#F0FDF4", sidebar:"#DCFCE7", card:"#FFFFFF", border:"#BBF7D0", accent:"#059669", accent2:"#0D9488", text:"#052E16", subtext:"#166534", muted:"#4ADE80", mode:"light" },
  { id:"custom",      name:"Custom",       bg:"#0F172A", sidebar:"#0B1120", card:"#131B2E", border:"#1E293B", accent:"#38BDF8", accent2:"#6366F1", text:"#F1F5F9", subtext:"#94A3B8", muted:"#64748B", mode:"dark"  },
];

const DEFAULT_THEME = THEME_PRESETS[0];

function applyTheme(theme) {
  const r = document.documentElement.style;
  r.setProperty("--bg",      theme.bg);
  r.setProperty("--sidebar", theme.sidebar);
  r.setProperty("--card",    theme.card);
  r.setProperty("--border",  theme.border);
  r.setProperty("--accent",  theme.accent);
  r.setProperty("--accent2", theme.accent2);
  r.setProperty("--text",    theme.text);
  r.setProperty("--subtext", theme.subtext);
  r.setProperty("--muted",   theme.muted);
  r.setProperty("--mode",    theme.mode);
}

function genId() { return Math.random().toString(36).slice(2, 10); }
function genOrderNum(n) { const d = new Date(); return `ORD-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(n).padStart(3,'0')}`; }

// Overstay thresholds (hours)
const OVERSTAY_WARN  = 24;  // Yellow — clothes sitting 24h+ in any active stage
const OVERSTAY_ALERT = 48;  // Orange — 48h+
const OVERSTAY_CRIT  = 72;  // Red    — 72h+ (3 days)

function getOverstay(order) {
  if (order.voided || order.statusId === 6) return null;
  const hrs = (Date.now() - order.createdAt) / 3600000;
  if (hrs >= OVERSTAY_CRIT)  return { hrs: Math.floor(hrs), level: "critical", color: "#EF4444", label: "3+ days in facility!" };
  if (hrs >= OVERSTAY_ALERT) return { hrs: Math.floor(hrs), level: "alert",    color: "#F97316", label: "2+ days in facility" };
  if (hrs >= OVERSTAY_WARN)  return { hrs: Math.floor(hrs), level: "warn",     color: "#F59E0B", label: "1+ day in facility" };
  return null;
}

function calcPrice(service, kg, express) {
  if (service.pricingType === "FLAT")       return service.basePrice;
  if (service.pricingType === "FIXED_LOAD") return express ? Math.round(service.basePrice * service.expressMultiplier) : service.basePrice;
  const effectiveKg = Math.max(kg, service.minKg);
  const mul = express ? service.expressMultiplier : 1.0;
  return Math.round(effectiveKg * service.basePrice * mul);
}

// ─── APP CONTEXT ─────────────────────────────────────────────────────────────
const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function WashTrackPOS() {
  const [initialized, setInitialized] = useState(false);
  const [screen, setScreen] = useState("login");
  const [currentStaff, setCurrentStaff] = useState(null);
  const [pinBuffer, setPinBuffer] = useState("");
  const [pinError, setPinError] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [theme, setThemeRaw] = useState(DEFAULT_THEME);

  const setTheme = (t) => {
    setThemeRaw(t);
    applyTheme(t);
    DB.set("wt:theme", t);
  };

  // App State
  const [shop, setShop]           = useState(SEED_SHOP);
  const [services, setServices]   = useState(SEED_SERVICES);
  const [stages, setStages]       = useState(SEED_STAGES);
  const [smsTemplates, setSmsTemplates] = useState(SEED_SMS_TEMPLATES);
  const [staff, setStaff]         = useState(SEED_STAFF);
  const [customers, setCustomers] = useState(SEED_CUSTOMERS);
  const [orders, setOrders]       = useState([]);
  const [smsLog, setSmsLog]       = useState([]);
  const [auditLog, setAuditLog]   = useState([]);
  const [orderCounter, setOrderCounter] = useState(1);
  const [inventory, setInventory] = useState(SEED_INVENTORY);
  const [supplyRules, setSupplyRules] = useState(SEED_SUPPLY_RULES);
  const [payMethods, setPayMethods] = useState(SEED_PAYMETHODS);

  // UI State
  const [notification, setNotification] = useState(null);
  const [modal, setModal]         = useState(null);
  const [pinModal, setPinModal]   = useState(null);

  // ── Initialize / Load ──
  useEffect(() => {
    (async () => {
      const savedOrders    = await DB.get("wt:orders");
      const savedCustomers = await DB.get("wt:customers");
      const savedShop      = await DB.get("wt:shop");
      const savedServices  = await DB.get("wt:services");
      const savedSms       = await DB.get("wt:smslog");
      const savedAudit     = await DB.get("wt:audit");
      const savedCounter   = await DB.get("wt:counter");
      const savedInventory   = await DB.get("wt:inventory");
      const savedPayMethods  = await DB.get("wt:paymethods");
      const savedSupplyRules = await DB.get("wt:supplyrules");

      if (savedOrders)     setOrders(savedOrders);
      if (savedCustomers) setCustomers(savedCustomers);
      if (savedShop)      setShop(savedShop);
      if (savedServices)  setServices(savedServices);
      if (savedSms)       setSmsLog(savedSms);
      if (savedAudit)     setAuditLog(savedAudit);
      if (savedCounter)   setOrderCounter(savedCounter);
      if (savedInventory)   setInventory(savedInventory);
      if (savedPayMethods)  setPayMethods(savedPayMethods);
      if (savedSupplyRules) setSupplyRules(savedSupplyRules);
      const savedTheme = await DB.get("wt:theme");
      if (savedTheme) { setThemeRaw(savedTheme); applyTheme(savedTheme); }
      else { applyTheme(DEFAULT_THEME); }

      setInitialized(true);
    })();
  }, []);

  // ── Persist ──
  useEffect(() => { if (initialized) DB.set("wt:orders", orders); }, [orders, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:customers", customers); }, [customers, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:shop", shop); }, [shop, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:services", services); }, [services, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:smslog", smsLog); }, [smsLog, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:audit", auditLog); }, [auditLog, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:counter", orderCounter); }, [orderCounter, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:inventory", inventory); }, [inventory, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:paymethods", payMethods); }, [payMethods, initialized]);
  useEffect(() => { if (initialized) DB.set("wt:supplyrules", supplyRules); }, [supplyRules, initialized]);

  // ── Auto email scheduler (checks every 60s) ──
  useEffect(() => {
    if (!initialized) return;
    let lastEndOfShiftDate = "";
    let lastDailyDate = "";
    let lastWeeklyDate = "";
    let lastMonthlyDate = "";
    const tick = () => {
      if (!shop || !shop.reportEmail) return;
      const now = new Date();
      const dateKey = now.toDateString();
      const weekKey = now.getFullYear() + "-" + Math.ceil(now.getDate()/7);
      const monthKey = now.getFullYear() + "-" + now.getMonth();
      const [sh, sm] = (shop.shiftEndTime || "22:00").split(":").map(Number);
      if (shop.autoEmailEndOfShift && now.getHours()===sh && now.getMinutes()===sm && lastEndOfShiftDate!==dateKey) {
        lastEndOfShiftDate = dateKey;
        const a = document.createElement("a");
        const subj = encodeURIComponent(shop.name + " — End-of-Shift Report " + now.toLocaleDateString("en-PH"));
        a.href = "mailto:" + shop.reportEmail + "?subject=" + subj;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      if (shop.autoEmailDaily && now.getHours()===0 && now.getMinutes()===0 && lastDailyDate!==dateKey) {
        lastDailyDate = dateKey;
        const a = document.createElement("a");
        const subj = encodeURIComponent(shop.name + " — Daily Report " + now.toLocaleDateString("en-PH"));
        a.href = "mailto:" + shop.reportEmail + "?subject=" + subj;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      if (shop.autoEmailWeekly && now.getDay()===0 && now.getHours()===23 && now.getMinutes()===59 && lastWeeklyDate!==weekKey) {
        lastWeeklyDate = weekKey;
        const a = document.createElement("a");
        const subj = encodeURIComponent(shop.name + " — Weekly Report " + now.toLocaleDateString("en-PH"));
        a.href = "mailto:" + shop.reportEmail + "?subject=" + subj;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      if (shop.autoEmailMonthly && now.getDate()===1 && now.getHours()===0 && now.getMinutes()===0 && lastMonthlyDate!==monthKey) {
        lastMonthlyDate = monthKey;
        const a = document.createElement("a");
        const subj = encodeURIComponent(shop.name + " — Monthly Report " + now.toLocaleDateString("en-PH"));
        a.href = "mailto:" + shop.reportEmail + "?subject=" + subj;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    };
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, [initialized, shop]);

  // ── Helpers ──
  const notify = useCallback((msg, type = "success") => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const addAudit = useCallback((type, desc, staffId) => {
    const entry = { id: genId(), type, desc, staffId: staffId || currentStaff?.id, at: Date.now() };
    setAuditLog(prev => [entry, ...prev].slice(0, 500));
  }, [currentStaff]);

  const sendSms = useCallback((phone, template, vars, orderId) => {
    let msg = template;
    Object.entries(vars).forEach(([k, v]) => { msg = msg.replaceAll(`{${k}}`, v); });
    const entry = { id: genId(), phone, message: msg, orderId, status: "SENT", at: Date.now() };
    setSmsLog(prev => [entry, ...prev]);
    return entry;
  }, []);

  const requirePin = (role, onSuccess, message) => {
    setPinModal({ role, onSuccess, message });
  };

  // ── Login ──
  const handlePinDigit = (d) => {
    const next = pinBuffer + d;
    setPinBuffer(next);
    if (next.length === 4) {
      const found = staff.find(s => s.active && s.id === selectedStaff?.id && s.pin === next);
      if (found) {
        setCurrentStaff(found);
        setScreen("home");
        setPinBuffer("");
        setPinError("");
        addAudit("LOGIN", `${found.name} logged in`, found.id);
      } else {
        setPinError("Incorrect PIN");
        setTimeout(() => { setPinBuffer(""); setPinError(""); }, 800);
      }
    }
  };

  const handlePinBackspace = () => setPinBuffer(p => p.slice(0, -1));
  const handleLogout = () => { setCurrentStaff(null); setScreen("login"); setSelectedStaff(null); setPinBuffer(""); };

  const ctx = {
    shop, setShop, services, setServices, stages, setStages,
    smsTemplates, setSmsTemplates, staff, setStaff,
    customers, setCustomers, orders, setOrders,
    smsLog, auditLog, orderCounter, setOrderCounter,
    inventory, setInventory, payMethods, setPayMethods, supplyRules, setSupplyRules,
    currentStaff, notify, addAudit, sendSms, requirePin,
    modal, setModal, calcPrice, genId, genOrderNum, theme, setTheme,
  };

  if (!initialized) return (
    <div style={{ background: "var(--bg)", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div className="spin" style={{ width: 48, height: 48, border: "4px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", margin: "0 auto 16px" }} />
        <p style={{ color: "#94A3B8", fontFamily: "monospace" }}>Loading WashTrack POS…</p>
      </div>
    </div>
  );

  return (
    <AppCtx.Provider value={ctx}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: "var(--bg)", minHeight: "100vh", color: "var(--text)", position: "relative" }}>
        <style>{GLOBAL_CSS}</style>

        {notification && (
          <div className={`notif notif-${notification.type}`} key={notification.id}>
            {notification.type === "success" ? "✓" : notification.type === "error" ? "✕" : "ℹ"} {notification.msg}
          </div>
        )}

        {pinModal && (
          <PinModalOverlay
            pinModal={pinModal}
            setPinModal={setPinModal}
            staff={staff}
            shop={shop}
            notify={notify}
          />
        )}

        {screen === "login" && (
          <LoginScreen
            staff={staff}
            selectedStaff={selectedStaff}
            setSelectedStaff={setSelectedStaff}
            pinBuffer={pinBuffer}
            pinError={pinError}
            handlePinDigit={handlePinDigit}
            handlePinBackspace={handlePinBackspace}
            shop={shop}
          />
        )}

        {screen !== "login" && currentStaff && (
          <MainLayout
            screen={screen}
            setScreen={setScreen}
            handleLogout={handleLogout}
          />
        )}
      </div>
    </AppCtx.Provider>
  );
}

// ─── PIN MODAL OVERLAY ───────────────────────────────────────────────────────
function PinModalOverlay({ pinModal, setPinModal, staff, shop, notify }) {
  const [buf, setBuf] = useState("");
  const [err, setErr] = useState("");

  const handleDigit = (d) => {
    const next = buf + d;
    setBuf(next);
    if (next.length >= 4) {
      let valid = false;
      if (pinModal.role === "OWNER") valid = next === shop.ownerPin;
      else if (pinModal.role === "MANAGER") valid = next === shop.managerPin || next === shop.ownerPin;
      else valid = staff.some(s => s.active && s.pin === next);

      if (valid) {
        setPinModal(null);
        setBuf("");
        setErr("");
        pinModal.onSuccess();
      } else {
        setErr("Incorrect PIN");
        setTimeout(() => { setBuf(""); setErr(""); }, 800);
      }
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setPinModal(null)}>
      <div style={{ background:"var(--card)", borderRadius:16, padding:32, width:300, textAlign:"center", border:"1px solid var(--border)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:24, marginBottom:8 }}>🔐</div>
        <h3 style={{ margin:"0 0 4px", color:"var(--text)" }}>PIN Required</h3>
        <p style={{ margin:"0 0 20px", color:"#94A3B8", fontSize:13 }}>{pinModal.message || `Enter ${pinModal.role} PIN`}</p>
        <PinDots count={buf.length} />
        {err && <p style={{ color:"#F87171", fontSize:13, marginTop:8 }}>{err}</p>}
        <PinPad onDigit={handleDigit} onBack={() => setBuf(b=>b.slice(0,-1))} />
        <button onClick={()=>setPinModal(null)} style={{ marginTop:12, background:"transparent", border:"none", color:"#94A3B8", cursor:"pointer", fontSize:13 }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
function LoginScreen({ staff, selectedStaff, setSelectedStaff, pinBuffer, pinError, handlePinDigit, handlePinBackspace, shop }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg, var(--bg) 0%, var(--sidebar) 50%, var(--bg) 100%)" }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ fontSize:48, marginBottom:8 }}>🫧</div>
        <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:"var(--text)", letterSpacing:-1 }}>{shop.name}</h1>
        <p style={{ margin:"4px 0 0", color:"#64748B", fontSize:14 }}>Laundry POS System</p>
      </div>

      {!selectedStaff ? (
        <div>
          <p style={{ textAlign:"center", color:"#94A3B8", fontSize:14, marginBottom:16 }}>Select your account</p>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", maxWidth:400 }}>
            {staff.filter(s=>s.active).map(s => (
              <button key={s.id} onClick={() => setSelectedStaff(s)} className="staff-tile">
                <div style={{ width:52, height:52, borderRadius:"50%", background:`linear-gradient(135deg, #38BDF8, #6366F1)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, margin:"0 auto 8px" }}>{s.avatar}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{s.name}</div>
                <div style={{ fontSize:11, color:"#64748B", textTransform:"uppercase" }}>{s.role}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign:"center" }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#38BDF8,#6366F1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:700, margin:"0 auto 12px" }}>{selectedStaff.avatar}</div>
          <h3 style={{ margin:"0 0 4px", color:"#F1F5F9" }}>{selectedStaff.name}</h3>
          <p style={{ margin:"0 0 20px", color:"#64748B", fontSize:13 }}>Enter your 4-digit PIN</p>
          <PinDots count={pinBuffer.length} />
          {pinError && <p style={{ color:"#F87171", fontSize:13, marginTop:8 }}>{pinError}</p>}
          <PinPad onDigit={handlePinDigit} onBack={handlePinBackspace} />
          <button onClick={() => setSelectedStaff(null)} style={{ marginTop:12, background:"transparent", border:"none", color:"#94A3B8", cursor:"pointer", fontSize:13 }}>← Back</button>
        </div>
      )}
    </div>
  );
}

function PinDots({ count }) {
  return (
    <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:20 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ width:16, height:16, borderRadius:"50%", background: i < count ? "var(--accent)" : "var(--border)", transition:"background 0.15s", boxShadow: i < count ? "0 0 8px var(--accent)" : "none" }} />
      ))}
    </div>
  );
}

function PinPad({ onDigit, onBack }) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, maxWidth:240, margin:"0 auto" }}>
      {keys.map((k, i) => k === "" ? <div key={i} /> : (
        <button key={i} onClick={() => k === "⌫" ? onBack() : onDigit(k)} className="pin-btn">
          {k}
        </button>
      ))}
    </div>
  );
}

// ─── MAIN LAYOUT ─────────────────────────────────────────────────────────────
function MainLayout({ screen, setScreen, handleLogout }) {
  const { currentStaff, orders, inventory } = useApp();
  const activeOrders = orders.filter(o => !o.voided && o.statusId < 6).length;
  const readyOrders  = orders.filter(o => !o.voided && o.statusId === 5).length;
  const lowStockCount = inventory.filter(i => i.qty <= i.minQty).length;
  const overstayCount = orders.filter(o => getOverstay(o)?.level === "critical").length;

  const navItems = [
    { id: "home",      icon: "⊞",  label: "Dashboard" },
    { id: "pos",       icon: "＋",  label: "New Order" },
    { id: "orders",    icon: "📋", label: "Orders",    badge: activeOrders || null },
    { id: "inventory", icon: "📦", label: "Inventory", badge: lowStockCount > 0 ? lowStockCount : null, badgeColor: "#F97316" },
    { id: "customers", icon: "👥", label: "Customers" },
    { id: "reports",   icon: "📊", label: "Reports" },
    ...(currentStaff?.role === "OWNER" || currentStaff?.role === "MANAGER" ? [{ id: "settings", icon: "⚙", label: "Settings" }] : []),
  ];

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
      {/* Sidebar */}
      <nav style={{ width:200, background:"var(--sidebar)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"20px 16px 12px" }}>
          <div style={{ fontSize:20, marginBottom:2 }}>🫧</div>
          <div style={{ fontSize:13, fontWeight:800, color:"#F1F5F9", letterSpacing:-0.5 }}>WashTrack</div>
          <div style={{ fontSize:10, color:"#475569" }}>POS v1.0</div>
        </div>
        <div style={{ flex:1, padding:"8px 8px" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setScreen(item.id)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, border:"none", background: screen === item.id ? "color-mix(in srgb, var(--accent) 15%, var(--sidebar))" : "transparent", color: screen === item.id ? "var(--accent)" : "var(--subtext)", cursor:"pointer", fontSize:13, fontWeight: screen===item.id ? 700:500, textAlign:"left", marginBottom:2, transition:"all 0.15s", position:"relative" }}>
              <span style={{ fontSize:16 }}>{item.icon}</span>
              {item.label}
              {item.badge && <span style={{ marginLeft:"auto", background: item.badgeColor || "#EF4444", color:"#fff", borderRadius:10, fontSize:10, fontWeight:700, padding:"1px 6px", minWidth:18, textAlign:"center" }}>{item.badge}</span>}
            </button>
          ))}
        </div>
        {readyOrders > 0 && (
          <div style={{ margin:"0 8px 8px", background:"#052e16", border:"1px solid #16a34a", borderRadius:8, padding:"8px 10px" }}>
            <div style={{ fontSize:11, color:"#86efac", fontWeight:700 }}>✅ {readyOrders} READY</div>
            <div style={{ fontSize:10, color:"#4ade80" }}>Waiting for pickup</div>
          </div>
        )}
        <div style={{ padding:"12px 8px", borderTop:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:8, marginBottom:4 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#38BDF8,#6366F1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700 }}>{currentStaff?.avatar}</div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:"#F1F5F9" }}>{currentStaff?.name}</div>
              <div style={{ fontSize:10, color:"#64748B" }}>{currentStaff?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width:"100%", padding:"7px 12px", borderRadius:8, border:"1px solid #334155", background:"transparent", color:"#94A3B8", cursor:"pointer", fontSize:12 }}>Sign Out</button>
        </div>
      </nav>

      {/* Content */}
      <main style={{ flex:1, overflow:"auto", background:"var(--bg)" }}>
        {screen === "home"      && <HomeScreen setScreen={setScreen} />}
        {screen === "pos"       && <POSScreen setScreen={setScreen} />}
        {screen === "orders"    && <OrdersScreen />}
        {screen === "inventory" && <InventoryScreen />}
        {screen === "customers" && <CustomersScreen />}
        {screen === "reports"   && <ReportsScreen />}
        {screen === "settings"  && <SettingsScreen />}
      </main>
    </div>
  );
}

// ─── HOME / DASHBOARD ────────────────────────────────────────────────────────
function HomeScreen({ setScreen }) {
  const { orders, customers, shop, inventory } = useApp();
  const today = new Date(); today.setHours(0,0,0,0);
  const todayOrders = orders.filter(o => !o.voided && o.createdAt >= today.getTime());
  const todayRevenue = todayOrders.reduce((s,o) => s+o.total, 0);
  const activeOrders = orders.filter(o => !o.voided && o.statusId < 6);
  const readyOrders  = orders.filter(o => !o.voided && o.statusId === 5);
  const overdueOrders = orders.filter(o => {
    if (o.voided || o.statusId !== 5) return false;
    return (Date.now() - o.statusUpdatedAt) > 48 * 3600000;
  });

  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0,0,0,0);
  const weekOrders = orders.filter(o => !o.voided && o.createdAt >= weekStart.getTime());
  const weekRevenue = weekOrders.reduce((s,o) => s+o.total, 0);

  // Inventory alerts
  const criticalStock = inventory.filter(i => i.qty === 0);
  const lowStock      = inventory.filter(i => i.qty > 0 && i.qty <= i.minQty);

  // Overstay alerts
  const overstayOrders = orders
    .map(o => ({ ...o, overstay: getOverstay(o) }))
    .filter(o => o.overstay)
    .sort((a, b) => b.overstay.hrs - a.overstay.hrs)
    .slice(0, 5);

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"var(--text)" }}>{shop.name}</h2>
        <p style={{ margin:"4px 0 0", color:"#64748B", fontSize:13 }}>{new Date().toLocaleDateString("en-PH", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
      </div>

      {/* Critical alerts banner */}
      {(criticalStock.length > 0 || overstayOrders.filter(o=>o.overstay.level==="critical").length > 0) && (
        <div style={{ marginBottom:16, padding:"10px 16px", borderRadius:10, background:"#450a0a", border:"1px solid #EF4444", display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:18 }}>🚨</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#FCA5A5" }}>Action Required</div>
            <div style={{ fontSize:12, color:"#F87171" }}>
              {criticalStock.length > 0 && `${criticalStock.length} item(s) out of stock. `}
              {overstayOrders.filter(o=>o.overstay.level==="critical").length > 0 && `${overstayOrders.filter(o=>o.overstay.level==="critical").length} order(s) in facility 3+ days.`}
            </div>
          </div>
          <button onClick={() => setScreen("inventory")} style={{ padding:"5px 12px", borderRadius:6, border:"1px solid #EF4444", background:"transparent", color:"#FCA5A5", cursor:"pointer", fontSize:12, fontWeight:700 }}>View Inventory</button>
        </div>
      )}

      {/* KPI Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Today's Revenue", value:`₱${todayRevenue.toLocaleString()}`, sub:`${todayOrders.length} orders`, color:"#38BDF8", icon:"💰" },
          { label:"Week Revenue",    value:`₱${weekRevenue.toLocaleString()}`,  sub:`${weekOrders.length} orders`,  color:"#818CF8", icon:"📈" },
          { label:"Active Orders",   value:activeOrders.length,                  sub:"in progress",                  color:"#F59E0B", icon:"🔄" },
          { label:"Ready for Pickup",value:readyOrders.length,                   sub: overdueOrders.length > 0 ? `${overdueOrders.length} overdue` : "awaiting customer", color:"#10B981", icon:"✅" },
        ].map((k,i) => (
          <div key={i} className="card" style={{ borderLeft:`3px solid ${k.color}`, background:"var(--card)", borderTop:"1px solid var(--border)", borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, color:"#64748B", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{k.label}</div>
                <div style={{ fontSize:26, fontWeight:800, color:k.color }}>{k.value}</div>
                <div style={{ fontSize:12, color:"#64748B", marginTop:4 }}>{k.sub}</div>
              </div>
              <div style={{ fontSize:24 }}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <button onClick={() => setScreen("pos")} className="action-btn primary">
          <span style={{ fontSize:28 }}>＋</span>
          <span style={{ fontWeight:700, fontSize:15 }}>New Order</span>
        </button>
        <button onClick={() => setScreen("orders")} className="action-btn secondary">
          <span style={{ fontSize:28 }}>📋</span>
          <span style={{ fontWeight:700, fontSize:15 }}>Manage Orders</span>
          {activeOrders.length > 0 && <span style={{ background:"#EF4444", color:"#fff", borderRadius:12, fontSize:12, padding:"2px 8px" }}>{activeOrders.length}</span>}
        </button>
        <button onClick={() => setScreen("inventory")} className="action-btn secondary" style={{ position:"relative" }}>
          <span style={{ fontSize:28 }}>📦</span>
          <span style={{ fontWeight:700, fontSize:15 }}>Inventory</span>
          {lowStock.length + criticalStock.length > 0 && (
            <span style={{ background:"#F97316", color:"#fff", borderRadius:12, fontSize:12, padding:"2px 8px" }}>
              {lowStock.length + criticalStock.length} low
            </span>
          )}
        </button>
        <button onClick={() => setScreen("customers")} className="action-btn secondary">
          <span style={{ fontSize:28 }}>👥</span>
          <span style={{ fontWeight:700, fontSize:15 }}>Customers</span>
          <span style={{ fontSize:12, color:"#64748B" }}>{customers.length} registered</span>
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Ready for Pickup */}
        {readyOrders.length > 0 && (
          <div className="card">
            <h3 style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:"#10B981" }}>✅ Ready for Pickup</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {readyOrders.slice(0,5).map(o => {
                const hoursWaiting = Math.floor((Date.now() - o.statusUpdatedAt) / 3600000);
                const aging = hoursWaiting >= 48 ? "red" : hoursWaiting >= 24 ? "orange" : "green";
                const agingColors = { green:"#10B981", orange:"#F59E0B", red:"#EF4444" };
                return (
                  <div key={o.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 12px", background:"var(--bg)", borderRadius:8, borderLeft:`3px solid ${agingColors[aging]}` }}>
                    <div style={{ flex:1 }}>
                      <span style={{ fontWeight:600, fontSize:13, color:"#F1F5F9" }}>{o.orderNum}</span>
                      <span style={{ color:"#64748B", fontSize:12, marginLeft:8 }}>{o.customerName}</span>
                    </div>
                    <span style={{ fontSize:12, color:agingColors[aging] }}>{hoursWaiting}h waiting</span>
                    <span style={{ fontWeight:700, color:"#38BDF8", fontSize:13 }}>₱{o.total.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Overstay Alerts */}
        {overstayOrders.length > 0 && (
          <div className="card" style={{ borderColor:"#F9731630" }}>
            <h3 style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:"#F97316" }}>⏰ Clothes Overstaying</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {overstayOrders.map(o => (
                <div key={o.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"var(--bg)", borderRadius:8, borderLeft:`3px solid ${o.overstay.color}` }}>
                  <div style={{ flex:1 }}>
                    <span style={{ fontWeight:600, fontSize:13, color:"var(--text)" }}>{o.orderNum}</span>
                    <span style={{ color:"#64748B", fontSize:12, marginLeft:8 }}>{o.customerName}</span>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:o.overstay.color }}>{o.overstay.hrs}h</div>
                    <div style={{ fontSize:10, color:"#64748B" }}>{o.overstay.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Panel */}
        {(lowStock.length > 0 || criticalStock.length > 0) && (
          <div className="card" style={{ borderColor:"#F9731630" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:"#F97316" }}>📦 Stock Alerts</h3>
              <button onClick={() => setScreen("inventory")} style={{ background:"transparent", border:"none", color:"#F97316", cursor:"pointer", fontSize:12, fontWeight:700 }}>View all →</button>
            </div>
            {criticalStock.map(i => (
              <div key={i.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:"#450a0a", borderRadius:6, marginBottom:6, border:"1px solid #EF444440" }}>
                <span>{i.icon}</span>
                <span style={{ flex:1, fontSize:13, color:"#FCA5A5", fontWeight:600 }}>{i.name}</span>
                <span style={{ fontSize:12, fontWeight:800, color:"#EF4444" }}>OUT OF STOCK</span>
              </div>
            ))}
            {lowStock.map(i => (
              <div key={i.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:"#431407", borderRadius:6, marginBottom:6, border:"1px solid #F9731630" }}>
                <span>{i.icon}</span>
                <span style={{ flex:1, fontSize:13, color:"#FDBA74" }}>{i.name}</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#F97316" }}>{i.qty} {i.unit} left</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── POS SCREEN ──────────────────────────────────────────────────────────────
// ─── RECEIPT HELPER ─────────────────────────────────────────────────────────
function buildReceiptHTML(order, shop) {
  const itemRows = order.items.map(i => {
    let desc = "";
    if (i.pricingType === "PER_KG")    desc = ` (${i.kg}kg × ₱${i.unitPrice})`;
    if (i.pricingType === "FIXED_LOAD") desc = ` (${i.minKg || i.kg}kg fixed load)`;
    const express = i.express ? " ⚡" : "";
    return `<tr>
      <td style="padding:4px 0;border-bottom:1px dashed #ddd">${i.serviceName}${express}${desc}</td>
      <td style="padding:4px 0;border-bottom:1px dashed #ddd;text-align:right;font-weight:600">₱${i.subtotal.toLocaleString()}</td>
    </tr>`;
  }).join("");

  const payInfo = order.isCashPayment && order.cashTendered
    ? `<tr><td style="padding:2px 0;color:#555">Cash Tendered</td><td style="text-align:right">₱${(order.cashTendered||0).toLocaleString()}</td></tr>
       <tr><td style="padding:2px 0;color:#555">Change</td><td style="text-align:right">₱${(order.change||0).toLocaleString()}</td></tr>`
    : `<tr><td colspan="2" style="padding:2px 0;color:#555">Paid via ${order.paymentMethod || "Cash"}</td></tr>`;

  return `<!DOCTYPE html><html><head><title>Receipt ${order.orderNum}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: monospace; font-size:13px; color:#111; padding:20px; max-width:320px; margin:0 auto; }
    .shop-name { font-size:17px; font-weight:800; margin-bottom:2px; }
    .divider { border:none; border-top:2px dashed #aaa; margin:10px 0; }
    table { width:100%; border-collapse:collapse; }
    .total-row td { font-size:16px; font-weight:800; padding-top:8px; }
    .footer { text-align:center; font-size:11px; color:#777; margin-top:14px; line-height:1.6; }
    .print-btn { display:block; width:100%; margin-top:16px; padding:12px; background:#2563EB; color:#fff; border:none; border-radius:8px; cursor:pointer; font-family:monospace; font-size:14px; font-weight:700; }
    @media print { .print-btn { display:none; } }
  </style></head><body>
  <div style="text-align:center;margin-bottom:10px">
    <div class="shop-name">🫧 ${shop.name}</div>
    <div style="font-size:11px;color:#555">${shop.address}</div>
    <div style="font-size:11px;color:#555">📞 ${shop.phone}</div>
  </div>
  <hr class="divider"/>
  <table style="margin-bottom:8px">
    <tr><td style="color:#555">Order #</td><td style="text-align:right;font-weight:700">${order.orderNum}</td></tr>
    <tr><td style="color:#555">Customer</td><td style="text-align:right">${order.customerName}</td></tr>
    <tr><td style="color:#555">Phone</td><td style="text-align:right">${order.customerPhone}</td></tr>
    <tr><td style="color:#555">Date</td><td style="text-align:right">${new Date(order.createdAt).toLocaleString("en-PH")}</td></tr>
    ${order.express ? `<tr><td colspan="2" style="color:#d97706;font-weight:700">⚡ Express Order</td></tr>` : ""}
  </table>
  <hr class="divider"/>
  <table>${itemRows}</table>
  <hr class="divider"/>
  <table>
    ${order.discount > 0 ? `<tr><td style="color:#16a34a">Discount</td><td style="text-align:right;color:#16a34a">-₱${order.discount.toLocaleString()}</td></tr>` : ""}
    <tr class="total-row"><td>TOTAL</td><td style="text-align:right">₱${order.total.toLocaleString()}</td></tr>
    ${payInfo}
  </table>
  <hr class="divider"/>
  <div class="footer">
    Thank you for choosing ${shop.name}!<br/>
    Please keep this receipt for reference.
  </div>
  <button class="print-btn" onclick="window.print()">🖨️ Print Receipt</button>
  </body></html>`;
}

function openReceiptWindow(order, shop) {
  const win = window.open("", "_blank", "width=420,height=700,toolbar=0,menubar=0");
  if (!win) { alert("Please allow popups to print receipts."); return; }
  win.document.write(buildReceiptHTML(order, shop));
  win.document.close();
}

function POSScreen({ setScreen }) {
  const { shop, services, customers, orders, setOrders, setCustomers, orderCounter, setOrderCounter,
          currentStaff, notify, addAudit, sendSms, smsTemplates, calcPrice, genId, genOrderNum, payMethods,
          inventory, setInventory, supplyRules } = useApp();

  const [step, setStep]                     = useState("customer");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomerMode, setNewCustomerMode]   = useState(false);
  const [newName, setNewName]   = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [express, setExpress]     = useState(false);
  const [discount, setDiscount]   = useState(0);
  const [notes, setNotes]         = useState("");
  const [cashTendered, setCashTendered] = useState("");
  const [selectedPayMethod, setSelectedPayMethod] = useState(null);

  const activePM = (payMethods || SEED_PAYMETHODS).filter(p => p.active).sort((a,b) => a.sortOrder - b.sortOrder);

  // Default to Cash on mount
  useEffect(() => {
    const cash = activePM.find(p => p.isCash);
    if (cash) setSelectedPayMethod(cash);
  // eslint-disable-next-line
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  ).slice(0, 6);

  const subtotal = cartItems.reduce((s, i) => s + i.subtotal, 0);
  const total    = Math.max(0, subtotal - discount);
  const isCash   = selectedPayMethod?.isCash ?? true;
  const change   = isCash ? Math.max(0, (parseFloat(cashTendered) || 0) - total) : 0;

  const addToCart = (service) => {
    const existing = cartItems.find(i => i.serviceId === service.id && i.express === express);
    if (existing) {
      if (service.pricingType === "PER_KG") {
        setCartItems(prev => prev.map(i =>
          i.id === existing.id ? { ...i, kg: i.kg + 1, subtotal: calcPrice(service, i.kg + 1, express) } : i
        ));
      }
      // FLAT / FIXED_LOAD: don't allow duplicates – just notify
      else { notify("Already added — one per order", "info"); }
      return;
    }
    const kg = (service.pricingType === "PER_KG") ? Math.max(service.minKg, 4) :
               (service.pricingType === "FIXED_LOAD") ? service.minKg : 0;
    setCartItems(prev => [...prev, {
      id: genId(), serviceId: service.id, serviceName: service.name,
      pricingType: service.pricingType, minKg: service.minKg, kg, express,
      unitPrice: service.basePrice, subtotal: calcPrice(service, kg, express),
      color: service.color,
    }]);
  };

  const updateCartKg = (itemId, kg) => {
    const svc = services.find(s => s.id === cartItems.find(i => i.id === itemId)?.serviceId);
    if (!svc || svc.pricingType !== "PER_KG") return;
    const newKg = Math.max(svc.minKg || 1, kg);
    setCartItems(prev => prev.map(i => i.id === itemId ? { ...i, kg: newKg, subtotal: calcPrice(svc, newKg, i.express) } : i));
  };

  const removeCartItem = (id) => setCartItems(prev => prev.filter(i => i.id !== id));

  const completeOrder = () => {
    if (!selectedCustomer && (!newName || !newPhone)) { notify("Customer info required", "error"); return; }
    if (cartItems.length === 0) { notify("Add at least one service", "error"); return; }
    if (!selectedPayMethod) { notify("Please select a payment method", "error"); return; }

    let customer = selectedCustomer;
    if (!customer) {
      customer = { id: genId(), name: newName, phone: newPhone, visits: 0, totalSpend: 0, lastVisit: Date.now(), promoOptIn: true };
      setCustomers(prev => [...prev, customer]);
    } else {
      setCustomers(prev => prev.map(c => c.id === customer.id
        ? { ...c, visits: c.visits + 1, totalSpend: c.totalSpend + total, lastVisit: Date.now() } : c));
    }

    const orderNum = genOrderNum(orderCounter);
    setOrderCounter(n => n + 1);
    const order = {
      id: genId(), orderNum,
      customerId: customer.id, customerName: customer.name, customerPhone: customer.phone,
      items: cartItems, subtotal, discount, total, notes, express,
      paymentMethod:   selectedPayMethod.label,
      paymentMethodId: selectedPayMethod.id,
      isCashPayment:   isCash,
      cashTendered:    isCash ? (parseFloat(cashTendered) || 0) : null,
      change:          isCash ? change : null,
      statusId: 1, statusLabel: "Received",
      createdAt: Date.now(), statusUpdatedAt: Date.now(),
      createdBy: currentStaff?.id, createdByName: currentStaff?.name,
      voided: false,
    };
    setOrders(prev => [order, ...prev]);

    // ── Auto-deduct supplies based on rules ──
    if (supplyRules && supplyRules.length > 0) {
      const deductions = {}; // invId -> total deduction amount
      cartItems.forEach(item => {
        supplyRules.forEach(rule => {
          // Check if rule applies to this service
          const applies = rule.appliesTo.includes("all") || rule.appliesTo.includes(item.serviceId);
          if (!applies) return;
          if (!deductions[rule.invId]) deductions[rule.invId] = 0;
          if (item.pricingType === "PER_KG" && rule.perKg > 0) {
            deductions[rule.invId] += rule.perKg * item.kg;
          }
          if ((item.pricingType === "FIXED_LOAD" || item.pricingType === "FLAT") && rule.perLoad > 0) {
            deductions[rule.invId] += rule.perLoad;
          }
          if (rule.perOrder > 0) {
            deductions[rule.invId] += rule.perOrder;
          }
        });
      });
      if (Object.keys(deductions).length > 0) {
        setInventory(prev => prev.map(invItem => {
          const ded = deductions[invItem.id];
          if (!ded) return invItem;
          const newQty = Math.max(0, parseFloat((invItem.qty - ded).toFixed(3)));
          return { ...invItem, qty: newQty };
        }));
        const dedList = Object.entries(deductions).map(([invId, amt]) => {
          const invItem = inventory.find(i => i.id === invId);
          return invItem ? `${invItem.name}: -${parseFloat(amt.toFixed(3))} ${invItem.unit}` : null;
        }).filter(Boolean).join(", ");
        if (dedList) addAudit("SUPPLY_DEDUCTED", `Auto-deducted for ${order.orderNum}: ${dedList}`);
      }
    }

    if (shop.autoSmsReceipt) {
      const totalKg = cartItems.filter(i => i.pricingType === "PER_KG").reduce((s, i) => s + i.kg, 0);
      sendSms(customer.phone, smsTemplates.receipt, { name: customer.name, order: orderNum, shop: shop.name, kg: totalKg, total }, order.id);
    }

    addAudit("ORDER_CREATED", `${orderNum} for ${customer.name} — ₱${total} via ${selectedPayMethod.label}`);
    notify(`Order ${orderNum} created! ₱${total.toLocaleString()} via ${selectedPayMethod.label}`);
    openReceiptWindow(order, shop);
    setScreen("orders");
  };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* ── Left panel ── */}
      <div style={{ flex:1, overflow:"auto", padding:20, borderRight:"1px solid var(--border)" }}>

        {/* Step tabs */}
        <div style={{ display:"flex", gap:0, marginBottom:20 }}>
          {["customer","items","payment"].map((s,i) => (
            <div key={s}
              style={{ flex:1, padding:"8px 0", textAlign:"center", cursor:"pointer",
                borderBottom:`2px solid ${step===s||["items","payment"].indexOf(step)>["items","payment"].indexOf(s)?"#38BDF8":"#334155"}`,
                color: step===s?"#38BDF8":"#64748B", fontSize:12, fontWeight:700 }}
              onClick={() => { if (i===0||(i===1&&selectedCustomer)||(i===2&&cartItems.length>0)) setStep(s); }}>
              {i+1}. {s.charAt(0).toUpperCase()+s.slice(1)}
            </div>
          ))}
        </div>

        {/* ── Step 1: Customer ── */}
        {step === "customer" && (
          <div>
            <h3 style={{ margin:"0 0 12px", color:"#F1F5F9", fontSize:15 }}>Find or Add Customer</h3>
            <input value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)}
              placeholder="Search by name or phone…" className="input" style={{ marginBottom:12 }} />
            {filteredCustomers.map(c => (
              <div key={c.id} onClick={() => { setSelectedCustomer(c); setNewCustomerMode(false); setStep("items"); }}
                style={{ padding:"10px 14px", borderRadius:8, marginBottom:6, cursor:"pointer",
                  border:`1px solid ${selectedCustomer?.id===c.id?"var(--accent)":"var(--border)"}`,
                  background: selectedCustomer?.id===c.id?"color-mix(in srgb, var(--accent) 10%, var(--card))":"var(--card)" }}>
                <div style={{ fontWeight:600, fontSize:13, color:"#F1F5F9" }}>{c.name}</div>
                <div style={{ fontSize:12, color:"#64748B" }}>{c.phone} · {c.visits} visits · ₱{c.totalSpend.toLocaleString()}</div>
              </div>
            ))}
            <button onClick={() => { setNewCustomerMode(true); setSelectedCustomer(null); setStep("items"); }}
              style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px dashed #334155",
                background:"transparent", color:"#38BDF8", cursor:"pointer", fontSize:13, marginTop:4 }}>
              + New Customer
            </button>
            {newCustomerMode && (
              <div style={{ marginTop:12, padding:16, background:"var(--card)", borderRadius:8, border:"1px solid var(--border)" }}>
                <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Full Name *" className="input" style={{ marginBottom:8 }} />
                <input value={newPhone} onChange={e=>setNewPhone(e.target.value)} placeholder="Phone (09XXXXXXXXX) *" className="input" />
              </div>
            )}
            {(selectedCustomer||(newName&&newPhone)) && (
              <button onClick={() => setStep("items")} className="btn-primary" style={{ width:"100%", marginTop:16 }}>Continue →</button>
            )}
          </div>
        )}

        {/* ── Step 2: Items ── */}
        {step === "items" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <h3 style={{ margin:0, color:"#F1F5F9", fontSize:15 }}>Select Services</h3>
              <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:13, color:express?"#F59E0B":"#94A3B8" }}>
                <div style={{ width:36, height:20, borderRadius:10, background:express?"#F59E0B":"#334155", position:"relative", cursor:"pointer" }} onClick={()=>setExpress(e=>!e)}>
                  <div style={{ position:"absolute", top:2, left:express?18:2, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
                </div>
                ⚡ Express
              </label>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
              {services.filter(s=>s.active).sort((a,b)=>a.sortOrder-b.sortOrder).map(svc => {
                const isKg   = svc.pricingType === "PER_KG";
                const isLoad = svc.pricingType === "FIXED_LOAD";
                const priceLabel = isKg
                  ? `₱${svc.basePrice}/kg${express?` → ₱${Math.round(svc.basePrice*svc.expressMultiplier)}/kg ⚡`:""}`
                  : isLoad
                    ? `₱${svc.basePrice} fixed${express?` → ₱${Math.round(svc.basePrice*svc.expressMultiplier)} ⚡`:""}`
                    : `₱${svc.basePrice} flat`;
                const subLabel = isKg ? `min ${svc.minKg}kg` : isLoad ? `${svc.minKg}kg load` : null;
                return (
                  <button key={svc.id} onClick={() => addToCart(svc)}
                    style={{ padding:"14px 12px", borderRadius:10, border:`1px solid ${svc.color}30`,
                      background:`${svc.color}15`, cursor:"pointer", textAlign:"left" }}
                    onMouseEnter={e=>e.currentTarget.style.background=`${svc.color}28`}
                    onMouseLeave={e=>e.currentTarget.style.background=`${svc.color}15`}>
                    <div style={{ fontWeight:700, fontSize:14, color:"#F1F5F9", marginBottom:3 }}>{svc.name}</div>
                    <div style={{ fontSize:12, color:svc.color }}>{priceLabel}</div>
                    {subLabel && <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>{subLabel}</div>}
                  </button>
                );
              })}
            </div>
            {cartItems.length > 0 && (
              <button onClick={() => setStep("payment")} className="btn-primary" style={{ width:"100%" }}>Continue to Payment →</button>
            )}
          </div>
        )}

        {/* ── Step 3: Payment ── */}
        {step === "payment" && (
          <div>
            <h3 style={{ margin:"0 0 16px", color:"#F1F5F9", fontSize:15 }}>💳 Payment</h3>

            {/* Payment method selector */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:"#94A3B8", display:"block", marginBottom:8, fontWeight:600 }}>
                Select Payment Method
              </label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {activePM.map(pm => (
                  <button key={pm.id} onClick={() => { setSelectedPayMethod(pm); setCashTendered(""); }}
                    style={{ padding:"10px 16px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:700,
                      border:`2px solid ${selectedPayMethod?.id===pm.id ? pm.color : "#334155"}`,
                      background: selectedPayMethod?.id===pm.id ? pm.color+"25" : "transparent",
                      color: selectedPayMethod?.id===pm.id ? pm.color : "#64748B",
                      transition:"all 0.15s" }}>
                    {pm.icon} {pm.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, color:"#94A3B8" }}>Discount (₱)</label>
              <input type="number" value={discount} onChange={e=>setDiscount(parseInt(e.target.value)||0)} className="input" placeholder="0" />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:"#94A3B8" }}>Notes</label>
              <input value={notes} onChange={e=>setNotes(e.target.value)} className="input" placeholder="Special instructions…" />
            </div>

            {/* Order total card */}
            <div style={{ padding:16, background:"var(--card)", borderRadius:10, border:"1px solid var(--border)", marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13 }}>
                <span style={{ color:"#94A3B8" }}>Subtotal</span><span>₱{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13, color:"#10B981" }}>
                  <span>Discount</span><span>-₱{discount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:20, color:"#38BDF8", borderTop:"1px solid #334155", paddingTop:8, marginTop:4 }}>
                <span>TOTAL</span><span>₱{total.toLocaleString()}</span>
              </div>
              {selectedPayMethod && (
                <div style={{ marginTop:8, fontSize:12, color:"#64748B", textAlign:"right" }}>
                  via {selectedPayMethod.icon} {selectedPayMethod.label}
                </div>
              )}
            </div>

            {/* Cash fields — only shown when Cash is selected */}
            {isCash && (
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, color:"#94A3B8" }}>Cash Tendered (₱)</label>
                <input type="number" value={cashTendered} onChange={e=>setCashTendered(e.target.value)}
                  className="input" placeholder="0" style={{ fontSize:20, fontWeight:700 }} />
                {parseFloat(cashTendered) > 0 && (
                  <div style={{ marginTop:6, fontSize:16, fontWeight:700, color:"#10B981" }}>
                    Change: ₱{change.toLocaleString()}
                  </div>
                )}
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  {[100,200,500,1000].map(amt => (
                    <button key={amt} onClick={() => setCashTendered(String(amt))}
                      style={{ flex:1, padding:"6px 0", borderRadius:6, border:"1px solid #334155",
                        background: cashTendered===String(amt)?"#1E3A5F":"transparent",
                        color: cashTendered===String(amt)?"#38BDF8":"#94A3B8", cursor:"pointer", fontSize:12 }}>
                      ₱{amt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Non-cash confirmation note */}
            {!isCash && selectedPayMethod && (
              <div style={{ padding:"12px 16px", borderRadius:8, background:"#38BDF810", border:"1px solid #38BDF830", marginBottom:16, fontSize:13 }}>
                <span style={{ color:"#94A3B8" }}>Ask customer to send </span>
                <span style={{ color:"#F1F5F9", fontWeight:700 }}>₱{total.toLocaleString()}</span>
                <span style={{ color:"#94A3B8" }}> to your {selectedPayMethod.label} account, then confirm below.</span>
              </div>
            )}

            <button onClick={completeOrder} className="btn-success"
              style={{ width:"100%", fontSize:17, padding:16, fontWeight:800 }}>
              ✓ Confirm Payment + Print Receipt 🖨️
            </button>
          </div>
        )}
      </div>

      {/* ── Right panel: Cart ── */}
      <div style={{ width:280, background:"var(--sidebar)", display:"flex", flexDirection:"column", padding:16 }}>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>
            {selectedCustomer ? selectedCustomer.name : newName || "—"}
          </div>
          <div style={{ fontSize:12, color:"#64748B" }}>
            {selectedCustomer ? selectedCustomer.phone : newPhone || "New Customer"}
          </div>
        </div>
        {express && <div style={{ background:"#451a03", border:"1px solid #F59E0B", borderRadius:6, padding:"4px 10px", fontSize:12, color:"#FCD34D", marginBottom:10 }}>⚡ Express pricing active</div>}
        <div style={{ flex:1, overflow:"auto" }}>
          {cartItems.length === 0
            ? <div style={{ textAlign:"center", padding:"40px 0", color:"#475569", fontSize:13 }}>No items yet</div>
            : cartItems.map(item => (
              <div key={item.id} style={{ padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#F1F5F9" }}>{item.serviceName}{item.express?" ⚡":""}</div>
                  <button onClick={() => removeCartItem(item.id)} style={{ background:"transparent", border:"none", color:"#475569", cursor:"pointer", fontSize:16 }}>×</button>
                </div>
                {item.pricingType === "PER_KG" ? (
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                    <button onClick={() => updateCartKg(item.id, item.kg-1)} style={{ width:24, height:24, borderRadius:4, border:"1px solid #334155", background:"transparent", color:"#94A3B8", cursor:"pointer", fontSize:14 }}>-</button>
                    <span style={{ fontSize:14, fontWeight:700, minWidth:30, textAlign:"center" }}>{item.kg}kg</span>
                    <button onClick={() => updateCartKg(item.id, item.kg+1)} style={{ width:24, height:24, borderRadius:4, border:"1px solid #334155", background:"transparent", color:"#94A3B8", cursor:"pointer", fontSize:14 }}>+</button>
                    <span style={{ marginLeft:"auto", fontWeight:700, color:"#38BDF8", fontSize:14 }}>₱{item.subtotal.toLocaleString()}</span>
                  </div>
                ) : (
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                    <span style={{ fontSize:12, color:"#64748B" }}>
                      {item.pricingType==="FIXED_LOAD" ? `${item.minKg||item.kg}kg load` : "Flat rate"}
                    </span>
                    <span style={{ fontWeight:700, color:"#38BDF8", fontSize:14 }}>₱{item.subtotal.toLocaleString()}</span>
                  </div>
                )}
              </div>
            ))
          }
        </div>
        {cartItems.length > 0 && (
          <div style={{ borderTop:"1px solid #1E293B", paddingTop:12, marginTop:4 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:18, color:"#38BDF8" }}>
              <span>Total</span><span>₱{total.toLocaleString()}</span>
            </div>
            <div style={{ fontSize:12, color:"#64748B", marginTop:4 }}>
              {cartItems.filter(i=>i.pricingType==="PER_KG").reduce((s,i)=>s+i.kg,0)}kg wash/dry
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ORDERS SCREEN ───────────────────────────────────────────────────────────
function OrdersScreen() {
  const { orders, setOrders, stages, shop, smsTemplates, sendSms, requirePin, currentStaff, notify, addAudit } = useApp();
  const [view, setView] = useState("kanban");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [voidReason, setVoidReason]       = useState("");
  const [showVoidFor, setShowVoidFor]     = useState(null);

  const activeOrders = orders.filter(o => !o.voided);
  const stageOrders = stages.slice(0,5).map(stage => ({
    ...stage,
    orders: activeOrders.filter(o => o.statusId === stage.id)
  }));

  const updateStatus = (orderId, newStatusId) => {
    const stage = stages.find(s => s.id === newStatusId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, statusId: newStatusId, statusLabel: stage.label, statusUpdatedAt: Date.now() } : o));
    const order = orders.find(o => o.id === orderId);
    addAudit("STATUS_CHANGED", `${order?.orderNum} → ${stage.label}`);

    if (newStatusId === 5 && shop.autoSmsReady && order) {
      sendSms(order.customerPhone, smsTemplates.ready, { name: order.customerName, order: order.orderNum, shop: shop.name }, orderId);
      notify(`SMS sent to ${order.customerName}`);
    }
    if (newStatusId === 6 && order) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, pickedUpAt: Date.now() } : o));
    }
    notify(`Status updated to ${stage.label}`);
  };

  const voidOrder = (order) => {
    if (!voidReason.trim()) { notify("Void reason required", "error"); return; }
    requirePin("MANAGER", () => {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, voided: true, voidReason, voidedAt: Date.now(), voidedBy: currentStaff?.name } : o));
      addAudit("ORDER_VOIDED", `${order.orderNum} voided — ${voidReason}`);
      notify(`Order ${order.orderNum} voided`);
      setShowVoidFor(null); setVoidReason(""); setSelectedOrder(null);
    }, "Enter Manager PIN to void order");
  };

  const agingColor = (order) => {
    if (order.statusId !== 5) return null;
    const hrs = (Date.now() - order.statusUpdatedAt) / 3600000;
    if (hrs >= 48) return "#EF4444";
    if (hrs >= 24) return "#F59E0B";
    return "#10B981";
  };

  if (selectedOrder) {
    const order = orders.find(o => o.id === selectedOrder);
    if (!order) { setSelectedOrder(null); return null; }
    const ac = agingColor(order);
    return (
      <div style={{ padding:24, maxWidth:600 }}>
        <button onClick={() => setSelectedOrder(null)} style={{ background:"transparent", border:"none", color:"#64748B", cursor:"pointer", fontSize:13, marginBottom:16 }}>← Back to Orders</button>
        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#F1F5F9" }}>{order.orderNum}</h2>
              <div style={{ fontSize:12, color:"#64748B" }}>{new Date(order.createdAt).toLocaleString()}</div>
            </div>
            <span style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700, background:`${stages.find(s=>s.id===order.statusId)?.color}20`, color:stages.find(s=>s.id===order.statusId)?.color }}>
              {stages.find(s=>s.id===order.statusId)?.icon} {order.statusLabel}
            </span>
          </div>
          <div style={{ marginBottom:16, padding:12, background:"var(--bg)", borderRadius:8 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{order.customerName}</div>
            <div style={{ fontSize:12, color:"#64748B" }}>{order.customerPhone}</div>
          </div>
          {order.items.map(item => (
            <div key={item.id} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #1E293B", fontSize:13 }}>
              <span style={{ color:"#F1F5F9" }}>{item.serviceName} {item.express?"⚡":""}</span>
              <span style={{ color:"#94A3B8" }}>{item.pricingType==="PER_KG"?`${item.kg}kg × ₱${item.unitPrice}`:""}</span>
              <span style={{ fontWeight:700, color:"#38BDF8" }}>₱{item.subtotal.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:4 }}>
            {order.discount > 0 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#10B981" }}><span>Discount</span><span>-₱{order.discount}</span></div>}
            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:20, color:"#38BDF8" }}><span>Total</span><span>₱{order.total.toLocaleString()}</span></div>
          </div>

          {/* Payment info */}
          <div style={{ marginTop:12, padding:"10px 14px", background:"var(--bg)", borderRadius:8, border:"1px solid var(--border)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
              <span style={{ color:"#94A3B8" }}>Payment</span>
              <span style={{ fontWeight:700, color:"#F1F5F9" }}>{order.paymentMethod || "Cash"}</span>
            </div>
            {order.isCashPayment && order.cashTendered > 0 && (
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748B", marginTop:4 }}>
                <span>Tendered: ₱{(order.cashTendered||0).toLocaleString()}</span>
                <span>Change: ₱{(order.change||0).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Reprint receipt */}
          <button onClick={() => openReceiptWindow(order, shop)}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", marginTop:12,
              padding:"9px 0", borderRadius:8, border:"1px solid #38BDF8", background:"#38BDF810",
              color:"#38BDF8", cursor:"pointer", fontSize:13, fontWeight:700 }}>
            🖨️ Reprint Receipt
          </button>

          {order.notes && <div style={{ marginTop:12, padding:10, background:"#1E293B", borderRadius:6, fontSize:13, color:"#94A3B8" }}>📝 {order.notes}</div>}
          {ac && <div style={{ marginTop:12, padding:8, background:`${ac}15`, border:`1px solid ${ac}`, borderRadius:6, fontSize:12, color:ac }}>⏱ Waiting for pickup {Math.floor((Date.now()-order.statusUpdatedAt)/3600000)}h</div>}
          {(() => {
            const ov = getOverstay(order);
            if (!ov) return null;
            return (
              <div style={{ marginTop:8, padding:"10px 14px", background:`${ov.color}15`, border:`1px solid ${ov.color}`, borderRadius:8, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:18 }}>⏰</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:ov.color }}>Clothes in facility {ov.hrs} hours</div>
                  <div style={{ fontSize:12, color:"#94A3B8" }}>{ov.label} — Contact customer if not yet picked up.</div>
                </div>
              </div>
            );
          })()}

          {!order.voided && order.statusId < 6 && (
            <div style={{ marginTop:16 }}>
              <h4 style={{ margin:"0 0 8px", fontSize:13, color:"#94A3B8" }}>Update Status</h4>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {stages.filter(s => s.id > order.statusId && s.id <= 6).map(s => (
                  <button key={s.id} onClick={() => updateStatus(order.id, s.id)} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${s.color}`, background:`${s.color}15`, color:s.color, cursor:"pointer", fontSize:12, fontWeight:700 }}>{s.icon} {s.label}</button>
                ))}
              </div>
            </div>
          )}

          {!order.voided && (
            <div style={{ marginTop:16 }}>
              {showVoidFor === order.id ? (
                <div>
                  <input value={voidReason} onChange={e=>setVoidReason(e.target.value)} placeholder="Void reason (required)…" className="input" style={{ marginBottom:8 }} />
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => voidOrder(order)} style={{ flex:1, padding:"8px", borderRadius:8, border:"1px solid #EF4444", background:"#EF444415", color:"#EF4444", cursor:"pointer", fontSize:13, fontWeight:700 }}>Confirm Void</button>
                    <button onClick={() => setShowVoidFor(null)} style={{ flex:1, padding:"8px", borderRadius:8, border:"1px solid #334155", background:"transparent", color:"#94A3B8", cursor:"pointer", fontSize:13 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowVoidFor(order.id)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #EF4444", background:"transparent", color:"#EF4444", cursor:"pointer", fontSize:12 }}>Void Order</button>
              )}
            </div>
          )}
          {order.voided && <div style={{ marginTop:12, padding:10, background:"#451010", borderRadius:6, fontSize:12, color:"#FCA5A5" }}>🚫 VOIDED — {order.voidReason}</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:24, height:"100%", overflow:"auto" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"var(--text)" }}>Orders</h2>
        <div style={{ display:"flex", gap:8 }}>
          {["kanban","list"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding:"6px 14px", borderRadius:6, border:"1px solid #334155", background: view===v?"#1E3A5F":"transparent", color: view===v?"#38BDF8":"#64748B", cursor:"pointer", fontSize:13 }}>{v==="kanban"?"⊞ Board":"≡ List"}</button>
          ))}
        </div>
      </div>

      {view === "kanban" ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, height:"calc(100% - 60px)", overflow:"auto" }}>
          {stageOrders.map(stage => (
            <div key={stage.id} style={{ background:"var(--sidebar)", borderRadius:10, padding:10, minHeight:200 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                <span style={{ fontSize:16 }}>{stage.icon}</span>
                <span style={{ fontSize:12, fontWeight:700, color:stage.color }}>{stage.label}</span>
                <span style={{ marginLeft:"auto", background:`${stage.color}20`, color:stage.color, borderRadius:10, fontSize:11, padding:"1px 7px", fontWeight:700 }}>{stage.orders.length}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {stage.orders.map(order => {
                  const ac = agingColor(order);
                  const hrs = Math.floor((Date.now() - order.createdAt) / 3600000);
                  return (
                    <div key={order.id} onClick={() => setSelectedOrder(order.id)}
                      style={{ padding:"10px", background:"#131B2E", borderRadius:8, cursor:"pointer", borderLeft:`3px solid ${ac||stage.color}`, transition:"all 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--border)"}
                      onMouseLeave={e=>e.currentTarget.style.background="var(--card)"}>
                      <div style={{ fontWeight:700, fontSize:12, color:"var(--text)", marginBottom:3 }}>{order.orderNum}</div>
                      <div style={{ fontSize:11, color:"#94A3B8", marginBottom:4 }}>{order.customerName}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:12, fontWeight:700, color:"#38BDF8" }}>₱{order.total.toLocaleString()}</span>
                        <span style={{ fontSize:10, color: ac||"#64748B" }}>{hrs}h ago</span>
                      </div>
                      {order.express && <span style={{ fontSize:10, color:"#F59E0B" }}>⚡ Express</span>}
                      {(() => { const ov = getOverstay(order); return ov ? (
                        <div style={{ marginTop:4, padding:"2px 6px", borderRadius:4, background:`${ov.color}20`, border:`1px solid ${ov.color}40`, fontSize:10, color:ov.color, fontWeight:700 }}>
                          ⏰ {ov.hrs}h — {ov.level === "critical" ? "OVERDUE!" : ov.level === "alert" ? "Long stay" : "Check soon"}
                        </div>
                      ) : null; })()}
                    </div>
                  );
                })}
                {stage.orders.length === 0 && <div style={{ textAlign:"center", padding:"20px 0", fontSize:12, color:"#334155" }}>Empty</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {orders.slice(0,50).map(order => (
            <div key={order.id} onClick={() => setSelectedOrder(order.id)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:8, marginBottom:6, background:"var(--card)", cursor:"pointer", border:`1px solid ${order.voided?"#EF44441A":"#1E293B"}`, opacity: order.voided ? 0.6 : 1 }}
              onMouseEnter={e=>e.currentTarget.style.background="var(--border)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--card)"}>
              <div style={{ flex:1 }}>
                <span style={{ fontWeight:700, fontSize:13, color:"#F1F5F9" }}>{order.orderNum}</span>
                {order.voided && <span style={{ marginLeft:8, fontSize:11, color:"#EF4444", fontWeight:700 }}>VOIDED</span>}
              </div>
              <div style={{ fontSize:12, color:"#94A3B8", minWidth:120 }}>{order.customerName}</div>
              <span style={{ padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:`${stages.find(s=>s.id===order.statusId)?.color}20`, color:stages.find(s=>s.id===order.statusId)?.color }}>{order.statusLabel}</span>
              <div style={{ fontSize:13, fontWeight:700, color:"#38BDF8", minWidth:80, textAlign:"right" }}>₱{order.total.toLocaleString()}</div>
              <div style={{ fontSize:11, color:"#64748B", minWidth:90, textAlign:"right" }}>{new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CUSTOMERS SCREEN ────────────────────────────────────────────────────────
function CustomersScreen() {
  const { customers, orders, smsTemplates, shop, sendSms, notify } = useApp();
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [promoMsg, setPromoMsg] = useState("");
  const [showPromo, setShowPromo] = useState(false);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const sendPromoBlast = () => {
    if (!promoMsg.trim()) { notify("Enter promo message", "error"); return; }
    const targets = customers.filter(c => c.promoOptIn);
    targets.forEach(c => sendSms(c.phone, smsTemplates.promo, { name: c.name, shop: shop.name, message: promoMsg, address: shop.address }, null));
    notify(`📱 Promo sent to ${targets.length} customers!`);
    setShowPromo(false); setPromoMsg("");
  };

  if (selected) {
    const customer = customers.find(c => c.id === selected);
    if (!customer) { setSelected(null); return null; }
    const customerOrders = orders.filter(o => o.customerId === customer.id && !o.voided).slice(0, 10);
    return (
      <div style={{ padding:24, maxWidth:600 }}>
        <button onClick={() => setSelected(null)} style={{ background:"transparent", border:"none", color:"#64748B", cursor:"pointer", fontSize:13, marginBottom:16 }}>← Back</button>
        <div className="card">
          <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:20 }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#38BDF8,#6366F1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, flexShrink:0 }}>{customer.name[0]}</div>
            <div>
              <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>{customer.name}</h2>
              <div style={{ fontSize:13, color:"#64748B" }}>{customer.phone}</div>
              {!customer.promoOptIn && <span style={{ fontSize:11, color:"#F87171" }}>📵 Promo opt-out</span>}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
            {[
              { label:"Total Visits", value:customer.visits, color:"#38BDF8" },
              { label:"Total Spend",  value:`₱${customer.totalSpend.toLocaleString()}`, color:"#10B981" },
              { label:"Last Visit",   value: customer.lastVisit ? `${Math.floor((Date.now()-customer.lastVisit)/86400000)}d ago` : "—", color:"#F59E0B" },
            ].map((s,i) => (
              <div key={i} style={{ background:"#0F172A", borderRadius:8, padding:"10px 12px", textAlign:"center" }}>
                <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#64748B" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <h4 style={{ margin:"0 0 8px", fontSize:13, color:"#94A3B8" }}>Order History</h4>
          {customerOrders.length === 0 ? <div style={{ color:"#64748B", fontSize:13 }}>No orders yet</div> : customerOrders.map(o => (
            <div key={o.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #1E293B", fontSize:13 }}>
              <span style={{ fontWeight:600, color:"#F1F5F9" }}>{o.orderNum}</span>
              <span style={{ color:"#64748B" }}>{new Date(o.createdAt).toLocaleDateString()}</span>
              <span style={{ fontWeight:700, color:"#38BDF8" }}>₱{o.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"var(--text)" }}>Customers</h2>
        <button onClick={() => setShowPromo(p=>!p)} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #F59E0B", background:"#F59E0B10", color:"#F59E0B", cursor:"pointer", fontSize:13, fontWeight:700 }}>📱 Promo Blast</button>
      </div>

      {showPromo && (
        <div className="card" style={{ marginBottom:16, border:"1px solid #F59E0B40" }}>
          <h4 style={{ margin:"0 0 8px", color:"#F59E0B", fontSize:13 }}>📢 Bulk Promo SMS</h4>
          <p style={{ fontSize:12, color:"#94A3B8", margin:"0 0 10px" }}>Will send to {customers.filter(c=>c.promoOptIn).length} opted-in customers</p>
          <textarea value={promoMsg} onChange={e=>setPromoMsg(e.target.value)} placeholder="Enter your promo message…" rows={3}
            style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid #334155", background:"#0F172A", color:"#F1F5F9", fontSize:13, resize:"vertical", boxSizing:"border-box", marginBottom:10 }} />
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={sendPromoBlast} className="btn-primary" style={{ flex:1 }}>Send to {customers.filter(c=>c.promoOptIn).length} customers</button>
            <button onClick={()=>setShowPromo(false)} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #334155", background:"transparent", color:"#94A3B8", cursor:"pointer", fontSize:13 }}>Cancel</button>
          </div>
        </div>
      )}

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers…" className="input" style={{ marginBottom:16 }} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
        {filtered.map(c => {
          const daysSince = c.lastVisit ? Math.floor((Date.now()-c.lastVisit)/86400000) : 999;
          const isAtRisk = daysSince > 30 && c.visits > 2;
          return (
            <div key={c.id} onClick={() => setSelected(c.id)}
              style={{ padding:16, borderRadius:10, background:"var(--card)", border:`1px solid ${isAtRisk?"#F59E0B30":"#1E293B"}`, cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background="var(--border)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--card)"}>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#38BDF8,#6366F1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, flexShrink:0 }}>{c.name[0]}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#F1F5F9" }}>{c.name}</div>
                  <div style={{ fontSize:12, color:"#64748B" }}>{c.phone}</div>
                </div>
                {isAtRisk && <span style={{ fontSize:10, color:"#F59E0B" }}>⚠ At risk</span>}
              </div>
              <div style={{ display:"flex", gap:12, marginTop:10 }}>
                <span style={{ fontSize:12, color:"#38BDF8", fontWeight:700 }}>{c.visits} visits</span>
                <span style={{ fontSize:12, color:"#94A3B8" }}>₱{c.totalSpend.toLocaleString()}</span>
                <span style={{ fontSize:12, color: daysSince < 7 ? "#10B981" : daysSince < 30 ? "#F59E0B" : "#EF4444", marginLeft:"auto" }}>{daysSince}d ago</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── REPORTS SCREEN ──────────────────────────────────────────────────────────
function ReportsScreen() {
  const { orders, services, customers, shop, notify } = useApp();
  const [range, setRange] = useState("today");
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailReport = () => {
    if (!shop || !shop.reportEmail) {
      alert("Please set an owner email in Settings \u2192 Shop \u2192 Owner Email first.");
      return;
    }
    const today = new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});
    const labels = { today:"Daily "+today, week:"Weekly "+today, month:"Monthly "+today };
    const totalRevenue = filtered.reduce((s,o)=>s+o.total,0);
    const totalOrders  = filtered.length;
    const totalKg      = filtered.reduce((s,o)=>s+o.items.reduce((a,i)=>a+(i.pricingType==="PER_KG"||i.pricingType==="FIXED_LOAD"?i.kg:0),0),0);
    const pmBreak = {};
    filtered.forEach(o => { const k=o.paymentMethod||"Cash"; pmBreak[k]=(pmBreak[k]||0)+o.total; });
    const pmText = Object.entries(pmBreak).sort((a,b)=>b[1]-a[1]).map(([m,v])=>`  ${m}: \u20B1${v.toLocaleString()}`).join("\n");
    const svcBreak = {};
    filtered.forEach(o=>o.items.forEach(i=>{svcBreak[i.serviceName]=(svcBreak[i.serviceName]||0)+i.subtotal;}));
    const svcText = Object.entries(svcBreak).sort((a,b)=>b[1]-a[1]).map(([n,v])=>`  ${n}: \u20B1${v.toLocaleString()}`).join("\n");
    const body = [
      shop.name + " — " + labels[range] + " Report",
      "",
      "=== SUMMARY ===",
      `Revenue: \u20B1${totalRevenue.toLocaleString()}`,
      `Orders: ${totalOrders}`,
      `KG Processed: ${totalKg.toFixed(1)}kg`,
      `Avg Order: \u20B1${Math.round(totalOrders>0?totalRevenue/totalOrders:0).toLocaleString()}`,
      `Customers Served: ${new Set(filtered.map(o=>o.customerId)).size}`,
      "",
      "=== PAYMENT BREAKDOWN ===",
      pmText || "  No data",
      "",
      "=== REVENUE BY SERVICE ===",
      svcText || "  No data",
      "",
      "Generated by WashTrack POS on " + new Date().toLocaleString("en-PH"),
    ].join("\n");
    const subject = encodeURIComponent(shop.name + " — " + labels[range] + " Report");
    const bodyEnc = encodeURIComponent(body);
    const a = document.createElement("a");
    a.href = "mailto:" + shop.reportEmail + "?subject=" + subject + "&body=" + bodyEnc;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
    notify("Email client opened with report!");
  };

  const now = Date.now();
  const ranges = {
    today:  new Date().setHours(0,0,0,0),
    week:   now - 7 * 86400000,
    month:  now - 30 * 86400000,
  };
  const from = ranges[range];
  const filtered = orders.filter(o => !o.voided && o.createdAt >= from);

  const totalRevenue = filtered.reduce((s,o) => s+o.total, 0);
  const totalOrders  = filtered.length;
  const totalKg      = filtered.reduce((s,o) => s+o.items.reduce((a,i)=>a+(i.pricingType==="PER_KG"?i.kg:0),0),0);
  const avgOrder     = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const repeatCustomers = customers.filter(c => c.visits >= 2).length;
  const repeatRate   = customers.length > 0 ? Math.round(repeatCustomers / customers.length * 100) : 0;

  // Revenue by service
  const svcRevenue = {};
  filtered.forEach(o => o.items.forEach(i => {
    svcRevenue[i.serviceName] = (svcRevenue[i.serviceName] || 0) + i.subtotal;
  }));
  const svcData = Object.entries(svcRevenue).sort((a,b) => b[1]-a[1]);
  const maxSvc = svcData[0]?.[1] || 1;

  // Daily trend
  const days = range === "today" ? 8 : range === "week" ? 7 : 14;
  const dailyData = Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days-1-i)); d.setHours(0,0,0,0);
    const dEnd = new Date(d); dEnd.setHours(23,59,59,999);
    const rev = orders.filter(o => !o.voided && o.createdAt >= d.getTime() && o.createdAt <= dEnd.getTime()).reduce((s,o)=>s+o.total,0);
    return { label: d.toLocaleDateString("en-PH",{month:"short",day:"numeric"}), rev };
  });
  const maxRev = Math.max(...dailyData.map(d=>d.rev), 1);

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"var(--text)" }}>Reports & Analytics</h2>
        <div style={{ display:"flex", gap:8 }}>
          {[["today","Today"],["week","7 Days"],["month","30 Days"]].map(([v,l]) => (
            <button key={v} onClick={() => setRange(v)} style={{ padding:"6px 14px", borderRadius:6, border:"1px solid #334155", background: range===v?"#1E3A5F":"transparent", color: range===v?"#38BDF8":"#64748B", cursor:"pointer", fontSize:13 }}>{l}</button>
          ))}
          <button onClick={handleEmailReport}
            style={{ padding:"6px 16px", borderRadius:6, border:"none", background: emailSent?"#10B981":"linear-gradient(135deg,#2563EB,#7C3AED)", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700 }}>
            {emailSent ? "✓ Sent!" : "📧 Email Report"}
          </button>
        </div>
      </div>

      {/* Email warning */}
      {(!shop || !shop.reportEmail) && (
        <div style={{ padding:"10px 16px", borderRadius:8, background:"#F59E0B15", border:"1px solid #F59E0B40", marginBottom:16, fontSize:13, color:"#F59E0B" }}>
          ⚠️ No owner email set. Go to <strong>Settings → Shop</strong> to add one for email reports.
        </div>
      )}
      {shop && shop.reportEmail && (
        <div style={{ padding:"8px 16px", borderRadius:8, background:"#10B98115", border:"1px solid #10B98140", marginBottom:16, fontSize:12, color:"#10B981" }}>
          📧 Reports sent to: <strong>{shop.reportEmail}</strong>
          {shop.autoEmailEndOfShift && <span style={{ marginLeft:12, color:"#64748B" }}>Auto-send at {shop.shiftEndTime||"22:00"} ✓</span>}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Revenue",       value:`₱${totalRevenue.toLocaleString()}`, icon:"💰", color:"#38BDF8" },
          { label:"Orders",        value:totalOrders,                          icon:"📋", color:"#818CF8" },
          { label:"KG Processed",  value:`${totalKg.toFixed(1)}kg`,           icon:"⚖",  color:"#F59E0B" },
          { label:"Avg Order",     value:`₱${avgOrder.toLocaleString()}`,     icon:"📊", color:"#10B981" },
          { label:"Repeat Rate",   value:`${repeatRate}%`,                    icon:"🔄", color:"#EC4899" },
          { label:"Customers",     value:customers.length,                     icon:"👥", color:"#6EE7B7" },
        ].map((k,i) => (
          <div key={i} className="card" style={{ borderLeft:`3px solid ${k.color}`, background:"var(--card)", borderTop:"1px solid var(--border)", borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:11, color:"#64748B", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{k.label}</div>
                <div style={{ fontSize:24, fontWeight:800, color:k.color }}>{k.value}</div>
              </div>
              <div style={{ fontSize:28 }}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Bar Chart */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:"#94A3B8" }}>Daily Revenue Trend</h3>
        <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:120 }}>
          {dailyData.map((d, i) => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ fontSize:10, color:"#38BDF8", fontWeight:700 }}>{d.rev > 0 ? `₱${d.rev}` : ""}</div>
              <div style={{ width:"100%", background:"linear-gradient(to top, #38BDF8, #6366F1)", borderRadius:"4px 4px 0 0", height:`${(d.rev/maxRev)*100}%`, minHeight: d.rev>0?4:0, transition:"height 0.5s ease" }} />
              <div style={{ fontSize:9, color:"#475569", textAlign:"center", lineHeight:1.2 }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method Breakdown */}
      {(() => {
        const PM_COLORS = { "Cash":"#10B981","GCash":"#3B82F6","Maya":"#8B5CF6","Credit Card":"#F59E0B" };
        const pmBreakdown = {};
        filtered.forEach(o => {
          const key = o.paymentMethod || "Cash";
          pmBreakdown[key] = (pmBreakdown[key] || 0) + o.total;
        });
        const pmData = Object.entries(pmBreakdown).sort((a,b) => b[1]-a[1]);
        const pmMax  = pmData[0]?.[1] || 1;
        if (pmData.length === 0) return null;
        return (
          <div className="card" style={{ marginBottom:20 }}>
            <h3 style={{ margin:"0 0 4px", fontSize:14, fontWeight:700, color:"#94A3B8" }}>Revenue by Payment Method</h3>
            <p style={{ margin:"0 0 16px", fontSize:12, color:"#475569" }}>Total collected per channel this period</p>
            {pmData.map(([method, rev], i) => {
              const color = PM_COLORS[method] || "#38BDF8";
              const pct   = totalRevenue > 0 ? Math.round(rev/totalRevenue*100) : 0;
              return (
                <div key={i} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                    <span style={{ color:"#F1F5F9", fontWeight:600 }}>{method}</span>
                    <span style={{ display:"flex", gap:12, alignItems:"center" }}>
                      <span style={{ color:"#64748B", fontSize:12 }}>{pct}%</span>
                      <span style={{ color, fontWeight:700 }}>₱{rev.toLocaleString()}</span>
                    </span>
                  </div>
                  <div style={{ height:10, borderRadius:5, background:"#1E293B" }}>
                    <div style={{ height:"100%", borderRadius:5, width:`${(rev/pmMax)*100}%`,
                      background:`linear-gradient(to right, ${color}, ${color}99)`, transition:"width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop:14, padding:"10px 14px", background:"var(--bg)", borderRadius:8, display:"flex", gap:16, flexWrap:"wrap" }}>
              {pmData.map(([method, rev]) => (
                <div key={method} style={{ fontSize:12 }}>
                  <span style={{ color:"#64748B" }}>{method}: </span>
                  <span style={{ color:"#F1F5F9", fontWeight:700 }}>₱{rev.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Busiest Day of Week — only shown for week/month */}
      {range !== "today" && (() => {
        const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        const FULL_DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        const dayTotals = Array(7).fill(0);
        const dayCounts = Array(7).fill(0);
        filtered.forEach(o => { const d=new Date(o.createdAt).getDay(); dayTotals[d]+=o.total; dayCounts[d]++; });
        const maxDay = Math.max(...dayTotals, 1);
        const bestDay = dayTotals.indexOf(Math.max(...dayTotals));
        return (
          <div className="card" style={{ marginBottom:20 }}>
            <h3 style={{ margin:"0 0 4px", fontSize:14, fontWeight:700, color:"#94A3B8" }}>📅 Busiest Day of the Week</h3>
            <p style={{ margin:"0 0 14px", fontSize:12, color:"#475569" }}>Peak trading day this period — great for staffing planning</p>
            <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:90 }}>
              {DAY_NAMES.map((name,i) => {
                const h = dayTotals[i]/maxDay*100;
                const best = i===bestDay && dayTotals[i]>0;
                return (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                    {best ? <div style={{ fontSize:10, color:"#F59E0B", fontWeight:700 }}>🏆</div> : <div style={{ fontSize:10 }}>&nbsp;</div>}
                    <div style={{ width:"100%", borderRadius:"4px 4px 0 0", height:`${h||2}%`, minHeight:2,
                      background: best?"linear-gradient(to top,#F59E0B,#FBBF24)":"linear-gradient(to top,#38BDF8,#6366F1)", transition:"height 0.4s" }} />
                    <div style={{ fontSize:10, color:best?"#F59E0B":"#64748B", fontWeight:best?700:400 }}>{name}</div>
                    {dayCounts[i]>0 && <div style={{ fontSize:9, color:"#475569" }}>{dayCounts[i]}</div>}
                  </div>
                );
              })}
            </div>
            {dayTotals[bestDay]>0 && (
              <div style={{ marginTop:10, padding:"8px 12px", background:"#F59E0B15", border:"1px solid #F59E0B40", borderRadius:6, fontSize:12, color:"#F59E0B" }}>
                🏆 Busiest: <strong>{FULL_DAYS[bestDay]}</strong> — ₱{dayTotals[bestDay].toLocaleString()} · {dayCounts[bestDay]} orders
              </div>
            )}
          </div>
        );
      })()}

      {/* Weekly Performance — only for month view */}
      {range === "month" && (() => {
        const weekMap = {};
        filtered.forEach(o => {
          const d = new Date(o.createdAt);
          const ws = new Date(d); ws.setDate(d.getDate()-d.getDay()); ws.setHours(0,0,0,0);
          const key = ws.toLocaleDateString("en-PH",{month:"short",day:"numeric"});
          if (!weekMap[key]) weekMap[key]={rev:0,orders:0};
          weekMap[key].rev+=o.total; weekMap[key].orders++;
        });
        const weekArr = Object.entries(weekMap);
        if (weekArr.length === 0) return null;
        const maxW = Math.max(...weekArr.map(([,v])=>v.rev), 1);
        const bestW = weekArr.reduce((bi,[,v],i,arr)=>v.rev>arr[bi][1].rev?i:bi, 0);
        return (
          <div className="card" style={{ marginBottom:20 }}>
            <h3 style={{ margin:"0 0 4px", fontSize:14, fontWeight:700, color:"#94A3B8" }}>📆 Weekly Performance</h3>
            <p style={{ margin:"0 0 14px", fontSize:12, color:"#475569" }}>Strongest week of the month</p>
            {weekArr.map(([label,v],i) => {
              const best = i===bestW && v.rev>0;
              const pct = Math.round(v.rev/maxW*100);
              return (
                <div key={i} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4, alignItems:"center" }}>
                    <span style={{ color:best?"#F59E0B":"#F1F5F9", fontWeight:best?700:500 }}>{best?"🏆 ":""}Week of {label}</span>
                    <span style={{ color:"#64748B", fontSize:11 }}>{v.orders} orders</span>
                    <span style={{ color:"#818CF8", fontWeight:700 }}>₱{v.rev.toLocaleString()}</span>
                  </div>
                  <div style={{ height:8, borderRadius:4, background:"#1E293B" }}>
                    <div style={{ height:"100%", borderRadius:4, width:`${pct}%`,
                      background:best?"linear-gradient(to right,#F59E0B,#FBBF24)":"linear-gradient(to right,#818CF8,#6366F1)", transition:"width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Revenue by Service */}
      <div className="card">
        <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:"#94A3B8" }}>Revenue by Service</h3>
        {svcData.length === 0 ? <div style={{ color:"#475569", fontSize:13 }}>No data for this period</div> : svcData.map(([name, rev], i) => {
          const svc = services.find(s => s.name === name);
          return (
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
                <span style={{ color:"#F1F5F9", fontWeight:600 }}>{name}</span>
                <span style={{ color:"#38BDF8", fontWeight:700 }}>₱{rev.toLocaleString()}</span>
              </div>
              <div style={{ height:6, borderRadius:3, background:"#1E293B" }}>
                <div style={{ height:"100%", borderRadius:3, width:`${(rev/maxSvc)*100}%`, background: `linear-gradient(to right, ${svc?.color||"#38BDF8"}, ${svc?.color||"#38BDF8"}80)`, transition:"width 0.5s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SETTINGS SCREEN ─────────────────────────────────────────────────────────
function SettingsScreen() {
  const { shop, setShop, services, setServices, stages, setStages, smsTemplates, setSmsTemplates, staff, setStaff, smsLog, auditLog, notify, addAudit, requirePin, currentStaff, theme, setTheme, inventory, supplyRules, setSupplyRules } = useApp();
  const [tab, setTab] = useState("shop");
  const [editService, setEditService] = useState(null);
  const [newService, setNewService]   = useState(false);
  const [nsSvc, setNsSvc]             = useState({ name:"", pricingType:"PER_KG", basePrice:65, minKg:4, expressMultiplier:1.5 });

  const tabs = [
    { id:"shop",      icon:"🏪", label:"Shop" },
    { id:"theme",     icon:"🎨", label:"Theme" },
    { id:"services",  icon:"🧺", label:"Services" },
    { id:"workflow",  icon:"🔄", label:"Workflow" },
    { id:"sms",       icon:"💬", label:"SMS" },
    { id:"staff",     icon:"👤", label:"Staff" },
    { id:"inventory", icon:"📦", label:"Inventory" },
    { id:"supplies",  icon:"🧴", label:"Supplies" },
    { id:"logs",      icon:"📜", label:"Audit Log" },
    { id:"smslog",    icon:"📱", label:"SMS Log" },
  ];

  const saveService = (svc) => {
    setServices(prev => prev.map(s => s.id === svc.id ? svc : s));
    setEditService(null); notify("Service updated");
    addAudit("SETTINGS_CHANGED", `Service updated: ${svc.name}`);
  };

  const addService = () => {
    if (!nsSvc.name) { notify("Name required", "error"); return; }
    const svc = { ...nsSvc, id: `s${Date.now()}`, active: true, color:"#38BDF8", sortOrder: services.length };
    setServices(prev => [...prev, svc]);
    setNewService(false); setNsSvc({ name:"", pricingType:"PER_KG", basePrice:65, minKg:4, expressMultiplier:1.5 });
    notify("Service added");
  };

  const toggleService = (id) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
    notify("Service updated");
  };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* Settings nav */}
      <div style={{ width:160, background:"var(--sidebar)", borderRight:"1px solid var(--border)", padding:"16px 8px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderRadius:8, border:"none", background: tab===t.id?"color-mix(in srgb, var(--accent) 15%, var(--sidebar))":"transparent", color: tab===t.id?"var(--accent)":"var(--subtext)", cursor:"pointer", fontSize:13, fontWeight: tab===t.id?700:500, textAlign:"left", marginBottom:2 }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflow:"auto", padding:24 }}>
        {/* Shop Identity */}
        {tab === "shop" && (
          <div>
            <h3 style={{ margin:"0 0 20px", fontSize:18, fontWeight:800, color:"var(--text)" }}>🏪 Shop Identity</h3>
            {[
              { key:"name",    label:"Shop Name",       placeholder:"Your Laundry Shop" },
              { key:"address", label:"Address",          placeholder:"Street, Barangay, City" },
              { key:"phone",   label:"Contact Number",   placeholder:"09XXXXXXXXX" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:12, color:"#94A3B8", marginBottom:6 }}>{f.label}</label>
                <input value={shop[f.key] || ""} onChange={e => setShop(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="input" />
              </div>
            ))}
            <div style={{ display:"flex", gap:12, marginBottom:16 }}>
              <div style={{ flex:1 }}>
                <label style={{ display:"block", fontSize:12, color:"#94A3B8", marginBottom:6 }}>SMS Receipt</label>
                <button onClick={() => setShop(p=>({...p, autoSmsReceipt: !p.autoSmsReceipt}))} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${shop.autoSmsReceipt?"#10B981":"#334155"}`, background: shop.autoSmsReceipt?"#10B98115":"transparent", color: shop.autoSmsReceipt?"#10B981":"#64748B", cursor:"pointer", fontSize:13, fontWeight:700 }}>{shop.autoSmsReceipt?"✓ Enabled":"✗ Disabled"}</button>
              </div>
              <div style={{ flex:1 }}>
                <label style={{ display:"block", fontSize:12, color:"#94A3B8", marginBottom:6 }}>SMS Ready Notification</label>
                <button onClick={() => setShop(p=>({...p, autoSmsReady: !p.autoSmsReady}))} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${shop.autoSmsReady?"#10B981":"#334155"}`, background: shop.autoSmsReady?"#10B98115":"transparent", color: shop.autoSmsReady?"#10B981":"#64748B", cursor:"pointer", fontSize:13, fontWeight:700 }}>{shop.autoSmsReady?"✓ Enabled":"✗ Disabled"}</button>
              </div>
            </div>
            {/* Email Report Settings */}
            <div style={{ marginTop:20, padding:18, background:"var(--bg)", borderRadius:10, border:"1px solid var(--border)" }}>
              <h4 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, color:"var(--text)" }}>📧 Email Report Settings</h4>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:"block", fontSize:12, color:"#94A3B8", marginBottom:6 }}>Owner Email Address</label>
                <input type="email" value={shop.reportEmail||""} onChange={e=>setShop(p=>({...p,reportEmail:e.target.value}))} placeholder="owner@example.com" className="input" />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:"block", fontSize:12, color:"#94A3B8", marginBottom:8 }}>Auto-Send Schedule</label>
                {[
                  { key:"autoEmailEndOfShift", label:"End of Shift", icon:"🌙" },
                  { key:"autoEmailDaily",       label:"Daily (midnight)", icon:"📅" },
                  { key:"autoEmailWeekly",      label:"Weekly (Sunday)", icon:"📆" },
                  { key:"autoEmailMonthly",     label:"Monthly (1st)", icon:"🗓" },
                ].map(opt => (
                  <div key={opt.key} onClick={()=>setShop(p=>({...p,[opt.key]:!p[opt.key]}))}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, cursor:"pointer", marginBottom:6,
                      border:`1px solid ${shop[opt.key]?"var(--accent)":"var(--border)"}`,
                      background:shop[opt.key]?"color-mix(in srgb, var(--accent) 8%, var(--card))":"var(--card)" }}>
                    <span>{opt.icon}</span>
                    <span style={{ flex:1, fontSize:13, color:"var(--text)" }}>{opt.label}</span>
                    <div style={{ width:34, height:18, borderRadius:9, background:shop[opt.key]?"var(--accent)":"#334155", position:"relative", flexShrink:0 }}>
                      <div style={{ position:"absolute", top:2, left:shop[opt.key]?18:2, width:14, height:14, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display:"block", fontSize:12, color:"#94A3B8", marginBottom:6 }}>Shift End Time</label>
                <input type="time" value={shop.shiftEndTime||"22:00"} onChange={e=>setShop(p=>({...p,shiftEndTime:e.target.value}))} className="input" style={{ maxWidth:140 }} />
              </div>
            </div>

            <button onClick={() => { notify("Shop settings saved"); addAudit("SETTINGS_CHANGED", "Shop identity updated"); }} className="btn-primary" style={{ width:"100%", marginTop:16 }}>Save Changes</button>
          </div>
        )}

        {/* Theme Customizer */}
        {tab === "theme" && <ThemeCustomizer theme={theme} setTheme={setTheme} notify={notify} addAudit={addAudit} />}

        {/* Services */}
        {tab === "services" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:"var(--text)" }}>🧺 Service Catalog</h3>
              <button onClick={() => setNewService(true)} className="btn-primary" style={{ padding:"8px 16px", fontSize:13 }}>+ Add Service</button>
            </div>
            {newService && (
              <div className="card" style={{ marginBottom:16, border:"1px solid #38BDF840" }}>
                <h4 style={{ margin:"0 0 12px", color:"#38BDF8", fontSize:14 }}>New Service</h4>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div><label style={{ fontSize:12, color:"#94A3B8" }}>Name *</label><input value={nsSvc.name} onChange={e=>setNsSvc(p=>({...p,name:e.target.value}))} className="input" /></div>
                  <div><label style={{ fontSize:12, color:"#94A3B8" }}>Pricing</label>
                    <select value={nsSvc.pricingType} onChange={e=>setNsSvc(p=>({...p,pricingType:e.target.value}))} className="input">
                      <option value="PER_KG">Per KG</option><option value="FLAT">Flat Rate</option><option value="FIXED_LOAD">Fixed Load (e.g. 7kg/8kg)</option>
                    </select>
                  </div>
                  <div><label style={{ fontSize:12, color:"#94A3B8" }}>Base Price (₱)</label><input type="number" value={nsSvc.basePrice} onChange={e=>setNsSvc(p=>({...p,basePrice:Number(e.target.value)}))} className="input" /></div>
                  <div><label style={{ fontSize:12, color:"#94A3B8" }}>Min KG</label><input type="number" value={nsSvc.minKg} onChange={e=>setNsSvc(p=>({...p,minKg:Number(e.target.value)}))} className="input" /></div>
                  <div><label style={{ fontSize:12, color:"#94A3B8" }}>Express Multiplier</label><input type="number" step="0.1" value={nsSvc.expressMultiplier} onChange={e=>setNsSvc(p=>({...p,expressMultiplier:Number(e.target.value)}))} className="input" /></div>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <button onClick={addService} className="btn-primary" style={{ flex:1 }}>Add Service</button>
                  <button onClick={() => setNewService(false)} style={{ flex:1, padding:"8px", borderRadius:8, border:"1px solid #334155", background:"transparent", color:"#94A3B8", cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            )}
            {services.map(svc => (
              <div key={svc.id} style={{ padding:16, borderRadius:10, background:"#131B2E", border:`1px solid #1E293B`, marginBottom:10 }}>
                {editService === svc.id ? (
                  <ServiceEditor svc={svc} onSave={saveService} onCancel={() => setEditService(null)} />
                ) : (
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:12, height:40, borderRadius:3, background:svc.color, flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, color:"#F1F5F9", fontSize:14 }}>{svc.name}</div>
                      <div style={{ fontSize:12, color:"#64748B" }}>{svc.pricingType==="PER_KG"?svc.pricingType==="FIXED_LOAD"?`₱${svc.basePrice} fixed (${svc.minKg}kg load), ${svc.expressMultiplier}x express`:`₱${svc.basePrice}/kg, min ${svc.minKg}kg, ${svc.expressMultiplier}x express`:`₱${svc.basePrice} flat`}</div>
                    </div>
                    <button onClick={() => toggleService(svc.id)} style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${svc.active?"#10B981":"#334155"}`, background:"transparent", color: svc.active?"#10B981":"#64748B", cursor:"pointer", fontSize:12 }}>{svc.active?"Active":"Inactive"}</button>
                    <button onClick={() => setEditService(svc.id)} style={{ padding:"4px 12px", borderRadius:6, border:"1px solid #334155", background:"transparent", color:"#94A3B8", cursor:"pointer", fontSize:12 }}>Edit</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Workflow */}
        {tab === "workflow" && (
          <div>
            <h3 style={{ margin:"0 0 20px", fontSize:18, fontWeight:800, color:"var(--text)" }}>🔄 Workflow Stages</h3>
            {stages.map(stage => (
              <div key={stage.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10, background:"#131B2E", marginBottom:10, border:"1px solid #1E293B" }}>
                <span style={{ fontSize:20 }}>{stage.icon}</span>
                <input value={stage.label} onChange={e => setStages(prev => prev.map(s => s.id===stage.id ? {...s, label: e.target.value} : s))}
                  style={{ flex:1, background:"transparent", border:"none", color:"#F1F5F9", fontSize:14, fontWeight:600, outline:"none" }} />
                <div style={{ width:12, height:12, borderRadius:"50%", background:stage.color, flexShrink:0 }} />
              </div>
            ))}
            <button onClick={() => { notify("Workflow stages saved"); }} className="btn-primary" style={{ width:"100%", marginTop:8 }}>Save Stages</button>
          </div>
        )}

        {/* SMS Templates */}
        {tab === "sms" && (
          <div>
            <h3 style={{ margin:"0 0 6px", fontSize:18, fontWeight:800, color:"var(--text)" }}>💬 SMS Templates</h3>
            <p style={{ margin:"0 0 20px", fontSize:12, color:"#64748B" }}>Tokens: {"{name}"} {"{order}"} {"{shop}"} {"{kg}"} {"{total}"} {"{address}"} {"{message}"}</p>
            {[["receipt","📄 Order Receipt"],["ready","✅ Order Ready"],["reminder","⏰ Pickup Reminder"],["promo","📢 Promo Blast"]].map(([key,label]) => (
              <div key={key} style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:13, fontWeight:700, color:"#F1F5F9", marginBottom:6 }}>{label}</label>
                <textarea value={smsTemplates[key]} onChange={e => setSmsTemplates(p=>({...p,[key]:e.target.value}))} rows={3}
                  style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid #334155", background:"#0F172A", color:"#F1F5F9", fontSize:13, resize:"vertical", boxSizing:"border-box" }} />
                <div style={{ fontSize:11, color:"#64748B", marginTop:3 }}>{smsTemplates[key].length} chars</div>
              </div>
            ))}
            <button onClick={() => { notify("SMS templates saved"); }} className="btn-primary" style={{ width:"100%" }}>Save Templates</button>
          </div>
        )}

        {/* Staff */}
        {tab === "staff" && (
          <div>
            <h3 style={{ margin:"0 0 20px", fontSize:18, fontWeight:800, color:"var(--text)" }}>👤 Staff Management</h3>
            {staff.map(s => (
              <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10, background:"#131B2E", marginBottom:10, border:"1px solid #1E293B", opacity: s.active?1:0.5 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#38BDF8,#6366F1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700 }}>{s.avatar}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, color:"#F1F5F9", fontSize:14 }}>{s.name}</div>
                  <div style={{ fontSize:12, color:"#64748B" }}>{s.role} {s.id === currentStaff?.id ? "· (you)":""}</div>
                </div>
                <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:`${s.active?"#10B98120":"#33415520"}`, color: s.active?"#10B981":"#64748B" }}>{s.active?"Active":"Inactive"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Inventory Settings */}
        {tab === "inventory" && (
          <div>
            <h3 style={{ margin:"0 0 6px", fontSize:18, fontWeight:800, color:"var(--text)" }}>📦 Inventory Settings</h3>
            <p style={{ margin:"0 0 20px", fontSize:13, color:"#64748B" }}>Configure overstay thresholds and manage stock from the dedicated Inventory screen.</p>

            <div className="card" style={{ marginBottom:16 }}>
              <h4 style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:"var(--text)" }}>⏰ Garment Overstay Thresholds</h4>
              <p style={{ fontSize:12, color:"#64748B", margin:"0 0 14px" }}>Orders in the facility beyond these durations trigger visual warnings in the Orders board and Dashboard.</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {[
                  { label:"⚠️ Warning", value:"24 hours", desc:"Yellow indicator", color:"#F59E0B" },
                  { label:"🔶 Alert",   value:"48 hours", desc:"Orange indicator", color:"#F97316" },
                  { label:"🔴 Critical",value:"72 hours", desc:"Red — escalate", color:"#EF4444" },
                ].map((t,i) => (
                  <div key={i} style={{ padding:"12px 14px", borderRadius:8, background:"var(--bg)", border:`1px solid ${t.color}30` }}>
                    <div style={{ fontSize:13, fontWeight:700, color:t.color, marginBottom:4 }}>{t.label}</div>
                    <div style={{ fontSize:16, fontWeight:800, color:"var(--text)" }}>{t.value}</div>
                    <div style={{ fontSize:11, color:"#64748B" }}>{t.desc}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:11, color:"#475569", margin:"12px 0 0" }}>Thresholds apply to ALL orders from the moment they were created, across all workflow stages.</p>
            </div>

            <div className="card">
              <h4 style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:"var(--text)" }}>📋 Quick Stock Overview</h4>
              {inventory.filter(i => i.qty <= i.minQty).length === 0 ? (
                <div style={{ padding:"20px 0", textAlign:"center", color:"#10B981", fontSize:14 }}>✅ All items are well stocked!</div>
              ) : (
                inventory.filter(i => i.qty <= i.minQty).map(item => {
                  const isEmpty = item.qty === 0;
                  return (
                    <div key={item.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                      <span style={{ fontSize:20 }}>{item.icon}</span>
                      <span style={{ flex:1, fontSize:13, color:"var(--text)" }}>{item.name}</span>
                      <span style={{ fontSize:12, fontWeight:700, color: isEmpty?"#EF4444":"#F97316" }}>
                        {isEmpty ? "OUT" : `${item.qty} ${item.unit}`}
                      </span>
                      <span style={{ fontSize:11, color:"#64748B" }}>min: {item.minQty}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Audit Log */}
        {/* Supply Deduction Rules */}
        {tab === "supplies" && (
          <div>
            <h3 style={{ margin:"0 0 6px", fontSize:18, fontWeight:800, color:"var(--text)" }}>🧴 Supply Auto-Deduction Rules</h3>
            <p style={{ margin:"0 0 20px", fontSize:13, color:"var(--subtext)" }}>
              Each rule automatically deducts inventory when an order is completed.
              Set <strong>per kg</strong> for wash services, <strong>per load</strong> for fixed loads (7kg/8kg), or <strong>per order</strong> for items used every time.
            </p>

            {/* Existing rules */}
            {supplyRules.map((rule, ri) => {
              const invItem = inventory.find(i => i.id === rule.invId);
              return (
                <div key={rule.id} className="card" style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:22 }}>{invItem?.icon || "📦"}</span>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:"var(--text)" }}>{rule.name}</div>
                        <div style={{ fontSize:12, color:"var(--subtext)" }}>
                          Linked: <strong>{invItem ? invItem.name : "⚠️ Item not found"}</strong>
                          {invItem && <span style={{ marginLeft:8, color:"var(--muted)" }}>Current stock: {parseFloat(invItem.qty.toFixed(2))} {invItem.unit}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSupplyRules(prev => prev.filter(r => r.id !== rule.id))}
                      style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #EF4444", background:"transparent", color:"#EF4444", cursor:"pointer", fontSize:12 }}>
                      Delete
                    </button>
                  </div>

                  {/* Deduction amounts */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
                    <div>
                      <label style={{ display:"block", fontSize:11, color:"var(--subtext)", marginBottom:4 }}>Per KG (wash services)</label>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <input type="number" step="0.01" min="0" value={rule.perKg}
                          onChange={e => setSupplyRules(prev => prev.map(r => r.id===rule.id ? {...r, perKg: parseFloat(e.target.value)||0} : r))}
                          className="input" style={{ fontSize:13 }} />
                        <span style={{ fontSize:12, color:"var(--muted)", whiteSpace:"nowrap" }}>{invItem?.unit || "unit"}</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:11, color:"var(--subtext)", marginBottom:4 }}>Per Load (fixed loads)</label>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <input type="number" step="0.01" min="0" value={rule.perLoad}
                          onChange={e => setSupplyRules(prev => prev.map(r => r.id===rule.id ? {...r, perLoad: parseFloat(e.target.value)||0} : r))}
                          className="input" style={{ fontSize:13 }} />
                        <span style={{ fontSize:12, color:"var(--muted)", whiteSpace:"nowrap" }}>{invItem?.unit || "unit"}</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:11, color:"var(--subtext)", marginBottom:4 }}>Per Order (always)</label>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <input type="number" step="0.01" min="0" value={rule.perOrder}
                          onChange={e => setSupplyRules(prev => prev.map(r => r.id===rule.id ? {...r, perOrder: parseFloat(e.target.value)||0} : r))}
                          className="input" style={{ fontSize:13 }} />
                        <span style={{ fontSize:12, color:"var(--muted)", whiteSpace:"nowrap" }}>{invItem?.unit || "unit"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Applies to services */}
                  <div>
                    <label style={{ display:"block", fontSize:11, color:"var(--subtext)", marginBottom:6 }}>Applies to Services</label>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      <button onClick={() => {
                        const isAll = rule.appliesTo.includes("all");
                        setSupplyRules(prev => prev.map(r => r.id===rule.id ? {...r, appliesTo: isAll ? [] : ["all"]} : r));
                      }} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${rule.appliesTo.includes("all")?"var(--accent)":"var(--border)"}`, background: rule.appliesTo.includes("all")?"color-mix(in srgb, var(--accent) 15%, var(--card))":"transparent", color: rule.appliesTo.includes("all")?"var(--accent)":"var(--subtext)", cursor:"pointer", fontSize:12, fontWeight:rule.appliesTo.includes("all")?700:400 }}>
                        All Services
                      </button>
                      {services.filter(s=>s.active).map(svc => {
                        const sel = rule.appliesTo.includes(svc.id);
                        return (
                          <button key={svc.id} onClick={() => {
                            if (rule.appliesTo.includes("all")) return;
                            setSupplyRules(prev => prev.map(r => {
                              if (r.id !== rule.id) return r;
                              const next = sel ? r.appliesTo.filter(x=>x!==svc.id) : [...r.appliesTo, svc.id];
                              return {...r, appliesTo: next};
                            }));
                          }}
                          style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${sel?"#1E293B":"var(--border)"}`,
                            background: sel?`${svc.color}25`:"transparent",
                            color: sel?svc.color:"var(--subtext)", cursor: rule.appliesTo.includes("all")?"default":"pointer", fontSize:12,
                            opacity: rule.appliesTo.includes("all")?0.4:1 }}>
                            {svc.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add new rule button */}
            <button onClick={() => {
              const newRule = {
                id: "sr" + Date.now(),
                name: "New Rule",
                invId: inventory[0]?.id || "",
                perKg: 0,
                perLoad: 0,
                perOrder: 0,
                appliesTo: ["all"],
              };
              setSupplyRules(prev => [...prev, newRule]);
            }} style={{ width:"100%", padding:"12px", borderRadius:10, border:"1px dashed var(--border)", background:"transparent", color:"var(--accent)", cursor:"pointer", fontSize:14, fontWeight:700, marginBottom:16 }}>
              + Add Supply Rule
            </button>

            {/* How it works explanation */}
            <div style={{ padding:16, borderRadius:10, background:"var(--bg)", border:"1px solid var(--border)", fontSize:12, color:"var(--subtext)", lineHeight:1.7 }}>
              <strong style={{ color:"var(--text)", display:"block", marginBottom:6 }}>ℹ️ How deductions work</strong>
              <div>• <strong>Per KG</strong> — deducted for every kg in a wash order (e.g. 0.05 bags of detergent per kg = 0.5 bags for a 10kg order)</div>
              <div>• <strong>Per Load</strong> — deducted once per fixed-load order (7kg/8kg loads)</div>
              <div>• <strong>Per Order</strong> — deducted once per order no matter the size (e.g. 1 plastic bag per order)</div>
              <div style={{ marginTop:6 }}>Changes are saved automatically. Deductions happen the moment an order is completed.</div>
            </div>
          </div>
        )}

        {tab === "logs" && (
          <div>
            <h3 style={{ margin:"0 0 16px", fontSize:18, fontWeight:800, color:"var(--text)" }}>📜 Audit Log</h3>
            {auditLog.length === 0 ? <div style={{ color:"#64748B", fontSize:13 }}>No activity yet</div> : auditLog.slice(0, 50).map(entry => (
              <div key={entry.id} style={{ padding:"10px 14px", borderRadius:8, background:"#131B2E", marginBottom:6, borderLeft:`3px solid ${entry.type.includes("VOID")?"#EF4444":entry.type.includes("CREATED")?"#10B981":"#6366F1"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:13, color:"#F1F5F9" }}>{entry.desc}</span>
                  <span style={{ fontSize:11, color:"#64748B" }}>{new Date(entry.at).toLocaleTimeString()}</span>
                </div>
                <div style={{ fontSize:11, color:"#475569" }}>{entry.type} · {new Date(entry.at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* SMS Log */}
        {tab === "smslog" && (
          <div>
            <h3 style={{ margin:"0 0 16px", fontSize:18, fontWeight:800, color:"var(--text)" }}>📱 SMS Log</h3>
            {smsLog.length === 0 ? <div style={{ color:"#64748B", fontSize:13 }}>No SMS sent yet</div> : smsLog.slice(0,50).map(entry => (
              <div key={entry.id} style={{ padding:"10px 14px", borderRadius:8, background:"#131B2E", marginBottom:6 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{entry.phone}</span>
                  <span style={{ fontSize:11, color:"#10B981" }}>✓ {entry.status}</span>
                </div>
                <div style={{ fontSize:12, color:"#94A3B8" }}>{entry.message}</div>
                <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>{new Date(entry.at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── THEME CUSTOMIZER COMPONENT ──────────────────────────────────────────────
function ThemeCustomizer({ theme, setTheme, notify, addAudit }) {
  const [custom, setCustom] = useState({ ...theme });
  const [activePreset, setActivePreset] = useState(theme.id || "dark-ocean");

  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    setCustom({ ...preset });
    setTheme(preset);
    notify("Theme applied: " + preset.name);
    addAudit("SETTINGS_CHANGED", "Theme changed to " + preset.name);
  };

  const applyCustom = () => {
    const t = { ...custom, id: "custom", name: "Custom" };
    setTheme(t);
    setActivePreset("custom");
    notify("Custom theme applied!");
    addAudit("SETTINGS_CHANGED", "Custom theme applied");
  };

  const colorFields = [
    { key: "bg",      label: "Background",    desc: "Main app background" },
    { key: "sidebar", label: "Sidebar",        desc: "Navigation panel" },
    { key: "card",    label: "Card / Panel",   desc: "Content cards and panels" },
    { key: "border",  label: "Borders",        desc: "Dividers and outlines" },
    { key: "accent",  label: "Accent (Primary)", desc: "Buttons, highlights, KPIs" },
    { key: "accent2", label: "Accent (Secondary)", desc: "Gradients, badges" },
    { key: "text",    label: "Primary Text",   desc: "Headings and main text" },
    { key: "subtext", label: "Secondary Text", desc: "Labels and descriptions" },
    { key: "muted",   label: "Muted Text",     desc: "Placeholders and hints" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>🎨 Theme Customizer</h3>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Personalize your POS with colors and styles</p>
        </div>
        <div style={{ padding: "6px 14px", borderRadius: 20, background: "var(--card)", border: "1px solid var(--border)", fontSize: 12, color: "var(--subtext)" }}>
          Current: <span style={{ color: "var(--accent)", fontWeight: 700 }}>{THEME_PRESETS.find(p => p.id === activePreset)?.name || "Custom"}</span>
        </div>
      </div>

      {/* Preset Palette Grid */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--subtext)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Preset Themes</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {THEME_PRESETS.filter(p => p.id !== "custom").map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              style={{
                padding: "12px 10px",
                borderRadius: 12,
                border: activePreset === preset.id ? "2px solid var(--accent)" : "2px solid " + preset.border,
                background: preset.bg,
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Mini color strip */}
              <div style={{ display: "flex", gap: 3, marginBottom: 8, justifyContent: "center" }}>
                {[preset.sidebar, preset.card, preset.accent, preset.accent2].map((c, i) => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: "1px solid " + preset.border }} />
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: preset.text, marginBottom: 2 }}>{preset.name}</div>
              <div style={{ fontSize: 10, color: preset.subtext }}>{preset.mode === "dark" ? "🌙 Dark" : "☀️ Light"}</div>
              {activePreset === preset.id && (
                <div style={{ position: "absolute", top: 6, right: 8, fontSize: 14 }}>✓</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Pickers */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--subtext)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Custom Colors</div>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>Pick any combination of colors. Changes preview live.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {colorFields.map(field => (
            <label key={field.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: custom[field.key], border: "2px solid var(--border)", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }} />
                <input
                  type="color"
                  value={custom[field.key]}
                  onChange={e => {
                    const updated = { ...custom, [field.key]: e.target.value, id: "custom", name: "Custom" };
                    setCustom(updated);
                    setTheme(updated);
                    setActivePreset("custom");
                  }}
                  style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{field.label}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{field.desc}</div>
                <div style={{ fontSize: 10, color: "var(--subtext)", fontFamily: "monospace", marginTop: 2 }}>{custom[field.key]}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Mode toggle */}
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Display Mode</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["dark", "light"].map(mode => (
              <button
                key={mode}
                onClick={() => {
                  const updated = { ...custom, mode, id: "custom", name: "Custom" };
                  setCustom(updated);
                  setTheme(updated);
                  setActivePreset("custom");
                }}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8,
                  border: custom.mode === mode ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: custom.mode === mode ? "var(--accent)20" : "transparent",
                  color: custom.mode === mode ? "var(--accent)" : "var(--subtext)",
                  cursor: "pointer", fontSize: 14, fontWeight: custom.mode === mode ? 700 : 500,
                }}
              >
                {mode === "dark" ? "🌙 Dark" : "☀️ Light"}
              </button>
            ))}
          </div>
        </div>

        <button onClick={applyCustom} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
          ✓ Apply Custom Theme
        </button>
      </div>

      {/* Live Preview */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--subtext)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Live Preview</div>
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
          <div style={{ background: "var(--sidebar)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 16 }}>🫧</div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>WashTrack</span>
          </div>
          <div style={{ background: "var(--bg)", padding: 14, display: "flex", gap: 10 }}>
            <div style={{ flex: 1, background: "var(--card)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>REVENUE</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>₱12,500</div>
            </div>
            <div style={{ flex: 1, background: "var(--card)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>ORDERS</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent2)" }}>24</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
              <div style={{ padding: "5px 12px", borderRadius: 6, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "default" }}>+ Order</div>
              <div style={{ padding: "5px 12px", borderRadius: 6, background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 11, cursor: "default" }}>Reports</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function ServiceEditor({ svc, onSave, onCancel }) {
  const [s, setS] = useState(svc);
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
        <div><label style={{ fontSize:11, color:"#94A3B8" }}>Name</label><input value={s.name} onChange={e=>setS(p=>({...p,name:e.target.value}))} className="input" /></div>
        <div><label style={{ fontSize:11, color:"#94A3B8" }}>Pricing</label>
          <select value={s.pricingType} onChange={e=>setS(p=>({...p,pricingType:e.target.value}))} className="input">
            <option value="PER_KG">Per KG</option><option value="FLAT">Flat Rate</option><option value="FIXED_LOAD">Fixed Load (e.g. 7kg/8kg)</option>
          </select>
        </div>
        <div><label style={{ fontSize:11, color:"#94A3B8" }}>Base Price (₱)</label><input type="number" value={s.basePrice} onChange={e=>setS(p=>({...p,basePrice:Number(e.target.value)}))} className="input" /></div>
        <div><label style={{ fontSize:11, color:"#94A3B8" }}>Min KG</label><input type="number" value={s.minKg} onChange={e=>setS(p=>({...p,minKg:Number(e.target.value)}))} className="input" /></div>
        <div><label style={{ fontSize:11, color:"#94A3B8" }}>Express ×</label><input type="number" step="0.1" value={s.expressMultiplier} onChange={e=>setS(p=>({...p,expressMultiplier:Number(e.target.value)}))} className="input" /></div>
        <div><label style={{ fontSize:11, color:"#94A3B8" }}>Color</label><input type="color" value={s.color} onChange={e=>setS(p=>({...p,color:e.target.value}))} className="input" style={{ padding:4, height:38 }} /></div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => onSave(s)} className="btn-primary" style={{ flex:1, padding:8, fontSize:13 }}>Save</button>
        <button onClick={onCancel} style={{ flex:1, padding:8, borderRadius:8, border:"1px solid #334155", background:"transparent", color:"#94A3B8", cursor:"pointer", fontSize:13 }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── INVENTORY SCREEN ─────────────────────────────────────────────────────────
function InventoryScreen() {
  const { inventory, setInventory, notify, addAudit, currentStaff } = useApp();
  const [filter, setFilter] = useState("all");   // all | low | out
  const [editId, setEditId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [restockId, setRestockId] = useState(null);
  const [restockQty, setRestockQty] = useState("");
  const [newItem, setNewItem] = useState({ name:"", category:"Consumable", unit:"pc", qty:0, minQty:5, costPerUnit:0, icon:"📦" });

  const CATEGORIES = ["Consumable","Packaging","Equipment","Cleaning","Other"];
  const ICONS = ["🧴","🫧","🧪","🛍","📌","🪝","🧾","💧","📦","🧹","🪣","🧽","🔧","💡"];

  const filtered = inventory.filter(i => {
    if (filter === "low") return i.qty > 0 && i.qty <= i.minQty;
    if (filter === "out") return i.qty === 0;
    return true;
  });

  const stockStatus = (item) => {
    if (item.qty === 0) return { label:"Out of Stock", color:"#EF4444", bg:"#450a0a", border:"#EF444440" };
    if (item.qty <= item.minQty) return { label:"Low Stock", color:"#F97316", bg:"#431407", border:"#F9731630" };
    return { label:"In Stock", color:"#10B981", bg:"#052e16", border:"#10B98130" };
  };

  const doRestock = (id) => {
    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) { notify("Enter valid quantity","error"); return; }
    setInventory(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + qty, lastRestocked: Date.now() } : i));
    const item = inventory.find(i => i.id === id);
    addAudit("INVENTORY", `Restocked ${item.name} +${qty} ${item.unit}`);
    notify(`Restocked ${item.name} ×${qty}`);
    setRestockId(null); setRestockQty("");
  };

  const doAdjust = (id, newQty) => {
    const q = parseInt(newQty);
    if (isNaN(q) || q < 0) return;
    const item = inventory.find(i => i.id === id);
    setInventory(prev => prev.map(i => i.id === id ? { ...i, qty: q } : i));
    addAudit("INVENTORY", `Adjusted ${item.name}: ${item.qty} → ${q}`);
  };

  const addItem = () => {
    if (!newItem.name.trim()) { notify("Name required","error"); return; }
    const item = { ...newItem, id: `inv${Date.now()}`, lastRestocked: Date.now() };
    setInventory(prev => [...prev, item]);
    addAudit("INVENTORY", `Added new item: ${item.name}`);
    notify(`${item.name} added to inventory`);
    setShowAdd(false);
    setNewItem({ name:"", category:"Consumable", unit:"pc", qty:0, minQty:5, costPerUnit:0, icon:"📦" });
  };

  const removeItem = (id) => {
    const item = inventory.find(i => i.id === id);
    setInventory(prev => prev.filter(i => i.id !== id));
    addAudit("INVENTORY", `Removed item: ${item.name}`);
    notify(`${item.name} removed`);
    setEditId(null);
  };

  const totalValue = inventory.reduce((s,i) => s + i.qty * i.costPerUnit, 0);
  const outCount   = inventory.filter(i => i.qty === 0).length;
  const lowCount   = inventory.filter(i => i.qty > 0 && i.qty <= i.minQty).length;

  return (
    <div style={{ padding:24 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"var(--text)" }}>📦 Inventory</h2>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#64748B" }}>Track supplies and get low-stock alerts</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ padding:"8px 18px", fontSize:13 }}>+ Add Item</button>
      </div>

      {/* KPI Strip */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Total Items",    value:inventory.length,          color:"#38BDF8", icon:"📦" },
          { label:"Out of Stock",   value:outCount,                  color:"#EF4444", icon:"🚫" },
          { label:"Low Stock",      value:lowCount,                  color:"#F97316", icon:"⚠️" },
          { label:"Stock Value",    value:`₱${totalValue.toLocaleString()}`, color:"#10B981", icon:"💰" },
        ].map((k,i) => (
          <div key={i} className="card" style={{ borderLeft:`3px solid ${k.color}`, padding:"12px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:10, color:"#64748B", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>{k.label}</div>
                <div style={{ fontSize:22, fontWeight:800, color:k.color }}>{k.value}</div>
              </div>
              <span style={{ fontSize:22 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[["all","All Items"],["low","Low Stock"],["out","Out of Stock"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding:"6px 14px", borderRadius:6, border:`1px solid ${filter===v?"var(--accent)":"#334155"}`, background: filter===v?"color-mix(in srgb, var(--accent) 15%, var(--card))":"transparent", color: filter===v?"var(--accent)":"#64748B", cursor:"pointer", fontSize:13, fontWeight: filter===v?700:400 }}>
            {l} {v==="low"&&lowCount>0?`(${lowCount})`:v==="out"&&outCount>0?`(${outCount})`:""}
          </button>
        ))}
      </div>

      {/* Add Item Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom:16, border:"1px solid #38BDF840" }}>
          <h4 style={{ margin:"0 0 14px", color:"#38BDF8", fontSize:14 }}>➕ New Inventory Item</h4>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
            <div style={{ gridColumn:"1 / -1" }}>
              <label style={{ fontSize:11, color:"#94A3B8", display:"block", marginBottom:4 }}>Item Name *</label>
              <input value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} placeholder="e.g. Ariel Detergent 2kg" className="input" />
            </div>
            <div>
              <label style={{ fontSize:11, color:"#94A3B8", display:"block", marginBottom:4 }}>Category</label>
              <select value={newItem.category} onChange={e=>setNewItem(p=>({...p,category:e.target.value}))} className="input">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:"#94A3B8", display:"block", marginBottom:4 }}>Unit</label>
              <input value={newItem.unit} onChange={e=>setNewItem(p=>({...p,unit:e.target.value}))} placeholder="bag, bottle, pc…" className="input" />
            </div>
            <div>
              <label style={{ fontSize:11, color:"#94A3B8", display:"block", marginBottom:4 }}>Icon</label>
              <select value={newItem.icon} onChange={e=>setNewItem(p=>({...p,icon:e.target.value}))} className="input">
                {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:"#94A3B8", display:"block", marginBottom:4 }}>Current Qty</label>
              <input type="number" value={newItem.qty} onChange={e=>setNewItem(p=>({...p,qty:parseInt(e.target.value)||0}))} className="input" />
            </div>
            <div>
              <label style={{ fontSize:11, color:"#94A3B8", display:"block", marginBottom:4 }}>Min Qty (alert below)</label>
              <input type="number" value={newItem.minQty} onChange={e=>setNewItem(p=>({...p,minQty:parseInt(e.target.value)||0}))} className="input" />
            </div>
            <div>
              <label style={{ fontSize:11, color:"#94A3B8", display:"block", marginBottom:4 }}>Cost / Unit (₱)</label>
              <input type="number" value={newItem.costPerUnit} onChange={e=>setNewItem(p=>({...p,costPerUnit:parseFloat(e.target.value)||0}))} className="input" />
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={addItem} className="btn-primary" style={{ flex:1 }}>Add Item</button>
            <button onClick={()=>setShowAdd(false)} style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid #334155", background:"transparent", color:"#94A3B8", cursor:"pointer", fontSize:13 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Inventory List */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#64748B", fontSize:14 }}>
            {filter === "out" ? "🎉 Nothing out of stock!" : filter === "low" ? "✅ All items well stocked!" : "No inventory items yet."}
          </div>
        )}
        {filtered.map(item => {
          const st = stockStatus(item);
          const pct = Math.min(100, Math.round((item.qty / Math.max(item.minQty * 2, 1)) * 100));
          const isEditing = editId === item.id;
          const isRestocking = restockId === item.id;
          const daysSince = Math.floor((Date.now() - item.lastRestocked) / 86400000);

          return (
            <div key={item.id} className="card" style={{ border:`1px solid ${st.border}`, padding:"14px 16px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                {/* Icon + name */}
                <div style={{ fontSize:28, flexShrink:0 }}>{item.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                    <span style={{ fontWeight:700, fontSize:14, color:"var(--text)" }}>{item.name}</span>
                    <span style={{ padding:"1px 8px", borderRadius:10, fontSize:10, fontWeight:700, background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>{st.label}</span>
                    {item.category && <span style={{ fontSize:10, color:"#64748B", padding:"1px 6px", borderRadius:6, border:"1px solid #334155" }}>{item.category}</span>}
                  </div>
                  {/* Stock bar */}
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, height:6, background:"#1E293B", borderRadius:3 }}>
                      <div style={{ width:`${pct}%`, height:"100%", borderRadius:3, background: item.qty===0?"#EF4444": item.qty<=item.minQty?"#F97316":"#10B981", transition:"width 0.4s ease" }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:st.color, minWidth:70, textAlign:"right" }}>
                      {item.qty} / {item.minQty * 2} {item.unit}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color:"#64748B", marginTop:3 }}>
                    Min: {item.minQty} {item.unit} · ₱{item.costPerUnit}/unit · Value: ₱{(item.qty * item.costPerUnit).toLocaleString()} · Last restocked: {daysSince === 0 ? "today" : `${daysSince}d ago`}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  <button onClick={() => { setRestockId(isRestocking?null:item.id); setRestockQty(""); setEditId(null); }}
                    style={{ padding:"5px 12px", borderRadius:6, border:"1px solid #10B981", background: isRestocking?"#10B98120":"transparent", color:"#10B981", cursor:"pointer", fontSize:12, fontWeight:700 }}>
                    + Restock
                  </button>
                  <button onClick={() => { setEditId(isEditing?null:item.id); setRestockId(null); }}
                    style={{ padding:"5px 12px", borderRadius:6, border:"1px solid #334155", background:"transparent", color:"#94A3B8", cursor:"pointer", fontSize:12 }}>
                    Edit
                  </button>
                </div>
              </div>

              {/* Restock panel */}
              {isRestocking && (
                <div style={{ marginTop:12, padding:"12px", background:"var(--bg)", borderRadius:8, border:"1px solid #10B98130", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:13, color:"#6EE7B7" }}>Add qty:</span>
                  <input type="number" value={restockQty} onChange={e=>setRestockQty(e.target.value)} placeholder="e.g. 10" className="input" style={{ width:100, marginBottom:0 }} />
                  <div style={{ display:"flex", gap:6 }}>
                    {[5,10,20,50].map(q => (
                      <button key={q} onClick={()=>setRestockQty(String(q))} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #334155", background: restockQty===String(q)?"#1E3A5F":"transparent", color: restockQty===String(q)?"#38BDF8":"#64748B", cursor:"pointer", fontSize:12 }}>+{q}</button>
                    ))}
                  </div>
                  <button onClick={() => doRestock(item.id)} className="btn-success" style={{ padding:"6px 16px", fontSize:13 }}>✓ Confirm</button>
                  <button onClick={()=>setRestockId(null)} style={{ padding:"6px 12px", borderRadius:6, border:"1px solid #334155", background:"transparent", color:"#94A3B8", cursor:"pointer", fontSize:13 }}>✕</button>
                </div>
              )}

              {/* Edit panel */}
              {isEditing && (
                <div style={{ marginTop:12, padding:12, background:"var(--bg)", borderRadius:8, border:"1px solid #334155" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:8 }}>
                    <div>
                      <label style={{ fontSize:10, color:"#94A3B8", display:"block", marginBottom:3 }}>Name</label>
                      <input value={item.name} onChange={e => setInventory(prev => prev.map(i => i.id===item.id?{...i,name:e.target.value}:i))} className="input" style={{ fontSize:12 }} />
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:"#94A3B8", display:"block", marginBottom:3 }}>Current Qty</label>
                      <input type="number" value={item.qty} onChange={e => doAdjust(item.id, e.target.value)} className="input" style={{ fontSize:12 }} />
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:"#94A3B8", display:"block", marginBottom:3 }}>Min Qty</label>
                      <input type="number" value={item.minQty} onChange={e => setInventory(prev => prev.map(i => i.id===item.id?{...i,minQty:parseInt(e.target.value)||0}:i))} className="input" style={{ fontSize:12 }} />
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:"#94A3B8", display:"block", marginBottom:3 }}>Cost/Unit (₱)</label>
                      <input type="number" value={item.costPerUnit} onChange={e => setInventory(prev => prev.map(i => i.id===item.id?{...i,costPerUnit:parseFloat(e.target.value)||0}:i))} className="input" style={{ fontSize:12 }} />
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>setEditId(null)} className="btn-primary" style={{ flex:1, padding:"7px", fontSize:12 }}>✓ Done</button>
                    <button onClick={() => removeItem(item.id)} style={{ padding:"7px 14px", borderRadius:6, border:"1px solid #EF4444", background:"transparent", color:"#EF4444", cursor:"pointer", fontSize:12 }}>🗑 Remove</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --bg:      #0F172A;
    --sidebar: #0B1120;
    --card:    #131B2E;
    --border:  #1E293B;
    --accent:  #38BDF8;
    --accent2: #6366F1;
    --text:    #F1F5F9;
    --subtext: #94A3B8;
    --muted:   #64748B;
  }

  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); transition: background 0.3s, color 0.3s; }

  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    transition: background 0.3s, border-color 0.3s;
  }

  .input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.15s, background 0.3s;
  }
  .input:focus { border-color: var(--accent); }
  .input option { background: var(--card); color: var(--text); }

  .btn-primary {
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: opacity 0.15s;
  }
  .btn-primary:hover { opacity: 0.88; }

  .btn-success {
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, #059669, #10B981);
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: opacity 0.15s;
  }
  .btn-success:hover { opacity: 0.9; }

  .action-btn {
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--border);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }
  .action-btn.primary {
    background: color-mix(in srgb, var(--accent) 12%, var(--card));
    border-color: color-mix(in srgb, var(--accent) 30%, transparent);
    color: var(--accent);
  }
  .action-btn.secondary {
    background: var(--card);
    color: var(--text);
  }
  .action-btn:hover { transform: translateY(-1px); border-color: var(--accent); }

  .staff-tile {
    width: 100px;
    padding: 16px 12px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--card);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s;
    text-align: center;
  }
  .staff-tile:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 15%, var(--card)); transform: translateY(-2px); }

  .pin-btn {
    padding: 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.1s;
  }
  .pin-btn:active { background: var(--border); transform: scale(0.95); }

  .notif {
    position: fixed;
    top: 16px;
    right: 16px;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    z-index: 10000;
    animation: slideIn 0.2s ease;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }
  .notif-success { background: #052e16; border: 1px solid #10B981; color: #6EE7B7; }
  .notif-error   { background: #450a0a; border: 1px solid #EF4444; color: #FCA5A5; }
  .notif-info    { background: #0c1a2e; border: 1px solid var(--accent); color: var(--accent); }

  /* Theme transition on all major containers */
  nav, main, aside, header, footer, section,
  [data-theme-bg] { transition: background 0.35s ease, border-color 0.35s ease, color 0.25s ease; }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .spin { animation: spin 1s linear infinite; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--subtext); }
`;
