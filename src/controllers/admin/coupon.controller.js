const { asyncHandler } = require('@/lib/ApiError.js')
const { sendJson } = require('@/lib/serialize.js')
const coupons = require('@/services/admin/coupon.service.js')

const listCoupons = asyncHandler(async (_req, res) => sendJson(res, await coupons.listCoupons()))

const saveCoupon = asyncHandler(async (req, res) =>
  sendJson(res, await coupons.saveCoupon(req.valid.params.id, req.valid.body), req.valid.params.id ? 200 : 201),
)

const deleteCoupon = asyncHandler(async (req, res) =>
  sendJson(res, await coupons.deleteCoupon(req.valid.params.id)),
)

module.exports = { listCoupons, saveCoupon, deleteCoupon }
