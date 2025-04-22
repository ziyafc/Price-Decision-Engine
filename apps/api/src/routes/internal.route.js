const express = require('express');
const router  = express.Router();

// --- cronRunner’i içeri al ---
const { cronRunner } = require('../../../../packages/price-engine/src/workers/cronRunner.js');

/**
 * Elle tetiklenen cron:
 * 1) promoStatusTick  2) price‑engine kuyruk  3) last_checked_at güncelle
 */
router.get('/cron', async (_, res) => {
  try {
    await cronRunner();
    res.send('Cron job finished ✅');
  } catch (err) {
    console.error('[ERR] manual cron', err);
    res.status(500).send('Cron error');
  }
});

module.exports = router;
