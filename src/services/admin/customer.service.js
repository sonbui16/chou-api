import { prisma } from '../../lib/prisma.js'

export async function listCustomers() {
  const customers = await prisma.user.findMany({
    where: { role: 'customer' },
    include: { _count: { select: { rentals: true } }, rentals: { select: { grand_total: true } } },
    orderBy: { created_at: 'desc' },
  })
  return customers.map((c) => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email,
    phone: c.phone,
    created_at: c.created_at,
    rental_count: c._count.rentals,
    total_spent: c.rentals.reduce((s, r) => s + Number(r.grand_total), 0),
  }))
}
