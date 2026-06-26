const { ApiError } = require('@/lib/ApiError.js')
const { verifyToken } = require('@/lib/jwt.js')

/** Gắn req.user nếu có token hợp lệ; ném 401 nếu thiếu/invalid. */
function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return next(ApiError.unauthorized())
  try {
    const payload = verifyToken(token)
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    next(ApiError.unauthorized('Token không hợp lệ hoặc đã hết hạn'))
  }
}

/** Chỉ cho staff/admin. */
function requireAdmin(req, _res, next) {
  requireAuth(req, _res, (err) => {
    if (err) return next(err)
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return next(ApiError.forbidden('Chỉ dành cho quản trị'))
    }
    next()
  })
}

/** Gắn req.user nếu có token, nhưng không bắt buộc. */
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) {
    try {
      const payload = verifyToken(token)
      req.user = { id: payload.sub, role: payload.role }
    } catch {
      /* bỏ qua token lỗi */
    }
  }
  next()
}

module.exports = { requireAuth, requireAdmin, optionalAuth }
