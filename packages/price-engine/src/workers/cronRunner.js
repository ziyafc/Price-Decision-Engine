const {
  getLastCheckedAt,
} = require('../infra/getLastCheckedAt');
const {
  updateLastCheckedAt,
} = require('../infra/updateLastCheckedAt');
const {
  getChangedSkuCurrencyList,
} = require('../core/getChangedSkuCurrencyList');
const {
  calculateFinalPrice,
} = require('../core/calculateFinalPrice');
const {
  upsertSkuPrice,
} = require('../core/upsertSkuPrice');

// --------------------------------------------------
// Tek bir cron turu — hem otomatik döngüde
// hem  /admin/cron manuel tetikte kullanılır
// --------------------------------------------------
async function mainCycle() {
  try {
    console.log('🚀 PriceEngine cron started...');
    const lastCheckedAt = await getLastCheckedAt();
    console.log('📌 lastCheckedAt:', lastCheckedAt);

    // 1) Değişen sku_currency_id'leri bul
    const changedIds = await getChangedSkuCurrencyList(lastCheckedAt);
    console.log(`🔍 Found ${changedIds.length} changed sku_currency_id records`);

    let success = 0;
    let failed  = 0;

    // 2) Fiyat hesapla ➜ sku_prices upsert
    for (const skuCurrencyId of changedIds) {
      try {
        const obj = await calculateFinalPrice(skuCurrencyId);
        if (obj) {
          await upsertSkuPrice(obj);
          success++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`[PRICE_CALC_FAIL] sku_currency_id=${skuCurrencyId}`, err.message);
        failed++;
      }
    }

    console.log(`✅ ${success} processed, ⚠️ ${failed} failed`);

    // 3) Heartbeat
    await updateLastCheckedAt();
    console.log('🧭 Cron completed and lastCheckedAt updated');
  } catch (err) {
    console.error('[CRON_FAILED]', err.message);
  }
}

// --------------------------------------------------
// Çalıştırma modu
//   •  Tek pas  :  node cronRunner.js
//   •  Döngü    :  node cronRunner.js --loop
// --------------------------------------------------
const LOOP = process.argv.includes('--loop');
if (LOOP) {
  console.log('🕒 cronRunner looping every 5 minutes');
  mainCycle();                         // hemen ilk tur
  setInterval(mainCycle, 5 * 60_000);  // 5 dk
} else if (require.main === module) {
  mainCycle();                         // tek pas
}

module.exports = { cronRunner: mainCycle };
