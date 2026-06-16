import { z } from 'zod'

const uuid = z.string().uuid()
const isoDateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày YYYY-MM-DD')

/* ---------------- Catalog ---------------- */
export const listProductsSchema = z.object({
  query: z.object({
    cat: z.string().optional(),
    size: z.coerce.number().int().optional(),
    color: z.coerce.number().int().optional(),
    maxPrice: z.coerce.number().int().optional(),
    sort: z.enum(['featured', 'price-asc', 'price-desc', 'rating']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(60).default(12),
  }),
})

export const productSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
})

export const availabilitySchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  query: z.object({ variantId: uuid, start: isoDateStr, end: isoDateStr }),
})

/* ---------------- Auth ---------------- */
export const registerSchema = z.object({
  body: z.object({
    full_name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8),
    password: z.string().min(6),
  }),
})

export const loginSchema = z.object({
  body: z.object({ email: z.string().email(), password: z.string().min(1) }),
})

/* ---------------- Address ---------------- */
const addressFields = {
  recipient: z.string().min(2),
  phone: z.string().min(8),
  line1: z.string().min(2),
  ward: z.string().optional(),
  district: z.string().optional(),
  province: z.string().min(1),
  is_default: z.boolean().optional(),
}
export const createAddressSchema = z.object({ body: z.object(addressFields) })
export const updateAddressSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object(addressFields).partial(),
})
export const idParamSchema = z.object({ params: z.object({ id: uuid }) })

/* ---------------- Rentals ---------------- */
export const createRentalSchema = z.object({
  body: z.object({
    fulfillment: z.enum(['pickup', 'delivery']),
    address_id: uuid.nullish(),
    note: z.string().optional(),
    method: z.enum(['cash', 'bank_transfer', 'vnpay', 'momo', 'card']),
    coupon_code: z.string().optional(),
    items: z
      .array(z.object({ variant_id: uuid, start: isoDateStr, end: isoDateStr }))
      .min(1),
  }),
})
export const rentalNoSchema = z.object({ params: z.object({ rentalNo: z.string().min(1) }) })

/* ---------------- Reviews ---------------- */
export const reviewSchema = z.object({
  body: z.object({
    product_id: uuid,
    rental_id: uuid.nullish(),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().optional(),
  }),
})

/* ---------------- Coupons ---------------- */
export const validateCouponSchema = z.object({
  body: z.object({ code: z.string().min(1), subtotal: z.coerce.number().min(0) }),
})
const couponFields = {
  code: z.string().min(1),
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().min(0),
  min_total: z.coerce.number().min(0).default(0),
  max_discount: z.coerce.number().min(0).nullish(),
  valid_from: z.string().datetime().nullish(),
  valid_to: z.string().datetime().nullish(),
  usage_limit: z.coerce.number().int().min(0).nullish(),
  is_active: z.boolean().default(true),
}
export const saveCouponSchema = z.object({
  params: z.object({ id: uuid }).partial(),
  body: z.object(couponFields),
})

/* ---------------- Admin: products / inventory / rentals / settings ---------------- */
export const saveProductSchema = z.object({
  params: z.object({ id: uuid }).partial(),
  body: z.object({
    category_id: uuid.nullish(),
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().nullish(),
    brand: z.string().nullish(),
    rental_price: z.coerce.number().min(0),
    deposit: z.coerce.number().min(0).default(0),
    status: z.enum(['draft', 'active', 'archived']).default('draft'),
  }),
})

export const inventoryUpdateSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    status: z.enum(['available', 'rented', 'cleaning', 'repairing', 'retired']).optional(),
    condition: z.enum(['new', 'good', 'fair', 'worn', 'damaged']).optional(),
    notes: z.string().nullish(),
  }),
})

export const rentalStatusSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'in_use', 'returned', 'completed', 'cancelled', 'overdue']),
    condition_in: z.enum(['new', 'good', 'fair', 'worn', 'damaged']).optional(),
  }),
})

export const adminRentalsQuerySchema = z.object({
  query: z.object({
    status: z
      .enum(['pending', 'confirmed', 'in_use', 'returned', 'completed', 'cancelled', 'overdue'])
      .optional(),
  }),
})

export const inventoryQuerySchema = z.object({
  query: z.object({
    status: z.enum(['available', 'rented', 'cleaning', 'repairing', 'retired']).optional(),
  }),
})

export const updateSettingsSchema = z.object({
  body: z.record(z.string(), z.any()),
})
