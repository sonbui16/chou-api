import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Prisma CLI (migrate/studio) cần 1 connection string — dựng từ các biến DB_*.
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env
const url = `postgresql://${DB_USER}:${encodeURIComponent(DB_PASSWORD ?? '')}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url,
  },
})
