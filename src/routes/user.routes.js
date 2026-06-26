const { Router } = require('express')
const { validate } = require('@/middlewares/validate.middleware.js')
const { optionalAuth, requireAuth } = require('@/middlewares/auth.middleware.js')
const rateLimit = require('express-rate-limit')
const catalog = require('@/controllers/user/catalog.controller.js')
const auth = require('@/controllers/user/auth.controller.js')
const account = require('@/controllers/user/account.controller.js')
const presence = require('@/controllers/user/presence.controller.js')
const V = require('@/validators/index.js')

const r = Router()

/* ---------------- Storefront công khai ---------------- */
r.get('/categories', catalog.getCategories)
r.get('/sizes', catalog.getSizes)
r.get('/colors', catalog.getColors)
r.get('/products', validate(V.listProductsSchema), catalog.getProducts)
r.get('/products/:slug', validate(V.productSlugSchema), catalog.getProduct)
r.get('/products/:slug/availability', validate(V.availabilitySchema), catalog.getAvailability)
r.get('/products/:slug/reviews', validate(V.productSlugSchema), catalog.getReviews)
r.get('/settings', catalog.publicSettings)
r.post('/coupons/validate', validate(V.validateCouponSchema), catalog.validateCoupon)
r.post(
  '/presence/heartbeat',
  rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false }),
  optionalAuth,
  validate(V.presenceHeartbeatSchema),
  presence.heartbeat,
)

/* ---------------- Auth ---------------- */
r.post('/auth/register', validate(V.registerSchema), auth.register)
r.post('/auth/login', validate(V.loginSchema), auth.login)
r.get('/auth/me', requireAuth, auth.me)

/* ---------------- Tài khoản (cần đăng nhập) ---------------- */
r.get('/addresses', requireAuth, account.listAddresses)
r.post('/addresses', requireAuth, validate(V.createAddressSchema), account.createAddress)
r.put('/addresses/:id', requireAuth, validate(V.updateAddressSchema), account.updateAddress)
r.delete('/addresses/:id', requireAuth, validate(V.idParamSchema), account.deleteAddress)

r.get('/rentals', requireAuth, account.myRentals)
r.post('/rentals', requireAuth, validate(V.createRentalSchema), account.createRental)
r.get('/rentals/:rentalNo', requireAuth, validate(V.rentalNoSchema), account.myRental)

r.post('/reviews', requireAuth, validate(V.reviewSchema), account.createReview)

module.exports = r
