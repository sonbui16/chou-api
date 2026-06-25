const { prisma } = require('@/lib/prisma.js')
const { ApiError } = require('@/lib/ApiError.js')
const { couponDiscount } = require('@/lib/pricing.js')

/** Người dùng kiểm tra & áp mã giảm giá (chỉ đọc). */
async function validateCoupon(code, subtotal) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } })
  if (!coupon) throw ApiError.notFound('Mã không tồn tại')
  const { discount, reason } = couponDiscount(coupon, subtotal)
  if (discount === 0) throw ApiError.badRequest(reason ?? 'Mã không áp dụng được')
  return { code: coupon.code, type: coupon.type, value: coupon.value, discount }
}

module.exports = { validateCoupon }
