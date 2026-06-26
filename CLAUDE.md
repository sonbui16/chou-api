# Chou Dress — Backend (chou-api)

API JSON cho trang cho thuê váy Chou Dress, phục vụ `chou-ui` (storefront khách, :5173) và
`chou-admin` (dashboard quản trị, :5174). Là 1 trong 3 phần của `chou-dress/`: `chou-ui` (frontend
khách) · `chou-admin` (frontend admin) · **`chou-api`** (backend — phần này). Thông điệp/nhãn trả về
dùng **tiếng Việt**, tiền tệ **VND** (số nguyên đồng).

## Stack & lệnh
- **Node + Express 4 + JavaScript (CommonJS, KHÔNG TypeScript)** — file `.js`, `require`/`module.exports`.
  `package.json` đặt `"type": "commonjs"`. **KHÔNG dùng `import`/`export`.**
- **module-alias**: import nội bộ qua alias `@/` (= `src/`), khai báo `_moduleAliases: { "@": "src" }`
  trong `package.json`. Mọi entrypoint nạp `require('module-alias/register')` ở **dòng đầu**
  (`server.js`, `schedule.js`). Ví dụ: `require('@/lib/prisma.js')` thay vì đường dẫn tương đối.
- **Prisma 7** (driver adapter `@prisma/adapter-pg`) · **PostgreSQL** · **zod** validate · **JWT**
  (`jsonwebtoken`) · **bcryptjs** (băm mật khẩu) · **cron** (lịch nền). Bảo mật: `helmet`, `cors`,
  `express-rate-limit`, `morgan`.
- Lệnh: `npm run dev` (`node --watch server.js`, port 4000) · `npm run schedule`
  (`node --watch schedule.js` — cron nền, chạy **tiến trình riêng**) · `npm run start` ·
  `npm run migrate` (`prisma migrate dev`) · `npm run generate` · `npm run seed`
  (`node prisma/seed.js`) · `npm run studio`.
- Server **không tự reload sâu** khi đổi nhiều file — restart `npm run dev` nếu cần.

## Biến môi trường (`.env`, không commit)
`DB_HOST` · `DB_PORT` · `DB_USER` · `DB_PASSWORD` · `DB_NAME` (postgres, các biến rời — KHÔNG
còn `DATABASE_URL`) · `PORT=4000` · `JWT_SECRET` · `JWT_EXPIRES_IN=7d` ·
`CORS_ORIGINS="http://localhost:5173,http://localhost:5174"` · `NODE_ENV` · `PG_DUMP` (đường dẫn
binary `pg_dump` cho job backup — fallback Postgres.app, vd `/Applications/Postgres.app/Contents/Versions/17/bin/pg_dump`).

## Cấu trúc — TÁCH BẠCH User vs Admin (folder theo đối tượng)
```
prisma/  schema.prisma (mirror docs/database/schema.sql) · migrations/ · seed.js
server.js                    # ROOT — entry HTTP: module-alias/register, helmet, cors (động ở dev),
                             #   json, morgan, response middleware, '/uploads' tĩnh, rate-limit
                             #   '/api/auth', mount '/api' → routes, notFound, errorHandler, listen(PORT)
schedule.js                  # ROOT — entry CRON riêng: nạp các job ở src/schedules/* qua CronJob
src/
  routes/
    index.js                 # r.use('/', userRoutes); r.use('/admin', adminRoutes)
    user.routes.js           # URL '/api/...'      (storefront + auth + tài khoản)
    admin.routes.js          # URL '/api/admin/...' (router.use(requireAdmin) đầu file)
  controllers/
    user/  auth · catalog (gồm publicSettings + validateCoupon) · account · presence
    admin/ dashboard · product · variant · image · inventory · rental · payment · customer · coupon · setting · visitor
  services/
    user/  auth · catalog · address · rental · review · coupon (validate)
    admin/ dashboard · product · variant · image · inventory · rental · payment · customer · coupon · setting
  middlewares/ validate.middleware.js · auth.middleware.js · response.middleware.js · notFound.middleware.js · errorHandler.middleware.js
  schedules/   backupDB.js (pg_dump → backups/, xoá bản >30 ngày) · dailyRepost.js
  validators/  index.js      # mọi zod schema (dùng chung user & admin)
  lib/         prisma · ApiError · serialize · jwt · settings · availability · pricing · dates · upload · assetCode · presenceCleanup
backups/                     # file .sql do job backupDB sinh ra (gitignored)
```
Ảnh: **multer** (`lib/upload.js`, field `files`, ≤5MB) lưu vào `uploads/`, phục vụ tĩnh `app.use('/uploads', ...)`;
`helmet({ crossOriginResourcePolicy: 'cross-origin' })` để FE :5173/:5174 load được ảnh. URL ảnh lưu **tuyệt đối**
(`${req.protocol}://${host}/uploads/<file>`). Mã váy tự sinh `CD-####` qua `lib/assetCode.nextAssetCodes(n)`.
Mỗi resource = 1 cặp `*.controller.js` + `*.service.js`. Controller **mỏng**; logic ở service.

## Quy ước API (BẮT BUỘC)
- REST + JSON, prefix `/api`. **Luồng:** route → `validate(zodSchema)` → controller → service → Prisma.
- **Validate:** `validate(schema)` parse `{ body, query, params }` → gắn `req.valid`; sai → 422 `VALIDATION`.
  Thêm schema mới vào `src/validators/index.js`.
- **Trả về (envelope chuẩn):** dùng helper gắn sẵn vào `res` bởi `response.middleware.js`:
  `res.success(data[, status=200])` → `{ status: 'success', data }` · `res.error(error[, status=400])`
  → `{ status: 'error', error }`. `data` được `serialize()` tự động (Prisma `Decimal`/`BigInt` → Number,
  `Date` → ISO). **KHÔNG** `res.json(prismaObject)` trực tiếp, **KHÔNG** còn dùng `sendJson`.
  Controller chuẩn: `res.success(await service.x(req.valid.body), 201)`.
- **Lỗi:** ném `ApiError` (hoặc `ApiError.badRequest/unauthorized/forbidden/notFound/conflict`); bọc handler
  async bằng `asyncHandler`. `errorHandler.middleware.js` (cuối chuỗi) trả envelope
  `{ status: 'error', error: { code, message, details? } }`; route không khớp → `notFound.middleware.js` 404.
  Thứ tự mount BẮT BUỘC: `response` (trước routes, để có `res.success/res.error`) → routes → `notFound` → `errorHandler`.
  Mã chuẩn: 400 `BAD_REQUEST` · 401 `UNAUTHORIZED` · 403 `FORBIDDEN` · 404 `NOT_FOUND` · 409
  `CONFLICT|DUPLICATE|OUT_OF_STOCK|DOUBLE_BOOKING` · 422 `VALIDATION` · 500 `INTERNAL`.
  Prisma tự map: `P2002`→409 DUPLICATE, `P2025`→404, `23P01`(EXCLUDE)→409 `DOUBLE_BOOKING`.
- **Auth:** header `Authorization: Bearer <jwt>`; payload `{ sub: userId, role }`. Middleware:
  `requireAuth` (gắn `req.user`), `requireAdmin` (chỉ `admin`/`staff`), `optionalAuth`.
- **Dữ liệu:** tiền số nguyên VND (Prisma `Decimal`, đừng float); ngày ISO 8601; field **snake_case**
  khớp DB & 2 frontend; khoá chính UUID. Danh sách có lọc/sắp xếp qua query.

## Prisma 7 — đặc thù phải nhớ
- **Không có `url` trong `schema.prisma`** → kết nối qua **driver adapter** (`@prisma/adapter-pg`) ở
  `lib/prisma.js` (truyền `host/port/user/password/database` từ các biến `DB_*`); migrate/studio
  dựng connection string từ các biến `DB_*` trong **`prisma.config.ts`** (`defineConfig`).
- `@prisma/client` là CJS → `const { PrismaClient } = require('@prisma/client')`. Client là **singleton**
  (`globalThis.__prisma`) trong `lib/prisma.js`, export `module.exports = { prisma }`.
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

## Lịch nền (cron) & backup — TIẾN TRÌNH RIÊNG
- `schedule.js` (ROOT) là entry **độc lập với server HTTP**, chạy bằng `npm run schedule`. Nạp
  `module-alias/register` + `dotenv/config`, rồi đăng ký job bằng `new CronJob(cronTime, fn, null, true)`
  (package `cron`). Mỗi job = 1 file trong `src/schedules/` export 1 hàm (`module.exports = fn`).
- **Cú pháp cron 6 trường** (có giây): `giây phút giờ ngày tháng thứ`. Vd `0 0 3 * * *` = 3h sáng mỗi ngày;
  `*/10 * * * * *` = mỗi 10 giây (chỉ dùng để TEST — nhớ đổi lại trước khi chạy thật).
- **`backupDB.js`**: gọi `pg_dump` qua `spawn` với **đường dẫn binary đầy đủ** (`process.env.PG_DUMP`,
  fallback Postgres.app) — KHÔNG dựa vào PATH (Node spawn không có shell). Ghi ra file bằng cờ `-f`
  (KHÔNG dùng `>` — spawn không qua shell nên redirect không chạy). Tên file gắn ngày `YYYY-MM-DD`
  vào `backups/`; sau khi `close` code 0 thì dọn các file cũ hơn 30 ngày. Tham số host/port/user/db
  lấy từ biến `DB_*`, mật khẩu truyền qua env `PGPASSWORD`.

## Hợp đồng URL (KHÔNG đổi nếu không cần — sẽ vỡ 2 frontend)
- User `/api/...`: `categories,sizes,colors,products,products/:slug[/availability|/reviews],settings,
  coupons/validate,auth/register|login|me,addresses(CRUD),rentals(GET,POST),rentals/:rentalNo,reviews`.
- Admin `/api/admin/...`: `stats,products(CRUD + GET /:id chi tiết),products/:id/variants(POST),variants/:id(DELETE),
  variants/:id/inventory(POST nhập kho),products/:id/images(POST upload),images/:id/primary(PATCH),images/:id(DELETE),
  inventory(GET,+PATCH,+DELETE /:id),rentals(+/:id,/:id/status,/:id/refund),payments,customers,coupons(CRUD),settings(GET,PUT)`.
- Khi thêm/sửa route, đối chiếu lại lời gọi ở `chou-ui/src/api/*` và `chou-admin/src/api/admin.js`.

## Bảo mật & vận hành
- `cors` cho origin trong `CORS_ORIGINS` (+ tự cho mọi `localhost/127.0.0.1` khi `NODE_ENV!=='production'`),
  bật `credentials`; `helmet({ crossOriginResourcePolicy: 'cross-origin' })`; rate-limit `/api/auth` (50 req/15ph).
- Mật khẩu băm `bcryptjs` (cột `password_hash`); không log token/secret; bí mật qua env.
- Webhook thanh toán idempotent qua unique `provider_txn` (bắt P2002 → coi như đã ghi).

## Thêm resource mới (theo skill `express-prisma-api`)
model (schema.prisma + migrate) → schema zod (validators/index.js) → service ở
`services/{user|admin}/x.service.js` → controller mỏng ở `controllers/{user|admin}/x.controller.js`
(dùng `res.success`) → khai route trong `routes/user.routes.js` hoặc `routes/admin.routes.js`.
Import nội bộ dùng alias `@/...`; export bằng `module.exports`.

## Cạm bẫy đã gặp
- Quên `res.success/res.error` (gọi `res.json` thẳng) → `Decimal` ra chuỗi/`Date` sai định dạng,
  lệch envelope `{ status, data }` so với 2 frontend.
- `spawn` không qua shell: `>` redirect không chạy (dùng cờ `-f`) và binary phải có trong PATH hoặc
  truyền đường dẫn đầy đủ — nếu không spawn báo ENOENT, `close` trả code `null`.
- Dùng `import`/`export` hoặc đường dẫn tương đối thay vì `require`/alias `@/` → vỡ vì project là CommonJS.
- Đổi trạng thái đơn phải theo luồng hợp lệ (xem `chou-admin/src/lib/rentalFlow.js`), không nhảy tuỳ tiện.
- Sau mutation, FE (TanStack Query) cần `invalidateQueries` — giữ response shape ổn định để không vỡ cache.
- Đổi tên field/URL = breaking change cho `chou-ui`/`chou-admin`: phải sửa đồng bộ cả hai.
