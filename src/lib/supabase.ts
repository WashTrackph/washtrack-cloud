import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wumtebldafvivunpmpph.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bXRlYmxkYWZ2aXZ1bnBtcHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTM4MzksImV4cCI6MjA5NjkyOTgzOX0.cH9YAnWEkofLHvStgiNRRih7OMX5_e3CRM8K_7V8-o0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get or create a persistent shop identity (stored locally)
export function getShopId(): string {
  let id = localStorage.getItem("wt_shop_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wt_shop_id", id);
  }
  return id;
}
