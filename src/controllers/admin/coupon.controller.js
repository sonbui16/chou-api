import { asyncHandler } from '../../lib/ApiError.js'
import { sendJson } from '../../lib/serialize.js'
import * as coupons from '../../services/admin/coupon.service.js'

export const listCoupons = asyncHandler(async (_req, res) => sendJson(res, await coupons.listCoupons()))

export const saveCoupon = asyncHandler(async (req, res) =>
  sendJson(res, await coupons.saveCoupon(req.valid.params.id, req.valid.body), req.valid.params.id ? 200 : 201),
)

export const deleteCoupon = asyncHandler(async (req, res) =>
  sendJson(res, await coupons.deleteCoupon(req.valid.params.id)),
)
