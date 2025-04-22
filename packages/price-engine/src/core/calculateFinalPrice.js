// File: calculateFinalPrice.js

const { supabase } = require('../infra/supabaseClient');

/**
 * Tek bir sku_currency_id için "nihai fiyat" hesaplar.
 * - sku_currencies -> (srp, currency_code, country_code, sku_id)
 * - skus -> code, product_id
 * - products -> title, rev_share_override
 * - organizations -> rev_share
 * - exchange_rates -> currency bazlı rate
 * - promotions -> discount (şu an 0)
 * - geo_settings / publisher_vat_rates -> vat_rate
 */
async function calculateFinalPrice(sku_currency_id) {
  const now = new Date();

  // 1) sku_currencies satırı ve bağlı veriler
  const { data: rowData, error: rowErr } = await supabase
    .from('sku_currencies')
    .select(`
      id,
      sku_id,
      currency_code,
      country_code,
      srp,
      sku:skus (
        id,
        code,
        product_id,
        organization_id,
        product:products (
          title,
          rev_share_override
        ),
        organization:organizations (
          rev_share
        )
      )
    `)
    .eq('id', sku_currency_id)
    .maybeSingle();

  if (rowErr || !rowData) {
    console.error('[calculateFinalPrice] fetch error', rowErr);
    return null;
  }

  const {
    id,
    sku_id,
    srp,
    currency_code,
    country_code,
    sku
  } = rowData;

  if (!sku || !id) {
    console.warn(`[calculateFinalPrice] Missing SKU or ID for sku_currency_id=${sku_currency_id}`);
    return null;
  }

  const sku_code = sku.code || '';
  const product_title = sku.product?.title || '';

  // 2) Rev share (priority: product rev_share_override > org.rev_share > default)
  const rev_share =
    Number(sku.product?.rev_share_override) ||
    Number(sku.organization?.rev_share) ||
    70;

  // 3) Discount (şu an sabit 0, ileride promotions tablosu bağlanabilir)
  const discount_rate = 0;

  // 4) VAT oranı (önce publisher_vat_rates, sonra geo_settings fallback)
  let vat_rate = 0;

  // A) Publisher VAT (isteğe bağlı, organization_id'yi sku üzerinden alabilirsin)
  const { data: vatRow } = await supabase
    .from('publisher_vat_rates')
    .select('vat_rate')
    .eq('organization_id', sku.organization_id)
    .eq('country_code', country_code)
    .maybeSingle();

  if (vatRow?.vat_rate) {
    vat_rate = Number(vatRow.vat_rate);
  } else {
    const { data: geoRow } = await supabase
      .from('geo_settings')
      .select('tax_rate')
      .eq('code', country_code)
      .maybeSingle();

    if (geoRow?.tax_rate) {
      vat_rate = Number(geoRow.tax_rate);
    }
  }

  // 5) Exchange Rate
  let exchange_rate = 1;
  const { data: exch } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('currency', currency_code)
    .maybeSingle();

  if (exch?.rate) {
    exchange_rate = Number(exch.rate);
  }

  // 6) Hesaplamalar
  const base_srp = Number(srp) || 0;
  const discounted_srp = base_srp * (1 - discount_rate / 100);
  const discounted_srp_wo_vat = discounted_srp / (1 + vat_rate / 100);
  const wsp = discounted_srp_wo_vat * (rev_share / 100);
  const wsp_in_eur = wsp / exchange_rate;
  const effective_price = discounted_srp;

  // 7) Sonuç: sku_prices için upsert edilecek veri
  return {
    sku_currency_id: id,
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
    updated_at: now.toISOString(),

    // 🔍 Test/Debug Kolonları (Price Master için kolay filtreleme)
    currency_code,
    country_code,
    sku_code,
    product_title
  };
}

module.exports = { calculateFinalPrice };
