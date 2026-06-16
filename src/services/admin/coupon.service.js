import { prisma } from '../../lib/prisma.js'

export function listCoupons() {
  return prisma.coupon.findMany({ orderBy: { created_at: 'desc' } })
}

export async function saveCoupon(id, data) {
  const payload = { ...data, code: data.code.toUpperCase().trim() }
  if (id) return prisma.coupon.update({ where: { id }, data: payload })
  return prisma.coupon.create({ data: payload })
}

export async function deleteCoupon(id) {
  await prisma.coupon.delete({ where: { id } })
  return { ok: true }
}
