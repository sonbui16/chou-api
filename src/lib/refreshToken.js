require('dotenv/config')
const crypto = require('node:crypto')

// TTL refresh token (số giây). Mặc định 7 ngày nếu thiếu env.
const REFRESH_TTL = Number(process.env.AUTH_REFRESH_TOKEN_TTL) || 7 * 24 * 60 * 60

/** Sinh refresh token opaque (entropy cao) — trả nguyên bản cho client 1 lần. */
function newOpaqueToken() {
  return crypto.randomBytes(48).toString('base64url')
}

/** Hash SHA-256 để LƯU vào DB (không lưu token thô). Token entropy cao → sha256 đủ an toàn. */
function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/** Mốc hết hạn refresh token tính từ bây giờ. */
function refreshExpiry() {
  return new Date(Date.now() + REFRESH_TTL * 1000)
}

module.exports = { newOpaqueToken, hashToken, refreshExpiry }
