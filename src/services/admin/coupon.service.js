const { prisma } = require('@/lib/prisma.js')

function listCoupons() {
  return prisma.coupon.findMany({ orderBy: { created_at: 'desc' } })
}

async function saveCoupon(id, data) {
  const payload = { ...data, code: data.code.toUpperCase().trim() }
  if (id) return prisma.coupon.update({ where: { id }, data: payload })
  return prisma.coupon.create({ data: payload })
}

async function deleteCoupon(id) {
  await prisma.coupon.delete({ where: { id } })
  return { ok: true }
}

module.exports = { listCoupons, saveCoupon, deleteCoupon }
