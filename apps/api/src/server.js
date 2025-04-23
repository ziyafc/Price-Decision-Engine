// apps/api/src/server.cjs

const express = require('express')
const cors = require('cors')
const app = express()

// 1) CORS middleware’i en üste ekleyin,
//    böylece hem preflight (OPTIONS) hem de gerçek istekler geçer:
app.use(cors({
  origin: '*' // production’da sadece front-end URL’inizle sınırlandırabilirsiniz
}))

// 2) JSON gövdeleri okuyabilsin:
app.use(express.json())

// 3) Mevcut route’larınız
app.use('/',          require('./routes/health.route.js'))
app.use('/admin',     require('./routes/internal.route.js'))
app.use('/dashboard', require('./routes/dashboard.route.js'))
app.use('/',          require('./routes/root.route.js'))

// 4) Yeni: SKU listeleme ve paging endpoint’i
//    apps/api/src/routes/skus.route.js içinde tanımlı olmalı
app.use('/api/skus', require('./routes/skus.route.js'))

// 5) Hata yakalama (opsiyonel, isterseniz kendi error-handler’ınızı ekleyin)
// app.use((err, req, res, next) => {
//   console.error(err)
//   res.status(500).json({ error: err.message || 'Internal Server Error' })
// })

// 6) Sunucuyu başlat
const PORT = parseInt(process.env.PORT, 10) || 8080
app.listen(PORT, () => {
  console.log(`🚀 API listening on port ${PORT}`)
})

module.exports = app
