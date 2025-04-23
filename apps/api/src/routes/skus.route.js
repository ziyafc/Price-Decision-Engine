// apps/api/src/routes/skus.route.js
const express  = require('express');
const router   = express.Router();
const { supabase } = require('../../../../packages/price-engine/src/infra/supabaseClient');

/* ------------------------------------------------------------------ */
/*  GET /api/skus?page=1&limit=200  – listeleme (mevcut kod)           */
/* ------------------------------------------------------------------ */
router.get('/', async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page  || '1', 10);
    const limit  = parseInt(req.query.limit || '200', 10);
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('sku_prices')
      .select(`
        *,
        sku_currency:sku_currency_id (
          sku_id, country_code, currency_code, srp, is_default,
          sku:sku_id (
            id, code,
            product:products (
              title, product_type, rev_share_override,
              promotion_products (
                discount,
                promotion:promotions (
                  start_date, end_date, start_time, end_time, status
                )
              )
            ),
            organization:organizations ( id, name, rev_share )
          )
        )
      `, { count: 'exact' })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.setHeader('X-Total-Count', count ?? 0);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/skus/:sku_id/update  – tek SKU güncelle                  */
/* ------------------------------------------------------------------ */
router.post('/:sku_id/update', async (req, res, next) => {
  try {
    const sku_id  = req.params.sku_id;
    const entries = req.body.entries;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'entries array required' });
    }

    // 1) Silinecek ve eklenecekleri ayır
    const deletes = entries.filter(e => Number(e.srp) <= 0);
    const upserts = entries.filter(e => Number(e.srp) >  0);

    /* ---------- 1.1  Silmeler ---------- */
    for (const d of deletes) {
      const { error: delErr1 } = await supabase
        .from('sku_currencies')
        .delete()
        .eq('sku_id', sku_id)
        .eq('currency_code', d.currency_code)
        .is('country_code', d.country_code);   // NULL için .is()

      if (delErr1) throw delErr1;

      const { error: delErr2 } = await supabase
        .from('sku_countries')
        .delete()
        .eq('sku_id', sku_id)
        .eq('currency_code', d.currency_code)
        .is('country_code', d.country_code);

      if (delErr2) throw delErr2;
    }

    /* ---------- 1.2  Upsert ---------- */
    if (upserts.length) {
      // sku_currencies
      const { error: upErr1 } = await supabase
        .from('sku_currencies')
        .upsert(
          upserts.map(u => ({
            sku_id,
            currency_code : u.currency_code,
            country_code  : u.country_code,
            srp           : u.srp,
            is_default    : u.is_default,
          })), { onConflict: ['sku_id', 'currency_code', 'country_code'] }
        );
      if (upErr1) throw upErr1;

      // sku_countries
      const { error: upErr2 } = await supabase
        .from('sku_countries')
        .upsert(
          upserts
            .filter(u => u.country_code !== null)   // sadece gerçek ülke satırları
            .map(u => ({
              sku_id,
              currency_code: u.currency_code,
              country_code : u.country_code,
              is_active    : true,
              product_id   : null   // varsa kolonlarınızı ekleyin
            })), { onConflict: ['sku_id', 'country_code', 'currency_code'] }
        );
      if (upErr2) throw upErr2;
    }

    return res.json({ ok: true, upserts: upserts.length, deletes: deletes.length });
  } catch (err) { return next(err); }
});

module.exports = router;
