const express = require('express');
const cors = require('cors'); // 1) Require the cors package
const path = require('path');

// Ana router (örneğin index.js)
const indexRouter = require('./routes/index');

// Engine fonksiyon test endpoint'leri
const engineTestRouter = require('./routes/engineTest');

// Supabase health test endpoint'i
const supabaseHealthRouter = require('./routes/supabaseHealth');

// cronRunner fonksiyonu
const { cronRunner } = require('./apps/price-engine-js/cronRunner'); 

const app = express();

// 2) Use CORS BEFORE your routes
// If you ONLY want to allow your Netlify domain, specify it here:
app.use(
  cors({
    origin: 'https://deluxe-kitten-74c23f.netlify.app',
    // You can also specify methods, credentials, etc. if needed:
    // methods: ['GET', 'POST'],
  })
);
// If you want to allow all origins (not recommended for production):
// app.use(cors());

const PORT = process.env.PORT || 8080;

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// Engine endpoint'leri: /engine altında
app.use('/engine', engineTestRouter);

// Ana route
app.use('/', indexRouter);

// Supabase health endpoint'i
app.use('/health', supabaseHealthRouter);

// 404 fallback
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/`);

  // 5 dakikada bir cronRunner çağır
  const FIVE_MINUTES = 5 * 60 * 1000;
  setInterval(() => {
    console.log('⏱  Triggering PriceEngine cron internally...');
    cronRunner();
  }, FIVE_MINUTES);
});
