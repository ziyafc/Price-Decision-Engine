// apps/api/src/routes/skus.route.js
import express from 'express'
import { supabase } from '../infra/supabaseClient.js'

const router = express.Router()

/**
 * GET /api/skus?page=1&limit=200
 * Returns paginated list of sku_prices with nested sku_currency and sku → product & organization
 */
router.get('/', async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 200
  const offset = (page - 1) * limit

  try {
    const { data, error, count } = await supabase
      .from('sku_prices')
      .select(
        `
        *,
        sku_currency:sku_currency_id (
          sku_id,
          currency_code,
          country_code,
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
      `,
        { count: 'exact' }
      )
      .range(offset, offset + limit - 1)

    if (error) throw error

    // toplam kayıt sayısını header’a ekleyelim
    res.set('X-Total-Count', count ?? 0)
    return res.json(data)
  } catch (err) {
    console.error('[skus.route]', err)
    next(err)
  }
})

export default router
