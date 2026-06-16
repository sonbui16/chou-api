/** Lỗi nghiệp vụ có HTTP status + mã code ổn định cho client. */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message ?? code)
    this.status = status
    this.code = code
    this.details = details
  }

  static badRequest(message, details) {
    return new ApiError(400, 'BAD_REQUEST', message, details)
  }
  static unauthorized(message = 'Cần đăng nhập') {
    return new ApiError(401, 'UNAUTHORIZED', message)
  }
  static forbidden(message = 'Không có quyền') {
    return new ApiError(403, 'FORBIDDEN', message)
  }
  static notFound(message = 'Không tìm thấy') {
    return new ApiError(404, 'NOT_FOUND', message)
  }
  static conflict(message, code = 'CONFLICT') {
    return new ApiError(409, code, message)
  }
}

/** Bọc async controller để tự forward lỗi sang error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
