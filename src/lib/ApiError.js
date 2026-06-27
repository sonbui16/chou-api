const { httpCodes } = require('@/config/constants.js')

/** Lỗi nghiệp vụ có HTTP status + mã code ổn định cho client. */
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message ?? code)
    this.status = status
    this.code = code
    this.details = details
  }

  static badRequest(message, details) {
    return new ApiError(httpCodes.badRequest, 'BAD_REQUEST', message, details)
  }
  static unauthorized(message = 'Cần đăng nhập') {
    return new ApiError(httpCodes.unauthorized, 'UNAUTHORIZED', message)
  }
  static forbidden(message = 'Không có quyền') {
    return new ApiError(httpCodes.forbidden, 'FORBIDDEN', message)
  }
  static notFound(message = 'Không tìm thấy') {
    return new ApiError(httpCodes.notFound, 'NOT_FOUND', message)
  }
  static conflict(message, code = 'CONFLICT') {
    return new ApiError(httpCodes.conflict, code, message)
  }
}

/** Bọc async controller để tự forward lỗi sang error middleware. */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

module.exports = { ApiError, asyncHandler }
