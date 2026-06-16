import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../lib/ApiError.js'
import { getSettings } from '../../lib/settings.js'
import { checkAvailability } from '../../lib/availability.js'
import { computeTotals } from '../../lib/pricing.js'
import { addDays, isoDate, toDateOnly } from '../../lib/dates.js'

const rentalInclude = {
  items: true,
  payments: true,
  address: true,
  coupon: { select: { code: true } },
}

async function nextRentalNo() {
  const count = await prisma.rental.count()
  return `R-2026-${String(count + 119).padStart(6, '0')}`
}

export async function createRental(userId, input) {
  const settings = await getSettings()
  const buffer = Number(settings.cleaning_buffer_days) || 0

  // Địa chỉ bắt buộc khi giao hàng
  if (input.fulfillment === 'delivery' && !input.address_id) {
    throw ApiError.badRequest('Giao hàng cần địa chỉ nhận')
  }

  // Coupon (nếu có)
  let coupon = null
  if (input.coupon_code) {
    coupon = await prisma.coupon.findUnique({ where: { code: input.coupon_code.toUpperCase().trim() } })
  }

  // Chọn bản váy còn trống cho từng dòng + gom thông tin giá
  const usedItemIds = new Set()
  const lines = []
  for (const line of input.items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: line.variant_id },
      include: { product: true },
    })
    if (!variant) throw ApiError.badRequest('Biến thể không tồn tại')

    const avail = await checkAvailability({
      variantId: line.variant_id,
      start: line.start,
      end: line.end,
      bufferDays: buffer,
    })
    const itemId = avail.availableItemIds.find((id) => !usedItemIds.has(id))
    if (!itemId) throw ApiError.conflict('Hết váy trong khoảng ngày đã chọn', 'OUT_OF_STOCK')
    usedItemIds.add(itemId)

    const unitPrice = Number(variant.price_override ?? variant.product.rental_price)
    lines.push({
      item_id: itemId,
      variant_id: variant.id,
      product_id: variant.product_id,
      product_name: variant.product.name,
      unit_price: unitPrice,
      deposit: Number(variant.product.deposit),
      start: line.start,
      end: line.end,
    })
  }

  const totals = computeTotals(
    lines.map((l) => ({ unit_price: l.unit_price, deposit: l.deposit, start: l.start, end: l.end })),
    { fulfillment: input.fulfillment, coupon, settings },
  )

  const startDate = lines.reduce((m, l) => (l.start < m ? l.start : m), lines[0].start)
  const endDate = lines.reduce((m, l) => (l.end > m ? l.end : m), lines[0].end)
  const rentalNo = await nextRentalNo()
  const payNow = input.method !== 'cash'

  const rental = await prisma.$transaction(async (tx) => {
    const created = await tx.rental.create({
      data: {
        rental_no: rentalNo,
        customer_id: userId,
        status: payNow ? 'confirmed' : 'pending',
        fulfillment: input.fulfillment,
        address_id: input.address_id ?? null,
        start_date: toDateOnly(startDate),
        end_date: toDateOnly(endDate),
        subtotal: totals.subtotal,
        discount_total: totals.discount_total,
        deposit_total: totals.deposit_total,
        shipping_fee: totals.shipping_fee,
        grand_total: totals.grand_total,
        coupon_id: coupon?.id ?? null,
        note: input.note ?? null,
        items: {
          create: lines.map((l) => ({
            item_id: l.item_id,
            variant_id: l.variant_id,
            product_id: l.product_id,
            rental_start: toDateOnly(l.start),
            rental_end: toDateOnly(l.end),
            hold_until: addDays(l.end, 1 + buffer),
            product_name: l.product_name,
            unit_price: l.unit_price,
            deposit_amount: l.deposit,
          })),
        },
      },
      include: rentalInclude,
    })

    if (payNow) {
      await tx.payment.createMany({
        data: [
          {
            rental_id: created.id,
            kind: 'rental_fee',
            method: input.method,
            amount: totals.grand_total,
            status: 'paid',
            provider_txn: `TXN-${rentalNo}-FEE`,
            paid_at: new Date(),
          },
          {
            rental_id: created.id,
            kind: 'deposit',
            method: input.method,
            amount: totals.deposit_total,
            status: 'paid',
            paid_at: new Date(),
          },
        ],
      })
    }

    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { used_count: { increment: 1 } },
      })
    }

    return tx.rental.findUnique({ where: { id: created.id }, include: rentalInclude })
  })

  return rental
}

export function listMyRentals(userId) {
  return prisma.rental.findMany({
    where: { customer_id: userId },
    include: rentalInclude,
    orderBy: { created_at: 'desc' },
  })
}

export async function getMyRentalByNo(userId, rentalNo) {
  const rental = await prisma.rental.findUnique({ where: { rental_no: rentalNo }, include: rentalInclude })
  if (!rental || rental.customer_id !== userId) throw ApiError.notFound('Không tìm thấy đơn')
  return rental
}

export { isoDate }
