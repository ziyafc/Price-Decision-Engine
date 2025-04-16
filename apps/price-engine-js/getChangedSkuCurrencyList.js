// File: getChangedSkuCurrencyList.js

const { supabase } = require('./supabaseClient');

/**
 * Son "lastCheckedAt" zamanından bu yana,
 * fiyatı etkileyebilecek değişiklikler olmuş sku_currencies satırlarını bulup,
 * ilgili "sku_currencies.id" (sku_currency_id) değerlerini array olarak döndürür.
 */
async function getChangedSkuCurrencyList(lastCheckedAt) {
  // 1) "sku_currencies.updated_at" veya "exchange_rates.rate_time" vb. tarayın
  // 2) Sonuçta "(sku_id, currency_code, country_code)" triple set'i bulup,
  //    her triple için "sku_currencies" tablosundan "id" alın.
  // 
  // Aşağıda basit bir örnek:
  const skuCurrencySet = new Set(); // JSON.stringify({ sku_id, currency_code, country_code })

  // (A) sku_currencies.updated_at
  const { data: changedCur } = await supabase
    .from('sku_currencies')
    .select('sku_id, currency_code, country_code, updated_at')
    .gt('updated_at', lastCheckedAt);
  
  changedCur?.forEach(row => {
    const keyObj = {
      sku_id: row.sku_id,
      currency_code: row.currency_code,
      country_code: row.country_code,
    };
    skuCurrencySet.add(JSON.stringify(keyObj));
  });

  // (B) exchange_rates.rate_time
  const { data: changedRates } = await supabase
    .from('exchange_rates')
    .select('currency, rate_time')
    .gt('rate_time', lastCheckedAt);

  const changedCurrencies = changedRates?.map(r => r.currency) || [];
  if (changedCurrencies.length > 0) {
    // Bu currency'yi kullanan tüm sku_currencies'i bul
    const { data: affected } = await supabase
      .from('sku_currencies')
      .select('sku_id, currency_code, country_code')
      .in('currency_code', changedCurrencies);

    affected?.forEach(row => {
      const keyObj = {
        sku_id: row.sku_id,
        currency_code: row.currency_code,
        country_code: row.country_code,
      };
      skuCurrencySet.add(JSON.stringify(keyObj));
    });
  }

  // (C) organizations.updated_at => product => sku => sku_currencies
  // vs. (benzer mantık)...

  // Elimizde "sku_id, currency_code, country_code" set'i var.
  const tripleArray = Array.from(skuCurrencySet).map(str => JSON.parse(str));
  if (tripleArray.length === 0) {
    return [];
  }

  // Şimdi bunların "sku_currencies.id" değerini bulalım
  const resultIds = [];

  for (let triple of tripleArray) {
    const { sku_id, currency_code, country_code } = triple;
    const { data: row, error: rowErr } = await supabase
      .from('sku_currencies')
      .select('id')
      .eq('sku_id', sku_id)
      .eq('currency_code', currency_code)
      .eq('country_code', country_code)
      .maybeSingle();

    if (!rowErr && row?.id) {
      resultIds.push(row.id);
    }
  }

  return resultIds; // => [ 'uuid1', 'uuid2', ... ]
}

module.exports = { getChangedSkuCurrencyList };
