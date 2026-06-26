/**
 * Chuẩn hoá output Prisma cho JSON:
 *  - Prisma Decimal  -> Number (tiền VND an toàn trong 2^53)
 *  - BigInt          -> Number
 *  - Date            -> ISO string
 * Đệ quy qua object/array.
 */
function serialize(value) {
  if (value === null || value === undefined) return value
  if (typeof value === 'bigint') return Number(value)
  if (value instanceof Date) return value.toISOString()
  // Prisma Decimal có method toNumber()
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber()
  }
  if (Array.isArray(value)) return value.map(serialize)
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v)
    return out
  }
  return value
}

module.exports = { serialize }
