import { supabase } from "./supabaseClient";

export async function getLastCheckedAt(): Promise<string> {
  const { data, error } = await supabase
    .from("scheduler_config")
    .select("last_checked_at")
    .eq("name", "price_engine")
    .maybeSingle();

  if (error || !data?.last_checked_at) {
    console.warn("[WARN_CODE: LAST_CHECKED_AT_FALLBACK]");
    return new Date().toISOString();
  }

  return data.last_checked_at;
}

export async function updateLastCheckedAt() {
  const { error } = await supabase
    .from("scheduler_config")
    .update({ last_checked_at: new Date().toISOString() })
    .eq("name", "price_engine");

  if (error) {
    console.error("[ERR_CODE: UPDATE_LAST_CHECKED_AT]", error.message);
    throw error;
  }

  console.log("🧭 lastCheckedAt updated");
}
