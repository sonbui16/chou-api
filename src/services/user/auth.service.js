const bcrypt = require('bcryptjs')
const { prisma } = require('@/lib/prisma.js')
const { ApiError } = require('@/lib/ApiError.js')
const { signToken } = require('@/lib/jwt.js')

const publicUser = (u) => ({
  id: u.id,
  role: u.role,
  full_name: u.full_name,
  email: u.email,
  phone: u.phone,
  created_at: u.created_at,
})

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
  const token = signToken({ sub: user.id, role: user.role })
  return { token, user: publicUser(user) }
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user || !user.password_hash) throw ApiError.unauthorized('Sai email hoặc mật khẩu')
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) throw ApiError.unauthorized('Sai email hoặc mật khẩu')
  if (!user.is_active) throw ApiError.forbidden('Tài khoản đã bị khoá')
  const token = signToken({ sub: user.id, role: user.role })
  return { token, user: publicUser(user) }
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw ApiError.notFound('Không tìm thấy tài khoản')
  return publicUser(user)
}

module.exports = { register, login, getMe }
