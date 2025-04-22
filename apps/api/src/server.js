// apps/api/src/server.cjs

const express = require('express');
const cors    = require('cors');
const app     = express();

// 1) CORS middleware’i en üste ekleyin,
//    böylece hem preflight (OPTIONS) hem de gerçek istekler geçer:
app.use(cors({
  origin: '*' // production’da burayı sadece front‑end URL’inizle sınırlandırabilirsiniz
}));

// 2) JSON gövdeleri okuyabilsin:
app.use(express.json());

// 3) Mevcut route’larınız
app.use('/',          require('./routes/health.route.js'));
app.use('/admin',     require('./routes/internal.route.js'));
app.use('/dashboard', require('./routes/dashboard.route.js'));
app.use('/',          require('./routes/root.route.js'));

// 4) SKU güncelleme endpoint’ini artık `/api/skus/:sku_id/update` altında mount ediyoruz:
app.use('/api/skus', require('./routes/skus.route.js'));

// 5) Sunucuyu başlat
const PORT = parseInt(process.env.PORT, 10) || 8080;
app.listen(PORT, () => {
  console.log(`🚀 API listening on port ${PORT}`);
});

module.exports = app;
