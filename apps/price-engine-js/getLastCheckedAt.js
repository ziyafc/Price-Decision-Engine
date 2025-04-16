// File: getLastCheckedAt.js

const { supabase } = require('./supabaseClient');

async function getLastCheckedAt() {
  const { data, error } = await supabase
    .from('scheduler_config')
    .select('last_checked_at')
    .eq('name', 'price_engine')
    .maybeSingle();

  if (error || !data?.last_checked_at) {
    console.warn('Fallback to now for last_checked_at due to error or missing config.');
    return new Date().toISOString();
  }
  return data.last_checked_at;
}

module.exports = { getLastCheckedAt };
