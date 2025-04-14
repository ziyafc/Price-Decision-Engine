const express = require('express');
const path = require('path');

// Ana router (örneğin index.js; basit içerik oluşturabilirsiniz)
const indexRouter = require('./routes/index');

// Engine fonksiyon test endpoint'leri
const engineTestRouter = require('./routes/engineTest');

// Supabase health test endpoint'i
const supabaseHealthRouter = require('./routes/supabaseHealth');

const app = express();

// Railway ortamında PORT environment değişkeni atanır (örneğin 8080), yoksa 8080 kullanılır.
const PORT = process.env.PORT || 8080;

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// Engine endpoint'leri: /engine altında çalışır
app.use('/engine', engineTestRouter);

// Ana route (örneğin ana sayfa)
app.use('/', indexRouter);

// Supabase health endpoint'i: /health altında erişilebilir
app.use('/health', supabaseHealthRouter);

// 404 fallback: Eşleşmeyen route’lar için views/404.html gösterilir
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// "0.0.0.0" kullanarak tüm IP'lere dinleme açıyoruz (Railway için gereklidir)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/`);
});
