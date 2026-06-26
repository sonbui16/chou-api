require('module-alias/register')
require('dotenv/config')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const routes = require('@/routes/index.js')
const response = require('@/middlewares/response.middleware.js')
const notFound = require('@/middlewares/notFound.middleware.js')
const errorHandler = require('@/middlewares/errorHandler.middleware.js')
const { UPLOAD_DIR } = require('@/lib/upload.js')
const { startPresenceCleanup } = require('@/lib/presenceCleanup.js')

const app = express()

const origins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const isDev = process.env.NODE_ENV !== 'production'
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?$/

const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true)
  if (origins.includes(origin) || (isDev && localOriginPattern.test(origin))) {
    return callback(null, true)
  }
  return callback(null, false)
}

// crossOriginResourcePolicy: cross-origin để ảnh /uploads load được từ chou-ui/chou-admin
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json())
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))

// Chuẩn hoá response: gắn res.success() / res.error() cho mọi route
app.use(response)

// Ảnh sản phẩm tải lên (multer) — phục vụ tĩnh
app.use('/uploads', express.static(UPLOAD_DIR))

// Giới hạn brute-force cho auth
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false }))

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT ?? 4000

app.listen(PORT, () => {
  console.log(`✅ chou-api đang chạy tại http://localhost:${PORT}`)
})

startPresenceCleanup()
