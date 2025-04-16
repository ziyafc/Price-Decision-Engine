// File: cronRunner.js

const { getLastCheckedAt } = require('./getLastCheckedAt');
const { updateLastCheckedAt } = require('./updateLastCheckedAt');
const { getChangedSkuCurrencyList } = require('./getChangedSkuCurrencyList');
const { calculateFinalPrice } = require('./calculateFinalPrice');
const { upsertSkuPrice } = require('./upsertSkuPrice');

async function cronRunner() {
  try {
    console.log('🚀 PriceEngine cron started...');
    const lastCheckedAt = await getLastCheckedAt();
    console.log('📌 lastCheckedAt:', lastCheckedAt);

    // 1) Değişen sku_currency_id'leri bul
    const changedIds = await getChangedSkuCurrencyList(lastCheckedAt);
    console.log(`🔍 Found ${changedIds.length} changed sku_currency_id records`);

    let success = 0;
    let failed = 0;

    // 2) Her ID için fiyatı hesapla => sku_prices'a upsert
    for (const skuCurrencyId of changedIds) {
      try {
        const finalPriceObj = await calculateFinalPrice(skuCurrencyId);
        if (finalPriceObj) {
          await upsertSkuPrice(finalPriceObj);
          success++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(
          `[ERR_CODE: PRICE_CALCULATION_FAILED] Failed for sku_currency_id=${skuCurrencyId}:`,
          err.message
        );
        failed++;
      }
    }

    console.log(`✅ ${success} entries processed successfully`);
    if (failed > 0) console.warn(`⚠️ ${failed} entries failed`);

    // 3) Son olarak lastCheckedAt güncelle
    await updateLastCheckedAt();
    console.log('🧭 Cron completed and lastCheckedAt updated');
  } catch (err) {
    console.error('[ERR_CODE: CRON_FAILED] Cron runner failed:', err.message);
  }
}

// Direkt çalıştırma
if (require.main === module) {
  cronRunner();
}

module.exports = { cronRunner };
