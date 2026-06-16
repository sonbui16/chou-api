import { asyncHandler } from '../../lib/ApiError.js'
import { sendJson } from '../../lib/serialize.js'
import * as settings from '../../services/admin/setting.service.js'

export const listSettings = asyncHandler(async (_req, res) => sendJson(res, await settings.listSettings()))

export const updateSettings = asyncHandler(async (req, res) =>
  sendJson(res, await settings.updateSettings(req.valid.body)),
)
