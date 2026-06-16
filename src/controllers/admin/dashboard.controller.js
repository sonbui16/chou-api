import { asyncHandler } from '../../lib/ApiError.js'
import { sendJson } from '../../lib/serialize.js'
import * as dashboard from '../../services/admin/dashboard.service.js'

export const stats = asyncHandler(async (_req, res) => sendJson(res, await dashboard.getStats()))
