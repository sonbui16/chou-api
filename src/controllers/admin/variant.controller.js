const { asyncHandler } = require('@/lib/ApiError.js')
const { httpCodes } = require('@/config/constants.js')
const variants = require('@/services/admin/variant.service.js')

const createVariant = asyncHandler(async (req, res) =>
  res.success(await variants.createVariant(req.valid.params.id, req.valid.body), httpCodes.created),
)

const deleteVariant = asyncHandler(async (req, res) =>
  res.success(await variants.deleteVariant(req.valid.params.id)),
)

module.exports = { createVariant, deleteVariant }
