import { ApiError } from '../lib/ApiError.js'

export function notFound(_req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint không tồn tại' } })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details } })
  }

  // Prisma known errors
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Dữ liệu đã tồn tại' } })
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy bản ghi' } })
  }
  // Ràng buộc EXCLUDE (đặt trùng lịch) — Postgres exclusion_violation = 23P01
  if (err?.code === '23P01' || /no_double_booking/.test(err?.message ?? '')) {
    return res
      .status(409)
      .json({ error: { code: 'DOUBLE_BOOKING', message: 'Bản váy đã được đặt trong khoảng ngày này' } })
  }

  console.error('[error]', err)
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Lỗi máy chủ' } })
}
