const { asyncHandler } = require('@/lib/ApiError.js')
const payments = require('@/services/admin/payment.service.js')

const listPayments = asyncHandler(async (_req, res) => res.success(await payments.listPayments()))

module.exports = { listPayments }
