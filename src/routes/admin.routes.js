const { Router } = require('express')
const { validate } = require('@/middlewares/validate.middleware.js')
const { requireAdmin } = require('@/middlewares/auth.middleware.js')
const { uploadImages } = require('@/lib/upload.js')
const dashboard = require('@/controllers/admin/dashboard.controller.js')
const product = require('@/controllers/admin/product.controller.js')
const variant = require('@/controllers/admin/variant.controller.js')
const image = require('@/controllers/admin/image.controller.js')
const inventory = require('@/controllers/admin/inventory.controller.js')
const rental = require('@/controllers/admin/rental.controller.js')
const payment = require('@/controllers/admin/payment.controller.js')
const customer = require('@/controllers/admin/customer.controller.js')
const coupon = require('@/controllers/admin/coupon.controller.js')
const setting = require('@/controllers/admin/setting.controller.js')
const visitor = require('@/controllers/admin/visitor.controller.js')
const V = require('@/validators/index.js')

const r = Router()

// Toàn bộ route admin yêu cầu quyền staff/admin
r.use(requireAdmin)

r.get('/stats', dashboard.stats)
r.get('/visitors/summary', visitor.summary)
r.get('/visitors', validate(V.adminVisitorsQuerySchema), visitor.listVisitors)

r.get('/products', product.listProducts)
r.get('/products/:id', validate(V.idParamSchema), product.getProduct)
r.post('/products', validate(V.saveProductSchema), product.saveProduct)
r.put('/products/:id', validate(V.saveProductSchema), product.saveProduct)
r.delete('/products/:id', validate(V.idParamSchema), product.deleteProduct)

// Biến thể (màu/size) của mẫu
r.post('/products/:id/variants', validate(V.createVariantSchema), variant.createVariant)
r.delete('/variants/:id', validate(V.idParamSchema), variant.deleteVariant)

// Ảnh sản phẩm (upload trước, validate params sau)
r.post('/products/:id/images', uploadImages, validate(V.idParamSchema), image.addImages)
r.patch('/images/:id/primary', validate(V.idParamSchema), image.setPrimary)
r.delete('/images/:id', validate(V.idParamSchema), image.deleteImage)

r.get('/inventory', validate(V.inventoryQuerySchema), inventory.listInventory)
r.post('/variants/:id/inventory', validate(V.addInventorySchema), inventory.addItems)
r.patch('/inventory/:id', validate(V.inventoryUpdateSchema), inventory.updateInventory)
r.delete('/inventory/:id', validate(V.idParamSchema), inventory.deleteItem)

r.get('/rentals', validate(V.adminRentalsQuerySchema), rental.listRentals)
r.get('/rentals/:id', validate(V.idParamSchema), rental.getRental)
r.patch('/rentals/:id/status', validate(V.rentalStatusSchema), rental.updateRentalStatus)
r.post('/rentals/:id/refund', validate(V.idParamSchema), rental.refundDeposit)

r.get('/payments', payment.listPayments)
r.get('/customers', customer.listCustomers)

r.get('/coupons', coupon.listCoupons)
r.post('/coupons', validate(V.saveCouponSchema), coupon.saveCoupon)
r.put('/coupons/:id', validate(V.saveCouponSchema), coupon.saveCoupon)
r.delete('/coupons/:id', validate(V.idParamSchema), coupon.deleteCoupon)

r.get('/settings', setting.listSettings)
r.put('/settings', validate(V.updateSettingsSchema), setting.updateSettings)

module.exports = r
