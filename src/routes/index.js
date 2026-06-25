const { Router } = require('express')
const userRoutes = require('@/routes/user.routes.js')
const adminRoutes = require('@/routes/admin.routes.js')

const r = Router()

// API người dùng (storefront + tài khoản) và API quản trị tách bạch.
r.use('/', userRoutes)
r.use('/admin', adminRoutes)

module.exports = r
