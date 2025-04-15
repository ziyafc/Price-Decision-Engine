const { supabase } = require("./supabaseClient");

async function calculateFinalPrice(sku_id, currency_code, country_code) {
  const now = new Date();

  // 1) SKU detaylarını Supabase'den çek
  // Burada sku_currencies(country_code, srp, ...) da çekelim
  const { data: skuData, error: skuErr } = await supabase
    .from("skus")
    .select(`
      id,
      product_id,
      organization_id,
      sku_currencies (
        currency_code,
        country_code,
        srp
      ),
      product:products (
        id,
        rev_share_override,
        promotion_products (
          discount,
          promotion:promotions (
            status,
            start_date,
            end_date,
            start_time,
            end_time
          )
        )
      ),
      organization:organizations (
        id,
        rev_share
      )
    `)
    .eq("id", sku_id)
    .maybeSingle();

  if (skuErr || !skuData) {
    console.error(`[ERR_CODE: SKU_NOT_FOUND] SKU fetch failed for ${sku_id}`, skuErr);
    return null;
  }

  // 2) country_code'lu row bulalım (ya da fallback country_code=null'a bakarsınız)
  const currencyRow = skuData.sku_currencies?.find(c =>
    c.currency_code === currency_code && c.country_code === country_code
  );
  if (!currencyRow) {
    console.warn(`[WARN_CODE: SRP_MISSING] No SRP for ${sku_id} / ${currency_code} / ${country_code}`);
    return null;
  }
  const base_srp = Number(currencyRow.srp);

  // 3) rev_share
  const rev_share =
    Number(skuData.product?.rev_share_override) ||
    Number(skuData.organization?.rev_share) ||
    70;

  // 4) Active Promotion
  const activePromo = skuData.product?.promotion_products?.find(pp => {
    const p = pp.promotion;
    if (!p) return false;
    const start = new Date(`${p.start_date}T${p.start_time}`);
    const end = new Date(`${p.end_date}T${p.end_time}`);
    return now >= start && now <= end && ["approved", "live"].includes(p.status.toLowerCase());
  });
  const discount_rate = activePromo?.discount || 0;

  // 5) VAT Bilgisi: country_code tabanlı
  // geo_settings + publisher_vat_rates
  const { data: geoData, error: geoErr } = await supabase
    .from("geo_settings")
    .select("code, tax_rate")
    .eq("is_active", true);
  if (geoErr || !geoData) {
    console.error(`[ERR_CODE: GEO_VAT_FETCH_FAILED] geo_settings fetch failed`, geoErr);
    return null;
  }
  const geoVATMap = Object.fromEntries(geoData.map(g => [g.code, g.tax_rate]));

  const { data: vatData, error: vatErr } = await supabase
    .from("publisher_vat_rates")
    .select("country_code, vat_rate")
    .eq("organization_id", skuData.organization_id);
  if (vatErr || !vatData) {
    console.error(`[ERR_CODE: PUBLISHER_VAT_FETCH_FAILED] publisher_vat_rates fetch failed for ${sku_id}`, vatErr);
    return null;
  }
  const vatOverrideMap = Object.fromEntries(vatData.map(v => [v.country_code, v.vat_rate]));

  // Tersine, bazen vatOverrideMap[EUR] diye bakıyorsanız, logiği projeye göre ayarlayın.
  // Ama asıl niyet "country_code" => vat_rate ise:
  const vat_rate = vatOverrideMap[country_code] ?? geoVATMap[country_code] ?? 0;

  // 6) Exchange rate => currency bazlı
  const { data: rateData, error: rateErr } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("currency", currency_code)
    .maybeSingle();
  if (rateErr || !rateData || !rateData.rate) {
    console.error(`[ERR_CODE: EXCHANGE_RATE_MISSING] Missing exchange rate for ${currency_code}`, rateErr);
    return null;
  }
  const exchange_rate = Number(rateData.rate);

  // 7) Hesaplamalar
  const discounted_srp = base_srp * (1 - discount_rate / 100);
  const discounted_srp_wo_vat = discounted_srp / (1 + vat_rate / 100);
  const wsp = discounted_srp_wo_vat * (rev_share / 100);
  const wsp_in_eur = wsp / exchange_rate;
  const effective_price = discounted_srp;

  return {
    sku_id,
    currency_code,
    country_code, // ÖNEMLİ: Bu da eklendi
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
    updated_at: new Date().toISOString()
  };
}

module.exports = { calculateFinalPrice };
