import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../lib/ApiError.js'
import { nextAssetCodes } from '../../lib/assetCode.js'

/** Thêm `quantity` bản váy thật vào 1 biến thể, tự sinh mã CD-#### nối tiếp. */
export async function addInventoryItems(variantId, { quantity, condition, acquired_at }) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { id: true } })
  if (!variant) throw ApiError.notFound('Không tìm thấy biến thể')

  return prisma.$transaction(async (tx) => {
    const codes = await nextAssetCodes(quantity, tx)
    await tx.inventoryItem.createMany({
      data: codes.map((asset_code) => ({
        variant_id: variantId,
        asset_code,
        condition: condition ?? undefined,
        acquired_at: acquired_at ? new Date(acquired_at) : undefined,
      })),
    })
    return tx.inventoryItem.findMany({
      where: { asset_code: { in: codes } },
      orderBy: { asset_code: 'asc' },
      select: { id: true, asset_code: true, status: true, condition: true },
    })
  })
}

/** Xoá 1 bản váy. Chặn nếu đã từng phát sinh đơn thuê (gợi ý 'Ngừng dùng'). */
export async function deleteInventoryItem(id) {
  const used = await prisma.rentalItem.count({ where: { item_id: id } })
  if (used > 0) {
    throw ApiError.conflict('Bản váy này đã từng cho thuê, không thể xoá. Hãy đổi trạng thái thành "Ngừng dùng".')
  }
  try {
    await prisma.inventoryItem.delete({ where: { id } })
  } catch (e) {
    if (e.code === 'P2025') throw ApiError.notFound('Không tìm thấy bản váy')
    throw e
  }
  return { ok: true }
}

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
