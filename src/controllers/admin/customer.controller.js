const { asyncHandler } = require('@/lib/ApiError.js')
const { sendJson } = require('@/lib/serialize.js')
const customers = require('@/services/admin/customer.service.js')

const listCustomers = asyncHandler(async (_req, res) => sendJson(res, await customers.listCustomers()))

module.exports = { listCustomers }
