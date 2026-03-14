// ─── Email Report Scheduler ──────────────────────────────────────────────────
// Checks auto-email flags against last-sent timestamps and sends reports when due.

import type { Shop, Order, Customer, Staff, Service, PayMethod, Stage, InventoryItem, SmsLogEntry, AuditLogEntry, EmailConfig } from "./types";
import { buildReportData, type ReportPeriod } from "./reportBuilder";
import { buildReportHTML } from "./reportTemplate";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LastEmailSent {
  daily: number;    // timestamp of last daily send
  weekly: number;   // timestamp of last weekly send
  monthly: number;  // timestamp of last monthly send
  shift: number;    // timestamp of last end-of-shift send
}

export const EMPTY_LAST_SENT: LastEmailSent = { daily: 0, weekly: 0, monthly: 0, shift: 0 };

interface SchedulerState {
  shop: Shop;
  emailConfig: EmailConfig;
  orders: Order[];
  customers: Customer[];
  staff: Staff[];
  services: Service[];
  payMethods: PayMethod[];
  stages: Stage[];
  inventory: InventoryItem[];
  smsLog: SmsLogEntry[];
  auditLog: AuditLogEntry[];
  lastSent: LastEmailSent;
}

// ─── Period Check Logic ──────────────────────────────────────────────────────

function startOfDay(d = new Date()): number {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

function isDailyDue(lastSent: number): boolean {
  return lastSent < startOfDay();
}

function isWeeklyDue(lastSent: number): boolean {
  const now = new Date();
  if (now.getDay() !== 0) return false;
  return lastSent < startOfDay();
}

function isMonthlyDue(lastSent: number): boolean {
  const now = new Date();
  if (now.getDate() !== 1) return false;
  return lastSent < startOfDay();
}

// ─── Send Email via Tauri ────────────────────────────────────────────────────

async function sendViaTauri(
  emailConfig: EmailConfig,
  shop: Shop,
  subject: string,
  bodyHtml: string,
): Promise<void> {
  if (!(window as any).__TAURI_INTERNALS__) {
    throw new Error("Email sending requires Tauri (not available in browser dev mode)");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  const sendTo = emailConfig.reportTo || shop.reportEmail || emailConfig.email;
  await invoke("send_email", {
    payload: {
      smtp_host: emailConfig.smtpHost,
      smtp_port: emailConfig.smtpPort,
      smtp_user: emailConfig.smtpUser || emailConfig.email,
      smtp_pass: emailConfig.password,
      from_name: emailConfig.fromName || shop.name,
      from_email: emailConfig.email,
      to_email: sendTo,
      subject,
      body_html: bodyHtml,
    },
  });
}

// ─── Build & Send a Report ───────────────────────────────────────────────────

export async function sendReport(
  period: ReportPeriod,
  state: Omit<SchedulerState, "lastSent">,
): Promise<void> {
  const { shop, emailConfig, orders, customers, staff, services, payMethods, stages, inventory, smsLog, auditLog } = state;

  const data = buildReportData(period, shop, orders, customers, staff, services, payMethods, stages, inventory, smsLog, auditLog);
  const html = buildReportHTML(data);

  const periodLabel = period === "today" ? "Daily" : period === "week" ? "Weekly" : "Monthly";
  const subject = `${shop.name} - ${periodLabel} Report (${data.periodLabel})`;

  await sendViaTauri(emailConfig, shop, subject, html);
}

// ─── Scheduler Check ─────────────────────────────────────────────────────────

export interface SchedulerResult {
  sent: string[];
  errors: string[];
  updatedLastSent: LastEmailSent;
}

export async function checkAndSendReports(state: SchedulerState): Promise<SchedulerResult> {
  const { shop, emailConfig, lastSent } = state;
  const sent: string[] = [];
  const errors: string[] = [];
  const updatedLastSent = { ...lastSent };

  // Guard: skip if email not configured or not verified
  if (!emailConfig.enabled || !emailConfig.testVerified) return { sent, errors, updatedLastSent };
  if (!emailConfig.email || !emailConfig.password) return { sent, errors, updatedLastSent };

  const reportState = {
    shop, emailConfig,
    orders: state.orders, customers: state.customers, staff: state.staff,
    services: state.services, payMethods: state.payMethods, stages: state.stages,
    inventory: state.inventory, smsLog: state.smsLog, auditLog: state.auditLog,
  };

  // Daily
  if (shop.autoEmailDaily && isDailyDue(lastSent.daily)) {
    try {
      await sendReport("today", reportState);
      updatedLastSent.daily = Date.now();
      sent.push("Daily report");
    } catch (err: any) {
      errors.push(`Daily report failed: ${err?.message || err}`);
    }
  }

  // Weekly
  if (shop.autoEmailWeekly && isWeeklyDue(lastSent.weekly)) {
    try {
      await sendReport("week", reportState);
      updatedLastSent.weekly = Date.now();
      sent.push("Weekly report");
    } catch (err: any) {
      errors.push(`Weekly report failed: ${err?.message || err}`);
    }
  }

  // Monthly
  if (shop.autoEmailMonthly && isMonthlyDue(lastSent.monthly)) {
    try {
      await sendReport("month", reportState);
      updatedLastSent.monthly = Date.now();
      sent.push("Monthly report");
    } catch (err: any) {
      errors.push(`Monthly report failed: ${err?.message || err}`);
    }
  }

  return { sent, errors, updatedLastSent };
}
