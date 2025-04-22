// File: upsertSkuPrice.js

const { supabase } = require('../infra/supabaseClient');

/**
 * "sku_prices" tablosuna, sku_currency_id üzerinden upsert yapar.
 * Yeni eklenen alanlar: currency_code, country_code, sku_code, product_title
 */
async function upsertSkuPrice({
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
}) {
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
        currency_code,     // ✅ yeni alanlar
        country_code,      // ✅
        sku_code,          // ✅
        product_title      // ✅
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
