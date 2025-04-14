// routes/calculate.ts
import express from "express";
import { calculateFinalPrice } from "../apps/price-engine/calculateFinalPrice";
import { upsertSkuPrice } from "../apps/price-engine/upsertSkuPrice";

const router = express.Router();

router.get("/calculate", async (req, res) => {
  const { sku_id, currency } = req.query;
  if (!sku_id || !currency) return res.status(400).json({ error: "Missing sku_id or currency" });

  try {
    const result = await calculateFinalPrice(String(sku_id), String(currency));
    if (!result) return res.status(404).json({ error: "Calculation failed or data missing." });

    await upsertSkuPrice(result);
    res.json({ message: "Calculated and upserted!", data: result });
  } catch (err) {
    console.error("[ERR_CODE: CALC_API_ERROR]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
