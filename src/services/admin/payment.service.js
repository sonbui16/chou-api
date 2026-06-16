import { prisma } from '../../lib/prisma.js'

export function listPayments() {
  return prisma.payment.findMany({
    include: { rental: { select: { rental_no: true } } },
    orderBy: { created_at: 'desc' },
  })
}
