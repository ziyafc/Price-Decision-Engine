// File: calculateFinalPrice.js

const { supabase } = require('./supabaseClient');

/**
 * Tek bir sku_currency_id için "nihai fiyat" hesaplar.
 * - sku_currencies -> (srp, currency_code, country_code, sku_id)
 * - organization veya product -> rev_share
 * - exchange_rates -> currency bazlı rate
 * - promotions -> discount
 * - geo_settings / publisher_vat_rates -> vat_rate
 */
async function calculateFinalPrice(sku_currency_id) {
  // 1) sku_currencies row
  const { data: rowData, error: rowErr } = await supabase
    .from('sku_currencies')
    .select(`
      id,
      sku_id,
      currency_code,
      country_code,
      srp,
      skus:skus!inner(
        organization_id
      )
    `)
    .eq('id', sku_currency_id)
    .maybeSingle();

  if (rowErr || !rowData) {
    console.error('[calculateFinalPrice] fetch error', rowErr);
    return null;
  }

  const { id, sku_id, srp, currency_code, country_code } = rowData;
  if (!id) {
    console.warn(`[calculateFinalPrice] No record found for id=${sku_currency_id}`);
    return null;
  }

  // 2) rev_share: (basitçe 70 diyelim, gerçekte organization tablosunu join edebilirsiniz)
  let rev_share = 70;
  // orgId = rowData.skus?.organization_id, or more queries to get real rev_share

  // 3) discount_rate: promotions vs. (burada 0 alalım)
  const discount_rate = 0;

  // 4) VAT: geo_settings veya publisher_vat_rates
  let vat_rate = 0;
  const { data: geoRow } = await supabase
    .from('geo_settings')
    .select('tax_rate')
    .eq('code', country_code)
    .maybeSingle();

  if (geoRow && geoRow.tax_rate) {
    vat_rate = Number(geoRow.tax_rate);
  }

  // 5) exchange_rate
  let exchange_rate = 1;
  const { data: exch } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('currency', currency_code)
    .maybeSingle();

  if (exch && exch.rate) {
    exchange_rate = Number(exch.rate);
  }

  // 6) Hesap
  const base_srp = Number(srp) || 0;
  const discounted_srp = base_srp * (1 - discount_rate / 100);
  const discounted_srp_wo_vat = discounted_srp / (1 + vat_rate / 100);
  const wsp = discounted_srp_wo_vat * (rev_share / 100);
  const wsp_in_eur = wsp / exchange_rate;
  const effective_price = discounted_srp;

  return {
    sku_currency_id: sku_currency_id,
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
    updated_at: new Date().toISOString(),
  };
}

module.exports = { calculateFinalPrice };
