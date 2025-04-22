const express = require('express');
const router  = express.Router();
const { supabase } = require('../../../../packages/price-engine/src/infra/supabaseClient');

// JSON status
router.get('/status', async (_, res) => {
  const { data, error } = await supabase
    .from('scheduler_config')
    .select('last_checked_at')
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ lastCheckedAt: data?.last_checked_at, serverTime: new Date().toISOString() });
});

// Static dashboard page
const path = require('path');
router.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

module.exports = router;
