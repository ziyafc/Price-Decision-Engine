const express = require('express');
const path = require('path');

// Ana router (örneğin index.js; basit içerik oluşturabilirsiniz)
const indexRouter = require('./routes/index');

// Engine fonksiyon test endpoint'leri
const engineTestRouter = require('./routes/engineTest');

const app = express();

// Railway ortamında PORT environment değişkeni atanır (örneğin 8080), yoksa 3000 kullanılır.
const PORT = process.env.PORT || 3000;

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// Engine endpoint'leri: /engine altında çalışır
app.use('/engine', engineTestRouter);

// Ana route (örneğin ana sayfa)
app.use('/', indexRouter);

// 404 fallback: Eşleşmeyen route’lar için views/404.html gösterilir
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// "0.0.0.0" kullanarak tüm IP'lere dinleme açıyoruz (Railway için gereklidir)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/`);
});
