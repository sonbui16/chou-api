const { z } = require('zod')

const uuid = z.string().uuid()
const isoDateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày YYYY-MM-DD')

/* ---------------- Catalog ---------------- */
const listProductsSchema = z.object({
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

const productSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
})

const availabilitySchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  query: z.object({ variantId: uuid, start: isoDateStr, end: isoDateStr }),
})

/* ---------------- Auth ---------------- */
const registerSchema = z.object({
  body: z.object({
    full_name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8),
    password: z.string().min(6),
  }),
})

const loginSchema = z.object({
  body: z.object({ email: z.string().email(), password: z.string().min(1) }),
})

/* ---------------- Presence ---------------- */
const presenceId = z.string().min(16).max(64).regex(/^[a-zA-Z0-9_-]+$/)
const presenceHeartbeatSchema = z.object({
  body: z.object({
    visitor_id: presenceId,
    session_id: presenceId,
    path: z.string().min(1).max(2048).startsWith('/'),
    referrer: z.string().max(2048).nullish(),
    event: z.enum(['heartbeat', 'pageview', 'visible']),
  }),
})

const adminVisitorsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['online', 'recent']).default('online'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional().default(''),
  }),
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
const createAddressSchema = z.object({ body: z.object(addressFields) })
const updateAddressSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object(addressFields).partial(),
})
const idParamSchema = z.object({ params: z.object({ id: uuid }) })

/* ---------------- Rentals ---------------- */
const createRentalSchema = z.object({
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
const rentalNoSchema = z.object({ params: z.object({ rentalNo: z.string().min(1) }) })

/* ---------------- Reviews ---------------- */
const reviewSchema = z.object({
  body: z.object({
    product_id: uuid,
    rental_id: uuid.nullish(),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().optional(),
  }),
})

/* ---------------- Coupons ---------------- */
const validateCouponSchema = z.object({
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
const saveCouponSchema = z.object({
  params: z.object({ id: uuid }).partial(),
  body: z.object(couponFields),
})

/* ---------------- Admin: products / inventory / rentals / settings ---------------- */
const saveProductSchema = z.object({
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

const inventoryUpdateSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    status: z.enum(['available', 'rented', 'cleaning', 'repairing', 'retired']).optional(),
    condition: z.enum(['new', 'good', 'fair', 'worn', 'damaged']).optional(),
    notes: z.string().nullish(),
  }),
})

const rentalStatusSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'in_use', 'returned', 'completed', 'cancelled', 'overdue']),
    condition_in: z.enum(['new', 'good', 'fair', 'worn', 'damaged']).optional(),
  }),
})

const adminRentalsQuerySchema = z.object({
  query: z.object({
    status: z
      .enum(['pending', 'confirmed', 'in_use', 'returned', 'completed', 'cancelled', 'overdue'])
      .optional(),
  }),
})

const inventoryQuerySchema = z.object({
  query: z.object({
    status: z.enum(['available', 'rented', 'cleaning', 'repairing', 'retired']).optional(),
  }),
})

const updateSettingsSchema = z.object({
  body: z.record(z.string(), z.any()),
})

/* ---------------- Admin: variants / inventory intake / images ---------------- */
const itemCondition = z.enum(['new', 'good', 'fair', 'worn', 'damaged'])

const createVariantSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    size_id: z.coerce.number().int().nullish(),
    color_id: z.coerce.number().int().nullish(),
    sku: z.string().min(1).nullish(),
    price_override: z.coerce.number().min(0).nullish(),
  }),
})

const addInventorySchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    quantity: z.coerce.number().int().min(1).max(50),
    condition: itemCondition.optional(),
    acquired_at: isoDateStr.optional(),
  }),
})

module.exports = { listProductsSchema, productSlugSchema, availabilitySchema, registerSchema, loginSchema, presenceHeartbeatSchema, adminVisitorsQuerySchema, createAddressSchema, updateAddressSchema, idParamSchema, createRentalSchema, rentalNoSchema, reviewSchema, validateCouponSchema, saveCouponSchema, saveProductSchema, inventoryUpdateSchema, rentalStatusSchema, adminRentalsQuerySchema, inventoryQuerySchema, updateSettingsSchema, createVariantSchema, addInventorySchema }
