# Chou Dress — Backend (chou-api)

API JSON cho trang cho thuê váy Chou Dress, phục vụ `chou-ui` (storefront khách, :5173) và
`chou-admin` (dashboard quản trị, :5174). Là 1 trong 3 phần của `chou-dress/`: `chou-ui` (frontend
khách) · `chou-admin` (frontend admin) · **`chou-api`** (backend — phần này). Thông điệp/nhãn trả về
dùng **tiếng Việt**, tiền tệ **VND** (số nguyên đồng).

## Stack & lệnh
- **Node + Express 4 + JavaScript (ESM, KHÔNG TypeScript)** — file `.js`, `import`/`export`.
- **Prisma 7** (driver adapter `@prisma/adapter-pg`) · **PostgreSQL** · **zod** validate · **JWT**
  (`jsonwebtoken`) · **bcryptjs** (băm mật khẩu). Bảo mật: `helmet`, `cors`, `express-rate-limit`, `morgan`.
- Lệnh: `npm run dev` (`node --watch src/server.js`, port 4000) · `npm run migrate` (`prisma migrate dev`)
  · `npm run generate` · `npm run seed` (`node prisma/seed.js`) · `npm run studio`.
- Server **không tự reload sâu** khi đổi nhiều file — restart `npm run dev` nếu cần.

## Biến môi trường (`.env`, không commit)
`DATABASE_URL` (postgres) · `PORT=4000` · `JWT_SECRET` · `JWT_EXPIRES_IN=7d` ·
`CORS_ORIGINS="http://localhost:5173,http://localhost:5174"` · `NODE_ENV`.

## Cấu trúc — TÁCH BẠCH User vs Admin (folder theo đối tượng)
```
prisma/  schema.prisma (mirror docs/database/schema.sql) · migrations/ · seed.js
src/
  server.js                  # lắng nghe PORT
  app.js                     # express: helmet, cors(CORS_ORIGINS), json, morgan,
                             #   rate-limit '/api/auth', GET /health, mount '/api' → routes
  routes/
    index.js                 # r.use('/', userRoutes); r.use('/admin', adminRoutes)
    user.routes.js           # URL '/api/...'      (storefront + auth + tài khoản)
    admin.routes.js          # URL '/api/admin/...' (router.use(requireAdmin) đầu file)
  controllers/
    user/  auth · catalog (gồm publicSettings + validateCoupon) · account
    admin/ dashboard · product · inventory · rental · payment · customer · coupon · setting
  services/
    user/  auth · catalog · address · rental · review · coupon (validate)
    admin/ dashboard · product · inventory · rental · payment · customer · coupon · setting
  middlewares/ validate.js · error.js · auth.js
  validators/  index.js      # mọi zod schema (dùng chung user & admin)
  lib/         prisma · ApiError · serialize · jwt · settings · availability · pricing · dates
```
Mỗi resource = 1 cặp `*.controller.js` + `*.service.js`. Controller **mỏng**; logic ở service.

## Quy ước API (BẮT BUỘC)
- REST + JSON, prefix `/api`. **Luồng:** route → `validate(zodSchema)` → controller → service → Prisma.
- **Validate:** `validate(schema)` parse `{ body, query, params }` → gắn `req.valid`; sai → 422 `VALIDATION`.
  Thêm schema mới vào `src/validators/index.js`.
- **Trả về:** luôn dùng `sendJson(res, data[, status])` (lib/serialize.js) — tự chuyển Prisma
  `Decimal`/`BigInt` → Number, `Date` → ISO. **Không** `res.json(prismaObject)` trực tiếp.
- **Lỗi:** ném `ApiError` (hoặc `ApiError.badRequest/unauthorized/forbidden/notFound/conflict`); bọc handler
  async bằng `asyncHandler`. Error-middleware cuối trả `{ error: { code, message, details? } }`.
  Mã chuẩn: 400 `BAD_REQUEST` · 401 `UNAUTHORIZED` · 403 `FORBIDDEN` · 404 `NOT_FOUND` · 409
  `CONFLICT|DUPLICATE|OUT_OF_STOCK|DOUBLE_BOOKING` · 422 `VALIDATION` · 500 `INTERNAL`.
  Prisma tự map: `P2002`→409 DUPLICATE, `P2025`→404, `23P01`(EXCLUDE)→409 `DOUBLE_BOOKING`.
- **Auth:** header `Authorization: Bearer <jwt>`; payload `{ sub: userId, role }`. Middleware:
  `requireAuth` (gắn `req.user`), `requireAdmin` (chỉ `admin`/`staff`), `optionalAuth`.
- **Dữ liệu:** tiền số nguyên VND (Prisma `Decimal`, đừng float); ngày ISO 8601; field **snake_case**
  khớp DB & 2 frontend; khoá chính UUID. Danh sách có lọc/sắp xếp qua query.

## Prisma 7 — đặc thù phải nhớ
- **Không có `url` trong `schema.prisma`** → kết nối qua **driver adapter** (`@prisma/adapter-pg`) ở
  `lib/prisma.js`; migrate đọc `DATABASE_URL` qua **`prisma.config.ts`** (`defineConfig` + `env`).
- `@prisma/client` là CJS → import `import pkg from '@prisma/client'; const { PrismaClient } = pkg`.
- Prisma **không hỗ trợ `daterange`** → `rental_items` lưu `rental_start`/`rental_end`/**`hold_until`**
  (= rental_end + `cleaning_buffer_days`); ràng buộc chống đặt trùng `EXCLUDE USING gist(... daterange ...)`
  đặt trong **migration SQL thô** (`migrations/*_booking_constraints`). Vi phạm → 409 `DOUBLE_BOOKING`.
- Ràng buộc/partial-index Postgres-only (EXCLUDE, unique-where) → thêm bằng migration SQL thô; giữ
  `docs/database/schema.sql` là tài liệu nguồn sự thật, `schema.prisma` mirror.

## Nghiệp vụ cốt lõi (lib/)
- `availability.checkAvailability({variantId,start,end,bufferDays})`: đếm `inventory_item` không bị
  `rental_item` (chưa huỷ) chồng `[start, end + buffer)` — `bufferDays` lấy từ `settings.cleaning_buffer_days`.
- `pricing`: subtotal = giá/ngày × số ngày; coupon (percent/fixed, min_total, max_discount); phí ship
  (miễn nếu pickup hoặc ≥ `free_shipping_min`); cọc. **Server là nguồn chốt** khi tạo đơn.
- Tạo đơn (`services/user/rental.service.js`) chạy trong `prisma.$transaction`: chọn bản còn trống →
  tạo `rental` + `rental_items` (snapshot giá/cọc, `hold_until` gồm buffer) + `payments`.
- Vòng đời đơn (admin): pending→confirmed→in_use→returned→completed; cancel; overdue. Đổi trạng thái
  qua `PATCH /admin/rentals/:id/status` (kèm `condition_in` khi returned); hoàn cọc `POST .../refund`
  (tạo `payment kind=deposit_refund` amount âm → status `completed`).

## Hợp đồng URL (KHÔNG đổi nếu không cần — sẽ vỡ 2 frontend)
- User `/api/...`: `categories,sizes,colors,products,products/:slug[/availability|/reviews],settings,
  coupons/validate,auth/register|login|me,addresses(CRUD),rentals(GET,POST),rentals/:rentalNo,reviews`.
- Admin `/api/admin/...`: `stats,products(CRUD),inventory(+PATCH),rentals(+/:id,/:id/status,/:id/refund),
  payments,customers,coupons(CRUD),settings(GET,PUT)`.
- Khi thêm/sửa route, đối chiếu lại lời gọi ở `chou-ui/src/api/*` và `chou-admin/src/api/admin.js`.

## Bảo mật & vận hành
- `cors` chỉ cho origin trong `CORS_ORIGINS`; `helmet`; rate-limit `/api/auth`.
- Mật khẩu băm `bcryptjs` (cột `password_hash`); không log token/secret; bí mật qua env.
- Webhook thanh toán idempotent qua unique `provider_txn` (bắt P2002 → coi như đã ghi).

## Thêm resource mới (theo skill `express-prisma-api`)
model (schema.prisma + migrate) → schema zod (validators/index.js) → service ở
`services/{user|admin}/x.service.js` → controller mỏng ở `controllers/{user|admin}/x.controller.js`
(dùng `sendJson`) → khai route trong `routes/user.routes.js` hoặc `routes/admin.routes.js`.

## Cạm bẫy đã gặp
- Quên `sendJson` → `Decimal` ra chuỗi/`Date` sai định dạng ở client.
- Đổi trạng thái đơn phải theo luồng hợp lệ (xem `chou-admin/src/lib/rentalFlow.js`), không nhảy tuỳ tiện.
- Sau mutation, FE (TanStack Query) cần `invalidateQueries` — giữ response shape ổn định để không vỡ cache.
- Đổi tên field/URL = breaking change cho `chou-ui`/`chou-admin`: phải sửa đồng bộ cả hai.
