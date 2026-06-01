// ─── DATA MODEL TYPES ────────────────────────────────────────────────────────

import type { HashedPin } from "./crypto";

export interface Shop {
  name: string;
  address: string;
  phone: string;
  logo: string | null;
  ownerPin: string | HashedPin;
  managerPin: string | HashedPin;
  currency: string;
  locale: string;
  cashDenominations: number[];
  overstayWarnHrs: number;
  overstayAlertHrs: number;
  overstayCritHrs: number;
  autoSmsReady: boolean;
  autoSmsReceipt: boolean;
  smsApiKey: string;
  smsSenderName: string;
  settingsPin?: string;
  autoEmailEndOfShift: boolean;
  autoEmailDaily: boolean;
  autoEmailWeekly: boolean;
  autoEmailMonthly: boolean;
  autoEmailPeriodic: boolean;
  periodicIntervalHours: number;   // e.g. 4 = every 4 hours
  workHoursStart: string;          // "HH:MM" — don't send before this
  workHoursEnd: string;            // "HH:MM" — don't send after this
  shiftEndTime: string;
  smsMockMode?: boolean;
  btPrinterAddress?: string;
  btPrinterName?: string;
  receiptPaperWidth?: number; // 58 or 80, default 58
}

export interface PayMethod {
  id: string;
  label: string;
  icon: string;
  isCash: boolean;
  color: string;
  active: boolean;
  sortOrder: number;
}

export interface Service {
  id: string;
  name: string;
  pricingType: "PER_KG" | "FLAT" | "FIXED_LOAD";
  basePrice: number;
  minKg: number;
  expressMultiplier: number;
  active: boolean;
  color: string;
  sortOrder: number;
}

export interface Stage {
  id: number;
  label: string;
  icon: string;
  color: string;
  order: number;
}

export interface SmsTemplates {
  receipt: string;
  ready: string;
  reminder: string;
  promo: string;
}

export interface Staff {
  id: string;
  name: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  pin: string | HashedPin;
  active: boolean;
  avatar: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  visits: number;
  totalSpend: number;
  lastVisit: number;
  promoOptIn: boolean;
}

export interface CartItem {
  id: string;
  serviceId: string;
  serviceName: string;
  pricingType: "PER_KG" | "FLAT" | "FIXED_LOAD";
  minKg: number;
  kg: number;
  qty: number;
  express: boolean;
  unitPrice: number;
  subtotal: number;
  color: string;
}

export interface Order {
  id: string;
  orderNum: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes: string;
  express: boolean;
  paymentMethod: string;
  paymentMethodId: string;
  isCashPayment: boolean;
  cashTendered: number | null;
  change: number | null;
  statusId: number;
  statusLabel: string;
  createdAt: number;
  statusUpdatedAt: number;
  createdBy: string;
  createdByName: string;
  paid: boolean;
  paidAt?: number;
  paidBy?: string;
  paidByName?: string;
  voided: boolean;
  voidReason?: string;
  voidedAt?: number;
  voidedBy?: string;
  pickedUpAt?: number;
  readySmsSent?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  qty: number;
  minQty: number;
  costPerUnit: number;
  icon: string;
  lastRestocked: number;
}

export interface SupplyRule {
  id: string;
  name: string;
  invId: string;
  perKg: number;
  perLoad: number;
  perOrder: number;
  appliesTo: string[];
}

export interface SmsLogEntry {
  id: string;
  phone: string;
  message: string;
  orderId: string | null;
  promoId?: string | null;
  status: string;
  messageId?: number | null;
  network?: string | null;
  at: number;
}

export interface Promotion {
  id: string;
  name: string;
  message: string;
  recipientIds: string[];
  sentCount: number;
  mockCount: number;
  skippedCount: number;
  filter: string;
  createdAt: number;
  createdBy: string;
}

export interface AuditLogEntry {
  id: string;
  type: string;
  desc: string;
  staffId: string;
  at: number;
}

export interface ThemePreset {
  id: string;
  name: string;
  bg: string;
  sidebar: string;
  card: string;
  border: string;
  accent: string;
  accent2: string;
  text: string;
  subtext: string;
  muted: string;
  mode: "dark" | "light";
}

export type EmailProvider = "gmail" | "workspace" | "outlook" | "yahoo" | "custom";

export interface EmailConfig {
  enabled: boolean;
  provider: EmailProvider;
  email: string;
  password: string;
  smtpUser: string;
  smtpHost: string;
  smtpPort: number;
  fromName: string;
  reportTo: string;
  testVerified: boolean;
}

export interface Overstay {
  hrs: number;
  level: "warn" | "alert" | "critical";
  color: string;
  label: string;
}
