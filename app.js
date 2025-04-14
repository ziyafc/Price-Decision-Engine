const express = require('express');
const path = require('path');

// Ana router
const indexRouter = require('./routes/index');

// Ek test route'ları
const engineTestRouter = require('./routes/engineTest');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Engine fonksiyon test endpoint'leri
app.use('/engine', engineTestRouter);

// Ana route
app.use('/', indexRouter);

// 404 fallback
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/`);
});
