import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../lib/ApiError.js'

export function listInventory(status) {
  return prisma.inventoryItem.findMany({
    where: status ? { status } : undefined,
    include: { variant: { include: { product: true, size: true, color: true } } },
    orderBy: { asset_code: 'asc' },
  })
}

export async function updateInventoryItem(id, data) {
  try {
    return await prisma.inventoryItem.update({ where: { id }, data })
  } catch {
    throw ApiError.notFound('Không tìm thấy bản váy')
  }
}
