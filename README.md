# Chou Dress — Backend (chou-api)

REST API cho trang cho thuê váy Chou Dress. **Express + Prisma 7 + PostgreSQL + zod** (JavaScript, ESM).
Sẵn sàng để `chou-ui` (storefront) và `chou-admin` ghép vào.

## Chạy

```bash
npm install
# .env đã cấu hình: postgresql://postgres:***@localhost:5432/chou-dress
npx prisma migrate dev      # tạo bảng + ràng buộc
npm run seed                # nạp dữ liệu mẫu (12 váy, users, coupon, đơn)
npm run dev                 # http://localhost:4000
```

Kiểm tra: `GET http://localhost:4000/health`.

## Tài khoản demo (sau khi seed)
- Admin: `admin@chou.vn` / `admin123`
- Khách: `mai.anh@example.com` / `test123` · `lan.tran@example.com` / `test123`

## Xác thực
JWT qua header `Authorization: Bearer <token>` (nhận từ `/api/auth/login`). Vai trò `admin`/`staff`
mới vào được `/api/admin/*`.

## Endpoints chính (prefix `/api`)

**Công khai:** `GET /categories` · `GET /products` (lọc `cat,size,color,maxPrice,sort,page,limit`) ·
`GET /products/:slug` · `GET /products/:slug/availability?variantId&start&end` ·
`GET /products/:slug/reviews` · `GET /settings` · `POST /coupons/validate`

**Auth/tài khoản:** `POST /auth/register|login` · `GET /auth/me` ·
`GET/POST/PUT/DELETE /addresses` · `GET /rentals` · `POST /rentals` · `GET /rentals/:rentalNo` ·
`POST /reviews`

**Admin (`/api/admin`):** `GET /stats` · products CRUD · `GET/PATCH /inventory` ·
`GET /rentals`, `PATCH /rentals/:id/status`, `POST /rentals/:id/refund` · `GET /payments` ·
coupons CRUD · `GET /customers` · `GET/PUT /settings`

## Quy ước
- JSON nhất quán; lỗi `{ error: { code, message } }`. Tiền là **số nguyên VND**, ngày ISO.
- Đặt thuê chạy trong transaction; chống đặt trùng bằng ràng buộc `EXCLUDE` ở DB (đặt trùng → **409**).
- Nguồn sự thật DB: `docs/database/schema.sql`; Prisma model mirror trong `prisma/schema.prisma`.

## Ghép với chou-ui
chou-ui chỉ cần trỏ base URL `http://localhost:4000/api`, lưu JWT sau đăng nhập, và bỏ lớp mock.
CORS đã mở cho `http://localhost:5173`.
