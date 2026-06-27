-- =============================================================================
-- CHOU DRESS — Dress Rental Database Schema (PostgreSQL 14+)
-- Production-ready DDL
--
-- Mô hình:
--   - Mỗi mẫu váy (product) có nhiều biến thể (variant theo size/màu),
--     mỗi biến thể có nhiều BẢN VẬT LÝ (inventory_item) được track riêng.
--   - Cho thuê theo khoảng ngày (daterange). Chống đặt trùng bằng
--     EXCLUSION CONSTRAINT (GiST) trên từng inventory_item.
--   - Nhận hàng: pickup tại shop hoặc giao tận nơi (cần địa chỉ).
--   - Thanh toán: tiền mặt hoặc online; có đặt cọc & hoàn cọc.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "btree_gist";  -- EXCLUDE: uuid WITH =, range WITH &&
CREATE EXTENSION IF NOT EXISTS "citext";      -- email không phân biệt hoa thường

-- -----------------------------------------------------------------------------
-- 1. ENUM types
-- -----------------------------------------------------------------------------
CREATE TYPE user_role          AS ENUM ('customer', 'staff', 'admin');
CREATE TYPE product_status      AS ENUM ('draft', 'active', 'archived');
CREATE TYPE item_status         AS ENUM ('available', 'rented', 'cleaning', 'repairing', 'retired');
CREATE TYPE item_condition      AS ENUM ('new', 'good', 'fair', 'worn', 'damaged');
CREATE TYPE fulfillment_method  AS ENUM ('pickup', 'delivery');
CREATE TYPE rental_status       AS ENUM ('pending', 'confirmed', 'in_use', 'returned', 'completed', 'cancelled', 'overdue');
CREATE TYPE payment_kind        AS ENUM ('rental_fee', 'deposit', 'deposit_refund', 'late_fee', 'damage_fee', 'shipping_fee');
CREATE TYPE payment_method      AS ENUM ('cash', 'bank_transfer', 'vnpay', 'momo', 'card');
CREATE TYPE payment_status      AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE discount_type       AS ENUM ('percent', 'fixed');

-- -----------------------------------------------------------------------------
-- 2. Trigger dùng chung: tự cập nhật updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. USERS & ĐỊA CHỈ
-- =============================================================================
CREATE TABLE users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  role          user_role    NOT NULL DEFAULT 'customer',
  full_name     TEXT         NOT NULL,
  email         CITEXT       UNIQUE,
  phone         TEXT         UNIQUE,
  password_hash TEXT,                          -- NULL nếu chỉ đăng nhập social/OTP
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT users_contact_chk CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Refresh token (opaque, lưu BẢN HASH sha256). Access token ngắn hạn dùng JWT, không lưu DB.
CREATE TABLE refresh_tokens (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT         NOT NULL UNIQUE,        -- sha256 hex của refresh token
  expires_at  TIMESTAMPTZ  NOT NULL,
  revoked_at  TIMESTAMPTZ,                         -- NULL = còn hiệu lực; set khi rotate/logout
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens(user_id);
CREATE INDEX refresh_tokens_expires_at_idx ON refresh_tokens(expires_at);

CREATE TABLE addresses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient    TEXT        NOT NULL,
  phone        TEXT        NOT NULL,
  line1        TEXT        NOT NULL,
  ward         TEXT,
  district     TEXT,
  province     TEXT        NOT NULL,
  is_default   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_user ON addresses(user_id);
-- Mỗi user chỉ có 1 địa chỉ mặc định
CREATE UNIQUE INDEX uq_addresses_default ON addresses(user_id) WHERE is_default;
CREATE TRIGGER trg_addresses_updated BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 4. CATALOG: danh mục, sản phẩm, biến thể, ảnh
-- =============================================================================
CREATE TABLE categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  UUID        REFERENCES categories(id) ON DELETE SET NULL,
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  position   INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Lookup size / màu (chuẩn hoá để lọc & thống kê)
CREATE TABLE sizes (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code  TEXT     NOT NULL UNIQUE,   -- 'S', 'M', 'L', '38', '40'...
  label TEXT     NOT NULL
);
CREATE TABLE colors (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name  TEXT     NOT NULL UNIQUE,
  hex   CHAR(7)                     -- '#FFEEDD'
);

CREATE TABLE products (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID           REFERENCES categories(id) ON DELETE SET NULL,
  name          TEXT           NOT NULL,
  slug          TEXT           NOT NULL UNIQUE,
  description   TEXT,
  brand         TEXT,
  -- Giá thuê / ngày & tiền cọc mặc định (variant có thể ghi đè)
  rental_price  NUMERIC(12,2)  NOT NULL CHECK (rental_price >= 0),
  deposit       NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  status        product_status NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status   ON products(status);
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Biến thể = 1 tổ hợp size + màu của 1 product
CREATE TABLE product_variants (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_id         SMALLINT      REFERENCES sizes(id),
  color_id        SMALLINT      REFERENCES colors(id),
  sku             TEXT          UNIQUE,
  price_override  NUMERIC(12,2) CHECK (price_override >= 0),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (product_id, size_id, color_id)
);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE TRIGGER trg_variants_updated BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE product_images (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id  UUID        REFERENCES product_variants(id) ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  alt         TEXT,
  position    INT         NOT NULL DEFAULT 0,
  is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_images_product ON product_images(product_id);
CREATE UNIQUE INDEX uq_images_primary ON product_images(product_id) WHERE is_primary;

-- =============================================================================
-- 5. KHO VẬT LÝ: từng bản váy thật
-- =============================================================================
CREATE TABLE inventory_items (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id  UUID           NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  asset_code  TEXT           NOT NULL UNIQUE,        -- mã gắn lên váy, vd CD-0001
  status      item_status    NOT NULL DEFAULT 'available',
  condition   item_condition NOT NULL DEFAULT 'good',
  acquired_at DATE,
  retired_at  DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_items_variant ON inventory_items(variant_id);
CREATE INDEX idx_items_status  ON inventory_items(status);
CREATE TRIGGER trg_items_updated BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 6. KHUYẾN MÃI (coupon)
-- =============================================================================
CREATE TABLE coupons (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT          NOT NULL UNIQUE,
  type         discount_type NOT NULL,
  value        NUMERIC(12,2) NOT NULL CHECK (value >= 0),
  min_total    NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(12,2),
  valid_from   TIMESTAMPTZ,
  valid_to     TIMESTAMPTZ,
  usage_limit  INT,                              -- NULL = không giới hạn
  used_count   INT           NOT NULL DEFAULT 0,
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT coupons_period_chk CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to > valid_from)
);

-- =============================================================================
-- 6b. CẤU HÌNH HỆ THỐNG (key-value, sửa runtime không cần deploy)
-- =============================================================================
CREATE TABLE settings (
  key         TEXT        PRIMARY KEY,
  value       JSONB       NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO settings (key, value, description) VALUES
  ('cleaning_buffer_days', '1',     'Số ngày đệm giặt ủi giữa 2 lượt thuê cùng 1 bản váy'),
  ('min_rental_days',      '1',     'Số ngày thuê tối thiểu mỗi đơn'),
  ('default_deposit_rate', '0.5',   'Tỷ lệ cọc mặc định trên giá thuê (nếu product không set)'),
  ('free_shipping_min',    '500000','Ngưỡng tổng đơn (VND) được miễn phí ship');

-- Helper: đọc 1 setting số nguyên (dùng khi build rental_period ở DB)
CREATE OR REPLACE FUNCTION setting_int(p_key TEXT, p_default INT DEFAULT 0)
RETURNS INT AS $$
  SELECT COALESCE((SELECT value::text::int FROM settings WHERE key = p_key), p_default);
$$ LANGUAGE sql STABLE;

-- =============================================================================
-- 7. ĐƠN THUÊ (rental) + dòng thuê (rental_items)
-- =============================================================================
CREATE TABLE rentals (
  id              UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_no       TEXT               NOT NULL UNIQUE,   -- mã đơn hiển thị, vd R-2026-000123
  customer_id     UUID               NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status          rental_status      NOT NULL DEFAULT 'pending',

  fulfillment     fulfillment_method NOT NULL,
  -- Bắt buộc địa chỉ khi giao hàng
  address_id      UUID               REFERENCES addresses(id) ON DELETE SET NULL,

  -- Khoảng thuê chung của đơn (từng item lưu lại period riêng để check trùng)
  start_date      DATE               NOT NULL,
  end_date        DATE               NOT NULL,

  -- Tổng tiền (đơn vị: VND). Snapshot tại thời điểm chốt đơn.
  subtotal        NUMERIC(12,2)      NOT NULL DEFAULT 0,
  discount_total  NUMERIC(12,2)      NOT NULL DEFAULT 0,
  deposit_total   NUMERIC(12,2)      NOT NULL DEFAULT 0,
  shipping_fee    NUMERIC(12,2)      NOT NULL DEFAULT 0,
  grand_total     NUMERIC(12,2)      NOT NULL DEFAULT 0,

  coupon_id       UUID               REFERENCES coupons(id) ON DELETE SET NULL,
  note            TEXT,
  picked_up_at    TIMESTAMPTZ,
  returned_at     TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ        NOT NULL DEFAULT now(),

  CONSTRAINT rentals_period_chk    CHECK (end_date >= start_date),
  CONSTRAINT rentals_delivery_addr CHECK (fulfillment <> 'delivery' OR address_id IS NOT NULL)
);
CREATE INDEX idx_rentals_customer ON rentals(customer_id);
CREATE INDEX idx_rentals_status   ON rentals(status);
CREATE INDEX idx_rentals_dates    ON rentals(start_date, end_date);
CREATE TRIGGER trg_rentals_updated BEFORE UPDATE ON rentals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE rental_items (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id      UUID          NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  item_id        UUID          NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,

  -- Khoảng giữ chỗ thực tế = ngày thuê + buffer giặt ủi.
  -- App build bằng: daterange(start, end + setting_int('cleaning_buffer_days'), '[)')
  -- Dùng [start, end) (half-open) cho EXCLUSION constraint chống trùng.
  rental_period  DATERANGE     NOT NULL,

  -- Snapshot thông tin & giá tại thời điểm đặt
  product_name   TEXT          NOT NULL,
  unit_price     NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  deposit_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),

  condition_out  item_condition,   -- tình trạng lúc giao
  condition_in   item_condition,   -- tình trạng lúc nhận lại
  cancelled_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- CHỐNG ĐẶT TRÙNG: 1 bản váy không thể có 2 lượt thuê chồng ngày
  -- (bỏ qua các dòng đã huỷ).
  CONSTRAINT no_double_booking EXCLUDE USING gist (
    item_id       WITH =,
    rental_period WITH &&
  ) WHERE (cancelled_at IS NULL)
);
CREATE INDEX idx_rental_items_rental ON rental_items(rental_id);
CREATE INDEX idx_rental_items_item   ON rental_items(item_id);

-- =============================================================================
-- 8. THANH TOÁN (gồm cọc, hoàn cọc, phí phạt)
-- =============================================================================
CREATE TABLE payments (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id     UUID           NOT NULL REFERENCES rentals(id) ON DELETE RESTRICT,
  kind          payment_kind   NOT NULL,
  method        payment_method NOT NULL,
  -- Số tiền: dương = thu của khách; âm = hoàn trả (deposit_refund)
  amount        NUMERIC(12,2)  NOT NULL,
  status        payment_status NOT NULL DEFAULT 'pending',
  provider_txn  TEXT,                              -- mã giao dịch cổng thanh toán
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_rental ON payments(rental_id);
CREATE INDEX idx_payments_status ON payments(status);
-- Idempotency: mỗi giao dịch online chỉ ghi nhận 1 lần
CREATE UNIQUE INDEX uq_payments_provider_txn ON payments(provider_txn) WHERE provider_txn IS NOT NULL;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 9. ĐÁNH GIÁ
-- =============================================================================
CREATE TABLE reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rental_id   UUID        REFERENCES rentals(id) ON DELETE SET NULL,
  rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Mỗi khách chỉ đánh giá 1 lần / sản phẩm
  UNIQUE (product_id, customer_id)
);
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- =============================================================================
-- 10. VIEW: tồn kho khả dụng theo biến thể (tiện cho trang tìm kiếm)
-- =============================================================================
CREATE VIEW v_variant_stock AS
SELECT
  v.id                                              AS variant_id,
  v.product_id,
  COUNT(i.id) FILTER (WHERE i.status <> 'retired')  AS total_items,
  COUNT(i.id) FILTER (WHERE i.status = 'available') AS available_items
FROM product_variants v
LEFT JOIN inventory_items i ON i.variant_id = v.id
GROUP BY v.id, v.product_id;
