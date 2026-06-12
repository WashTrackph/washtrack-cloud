import type { Shop, PayMethod, Service, Stage, SmsTemplates, Staff, Customer, InventoryItem, SupplyRule, ThemePreset, EmailConfig, EmailProvider } from "../lib/types";

export const SEED_SHOP: Shop = {
  name: "My Laundry Shop",
  address: "123 Main St, Your City",
  phone: "",
  logo: null,
  ownerPin: "1234",
  managerPin: "5678",
  currency: "\u20B1",
  locale: "en-PH",
  cashDenominations: [100, 200, 500, 1000],
  overstayWarnHrs: 24,
  overstayAlertHrs: 48,
  overstayCritHrs: 72,
  autoSmsReady: true,
  autoSmsReceipt: true,
  smsApiKey: "",
  smsSenderName: "SEMAPHORE",
  autoEmailEndOfShift: false,
  autoEmailDaily: false,
  autoEmailWeekly: false,
  autoEmailMonthly: false,
  autoEmailPeriodic: false,
  periodicIntervalHours: 4,
  workHoursStart: "08:00",
  workHoursEnd: "22:00",
  shiftEndTime: "22:00",
};

export const SEED_PAYMETHODS: PayMethod[] = [
  { id: "pm1", label: "Cash",        icon: "ðŸ’µ", isCash: true,  color: "#10B981", active: true, sortOrder: 0 },
  { id: "pm2", label: "GCash",       icon: "ðŸ“±", isCash: false, color: "#3B82F6", active: true, sortOrder: 1 },
  { id: "pm3", label: "Maya",        icon: "ðŸ’œ", isCash: false, color: "#8B5CF6", active: true, sortOrder: 2 },
  { id: "pm4", label: "Credit Card", icon: "ðŸ’³", isCash: false, color: "#F59E0B", active: true, sortOrder: 3 },
];

export const SEED_SERVICES: Service[] = [
  { id: "s1", name: "Wash & Dry",   pricingType: "PER_KG",    basePrice: 65,  minKg: 4, expressMultiplier: 1.5, active: true, color: "#3B82F6", sortOrder: 0 },
  { id: "s2", name: "Wash Only",    pricingType: "PER_KG",    basePrice: 40,  minKg: 4, expressMultiplier: 1.5, active: true, color: "#10B981", sortOrder: 1 },
  { id: "s3", name: "Dry Only",     pricingType: "PER_KG",    basePrice: 30,  minKg: 4, expressMultiplier: 1.5, active: true, color: "#8B5CF6", sortOrder: 2 },
  { id: "s4", name: "Premium Wash", pricingType: "PER_KG",    basePrice: 95,  minKg: 3, expressMultiplier: 2.0, active: true, color: "#F59E0B", sortOrder: 3 },
  { id: "s5", name: "Folding",      pricingType: "FLAT",       basePrice: 50,  minKg: 0, expressMultiplier: 1.0, active: true, color: "#EC4899", sortOrder: 4 },
  { id: "s6", name: "7kg Load",     pricingType: "FIXED_LOAD", basePrice: 120, minKg: 7, expressMultiplier: 1.5, active: true, color: "#06B6D4", sortOrder: 5 },
  { id: "s7", name: "8kg Load",     pricingType: "FIXED_LOAD", basePrice: 135, minKg: 8, expressMultiplier: 1.5, active: true, color: "#F97316", sortOrder: 6 },
];

export const SEED_STAGES: Stage[] = [
  { id: 1, label: "Received",   icon: "ðŸ“¥", color: "#6B7280", order: 0 },
  { id: 2, label: "Washing",    icon: "ðŸ«§", color: "#3B82F6", order: 1 },
  { id: 3, label: "Drying",     icon: "ðŸ’¨", color: "#F59E0B", order: 2 },
  { id: 4, label: "Folding",    icon: "ðŸ‘•", color: "#8B5CF6", order: 3 },
  { id: 5, label: "Ready",      icon: "\u2705",        color: "#10B981", order: 4 },
  { id: 6, label: "Out for Delivery", icon: "ðŸšš", color: "#F97316", order: 5 },
  { id: 7, label: "Delivered",         icon: "ðŸŽ‰", color: "#6B7280", order: 6 },
];

export const SEED_SMS_TEMPLATES: SmsTemplates = {
  receipt:  "Hi {name}! Thank you for your order at {shop}! ðŸ§º Order #{order} - {kg}kg, Total: \u20B1{total}. We will text you once your laundry is ready. Follow us: {facebook}",
  ready:    "Hi {name}! Great news! Your laundry at {shop} is READY for pickup. \u2705 Order #{order}. Thank you and see you soon! ðŸ˜Š",
  reminder: "Hi {name}! Just a reminder \u2014 Order #{order} at {shop} is ready for pickup. Please pick up at your earliest convenience. Thank you!",
  promo:    "Hi {name}! ðŸŽ‰ Special offer from {shop}: {message}. Visit us at {address}. Follow us: {facebook}",
  delivery: "Hi {name}! Your laundry from {shop} is on the way! Order #{order} is out for delivery. Please be available to receive it. Thank you!",
};

export const SEED_STAFF: Staff[] = [
  { id: "u1", name: "Owner",  role: "OWNER",   pin: "1234", active: true, avatar: "O" },
  { id: "u2", name: "Maria",  role: "MANAGER", pin: "5678", active: true, avatar: "M" },
  { id: "u3", name: "Juan",   role: "STAFF",   pin: "0000", active: true, avatar: "J" },
];

export const SEED_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Ana Reyes",     phone: "09171234001", visits: 12, totalSpend: 3840, lastVisit: Date.now() - 86400000 * 2,  promoOptIn: true },
  { id: "c2", name: "Ben Santos",    phone: "09281234002", visits: 5,  totalSpend: 1500, lastVisit: Date.now() - 86400000 * 7,  promoOptIn: true },
  { id: "c3", name: "Cita Dela Cruz",phone: "09181234003", visits: 23, totalSpend: 7820, lastVisit: Date.now() - 86400000 * 1,  promoOptIn: false },
  { id: "c4", name: "Dino Garcia",   phone: "09271234004", visits: 3,  totalSpend: 870,  lastVisit: Date.now() - 86400000 * 14, promoOptIn: true },
];

export const SEED_INVENTORY: InventoryItem[] = [
  { id: "inv1", name: "Detergent (Ariel 2kg)",      category: "Consumable", unit: "bag",    qty: 0, minQty: 5,  costPerUnit: 95,  icon: "ðŸ§´", lastRestocked: Date.now() },
  { id: "inv2", name: "Fabric Softener (Downy 1L)", category: "Consumable", unit: "bottle", qty: 0, minQty: 4,  costPerUnit: 85,  icon: "ðŸ«§", lastRestocked: Date.now() },
  { id: "inv3", name: "Bleach (Pride 1L)",           category: "Consumable", unit: "bottle", qty: 0, minQty: 4,  costPerUnit: 35,  icon: "ðŸ§ª", lastRestocked: Date.now() },
  { id: "inv4", name: "Plastic Bags (Large)",        category: "Packaging",  unit: "pc",     qty: 0, minQty: 30, costPerUnit: 2,   icon: "ðŸ›", lastRestocked: Date.now() },
  { id: "inv5", name: "Laundry Pins",                category: "Equipment",  unit: "pack",   qty: 0, minQty: 5,  costPerUnit: 45,  icon: "ðŸ“Œ", lastRestocked: Date.now() },
  { id: "inv6", name: "Hangers (Metal)",             category: "Equipment",  unit: "pc",     qty: 0, minQty: 20, costPerUnit: 8,   icon: "ðŸª", lastRestocked: Date.now() },
  { id: "inv7", name: "Receipt Paper (58mm)",        category: "Consumable", unit: "roll",   qty: 0, minQty: 3,  costPerUnit: 25,  icon: "ðŸ§¾", lastRestocked: Date.now() },
  { id: "inv8", name: "Stain Remover Spray",         category: "Consumable", unit: "bottle", qty: 0, minQty: 3,  costPerUnit: 120, icon: "ðŸ’§", lastRestocked: Date.now() },
];

export const SEED_SUPPLY_RULES: SupplyRule[] = [
  { id: "sr1", name: "Detergent per kg",      invId: "inv1", perKg: 0.05,  perLoad: 0.35, perOrder: 0,   appliesTo: ["s1","s2","s4","s6","s7"] },
  { id: "sr2", name: "Fabric Softener per kg", invId: "inv2", perKg: 0.03,  perLoad: 0.25, perOrder: 0,   appliesTo: ["s1","s4","s6","s7"] },
  { id: "sr3", name: "Plastic Bag per order",  invId: "inv4", perKg: 0,     perLoad: 0,    perOrder: 1,   appliesTo: ["all"] },
];

export const THEME_PRESETS: ThemePreset[] = [
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

export const DEFAULT_THEME = THEME_PRESETS[0];

// â”€â”€â”€ Email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const EMAIL_PROVIDERS: { id: EmailProvider; label: string; smtpHost: string; smtpPort: number; help: string }[] = [
  { id: "gmail",     label: "Gmail (Personal)",      smtpHost: "smtp.gmail.com",           smtpPort: 587, help: "Use an App Password: myaccount.google.com > Security > 2-Step Verification > App Passwords" },
  { id: "workspace", label: "Google Workspace",       smtpHost: "smtp.gmail.com",           smtpPort: 587, help: "Use an App Password or enable SMTP relay in Google Admin console" },
  { id: "outlook",   label: "Outlook / Hotmail",      smtpHost: "smtp-mail.outlook.com",    smtpPort: 587, help: "Use your regular Outlook password. Enable SMTP in Outlook settings if needed" },
  { id: "yahoo",     label: "Yahoo Mail",             smtpHost: "smtp.mail.yahoo.com",      smtpPort: 587, help: "Generate an App Password: login.yahoo.com > Account Security > App Passwords" },
  { id: "custom",    label: "Custom SMTP",            smtpHost: "",                          smtpPort: 587, help: "Enter your SMTP server details manually" },
];

export const SEED_EMAIL_CONFIG: EmailConfig = {
  enabled: false,
  provider: "gmail",
  email: "",
  password: "",
  smtpUser: "",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  fromName: "",
  reportTo: "",
  testVerified: false,
};

