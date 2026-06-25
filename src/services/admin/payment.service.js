const { prisma } = require('@/lib/prisma.js')

function listPayments() {
  return prisma.payment.findMany({
    include: { rental: { select: { rental_no: true } } },
    orderBy: { created_at: 'desc' },
  })
}

module.exports = { listPayments }
