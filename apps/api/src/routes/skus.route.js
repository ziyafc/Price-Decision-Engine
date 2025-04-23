// apps/api/src/routes/skus.route.js
import { Router } from 'express'
import { supabase } from '../infra/supabaseClient'

export const skusRoute = Router()

// GET /api/skus?page=1&limit=200
skusRoute.get('/', async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page  as string) || 1
    const limit  = parseInt(req.query.limit as string) || 200
    const offset = (page - 1) * limit

    const { data, count, error } = await supabase
      .from('sku_prices')
      .select(
        `
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

    // Toplam satır sayısını header’da dönüyoruz
    res.setHeader('X-Total-Count', count ?? 0)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

export default skusRoute
