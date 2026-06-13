import { supabase } from "./supabase";
import type { Order, Customer } from "./types";

async function getShopId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

async function getShopIdSync(): Promise<string> {
  return getShopId();
}

// ── Orders ──────────────────────────────────────────────────────────────────

export async function fetchRemoteOrders(): Promise<Order[]> {
  const shopId = await getShopId();
  const { data, error } = await supabase
    .from("wt_orders")
    .select("data")
    .eq("shop_id", shopId);
  if (error) throw error;
  return (data || []).map((r) => r.data as Order);
}

export async function upsertOrders(orders: Order[]): Promise<void> {
  if (!orders.length) return;
  const shopId = await getShopId();
  await supabase.from("wt_orders").upsert(
    orders.map((o) => ({
      id: o.id,
      shop_id: shopId,
      data: o,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "id,shop_id" }
  );
}

export async function upsertOrder(order: Order): Promise<void> {
  await upsertOrders([order]);
}

export async function subscribeOrders(callback: (order: Order, event: string) => void) {
  const shopId = await getShopIdSync();
  return supabase
    .channel(`wt_orders_${shopId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "wt_orders", filter: `shop_id=eq.${shopId}` },
      (payload) => {
        const row = payload.new as any;
        if (row?.data) callback(row.data as Order, payload.eventType);
      }
    )
    .subscribe();
}

// ── Customers ────────────────────────────────────────────────────────────────

export async function fetchRemoteCustomers(): Promise<Customer[]> {
  const shopId = await getShopId();
  const { data, error } = await supabase
    .from("wt_customers")
    .select("data")
    .eq("shop_id", shopId);
  if (error) throw error;
  return (data || []).map((r) => r.data as Customer);
}

export async function upsertCustomers(customers: Customer[]): Promise<void> {
  if (!customers.length) return;
  const shopId = await getShopId();
  await supabase.from("wt_customers").upsert(
    customers.map((c) => ({
      id: c.id,
      shop_id: shopId,
      data: c,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "id,shop_id" }
  );
}

export async function upsertCustomer(customer: Customer): Promise<void> {
  await upsertCustomers([customer]);
}

export async function subscribeCustomers(callback: (customer: Customer) => void) {
  const shopId = await getShopIdSync();
  return supabase
    .channel(`wt_customers_${shopId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "wt_customers", filter: `shop_id=eq.${shopId}` },
      (payload) => {
        const row = payload.new as any;
        if (row?.data) callback(row.data as Customer);
      }
    )
    .subscribe();
}
