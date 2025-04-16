// File: skuCurrenciesService.js

const { supabase } = require('./supabaseClient');

/**
 * "sku_currencies" tablosunda (sku_id, currency_code, country_code) kaydı bulur.
 * Yoksa ekler. Tek satır döndürür (içinde id, srp vs.).
 * onConflict: "sku_id, currency_code, country_code" için tabloya UNIQUE(...) eklenmelidir.
 */
async function findOrCreateSkuCurrency({ sku_id, currency_code, country_code, srpValue = 0 }) {
  const { data, error } = await supabase
    .from('sku_currencies')
    .upsert({
      sku_id,
      currency_code,
      country_code,
      srp: srpValue,
    }, {
      onConflict: 'sku_id, currency_code, country_code', // tabloya UNIQUE ekli olduğunu varsayıyoruz
    })
    .select()
    .single();

  if (error) {
    console.error('[findOrCreateSkuCurrency] upsert error:', error);
    throw error;
  }

  return data; // içinde .id de bulunur
}

module.exports = {
  findOrCreateSkuCurrency,
};
