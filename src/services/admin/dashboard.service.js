import { prisma } from '../../lib/prisma.js'

/** Số liệu tổng quan cho dashboard quản trị. */
export async function getStats() {
  const [payments, rentals, inventory] = await Promise.all([
    prisma.payment.findMany({ where: { status: 'paid' } }),
    prisma.rental.findMany({ select: { status: true } }),
    prisma.inventoryItem.findMany({ select: { status: true } }),
  ])

  const revenue = payments
    .filter((p) => p.kind !== 'deposit' && p.kind !== 'deposit_refund' && Number(p.amount) > 0)
    .reduce((s, p) => s + Number(p.amount), 0)

  const byMonth = {}
  for (const p of payments) {
    if (p.kind === 'deposit' || Number(p.amount) <= 0) continue
    const m = (p.paid_at ?? p.created_at).toISOString().slice(0, 7)
    byMonth[m] = (byMonth[m] ?? 0) + Number(p.amount)
  }

  const totalItems = inventory.filter((i) => i.status !== 'retired').length
  const rentedItems = inventory.filter((i) => i.status === 'rented').length

  const recent = await prisma.rental.findMany({
    include: { customer: { select: { full_name: true } } },
    orderBy: { created_at: 'desc' },
    take: 6,
  })

  return {
    revenue,
    active_rentals: rentals.filter((r) => r.status === 'in_use').length,
    overdue: rentals.filter((r) => r.status === 'overdue').length,
    total_items: totalItems,
    rented_items: rentedItems,
    utilization: totalItems ? Math.round((rentedItems / totalItems) * 100) : 0,
    revenue_by_month: Object.entries(byMonth).sort().map(([month, value]) => ({ month, value })),
    recent,
  }
}
