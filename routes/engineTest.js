const express = require("express");
const router = express.Router();

const { calculateFinalPrice } = require("../apps/price-engine-js/calculateFinalPrice");
const { upsertSkuPrice } = require("../apps/price-engine-js/upsertSkuPrice");
const { getChangedSkuCurrencyList } = require("../apps/price-engine-js/getChangedSkuCurrencyList");
const { getLastCheckedAt, updateLastCheckedAt } = require("../apps/price-engine-js/updateLastCheckedAt");
const { cronRunner } = require("../apps/price-engine-js/cronRunner");

router.get("/ping", (_, res) => {
  res.send("PriceEngine is alive 🚀");
});

router.get("/calculate", async (req, res) => {
  const { sku_id, currency } = req.query;
  if (!sku_id || !currency) return res.status(400).send("Missing sku_id or currency");
  try {
    const result = await calculateFinalPrice(String(sku_id), String(currency));
    if (!result) return res.status(404).send("No calculation result");
    res.json(result);
  } catch (err) {
    console.error("[ERR_CODE: CALCULATE_ENDPOINT_ERROR]", err.message);
    res.status(500).send("Internal server error");
  }
});

router.get("/upsert", async (req, res) => {
  const { sku_id, currency } = req.query;
  if (!sku_id || !currency) return res.status(400).send("Missing sku_id or currency");
  try {
    const result = await calculateFinalPrice(String(sku_id), String(currency));
    if (!result) return res.status(404).send("Calculation failed");
    await upsertSkuPrice(result);
    res.send("Upsert completed ✅");
  } catch (err) {
    console.error("[ERR_CODE: UPSERT_ENDPOINT_ERROR]", err.message);
    res.status(500).send("Internal server error");
  }
});

router.get("/changed", async (_, res) => {
  try {
    const lastCheckedAt = await getLastCheckedAt();
    const list = await getChangedSkuCurrencyList(lastCheckedAt);
    res.json(list);
  } catch (err) {
    console.error("[ERR_CODE: CHANGED_ENDPOINT_ERROR]", err.message);
    res.status(500).send("Internal server error");
  }
});

router.get("/cron", async (_, res) => {
  try {
    await cronRunner();
    res.send("Cron job finished ✅");
  } catch (err) {
    console.error("[ERR_CODE: CRON_ENDPOINT_ERROR]", err.message);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
