const { asyncHandler } = require('@/lib/ApiError.js')
const coupons = require('@/services/admin/coupon.service.js')

const listCoupons = asyncHandler(async (_req, res) => res.success(await coupons.listCoupons()))

const saveCoupon = asyncHandler(async (req, res) =>
  res.success(await coupons.saveCoupon(req.valid.params.id, req.valid.body), req.valid.params.id ? 200 : 201),
)

const deleteCoupon = asyncHandler(async (req, res) =>
  res.success(await coupons.deleteCoupon(req.valid.params.id)),
)

module.exports = { listCoupons, saveCoupon, deleteCoupon }
