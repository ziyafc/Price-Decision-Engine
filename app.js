const express = require('express');
const path = require('path');

// Ana router (örneğin index.js; basit bir örnek içerik oluşturabilirsiniz)
const indexRouter = require('./routes/index');

// Engine fonksiyon test endpoint'leri
const engineTestRouter = require('./routes/engineTest');

const app = express();
const PORT = process.env.PORT || 3000;

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// Engine endpoint'leri: /engine altında çalışır
app.use('/engine', engineTestRouter);

// Ana route (örneğin ana sayfa)
app.use('/', indexRouter);

// 404 fallback: Eğer hiçbir route eşleşmezse views/404.html gösterilir
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/`);
});
