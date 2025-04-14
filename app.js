const express = require('express');
const path = require('path');

// Ana router (örneğin index.js)
const indexRouter = require('./routes/index');

// Engine fonksiyon test endpoint'leri
const engineTestRouter = require('./routes/engineTest');

// Supabase health test endpoint'i
const supabaseHealthRouter = require('./routes/supabaseHealth');

// Burada, "cronRunner" fonksiyonunun doğru yolu:
// Eğer senin "apps/price-engine-js/cronRunner.js" içindeyse, şöyle:
const { cronRunner } = require('./apps/price-engine-js/cronRunner');
// Eğer farklı klasördeyse, ona göre güncelle (örn. './cronRunner')

const app = express();

// Railway ortamında PORT environment değişkeni atanır, yoksa 8080 kullanılır.
const PORT = process.env.PORT || 8080;

// Statik dosyalar (public klasörü varsa)
app.use(express.static(path.join(__dirname, 'public')));

// Engine endpoint'leri: /engine altında çalışır
app.use('/engine', engineTestRouter);

// Ana route
app.use('/', indexRouter);

// Supabase health endpoint'i: /health
app.use('/health', supabaseHealthRouter);

// 404 fallback
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Sunucuyu "0.0.0.0" üzerinde başlat (Railway için)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/`);

  // Her 5 dakikada bir cronRunner fonksiyonunu çağırıyoruz.
  const FIVE_MINUTES = 5 * 60 * 1000;
  setInterval(() => {
    console.log('⏱  Triggering PriceEngine cron internally...');
    cronRunner();
  }, FIVE_MINUTES);
});
