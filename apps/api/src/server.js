// apps/api/src/server.cjs
const express = require('express');
const app     = express();

// Body parser: JSON
app.use(express.json());

// Healthcheck, internal admin, dashboard, root
app.use('/',         require('./routes/health.route.js'));
app.use('/admin',    require('./routes/internal.route.js'));
app.use('/dashboard',require('./routes/dashboard.route.js'));
app.use('/',         require('./routes/root.route.js'));

// SKU update endpoint: single call to RPC
app.use(
  '/skus',
  require('./routes/skus.route.js')
);

// Start server
const PORT = parseInt(process.env.PORT, 10) || 8080;
app.listen(PORT, () => {
  console.log(`🚀 API listening on port ${PORT}`);
});

module.exports = app;
