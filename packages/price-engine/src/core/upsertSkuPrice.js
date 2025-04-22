// File: upsertSkuPrice.js

const { supabase } = require('../infra/supabaseClient');

/**
 * "sku_prices" tablosuna, sku_currency_id üzerinden upsert yapar.
 * Eğer hesaplanan veriler mevcut değerle aynıysa, hiçbir şey yazmaz.
 */
async function upsertSkuPrice(payload) {
  const {
    sku_currency_id,
    base_srp,
    discount_rate,
    rev_share,
    discounted_srp,
    vat_rate,
    discounted_srp_wo_vat,
    wsp,
    exchange_rate,
    wsp_in_eur,
    effective_price,
    updated_at,
    currency_code,
    country_code,
    sku_code,
    product_title
  } = payload;

  // 1) Mevcut değerle karşılaştır
  const { data: existing, error: fetchError } = await supabase
    .from('sku_prices')
    .select('base_srp, discount_rate, rev_share, discounted_srp, vat_rate, discounted_srp_wo_vat, wsp, exchange_rate, wsp_in_eur, effective_price')
    .eq('sku_currency_id', sku_currency_id)
    .maybeSingle();

  if (fetchError) {
    console.error(`[upsertSkuPrice] Fetch error for sku_currency_id=${sku_currency_id}`, fetchError.message);
    throw fetchError;
  }

  const isSame =
    existing &&
    existing.base_srp === base_srp &&
    existing.discount_rate === discount_rate &&
    existing.rev_share === rev_share &&
    existing.discounted_srp === discounted_srp &&
    existing.vat_rate === vat_rate &&
    existing.discounted_srp_wo_vat === discounted_srp_wo_vat &&
    existing.wsp === wsp &&
    existing.exchange_rate === exchange_rate &&
    existing.wsp_in_eur === wsp_in_eur &&
    existing.effective_price === effective_price;

  if (isSame) {
    console.log(`🟡 No change for sku_currency_id=${sku_currency_id} — skipping upsert`);
    return existing;
  }

  // 2) Fark varsa upsert et
  const { data, error } = await supabase
    .from('sku_prices')
    .upsert(
      {
        sku_currency_id,
        base_srp,
        discount_rate,
        rev_share,
        discounted_srp,
        vat_rate,
        discounted_srp_wo_vat,
        wsp,
        exchange_rate,
        wsp_in_eur,
        effective_price,
        updated_at,
        currency_code,
        country_code,
        sku_code,
        product_title
      },
      {
        onConflict: 'sku_currency_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error(`[upsertSkuPrice] Failed for sku_currency_id=${sku_currency_id}`, error.message);
    throw error;
  }

  console.log(`✅ sku_price upserted for sku_currency_id=${sku_currency_id}`);
  return data;
}

module.exports = { upsertSkuPrice };
