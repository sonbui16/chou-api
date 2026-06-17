import { Router } from 'express'
import { validate } from '../middlewares/validate.js'
import { requireAdmin } from '../middlewares/auth.js'
import { uploadImages } from '../lib/upload.js'
import * as dashboard from '../controllers/admin/dashboard.controller.js'
import * as product from '../controllers/admin/product.controller.js'
import * as variant from '../controllers/admin/variant.controller.js'
import * as image from '../controllers/admin/image.controller.js'
import * as inventory from '../controllers/admin/inventory.controller.js'
import * as rental from '../controllers/admin/rental.controller.js'
import * as payment from '../controllers/admin/payment.controller.js'
import * as customer from '../controllers/admin/customer.controller.js'
import * as coupon from '../controllers/admin/coupon.controller.js'
import * as setting from '../controllers/admin/setting.controller.js'
import * as V from '../validators/index.js'

const r = Router()

// Toàn bộ route admin yêu cầu quyền staff/admin
r.use(requireAdmin)

r.get('/stats', dashboard.stats)

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

export default r
