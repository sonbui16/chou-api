require('dotenv/config')
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

// Prisma 7 dùng driver adapter cho kết nối (không còn `url` trong schema).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

const globalForPrisma = globalThis
const prisma =
  globalForPrisma.__prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma

module.exports = { prisma }
