import { asyncHandler } from '../../lib/ApiError.js'
import { sendJson } from '../../lib/serialize.js'
import { getSettings } from '../../lib/settings.js'
import { checkAvailability } from '../../lib/availability.js'
import * as catalog from '../../services/user/catalog.service.js'
import * as coupons from '../../services/user/coupon.service.js'

export const getCategories = asyncHandler(async (_req, res) => {
  sendJson(res, await catalog.listCategories())
})

export const getSizes = asyncHandler(async (_req, res) => {
  sendJson(res, await catalog.listSizes())
})

export const getColors = asyncHandler(async (_req, res) => {
  sendJson(res, await catalog.listColors())
})

export const getProducts = asyncHandler(async (req, res) => {
  sendJson(res, await catalog.listProducts(req.valid.query))
})

export const getProduct = asyncHandler(async (req, res) => {
  sendJson(res, await catalog.getProductBySlug(req.valid.params.slug))
})

export const getReviews = asyncHandler(async (req, res) => {
  sendJson(res, await catalog.getProductReviews(req.valid.params.slug))
})

export const getAvailability = asyncHandler(async (req, res) => {
  const { slug } = req.valid.params
  const { variantId, start, end } = req.valid.query
  await catalog.getAvailabilityForProduct(slug, variantId, start, end)
  const settings = await getSettings()
  const result = await checkAvailability({
    variantId,
    start,
    end,
    bufferDays: Number(settings.cleaning_buffer_days) || 0,
  })
  sendJson(res, result)
})

/* ---------------- Storefront misc (settings công khai + áp coupon) ---------------- */
export const publicSettings = asyncHandler(async (_req, res) => {
  const s = await getSettings()
  sendJson(res, {
    min_rental_days: s.min_rental_days,
    free_shipping_min: s.free_shipping_min,
    cleaning_buffer_days: s.cleaning_buffer_days,
  })
})

export const validateCoupon = asyncHandler(async (req, res) => {
  sendJson(res, await coupons.validateCoupon(req.valid.body.code, req.valid.body.subtotal))
})
