const { rentalDays } = require('@/lib/dates.js')

/** Tính giảm giá từ coupon đối với subtotal. Trả { discount, reason }. */
function couponDiscount(coupon, subtotal, today = new Date()) {
  if (!coupon) return { discount: 0 }
  if (!coupon.is_active) return { discount: 0, reason: 'Mã không còn hiệu lực' }
  if (coupon.valid_from && new Date(coupon.valid_from) > today)
    return { discount: 0, reason: 'Mã chưa đến ngày áp dụng' }
  if (coupon.valid_to && new Date(coupon.valid_to) < today)
    return { discount: 0, reason: 'Mã đã hết hạn' }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit)
    return { discount: 0, reason: 'Mã đã hết lượt dùng' }

  const min = Number(coupon.min_total)
  if (subtotal < min)
    return { discount: 0, reason: `Cần đơn tối thiểu ${min.toLocaleString('vi-VN')}₫` }

  let discount =
    coupon.type === 'percent'
      ? Math.round((subtotal * Number(coupon.value)) / 100)
      : Number(coupon.value)
  if (coupon.max_discount != null) discount = Math.min(discount, Number(coupon.max_discount))
  return { discount: Math.min(discount, subtotal) }
}

/**
 * Tính các khoản tiền của đơn.
 * lines: [{ unit_price, deposit, start, end }]
 */
function computeTotals(lines, { fulfillment, coupon, settings }) {
  const priced = lines.map((l) => {
    const days = rentalDays(l.start, l.end)
    return { days, lineTotal: Number(l.unit_price) * days, deposit: Number(l.deposit) }
  })
  const subtotal = priced.reduce((s, l) => s + l.lineTotal, 0)
  const deposit_total = priced.reduce((s, l) => s + l.deposit, 0)
  const { discount, reason } = couponDiscount(coupon, subtotal)
  const net = subtotal - discount
  const shipping_fee =
    fulfillment === 'pickup' || net >= Number(settings.free_shipping_min) ? 0 : 40000
  const grand_total = net + shipping_fee
  return {
    subtotal,
    discount_total: discount,
    deposit_total,
    shipping_fee,
    grand_total,
    coupon_reason: reason,
    lines: priced,
  }
}

module.exports = { couponDiscount, computeTotals }
