require('dotenv/config')
const jwt = require('jsonwebtoken')

const SECRET = process.env.AUTH_JWT_SECRET ?? 'dev-secret'
// expiresIn dạng SỐ = giây (jsonwebtoken hiểu number là giây). 7 ngày = 7 * 24 * 60 * 60 = 604800.
// Phải Number() vì env luôn là chuỗi — chuỗi số như "604800" sẽ bị 'ms' hiểu nhầm là mili-giây.
const EXPIRES_IN = Number(process.env.AUTH_ACCESS_TOKEN_TTL) || 7 * 24 * 60 * 60

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
}

function verifyToken(token) {
  return jwt.verify(token, SECRET)
}

module.exports = { signToken, verifyToken }
