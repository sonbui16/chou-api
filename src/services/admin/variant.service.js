const { prisma } = require('@/lib/prisma.js')
const { ApiError } = require('@/lib/ApiError.js')

async function createVariant(productId, data) {
  try {
    return await prisma.productVariant.create({
      data: {
        product_id: productId,
        size_id: data.size_id ?? null,
        color_id: data.color_id ?? null,
        sku: data.sku ?? null,
        price_override: data.price_override ?? null,
      },
      include: {
        size: true,
        color: true,
        _count: { select: { inventory: true } },
        inventory: {
          orderBy: { asset_code: 'asc' },
          select: { id: true, asset_code: true, status: true, condition: true },
        },
      },
    })
  } catch (e) {
    if (e.code === 'P2002') throw ApiError.conflict('Mẫu đã có biến thể màu/size này', 'DUPLICATE')
    if (e.code === 'P2025') throw ApiError.notFound('Không tìm thấy mẫu váy')
    if (e.code === 'P2003') throw ApiError.badRequest('Màu hoặc size không hợp lệ')
    throw e
  }
}

async function deleteVariant(id) {
  const count = await prisma.inventoryItem.count({ where: { variant_id: id } })
  if (count > 0) throw ApiError.conflict('Hãy xoá hết bản váy trong biến thể này trước')
  try {
    await prisma.productVariant.delete({ where: { id } })
  } catch (e) {
    if (e.code === 'P2025') throw ApiError.notFound('Không tìm thấy biến thể')
    throw e
  }
  return { ok: true }
}

module.exports = { createVariant, deleteVariant }
