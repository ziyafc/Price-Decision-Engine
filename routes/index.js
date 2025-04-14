const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Ana sayfa: Price Decision Engine");
});

module.exports = router;
