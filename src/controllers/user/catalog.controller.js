const { asyncHandler } = require('@/lib/ApiError.js')
const { sendJson } = require('@/lib/serialize.js')
const { getSettings } = require('@/lib/settings.js')
const { checkAvailability } = require('@/lib/availability.js')
const catalog = require('@/services/user/catalog.service.js')
const coupons = require('@/services/user/coupon.service.js')

const getCategories = asyncHandler(async (_req, res) => {
  sendJson(res, await catalog.listCategories())
})

const getSizes = asyncHandler(async (_req, res) => {
  sendJson(res, await catalog.listSizes())
})

const getColors = asyncHandler(async (_req, res) => {
  sendJson(res, await catalog.listColors())
})

const getProducts = asyncHandler(async (req, res) => {
  sendJson(res, await catalog.listProducts(req.valid.query))
})

const getProduct = asyncHandler(async (req, res) => {
  sendJson(res, await catalog.getProductBySlug(req.valid.params.slug))
})

const getReviews = asyncHandler(async (req, res) => {
  sendJson(res, await catalog.getProductReviews(req.valid.params.slug))
})

const getAvailability = asyncHandler(async (req, res) => {
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
const publicSettings = asyncHandler(async (_req, res) => {
  const s = await getSettings()
  sendJson(res, {
    min_rental_days: s.min_rental_days,
    free_shipping_min: s.free_shipping_min,
    cleaning_buffer_days: s.cleaning_buffer_days,
  })
})

const validateCoupon = asyncHandler(async (req, res) => {
  sendJson(res, await coupons.validateCoupon(req.valid.body.code, req.valid.body.subtotal))
})

module.exports = { getCategories, getSizes, getColors, getProducts, getProduct, getReviews, getAvailability, publicSettings, validateCoupon }
