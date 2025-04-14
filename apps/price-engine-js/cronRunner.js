const { getLastCheckedAt, updateLastCheckedAt } = require("./updateLastCheckedAt");
const { getChangedSkuCurrencyList } = require("./getChangedSkuCurrencyList");
const { calculateFinalPrice } = require("./calculateFinalPrice");
const { upsertSkuPrice } = require("./upsertSkuPrice");

async function cronRunner() {
  try {
    console.log("🚀 PriceEngine cron started...");
    const lastCheckedAt = await getLastCheckedAt();
    console.log("📌 lastCheckedAt:", lastCheckedAt);

    const changedRows = await getChangedSkuCurrencyList(lastCheckedAt);
    console.log(`🔍 Found ${changedRows.length} changed SKU-currency pairs`);

    let success = 0;
    let failed = 0;
    for (const row of changedRows) {
      try {
        const result = await calculateFinalPrice(row.sku_id, row.currency_code);
        if (result) {
          await upsertSkuPrice(result);
          success++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`[ERR_CODE: PRICE_CALCULATION_FAILED] Failed for ${row.sku_id}-${row.currency_code}`, err.message);
        failed++;
      }
    }

    console.log(`✅ ${success} entries processed successfully`);
    if (failed > 0) console.warn(`⚠️ ${failed} entries failed`);

    await updateLastCheckedAt();
    console.log("🧭 Cron completed and lastCheckedAt updated");
  } catch (err) {
    console.error("[ERR_CODE: CRON_FAILED] Cron runner failed:", err.message);
  }
}

// Eğer direkt çalıştırmak istersen:
if (require.main === module) {
  cronRunner();
}

module.exports = { cronRunner };
