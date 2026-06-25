const { prisma } = require('@/lib/prisma.js')

const DEFAULTS = {
  cleaning_buffer_days: 1,
  min_rental_days: 1,
  default_deposit_rate: 0.5,
  free_shipping_min: 500000,
}

/** Đọc toàn bộ settings (key-value JSONB) thành object phẳng + giá trị mặc định. */
async function getSettings() {
  const rows = await prisma.setting.findMany()
  const map = { ...DEFAULTS }
  for (const r of rows) {
    map[r.key] = typeof r.value === 'string' ? Number(r.value) : r.value
  }
  return map
}


module.exports = { getSettings, SETTINGS_DEFAULTS: DEFAULTS }
