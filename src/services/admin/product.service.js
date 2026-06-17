import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../lib/ApiError.js'

export async function getProduct(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { position: 'asc' } },
      variants: {
        orderBy: { created_at: 'asc' },
        include: {
          size: true,
          color: true,
          _count: { select: { inventory: true } },
          inventory: {
            orderBy: { asset_code: 'asc' },
            select: { id: true, asset_code: true, status: true, condition: true },
          },
        },
      },
    },
  })
  if (!product) throw ApiError.notFound('Không tìm thấy mẫu váy')
  return product
}

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
