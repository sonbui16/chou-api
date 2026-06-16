import { prisma } from '../../lib/prisma.js'

/** Tạo/cập nhật đánh giá (1 review / khách / sản phẩm). */
export async function upsertReview(userId, { product_id, rental_id, rating, comment }) {
  return prisma.review.upsert({
    where: { product_id_customer_id: { product_id, customer_id: userId } },
    create: { product_id, customer_id: userId, rental_id: rental_id ?? null, rating, comment },
    update: { rating, comment, rental_id: rental_id ?? null },
  })
}
