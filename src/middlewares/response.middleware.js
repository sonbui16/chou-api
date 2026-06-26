const { serialize } = require('@/lib/serialize.js')

/**
 * Chuẩn hoá response — gắn 2 helper vào mọi `res`:
 *   res.success(data, status = 200) -> { status: 'success', data }
 *   res.error(error, status = 400)  -> { status: 'error', error }
 * `data` được serialize (Decimal -> Number, BigInt -> Number, Date -> ISO)
 * theo đúng quy ước dự án.
 */
const response = (_, res, next) => {
  res.success = (data = null, status = 200) => {
    res.status(status).json({ status: 'success', data: serialize(data) })
  }

  res.error = (error = null, status = 400) => {
    res.status(status).json({ status: 'error', error })
  }

  next()
}

module.exports = response
