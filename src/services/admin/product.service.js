import { prisma } from '../../lib/prisma.js'

export function listProducts() {
  return prisma.product.findMany({
    include: {
      category: true,
      images: { where: { is_primary: true }, take: 1 },
      variants: { select: { id: true } },
      _count: { select: { variants: true } },
    },
    orderBy: { created_at: 'desc' },
  })
}

export async function saveProduct(id, data) {
  if (id) return prisma.product.update({ where: { id }, data })
  return prisma.product.create({ data })
}

export async function deleteProduct(id) {
  await prisma.product.delete({ where: { id } })
  return { ok: true }
}
