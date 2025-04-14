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
  const result = await calculateFinalPrice(String(sku_id), String(currency));
  if (!result) return res.status(404).send("No calculation result");
  res.json(result);
});

router.get("/upsert", async (req, res) => {
  const { sku_id, currency } = req.query;
  if (!sku_id || !currency) return res.status(400).send("Missing sku_id or currency");
  const result = await calculateFinalPrice(String(sku_id), String(currency));
  if (!result) return res.status(404).send("Calculation failed");
  await upsertSkuPrice(result);
  res.send("Upsert completed ✅");
});

router.get("/changed", async (_, res) => {
  const lastCheckedAt = await getLastCheckedAt();
  const list = await getChangedSkuCurrencyList(lastCheckedAt);
  res.json(list);
});

router.get("/cron", async (_, res) => {
  await cronRunner();
  res.send("Cron job finished ✅");
});

module.exports = router;
