const { prisma } = require('@/lib/prisma.js')
const { addDays, isoDate, rangesOverlap } = require('@/lib/dates.js')

/**
 * Số bản vật lý của một variant còn trống trong khoảng [start, end] (ngày, bao gồm 2 đầu mút).
 * Khớp ràng buộc no_double_booking: khoảng giữ chỗ = [start, end + 1 + buffer).
 */
async function checkAvailability({ variantId, start, end, bufferDays }) {
  const usable = await prisma.inventoryItem.findMany({
    where: { variant_id: variantId, status: { notIn: ['retired', 'repairing'] } },
    select: { id: true },
  })
  if (usable.length === 0) {
    return { total: 0, available: 0, availableItemIds: [] }
  }

  // Khoảng yêu cầu (nửa mở), đã gồm buffer giặt ủi — đúng như giá trị sẽ lưu hold_until.
  const reqStart = isoDate(start)
  const reqEnd = isoDate(addDays(end, 1 + bufferDays))

  const conflicts = await prisma.rentalItem.findMany({
    where: {
      variant_id: variantId,
      cancelled_at: null,
      rental: { status: { not: 'cancelled' } },
    },
    select: { item_id: true, rental_start: true, hold_until: true },
  })

  const blocked = new Set()
  for (const c of conflicts) {
    if (rangesOverlap(reqStart, reqEnd, c.rental_start, c.hold_until)) {
      blocked.add(c.item_id)
    }
  }

  const free = usable.filter((i) => !blocked.has(i.id))
  return {
    total: usable.length,
    available: free.length,
    availableItemIds: free.map((i) => i.id),
  }
}

module.exports = { checkAvailability }
