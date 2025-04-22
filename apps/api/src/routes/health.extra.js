const express = require('express');
const router = express.Router();
const { supabase } = require('../apps/price-engine-js/supabaseClient');

// Bu endpoint Supabase bağlantı sağlığını test eder.
// Örnek sorgu: "skus" tablosundan 1 kayıt çekiyoruz.
router.get('/supabase-health', async (req, res) => {
  try {
    // 'skus' tablosundan tek bir kayıt çekiyoruz.
    const { data, error } = await supabase
      .from("skus")
      .select("id")
      .limit(1);

    if (error) {
      throw error;
    }

    // Sorgu başarılı ise, bağlantı sağlıklı kabul edilir.
    const now = new Date().toISOString();
    res.json({
      status: "healthy",
      message: "Supabase connection is healthy.",
      lastCommunication: now,
      sampleData: data
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to connect to Supabase.",
      error: err.message
    });
  }
});

module.exports = router;
