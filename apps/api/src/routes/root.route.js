const express = require('express');
const router  = express.Router();
const { supabase } = require('../../../../packages/price-engine/src/infra/supabaseClient');

// helper → cron’un son çalıştığı zaman
async function getLastCron() {
  const { data, error } = await supabase
    .from('scheduler_config')
    .select('last_checked_at')
    .maybeSingle();

  if (error || !data?.last_checked_at) {
    return { ok: false, message: error ? error.message : 'no row' };
  }
  return { ok: true, lastCheckedAt: data.last_checked_at };
}

router.get('/', async (_, res) => {
  // 1) cron
  const cron = await getLastCron();

  // 2) Supabase basit select
  const { error } = await supabase.from('skus').select('id').limit(1);
  const db = error ? { ok: false, message: error.message } : { ok: true };

  // basit HTML çıktısı
  res.send(`
    <h2>Price‑Engine Status</h2>
    <p>Cron heartbeat : <strong>${cron.ok ? cron.lastCheckedAt : 'ERROR'}</strong></p>
    <p>Last sync      : <strong>${new Date().toISOString()}</strong></p>
    <p>Supabase DB    : <strong>${db.ok ? 'connected ✅' : 'error ❌'}</strong></p>
    <hr>
    <p><a href="/dashboard">Open full dashboard</a></p>
  `);
});

module.exports = router;
