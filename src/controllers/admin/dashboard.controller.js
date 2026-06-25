const { asyncHandler } = require('@/lib/ApiError.js')
const { sendJson } = require('@/lib/serialize.js')
const dashboard = require('@/services/admin/dashboard.service.js')

const stats = asyncHandler(async (_req, res) => sendJson(res, await dashboard.getStats()))

module.exports = { stats }
