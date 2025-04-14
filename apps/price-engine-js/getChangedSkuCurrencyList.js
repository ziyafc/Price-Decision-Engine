const { supabase } = require("./supabaseClient");

async function getChangedSkuCurrencyList(lastCheckedAt) {
  const skuCurrencySet = new Set();

  // 1. sku_currencies.updated_at kontrolü
  const { data: changedSrp } = await supabase
    .from("sku_currencies")
    .select("sku_id, currency_code, updated_at")
    .gt("updated_at", lastCheckedAt);
  changedSrp?.forEach(row => {
    skuCurrencySet.add(`${row.sku_id}-${row.currency_code}`);
  });

  // 2. exchange_rates.rate_time değişim kontrolü
  const { data: changedRates } = await supabase
    .from("exchange_rates")
    .select("currency, rate_time")
    .gt("rate_time", lastCheckedAt);
  const changedCurrencies = changedRates?.map(r => r.currency) ?? [];
  if (changedCurrencies.length > 0) {
    const { data: affectedSkus } = await supabase
      .from("sku_currencies")
      .select("sku_id, currency_code")
      .in("currency_code", changedCurrencies);
    affectedSkus?.forEach(row => {
      skuCurrencySet.add(`${row.sku_id}-${row.currency_code}`);
    });
  }

  // 3. organizations.updated_at (rev_share değişikliği)
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
          .select("sku_id, currency_code")
          .in("sku_id", skuIds);
        skuCurrencies?.forEach(row => {
          skuCurrencySet.add(`${row.sku_id}-${row.currency_code}`);
        });
      }
    }
  }

  // 4. promotions start_time/end_time kontrolü
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
    const { data: skuCurrencies } = await supabase
      .from("sku_currencies")
      .select("sku_id, currency_code")
      .in("sku_id", skuIds);
    skuCurrencies?.forEach(row => {
      skuCurrencySet.add(`${row.sku_id}-${row.currency_code}`);
    });
  }

  // Tekil kombinasyonu diziye çevirerek dön
  return Array.from(skuCurrencySet).map(key => {
    const [sku_id, currency_code] = key.split("-");
    return { sku_id, currency_code };
  });
}

module.exports = { getChangedSkuCurrencyList };
