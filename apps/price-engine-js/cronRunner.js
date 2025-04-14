import { getLastCheckedAt, updateLastCheckedAt } from "./updateLastCheckedAt";
import { getChangedSkuCurrencyList } from "./getChangedSkuCurrencyList";
import { calculateFinalPrice } from "./calculateFinalPrice";
import { upsertSkuPrice } from "./upsertSkuPrice";

export async function cronRunner() {
  try {
    console.log("🚀 PriceEngine cron started...");
    const lastCheckedAt = await getLastCheckedAt();
    const changedRows = await getChangedSkuCurrencyList(lastCheckedAt);

    let success = 0, failed = 0;
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
        console.error("[ERR_CODE: PRICE_CALCULATION_FAILED]", row, err);
        failed++;
      }
    }

    console.log(`✅ Success: ${success}, ❌ Failed: ${failed}`);
    await updateLastCheckedAt();
  } catch (err) {
    console.error("[ERR_CODE: CRON_FAILED]", err);
  }
}

if (require.main === module) {
  cronRunner();
}
