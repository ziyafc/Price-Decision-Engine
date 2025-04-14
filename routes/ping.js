// routes/ping.ts
import express from "express";
const router = express.Router();

router.get("/ping", (req, res) => {
  res.send("PriceEngine is alive 🚀");
});

export default router;
