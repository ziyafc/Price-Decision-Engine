// File: updateLastCheckedAt.js

const { supabase } = require('./supabaseClient');

async function updateLastCheckedAt() {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('scheduler_config')
    .update({ last_checked_at: now })
    .eq('name', 'price_engine');

  if (error) {
    console.error('[UPDATE_LAST_CHECKED_AT_FAILED]', error.message);
    throw error;
  }
  console.log('✅ Updated last_checked_at in scheduler_config');
}

module.exports = { updateLastCheckedAt };
