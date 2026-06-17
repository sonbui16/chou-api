import { asyncHandler } from '../../lib/ApiError.js'
import { sendJson } from '../../lib/serialize.js'
import * as variants from '../../services/admin/variant.service.js'

export const createVariant = asyncHandler(async (req, res) =>
  sendJson(res, await variants.createVariant(req.valid.params.id, req.valid.body), 201),
)

export const deleteVariant = asyncHandler(async (req, res) =>
  sendJson(res, await variants.deleteVariant(req.valid.params.id)),
)
