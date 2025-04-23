/**
 * apps/api/src/routes/skus.route.js
 * ---------------------------------
 *  SKU price listesi + güncelleme endpoint’leri
 */
const express  = require('express');
const router   = express.Router();

/* Supabase istemcisi – projenizdeki gerçek yolu kontrol edin */
const { supabase } = require('../../../../packages/price-engine/src/infra/supabaseClient');

/* ------------------------------------------------------------------ */
/*  Küçük yardımcı: uniqBy                                            */
/* ------------------------------------------------------------------ */
function uniqBy(arr, keyFn) {
  const m = new Map();
  arr.forEach((it) => {
    const k = keyFn(it);
    if (!m.has(k)) m.set(k, it);
  });
  return Array.from(m.values());
}

/* ================================================================== */
/*  1)  GET /api/skus?page=1&limit=200                                */
/* ================================================================== */
router.get('/', async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page  || '1', 10);
    const limit  = parseInt(req.query.limit || '200', 10);
    const offset = (page - 1) * limit;

    /* Front-end’in ihtiyaç duyduğu nested select */
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

    /* Toplam satır sayısı -> header */
    res.setHeader('X-Total-Count', count ?? 0);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/* ================================================================== */
/*  2)  POST /api/skus/:sku_id/update                                 */
/*      Body: { entries:[{currency_code,country_code,srp,is_default}] }*/
/* ================================================================== */
router.post('/:sku_id/update', async (req, res, next) => {
  try {
    const sku_id  = req.params.sku_id;
    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];

    /* -------------------------------------------------------------- */
    /*  İlgili SKU’nun product_id’sini tek sorguda alıyoruz           */
    /* -------------------------------------------------------------- */
    const { data: skuRow, error: skuErr } = await supabase
      .from('skus')
      .select('product_id')
      .eq('id', sku_id)
      .maybeSingle();

    if (skuErr)  throw skuErr;
    if (!skuRow) return res.status(404).json({ error: 'SKU not found' });
    const product_id = skuRow.product_id;

    /* -------------------------------------------------------------- */
    /*  1) Silinecek ve upsert edilecek kayıtları grupla              */
    /* -------------------------------------------------------------- */
    const deletes = [];
    const upserts = [];

    entries.forEach((e) => {
      if (!e.currency_code) return; // zorunlu alan

      const cc = e.country_code ?? null;
      if (e.srp > 0) {
        upserts.push({
          sku_id,
          currency_code: e.currency_code,
          country_code : cc,
          srp          : e.srp,
          is_default   : !!e.is_default,
        });
      } else {
        deletes.push({ sku_id, currency_code: e.currency_code, country_code: cc });
      }
    });

    /* -------------------------------------------------------------- */
    /*  1.1  Silmeler                                                 */
    /* -------------------------------------------------------------- */
    for (const d of uniqBy(deletes, x => `${x.currency_code}|${x.country_code}`)) {
      let q1 = supabase.from('sku_currencies').delete()
        .eq('sku_id', sku_id)
        .eq('currency_code', d.currency_code);

      d.country_code === null
        ? (q1 = q1.is('country_code', null))
        : (q1 = q1.eq('country_code', d.country_code));

      const { error: delErr1 } = await q1;
      if (delErr1) throw delErr1;

      let q2 = supabase.from('sku_countries').delete()
        .eq('sku_id', sku_id)
        .eq('currency_code', d.currency_code);

      d.country_code === null
        ? (q2 = q2.is('country_code', null))
        : (q2 = q2.eq('country_code', d.country_code));

      const { error: delErr2 } = await q2;
      if (delErr2) throw delErr2;
    }

    /* -------------------------------------------------------------- */
    /*  1.2  Upsert işlemleri                                         */
    /* -------------------------------------------------------------- */
    if (upserts.length) {
      const uniq = uniqBy(upserts, u => `${u.currency_code}|${u.country_code}`);

      /* sku_currencies */
      const { error: upErr1 } = await supabase
        .from('sku_currencies')
        .upsert(uniq, {
          onConflict: ['sku_id', 'currency_code', 'country_code'],
        });
      if (upErr1) throw upErr1;

      /* sku_countries – NOT NULL product_id artık ekleniyor */
      const { error: upErr2 } = await supabase
        .from('sku_countries')
        .upsert(
          uniq
            .filter(u => u.country_code !== null)      // NULL satırı country tablosuna yazma
            .map(u => ({
              sku_id,
              product_id,                     // ← Zorunlu alan dolu
              currency_code: u.currency_code,
              country_code : u.country_code,
              is_active    : true,
            })),
          { onConflict: ['sku_id', 'country_code', 'currency_code'] }
        );
      if (upErr2) throw upErr2;
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
