---
name: express-prisma-api
description: Dựng một REST resource đầu-cuối cho chou-api bằng Express + Prisma 7 + zod (JavaScript). Dùng khi cần thêm/sửa endpoint, model Prisma, validation, hoặc xử lý lỗi cho backend Chou Dress.
---

# Express + Prisma REST API (chou-api)

Quy trình chuẩn để thêm một **resource** (vd `products`, `rentals`, `payments`) vào backend
Chou Dress. Stack: Node + Express (ESM, JavaScript thuần), Prisma 7, PostgreSQL, zod. Đọc kèm
`chou-api/CLAUDE.md` cho quy ước chung.

## Các bước

1. **Model (Prisma):** thêm/sửa model trong `prisma/schema.prisma` cho khớp `docs/database/schema.sql`.
   Tạo migration: `npx prisma migrate dev --name <ten>`. Ràng buộc Postgres không model được
   (vd `EXCLUDE` chống đặt trùng) → `--create-only` rồi viết SQL thô vào file migration.
   > Chọn **đối tượng**: resource cho khách → đặt dưới `user/`; cho quản trị → `admin/`.
2. **Validator (zod):** thêm schema vào `src/validators/index.js` (dùng chung user & admin).
3. **Service:** `src/services/{user|admin}/<resource>.service.js` — business logic + truy vấn Prisma.
   Hàm thuần, nhận tham số đã validate, ném lỗi nghiệp vụ (xem mục Lỗi).
4. **Controller:** `src/controllers/{user|admin}/<resource>.controller.js` — mỏng: lấy dữ liệu đã
   validate từ `req`, gọi service, `sendJson(res, ...)`. Không đặt logic ở đây.
5. **Route:** khai báo trong `src/routes/user.routes.js` (URL `/api/...`) hoặc `src/routes/admin.routes.js`
   (URL `/api/admin/...`, đã bọc `requireAdmin`). Gắn `validate(schema)` + controller.

## Khuôn mẫu

```js
// src/lib/prisma.js — Prisma client singleton (tránh tạo nhiều connection khi dev --watch)
import { PrismaClient } from '@prisma/client'
const g = globalThis
export const prisma = g.__prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') g.__prisma = prisma
```

```js
// src/middlewares/validate.js
export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse({ body: req.body, query: req.query, params: req.params })
  if (!parsed.success) return next(new ApiError(422, 'VALIDATION', parsed.error.issues))
  req.valid = parsed.data
  next()
}
```

```js
// src/lib/ApiError.js + error middleware (mount CUỐI cùng trong app.js)
export class ApiError extends Error {
  constructor(status, code, details) { super(code); this.status = status; this.code = code; this.details = details }
}
export const errorHandler = (err, _req, res, _next) => {
  const status = err.status ?? 500
  res.status(status).json({ error: { code: err.code ?? 'INTERNAL', message: err.message, details: err.details } })
}
```

```js
// src/routes/products.routes.js
import { Router } from 'express'
import { listProducts } from '../controllers/products.controller.js'
import { validate } from '../middlewares/validate.js'
import { listProductsSchema } from '../validators/products.js'
const r = Router()
r.get('/', validate(listProductsSchema), listProducts)
export default r
```

## Quy ước bắt buộc
- Tiền: số nguyên VND (hoặc Prisma `Decimal`) — **không float**. Ngày: ISO 8601.
- Mọi input đi qua zod; mọi lỗi đi qua `ApiError` + error-middleware (`{ error: { code, message } }`).
- Service dùng `prisma.$transaction` cho thao tác nhiều bảng (vd tạo `rental` + `rental_items` + `payments`).
- **Đặt thuê:** trong transaction, kiểm tra overlap ngày của `inventory_item` trước khi insert; vẫn
  dựa vào ràng buộc `EXCLUDE` ở DB làm chốt chặn cuối (bắt lỗi vi phạm → trả 409).
- Snapshot giá/cọc vào `rental_items` lúc tạo, không join giá hiện tại.
- `Decimal`/`BigInt` → ép `Number`/`string` trước khi `res.json`.

## Kiểm thử nhanh
- `npx prisma migrate dev` chạy sạch; `npx prisma studio` xem dữ liệu.
- `curl` thử endpoint: trường hợp hợp lệ, sai validation (422), và đặt trùng lịch (409).
