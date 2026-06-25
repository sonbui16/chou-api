const { prisma } = require('@/lib/prisma.js')
const { ApiError } = require('@/lib/ApiError.js')

const rentalInclude = {
  items: true,
  payments: true,
  address: true,
  customer: { select: { id: true, full_name: true, email: true, phone: true } },
}

function listRentals(status) {
  return prisma.rental.findMany({
    where: status ? { status } : undefined,
    include: rentalInclude,
    orderBy: { created_at: 'desc' },
  })
}

async function getRental(id) {
  const r = await prisma.rental.findUnique({ where: { id }, include: rentalInclude })
  if (!r) throw ApiError.notFound('Không tìm thấy đơn')
  return r
}

async function updateRentalStatus(id, status, condition_in) {
  const rental = await prisma.rental.findUnique({ where: { id } })
  if (!rental) throw ApiError.notFound('Không tìm thấy đơn')

  const data = { status }
  const now = new Date()
  if (status === 'in_use') data.picked_up_at = now
  if (status === 'returned') data.returned_at = now
  if (status === 'cancelled') data.cancelled_at = now

  return prisma.$transaction(async (tx) => {
    if (status === 'returned' && condition_in) {
      await tx.rentalItem.updateMany({ where: { rental_id: id }, data: { condition_in } })
    }
    // huỷ đơn → đánh dấu rental_items cancelled để nhả lịch (EXCLUDE bỏ qua)
    if (status === 'cancelled') {
      await tx.rentalItem.updateMany({ where: { rental_id: id }, data: { cancelled_at: now } })
    }
    return tx.rental.update({ where: { id }, data, include: rentalInclude })
  })
}

async function refundDeposit(id) {
  const rental = await prisma.rental.findUnique({ where: { id }, include: { payments: true } })
  if (!rental) throw ApiError.notFound('Không tìm thấy đơn')
  if (rental.payments.some((p) => p.kind === 'deposit_refund')) {
    throw ApiError.badRequest('Đơn đã được hoàn cọc')
  }
  return prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        rental_id: id,
        kind: 'deposit_refund',
        method: 'bank_transfer',
        amount: Number(rental.deposit_total) * -1,
        status: 'paid',
        paid_at: new Date(),
      },
    })
    await tx.payment.updateMany({ where: { rental_id: id, kind: 'deposit' }, data: { status: 'refunded' } })
    return tx.rental.update({ where: { id }, data: { status: 'completed' }, include: rentalInclude })
  })
}

module.exports = { listRentals, getRental, updateRentalStatus, refundDeposit }
