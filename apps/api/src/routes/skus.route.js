// apps/api/src/routes/skus.route.js
const express  = require('express')
const router   = express.Router()

// Supabase client — yolun projendeki gerçek konumuna dikkat et
const { supabase } = require('../../../../packages/price-engine/src/infra/supabaseClient')

// GET /api/skus?page=1&limit=200
router.get('/', async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page  || '1', 10)
    const limit  = parseInt(req.query.limit || '200', 10)
    const offset = (page - 1) * limit

    const { data, count, error } = await supabase
      .from('sku_prices')
      .select(`
        *,
        sku_currency:sku_currency_id (
          sku_id, country_code, currency_code, srp, is_default,
          sku:sku_id (
            id, code,
            product:products (
              title, product_type, rev_share_override,
              promotion_products (
                discount,
                promotion:promotions (
                  start_date, end_date, start_time, end_time, status
                )
              )
            ),
            organization:organizations ( id, name, rev_share )
          )
        )
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.setHeader('X-Total-Count', count ?? 0)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

module.exports = router
