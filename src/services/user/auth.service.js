const bcrypt = require('bcryptjs')
const { prisma } = require('@/lib/prisma.js')
const { ApiError } = require('@/lib/ApiError.js')
const { signToken } = require('@/lib/jwt.js')
const { newOpaqueToken, hashToken, refreshExpiry } = require('@/lib/refreshToken.js')

const publicUser = (u) => ({
  id: u.id,
  role: u.role,
  full_name: u.full_name,
  email: u.email,
  phone: u.phone,
  created_at: u.created_at,
})

/**
 * Phát cặp token: access (JWT ngắn hạn) + refresh (opaque, lưu BẢN HASH vào DB).
 * Trả refresh token nguyên bản cho client — DB chỉ giữ token_hash.
 */
async function issueTokens(user) {
  const token = signToken({ sub: user.id, role: user.role })
  const refresh_token = newOpaqueToken()
  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: hashToken(refresh_token),
      expires_at: refreshExpiry(),
    },
  })
  return { token, refresh_token }
}

async function register({ full_name, email, phone, password }) {
  const normEmail = email.toLowerCase().trim()
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: normEmail }, { phone }] },
  })
  if (existing) throw ApiError.conflict('Email hoặc số điện thoại đã được dùng', 'DUPLICATE')

  const password_hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { full_name, email: normEmail, phone, password_hash, role: 'customer' },
  })
  return { ...(await issueTokens(user)), user: publicUser(user) }
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user || !user.password_hash) throw ApiError.unauthorized('Sai email hoặc mật khẩu')
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) throw ApiError.unauthorized('Sai email hoặc mật khẩu')
  if (!user.is_active) throw ApiError.forbidden('Tài khoản đã bị khoá')
  return { ...(await issueTokens(user)), user: publicUser(user) }
}

/**
 * Đổi refresh token lấy cặp token mới (ROTATION): revoke token cũ, phát cặp mới.
 * Token không tồn tại / đã revoke / hết hạn → 401.
 */
async function refresh(rawToken) {
  const row = await prisma.refreshToken.findUnique({ where: { token_hash: hashToken(rawToken) } })
  if (!row || row.revoked_at || row.expires_at < new Date()) {
    throw ApiError.unauthorized('Refresh token không hợp lệ hoặc đã hết hạn')
  }
  const user = await prisma.user.findUnique({ where: { id: row.user_id } })
  if (!user || !user.is_active) throw ApiError.unauthorized('Tài khoản không khả dụng')

  await prisma.refreshToken.update({ where: { id: row.id }, data: { revoked_at: new Date() } })
  return issueTokens(user)
}

/** Thu hồi 1 refresh token (logout). Idempotent — không lộ token có tồn tại hay không. */
async function logout(rawToken) {
  await prisma.refreshToken.updateMany({
    where: { token_hash: hashToken(rawToken), revoked_at: null },
    data: { revoked_at: new Date() },
  })
  return { success: true }
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw ApiError.notFound('Không tìm thấy tài khoản')
  return publicUser(user)
}

module.exports = { register, login, refresh, logout, getMe }
