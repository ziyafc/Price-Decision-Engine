const { supabase } = require("./supabaseClient");

async function getChangedSkuCurrencyList(lastCheckedAt) {
  const skuCurrencySet = new Set();

  // 1) sku_currencies.updated_at kontrolü
  const { data: changedSrp } = await supabase
    .from("sku_currencies")
    // Burada country_code'u da seçiyoruz
    .select("sku_id, currency_code, country_code, updated_at")
    .gt("updated_at", lastCheckedAt);

  changedSrp?.forEach(row => {
    // JSON ile sakla: sku_id + currency_code + country_code
    const keyObj = {
      sku_id: row.sku_id,
      currency_code: row.currency_code,
      country_code: row.country_code
    };
    skuCurrencySet.add(JSON.stringify(keyObj));
  });

  // 2) exchange_rates.rate_time değişim kontrolü
  const { data: changedRates } = await supabase
    .from("exchange_rates")
    .select("currency, rate_time")
    .gt("rate_time", lastCheckedAt);

  const changedCurrencies = changedRates?.map(r => r.currency) ?? [];
  if (changedCurrencies.length > 0) {
    // Bu currency'yi kullanan tüm sku_currencies satırlarını bulurken country_code da alıyoruz:
    const { data: affectedSkus } = await supabase
      .from("sku_currencies")
      .select("sku_id, currency_code, country_code")
      .in("currency_code", changedCurrencies);

    affectedSkus?.forEach(row => {
      const keyObj = {
        sku_id: row.sku_id,
        currency_code: row.currency_code,
        country_code: row.country_code
      };
      skuCurrencySet.add(JSON.stringify(keyObj));
    });
  }

  // 3) organizations.updated_at (rev_share değişikliği)
  const { data: changedOrgs } = await supabase
    .from("organizations")
    .select("id")
    .gt("updated_at", lastCheckedAt);
  const orgIds = changedOrgs?.map(o => o.id) ?? [];
  if (orgIds.length > 0) {
    const { data: affectedProducts } = await supabase
      .from("products")
      .select("id")
      .in("organization_id", orgIds);
    const productIds = affectedProducts?.map(p => p.id) ?? [];
    if (productIds.length > 0) {
      const { data: skus } = await supabase
        .from("skus")
        .select("id")
        .in("product_id", productIds);
      const skuIds = skus?.map(s => s.id) ?? [];
      if (skuIds.length > 0) {
        const { data: skuCurrencies } = await supabase
          .from("sku_currencies")
          .select("sku_id, currency_code, country_code")
          .in("sku_id", skuIds);
        skuCurrencies?.forEach(row => {
          const keyObj = {
            sku_id: row.sku_id,
            currency_code: row.currency_code,
            country_code: row.country_code
          };
          skuCurrencySet.add(JSON.stringify(keyObj));
        });
      }
    }
  }

  // 4) promotions start_time/end_time kontrolü
  const now = new Date().toISOString();
  const { data: livePromos } = await supabase
    .from("promotions")
    .select("id")
    .or(`start_time.lte.${now},end_time.lte.${now}`)
    .in("status", ["scheduled", "live"]);
  const promoIds = livePromos?.map(p => p.id) ?? [];
  if (promoIds.length > 0) {
    const { data: affectedPromoSkus } = await supabase
      .from("promotion_products")
      .select("sku_id")
      .in("promotion_id", promoIds);
    const skuIds = affectedPromoSkus?.map(p => p.sku_id) ?? [];
    if (skuIds.length > 0) {
      const { data: skuCurrencies } = await supabase
        .from("sku_currencies")
        .select("sku_id, currency_code, country_code")
        .in("sku_id", skuIds);

      skuCurrencies?.forEach(row => {
        const keyObj = {
          sku_id: row.sku_id,
          currency_code: row.currency_code,
          country_code: row.country_code
        };
        skuCurrencySet.add(JSON.stringify(keyObj));
      });
    }
  }

  // Tekil kombinasyonu diziye çevirerek dön
  // (sku_id, currency_code, country_code) JSON parse
  return Array.from(skuCurrencySet).map(str => JSON.parse(str));
}

module.exports = { getChangedSkuCurrencyList };
