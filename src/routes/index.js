import { Router } from 'express'
import userRoutes from './user.routes.js'
import adminRoutes from './admin.routes.js'

const r = Router()

// API người dùng (storefront + tài khoản) và API quản trị tách bạch.
r.use('/', userRoutes)
r.use('/admin', adminRoutes)

export default r
