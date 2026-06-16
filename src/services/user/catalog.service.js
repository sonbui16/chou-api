import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../lib/ApiError.js'

const productInclude = {
  category: true,
  images: { orderBy: { position: 'asc' } },
  variants: { include: { size: true, color: true, inventory: true } },
  reviews: true,
}

function toProductView(p) {
  const ratingCount = p.reviews.length
  const ratingAvg = ratingCount
    ? p.reviews.reduce((s, r) => s + r.rating, 0) / ratingCount
    : 0
  const primary = p.images.find((i) => i.is_primary) ?? p.images[0]
  const availableNow = p.variants.reduce(
    (sum, v) => sum + v.inventory.filter((i) => i.status === 'available').length,
    0,
  )
  // Bỏ mảng reviews thô khỏi payload list (giữ aggregate)
  const { reviews, ...rest } = p
  return {
    ...rest,
    primary_image: primary?.url ?? null,
    rating_avg: Number(ratingAvg.toFixed(2)),
    rating_count: ratingCount,
    available_now: availableNow,
  }
}

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { position: 'asc' } })
}

export async function listSizes() {
  return prisma.size.findMany({ orderBy: { id: 'asc' } })
}

export async function listColors() {
  return prisma.color.findMany({ orderBy: { id: 'asc' } })
}

export async function listProducts(q) {
  const where = { status: 'active' }
  if (q.cat) where.category = { slug: q.cat }
  if (q.size) where.variants = { some: { size_id: q.size } }
  if (q.color) {
    where.variants = where.variants
      ? { some: { AND: [{ size_id: q.size }, { color_id: q.color }] } }
      : { some: { color_id: q.color } }
  }
  if (q.maxPrice) where.rental_price = { lte: q.maxPrice }

  const orderBy =
    q.sort === 'price-asc'
      ? { rental_price: 'asc' }
      : q.sort === 'price-desc'
        ? { rental_price: 'desc' }
        : { created_at: 'desc' }

  const page = q.page ?? 1
  const limit = q.limit ?? 12
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  let items = rows.map(toProductView)
  if (q.sort === 'rating') items = items.sort((a, b) => b.rating_avg - a.rating_avg)

  return { items, total, page, limit, page_count: Math.ceil(total / limit) }
}

export async function getProductBySlug(slug) {
  const p = await prisma.product.findUnique({ where: { slug }, include: productInclude })
  if (!p) throw ApiError.notFound('Không tìm thấy sản phẩm')
  return toProductView(p)
}

export async function getProductReviews(slug) {
  const p = await prisma.product.findUnique({ where: { slug }, select: { id: true } })
  if (!p) throw ApiError.notFound('Không tìm thấy sản phẩm')
  return prisma.review.findMany({
    where: { product_id: p.id },
    include: { customer: { select: { full_name: true } } },
    orderBy: { created_at: 'desc' },
  })
}

export async function getAvailabilityForProduct(slug, variantId, start, end) {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, variants: { select: { id: true } } },
  })
  if (!product) throw ApiError.notFound('Không tìm thấy sản phẩm')
  if (!product.variants.some((v) => v.id === variantId)) {
    throw ApiError.badRequest('variantId không thuộc sản phẩm này')
  }
  return { product, variantId, start, end }
}
