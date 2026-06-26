require('dotenv/config')
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

// Prisma 7 dùng driver adapter cho kết nối (không còn `url` trong schema).
// Cấu hình qua các biến DB_* rời (host/port/user/password/name).
const adapter = new PrismaPg({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

const globalForPrisma = globalThis
const prisma =
  globalForPrisma.__prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma

module.exports = { prisma }
