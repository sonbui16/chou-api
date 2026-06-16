# Chou Dress — Thiết kế Database (chou-api)

Tài liệu cơ sở dữ liệu cho trang cho thuê váy Chou Dress, tập trung các chức năng chính,
viết theo hướng **production-ready**. Đây là DB của backend `chou-api`.

- **DBMS:** PostgreSQL 14+
- **DDL đầy đủ:** [schema.sql](schema.sql)
- **Quy ước:** snake_case, khoá chính UUID, mọi bảng có `created_at` (và `updated_at` nếu có sửa),
  tiền tệ `NUMERIC(12,2)` đơn vị VND.

## Quyết định thiết kế cốt lõi

| Vấn đề | Lựa chọn | Lý do |
|---|---|---|
| Kho hàng | `product` → `product_variant` (size/màu) → **`inventory_item`** (từng bản vật lý) | Shop có nhiều bản của cùng mẫu; cần track riêng tình trạng & đặt lịch từng cái. |
| Chống đặt trùng | `EXCLUDE USING gist (item_id WITH =, rental_period WITH &&)` | DB tự chặn 2 lượt thuê chồng ngày trên cùng 1 bản váy — không phụ thuộc logic app. |
| Nhận hàng | `fulfillment` = `pickup` \| `delivery` + ràng buộc địa chỉ | Hỗ trợ cả lấy tại shop lẫn giao tận nơi; giao thì bắt buộc `address_id`. |
| Thanh toán | Bảng `payments` đa loại (`kind`) + đa phương thức (`method`) | Một bảng xử lý cả tiền mặt, online, **đặt cọc & hoàn cọc**, phí phạt. |
| Giá | Snapshot vào `rentals` / `rental_items` | Giá tại thời điểm đặt không đổi dù sau này sửa bảng giá. |

## Các bảng chính

### Người dùng
- **users** — khách + nhân viên + admin (phân biệt bằng `role`). Bắt buộc có email **hoặc** sđt.
- **addresses** — sổ địa chỉ giao hàng, mỗi user 1 địa chỉ mặc định.

### Catalog
- **categories** — danh mục phân cấp (`parent_id`).
- **products** — mẫu váy: tên, mô tả, giá thuê/ngày, tiền cọc, trạng thái.
- **product_variants** — tổ hợp size + màu (1 SKU); có thể ghi đè giá.
- **sizes / colors** — bảng tra cứu chuẩn hoá để lọc.
- **product_images** — ảnh theo product hoặc theo variant; 1 ảnh `is_primary`.
- **inventory_items** — **từng bản váy thật**: mã tài sản, `status` (available/rented/cleaning/repairing/retired), `condition`.

### Đơn thuê
- **rentals** — đầu đơn: khách, khoảng thuê, hình thức nhận, các khoản tiền, coupon, mốc pickup/return/cancel.
- **rental_items** — dòng thuê: gắn với 1 `inventory_item` + `rental_period` (daterange). Nơi ràng buộc chống đặt trùng hoạt động.

### Thanh toán, đánh giá, khuyến mãi, cấu hình
- **payments** — mọi giao dịch tiền: phí thuê, **cọc**, **hoàn cọc** (amount âm), phí trễ, phí hư hỏng, phí ship. `provider_txn` unique để idempotent.
- **coupons** — mã giảm giá (percent/fixed, giới hạn lượt, thời hạn).
- **reviews** — đánh giá 1–5 sao, mỗi khách 1 lần/sản phẩm.
- **settings** — cấu hình runtime key-value (JSONB): `cleaning_buffer_days`, `min_rental_days`, `default_deposit_rate`, `free_shipping_min`. Sửa bằng `UPDATE`, không cần deploy. Có helper `setting_int(key, default)`.

### View
- **v_variant_stock** — tổng số / số bản đang available theo từng variant (phục vụ lọc còn hàng).

## Sơ đồ quan hệ (ERD)

```mermaid
erDiagram
  users          ||--o{ addresses        : has
  users          ||--o{ rentals          : places
  users          ||--o{ reviews          : writes
  categories     ||--o{ products         : groups
  products       ||--o{ product_variants : has
  products       ||--o{ product_images   : has
  products       ||--o{ reviews          : receives
  sizes          ||--o{ product_variants : sizes
  colors         ||--o{ product_variants : colors
  product_variants ||--o{ inventory_items : "physical copies"
  rentals        ||--o{ rental_items     : contains
  rentals        ||--o{ payments         : "paid by"
  inventory_items||--o{ rental_items     : "rented as"
  coupons        ||--o{ rentals          : applied
  addresses      ||--o{ rentals          : "ship to"
```

## Luồng nghiệp vụ chính

1. **Kiểm tra còn hàng**: tìm `inventory_item` của variant mà KHÔNG có `rental_item` nào (chưa huỷ) có `rental_period && [start, end)`.
2. **Tạo đơn**: insert `rentals` + các `rental_items`. Exclusion constraint raise lỗi nếu có ai vừa đặt trùng → an toàn concurrency.
3. **Thu tiền + cọc**: insert `payments` (`kind='rental_fee'`, `kind='deposit'`).
4. **Giao/pickup → in_use**, cập nhật `inventory_items.status='rented'`.
5. **Trả váy**: set `returned_at`, ghi `condition_in`, hoàn cọc bằng `payments(kind='deposit_refund', amount<0)`, trừ phí hư hỏng nếu có, đưa item về `cleaning` rồi `available`.

> **Buffer giặt ủi (cấu hình được):** key `cleaning_buffer_days` trong `settings` (mặc định `1`).
> Khi tạo `rental_item`, app build `rental_period` đã cộng buffer vào `end`:
>
> ```sql
> rental_period := daterange(start_date, end_date + setting_int('cleaning_buffer_days'), '[)');
> ```
>
> Nhờ vậy 2 lượt thuê sát ngày vẫn bị exclusion constraint coi là chồng nhau. Đổi buffer =
> `UPDATE settings SET value = '2' WHERE key = 'cleaning_buffer_days';` — không cần deploy.

---

# Cấu hình DB (production)

## Biến môi trường (`.env` của chou-api)

```bash
DATABASE_URL=postgresql://chou_app:CHANGE_ME@db-host:5432/chou_dress?sslmode=require
PGSSLMODE=require

# Connection pool (ứng dụng / PgBouncer)
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_STATEMENT_TIMEOUT_MS=15000
DB_IDLE_TX_TIMEOUT_MS=30000
```

## Vai trò & phân quyền

```sql
-- Owner schema (migration) tách khỏi role chạy app
CREATE ROLE chou_owner LOGIN PASSWORD '***';
CREATE ROLE chou_app   LOGIN PASSWORD '***';

GRANT CONNECT ON DATABASE chou_dress TO chou_app;
GRANT USAGE  ON SCHEMA public        TO chou_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES   IN SCHEMA public TO chou_app;
GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO chou_app;
-- App KHÔNG cần quyền DDL (CREATE/DROP/ALTER) → giảm rủi ro.
```

## Tham số PostgreSQL khuyến nghị (điều chỉnh theo RAM)

```ini
max_connections = 100          # dùng PgBouncer nếu cần nhiều hơn
shared_buffers = 25% RAM
effective_cache_size = 60% RAM
work_mem = 16MB
maintenance_work_mem = 256MB
wal_level = replica            # bật cho streaming replication / PITR
ssl = on
log_min_duration_statement = 500   # log query chậm > 500ms
idle_in_transaction_session_timeout = 30000
```

## Sao lưu & phục hồi
- **Logical**: `pg_dump -Fc` định kỳ (cron hằng ngày), lưu off-site, mã hoá.
- **PITR**: bật WAL archiving (`archive_mode=on`) để khôi phục đến thời điểm.
- **Test restore** định kỳ — backup chưa restore thử = chưa có backup.

## Migration
- Quản lý schema bằng tool có version (Prisma / Drizzle / Knex / Flyway / golang-migrate…).
  **Không sửa DB thủ công** trên production.
- `schema.sql` ở đây là baseline; các migration tiếp theo build lên trên nó.

## Lưu ý vận hành
- Lưu tiền bằng `NUMERIC`, **không** dùng float.
- Đảm bảo `provider_txn` được set cho mọi giao dịch online (idempotent webhook).
- Cân nhắc index `pg_trgm` cho `products.name` nếu cần tìm kiếm tên váy.
- Bật RLS nếu sau này cho nhiều shop dùng chung (multi-tenant).
