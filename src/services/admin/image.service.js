const fs = require('node:fs/promises')
const path = require('node:path')
const { prisma } = require('@/lib/prisma.js')
const { ApiError } = require('@/lib/ApiError.js')
const { UPLOAD_DIR } = require('@/lib/upload.js')

const fileUrl = (req, filename) => `${req.protocol}://${req.get('host')}/uploads/${filename}`

/** Lưu các ảnh đã upload vào product_images. Ảnh đầu tiên của mẫu chưa có ảnh → is_primary. */
async function addImages(productId, files, req) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
  if (!product) throw ApiError.notFound('Không tìm thấy mẫu váy')
  if (!files?.length) throw ApiError.badRequest('Chưa chọn ảnh để tải lên')

  const agg = await prisma.productImage.aggregate({
    where: { product_id: productId },
    _count: true,
    _max: { position: true },
  })
  const hadNone = agg._count === 0
  let pos = (agg._max.position ?? -1) + 1

  await prisma.productImage.createMany({
    data: files.map((file, i) => ({
      product_id: productId,
      url: fileUrl(req, file.filename),
      position: pos++,
      is_primary: hadNone && i === 0,
    })),
  })
  return prisma.productImage.findMany({ where: { product_id: productId }, orderBy: { position: 'asc' } })
}

async function setPrimaryImage(imageId) {
  const image = await prisma.productImage.findUnique({ where: { id: imageId }, select: { product_id: true } })
  if (!image) throw ApiError.notFound('Không tìm thấy ảnh')
  const productId = image.product_id
  await prisma.$transaction([
    prisma.productImage.updateMany({ where: { product_id: productId }, data: { is_primary: false } }),
    prisma.productImage.update({ where: { id: imageId }, data: { is_primary: true } }),
  ])
  return prisma.productImage.findMany({ where: { product_id: productId }, orderBy: { position: 'asc' } })
}

async function deleteImage(id) {
  const image = await prisma.productImage.findUnique({ where: { id }, select: { url: true } })
  if (!image) throw ApiError.notFound('Không tìm thấy ảnh')
  await prisma.productImage.delete({ where: { id } })
  // Xoá file vật lý nếu là ảnh tải lên (best-effort)
  const filename = image.url.split('/uploads/')[1]
  if (filename) await fs.unlink(path.join(UPLOAD_DIR, filename)).catch(() => {})
  return { ok: true }
}

module.exports = { addImages, setPrimaryImage, deleteImage }
