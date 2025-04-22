const express = require('express');
const router  = express.Router();

router.get('/ping', (_, res) => {
  res.send('PriceEngine alive 🚀');
});

module.exports = router;
