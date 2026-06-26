const { asyncHandler } = require('@/lib/ApiError.js')
const customers = require('@/services/admin/customer.service.js')

const listCustomers = asyncHandler(async (_req, res) => res.success(await customers.listCustomers()))

module.exports = { listCustomers }
