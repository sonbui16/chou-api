import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import routes from './routes/index.js'
import { notFound, errorHandler } from './middlewares/error.js'

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

app.use(helmet())
app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json())
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))

// Giới hạn brute-force cho auth
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false }))

app.get('/health', (_req, res) => res.json({ ok: true, service: 'chou-api' }))
app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

export default app
