const { supabase } = require("./supabaseClient");

async function getLastCheckedAt() {
  const { data, error } = await supabase
    .from("scheduler_config")
    .select("last_checked_at")
    .eq("name", "price_engine")
    .maybeSingle();

  if (error || !data?.last_checked_at) {
    console.warn("Fallback to now for last_checked_at due to error or missing config.");
    return new Date().toISOString();
  }
  return data.last_checked_at;
}

async function updateLastCheckedAt() {
  const { error } = await supabase
    .from("scheduler_config")
    .update({ last_checked_at: new Date().toISOString() })
    .eq("name", "price_engine");
  if (error) {
    console.error(`[ERR_CODE: UPDATE_LAST_CHECKED_AT_FAILED] Failed to update last_checked_at:`, error.message);
    throw error;
  }
  console.log("✅ Updated last_checked_at in scheduler_config");
}

module.exports = { getLastCheckedAt, updateLastCheckedAt };
