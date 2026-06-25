const { asyncHandler } = require('@/lib/ApiError.js')
const { sendJson } = require('@/lib/serialize.js')
const variants = require('@/services/admin/variant.service.js')

const createVariant = asyncHandler(async (req, res) =>
  sendJson(res, await variants.createVariant(req.valid.params.id, req.valid.body), 201),
)

const deleteVariant = asyncHandler(async (req, res) =>
  sendJson(res, await variants.deleteVariant(req.valid.params.id)),
)

module.exports = { createVariant, deleteVariant }
