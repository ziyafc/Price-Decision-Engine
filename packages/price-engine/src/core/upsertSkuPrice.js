// File: upsertSkuPrice.js
const { supabase } = require('../infra/supabaseClient');

/**
 * sku_prices: tek satır / sku_currency_id
 *  - UNIQUE (sku_currency_id) var.
 *  - upsert => INSERT ya da UPDATE, artık ön‑okuma yok.
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
    currency_code,
    country_code,
    sku_code,
    product_title,
  } = payload;

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
        currency_code,
        country_code,
        sku_code,
        product_title,
        updated_at: new Date().toISOString(), // tek güncelleme noktası
      },
      {
        onConflict: 'sku_currency_id',
      },
    )
    .select()
    .single();

  if (error) {
    console.error(
      `[upsertSkuPrice] Failed for sku_currency_id=${sku_currency_id}`,
      error.message,
    );
    throw error;
  }

  console.log(`✅ sku_price upserted for sku_currency_id=${sku_currency_id}`);
  return data;
}

module.exports = { upsertSkuPrice };
