// apps/api/src/routes/skus.route.js
const express = require('express');
const router  = express.Router();

// Supabase client’ınızı projenin infra klasöründen alın
const { supabase } = require('../../../../packages/price-engine/src/infra/supabaseClient');

/**
 * POST /api/skus/:sku_id/update
 * Body: { entries: [ {currency_code, country_code, srp, is_default}, … ] }
 */
router.post('/:sku_id/update', async (req, res) => {
  const sku_id = req.params.sku_id;
  const entries = req.body.entries;

  if (!Array.isArray(entries)) {
    return res.status(400).json({ error: "'entries' must be an array" });
  }

  // RPC’i çağır
  const { error } = await supabase.rpc('update_sku', {
    p_sku_id:  sku_id,
    p_entries: entries
  });

  if (error) {
    console.error('[update_sku RPC error]', error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.json({ success: true });
});

module.exports = router;
