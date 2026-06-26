const { asyncHandler } = require('@/lib/ApiError.js')
const settings = require('@/services/admin/setting.service.js')

const listSettings = asyncHandler(async (_req, res) => res.success(await settings.listSettings()))

const updateSettings = asyncHandler(async (req, res) =>
  res.success(await settings.updateSettings(req.valid.body)),
)

module.exports = { listSettings, updateSettings }
