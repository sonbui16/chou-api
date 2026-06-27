const { ApiError } = require('@/lib/ApiError.js')
const { httpCodes } = require('@/config/constants.js')

// Envelope lỗi chuẩn: { status: 'error', error: { code, message, details? } }
// Viết trực tiếp (không qua res.error) vì lỗi có thể phát sinh ở middleware
// chạy trước response middleware (vd express.json gặp JSON hỏng).
function sendError(res, status, code, message, details) {
  res.status(status).json({ status: 'error', error: { code, message, details } })
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return sendError(res, err.status, err.code, err.message, err.details)
  }

  // Prisma known errors
  if (err?.code === 'P2002') {
    return sendError(res, httpCodes.conflict, 'DUPLICATE', 'Dữ liệu đã tồn tại')
  }
  if (err?.code === 'P2025') {
    return sendError(res, httpCodes.notFound, 'NOT_FOUND', 'Không tìm thấy bản ghi')
  }
  // Ràng buộc EXCLUDE (đặt trùng lịch) — Postgres exclusion_violation = 23P01
  if (err?.code === '23P01' || /no_double_booking/.test(err?.message ?? '')) {
    return sendError(res, httpCodes.conflict, 'DOUBLE_BOOKING', 'Bản váy đã được đặt trong khoảng ngày này')
  }

  console.error('[error]', err)
  sendError(res, httpCodes.internalServerError, 'INTERNAL', 'Lỗi máy chủ')
}

module.exports = errorHandler
