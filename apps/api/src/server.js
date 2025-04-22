const express = require('express');
const app = express();

app.use('/',      require('./routes/health.route.js'));
app.use('/admin', require('./routes/internal.route.js'));
app.use('/dashboard', require('./routes/dashboard.route.js'));
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API running on ${PORT}`));
