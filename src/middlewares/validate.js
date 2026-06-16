import { ApiError } from '../lib/ApiError.js'

/**
 * validate(schema) — schema zod hình { body?, query?, params? }.
 * Kết quả đã parse gắn vào req.valid.
 */
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  })
  if (!result.success) {
    return next(new ApiError(422, 'VALIDATION', 'Dữ liệu không hợp lệ', result.error.issues))
  }
  req.valid = result.data
  next()
}
