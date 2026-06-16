-- Ràng buộc Postgres-only mà Prisma schema không biểu diễn được.

-- Cần cho EXCLUDE dùng uuid (=) cùng range (&&)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- CHỐNG ĐẶT TRÙNG: 1 bản váy (item_id) không thể có 2 lượt thuê chồng ngày.
-- Khoảng giữ chỗ = [rental_start, hold_until) (hold_until đã gồm buffer giặt ủi).
-- Bỏ qua các dòng đã huỷ.
ALTER TABLE "rental_items"
  ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (
    item_id WITH =,
    daterange(rental_start, hold_until, '[)') WITH &&
  ) WHERE (cancelled_at IS NULL);

-- Mỗi user chỉ có 1 địa chỉ mặc định
CREATE UNIQUE INDEX uq_addresses_default ON "addresses"(user_id) WHERE is_default;

-- Mỗi product chỉ 1 ảnh primary
CREATE UNIQUE INDEX uq_images_primary ON "product_images"(product_id) WHERE is_primary;

-- CHECK ràng buộc nghiệp vụ
ALTER TABLE "rentals"
  ADD CONSTRAINT rentals_period_chk CHECK (end_date >= start_date);
ALTER TABLE "rentals"
  ADD CONSTRAINT rentals_delivery_addr CHECK (fulfillment <> 'delivery' OR address_id IS NOT NULL);
ALTER TABLE "reviews"
  ADD CONSTRAINT reviews_rating_chk CHECK (rating BETWEEN 1 AND 5);

-- Helper đọc setting số nguyên (parity với docs/database/schema.sql)
CREATE OR REPLACE FUNCTION setting_int(p_key TEXT, p_default INT DEFAULT 0)
RETURNS INT AS $$
  SELECT COALESCE((SELECT value::text::int FROM settings WHERE key = p_key), p_default);
$$ LANGUAGE sql STABLE;
