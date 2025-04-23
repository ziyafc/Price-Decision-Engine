// apps/api/src/server.js
const express = require('express');
const cors    = require('cors');
const app     = express();

/* ------------------------------------------------- */
/* 1) CORS – prod’da origin’i FE domaine kısıtlayın   */
/* ------------------------------------------------- */
app.use(cors({ origin: '*' }));

/* ------------------------------------------------- */
/* 2) Gövde-parsing                                  */
/* ------------------------------------------------- */
app.use(express.json());

/* ------------------------------------------------- */
/* 3) Eski route’lar                                 */
/* ------------------------------------------------- */
app.use('/',          require('./routes/health.route.js'));
app.use('/admin',     require('./routes/internal.route.js'));
app.use('/dashboard', require('./routes/dashboard.route.js'));
app.use('/',          require('./routes/root.route.js'));

/* ------------------------------------------------- */
/* 4) Yeni SKU paging/listing route                  */
/*    (mutlaka var: apps/api/src/routes/skus.route.js)*/
/* ------------------------------------------------- */
app.use('/api/skus', require('./routes/skus.route.js'));

/* ------------------------------------------------- */
/* 5) Basit hata-yakalama (opsiyonel ama faydalı)     */
/* ------------------------------------------------- */
app.use((err, _req, res, _next) => {
  console.error('[API ERROR]', err);
  res
    .status(err.status || 500)
    .json({ error: err.message || 'Internal Server Error' });
});

/* ------------------------------------------------- */
/* 6) Sunucuyu başlat                                */
/* ------------------------------------------------- */
const PORT = parseInt(process.env.PORT, 10) || 8080;
app.listen(PORT, () => {
  console.log(`🚀  API listening on ${PORT}`);
});

module.exports = app;
