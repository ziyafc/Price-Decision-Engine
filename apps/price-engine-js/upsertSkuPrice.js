const { supabase } = require("./supabaseClient");

async function upsertSkuPrice(price) {
  // DİKKAT: country_code da eklendi => onConflict: 'sku_id, currency_code, country_code'
  const { error } = await supabase
    .from("sku_prices")
    .upsert(
      {
        sku_id: price.sku_id,
        currency_code: price.currency_code,
        country_code: price.country_code, // <-- eklendi
        base_srp: price.base_srp,
        discount_rate: price.discount_rate,
        rev_share: price.rev_share,
        discounted_srp: price.discounted_srp,
        vat_rate: price.vat_rate,
        discounted_srp_wo_vat: price.discounted_srp_wo_vat,
        wsp: price.wsp,
        exchange_rate: price.exchange_rate,
        wsp_in_eur: price.wsp_in_eur,
        effective_price: price.effective_price,
        updated_at: price.updated_at,
      },
      { onConflict: "sku_id, currency_code, country_code" } // <-- güncellendi
    );
  if (error) {
    console.error(`[ERR_CODE: UPSERT_FAILED] Failed to upsert sku_price for ${price.sku_id}/${price.currency_code}/${price.country_code}`, error.message);
    throw error;
  }
  console.log(`✅ sku_price upserted for ${price.sku_id} ${price.currency_code} ${price.country_code}`);
}

module.exports = { upsertSkuPrice };
