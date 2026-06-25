const { asyncHandler } = require('@/lib/ApiError.js')
const { sendJson } = require('@/lib/serialize.js')
const payments = require('@/services/admin/payment.service.js')

const listPayments = asyncHandler(async (_req, res) => sendJson(res, await payments.listPayments()))

module.exports = { listPayments }
