const { asyncHandler } = require('@/lib/ApiError.js')
const dashboard = require('@/services/admin/dashboard.service.js')

const stats = asyncHandler(async (_req, res) => res.success(await dashboard.getStats()))

module.exports = { stats }
