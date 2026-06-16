/** Tiện ích ngày làm việc trên chuỗi ISO 'YYYY-MM-DD' (UTC, không giờ). */

export function toDateOnly(d) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()))
}

export function isoDate(d) {
  return toDateOnly(d).toISOString().slice(0, 10)
}

export function addDays(d, n) {
  const dt = toDateOnly(d)
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt
}

/** Số ngày thuê tính cả 2 đầu mút (A..B) */
export function rentalDays(start, end) {
  const ms = toDateOnly(end).getTime() - toDateOnly(start).getTime()
  return Math.max(1, Math.round(ms / 86_400_000) + 1)
}

/** Hai khoảng nửa mở [aStart, aEnd) và [bStart, bEnd) có giao nhau? */
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return toDateOnly(aStart) < toDateOnly(bEnd) && toDateOnly(bStart) < toDateOnly(aEnd)
}
