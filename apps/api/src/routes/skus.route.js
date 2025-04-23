// apps/api/src/routes/skus.route.js

const express = require('express')
const router  = express.Router()
const { supabase } = require('../infra/supabaseClient')

/**
 * GET /api/skus?page=1&limit=200
 * 
 * Returns paginated sku_prices rows, with nested "sku_currency" objects.
 * Sets X-Total-Count header to total count for infinite scroll.
 */
router.get('/', async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page  as string, 10) || 1
    const limit  = parseInt(req.query.limit as string, 10) || 200
    const offset = (page - 1) * limit

    // Fetch sku_prices with nested sku_currency -> sku -> product & organization & promotions
    const { data, count, error } = await supabase
      .from('sku_prices')
      .select(`
        *,
        sku_currency:sku_currency_id (
          sku_id,
          country_code,
          currency_code,
          srp,
          is_default,
          sku:sku_id (
            id,
            code,
            organization_id,
            product:products (
              title,
              product_type,
              rev_share_override,
              promotion_products (
                discount,
                promotion:promotions (
                  start_date,
                  end_date,
                  start_time,
                  end_time,
                  status
                )
              )
            ),
            organization:organizations (
              id,
              name,
              rev_share
            )
          )
        )
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Expose total count for client-side pagination
    res.setHeader('X-Total-Count', count ?? 0)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

module.exports = router
