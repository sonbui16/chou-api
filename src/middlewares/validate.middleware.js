const { ApiError } = require('@/lib/ApiError.js')
const { httpCodes } = require('@/config/constants.js')

/**
 * validate(schema) — schema zod hình { body?, query?, params? }.
 * Kết quả đã parse gắn vào req.valid.
 */
const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  })
  if (!result.success) {
    return next(new ApiError(httpCodes.unprocessableEntity, 'VALIDATION', 'Dữ liệu không hợp lệ', result.error.issues))
  }
  req.valid = result.data
  next()
}

module.exports = { validate }
