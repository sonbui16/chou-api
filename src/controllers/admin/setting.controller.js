const { asyncHandler } = require('@/lib/ApiError.js')
const { sendJson } = require('@/lib/serialize.js')
const settings = require('@/services/admin/setting.service.js')

const listSettings = asyncHandler(async (_req, res) => sendJson(res, await settings.listSettings()))

const updateSettings = asyncHandler(async (req, res) =>
  sendJson(res, await settings.updateSettings(req.valid.body)),
)

module.exports = { listSettings, updateSettings }
