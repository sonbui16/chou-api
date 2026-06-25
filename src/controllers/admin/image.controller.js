const { asyncHandler } = require('@/lib/ApiError.js')
const { sendJson } = require('@/lib/serialize.js')
const images = require('@/services/admin/image.service.js')

const addImages = asyncHandler(async (req, res) =>
  sendJson(res, await images.addImages(req.valid.params.id, req.files, req), 201),
)

const setPrimary = asyncHandler(async (req, res) =>
  sendJson(res, await images.setPrimaryImage(req.valid.params.id)),
)

const deleteImage = asyncHandler(async (req, res) =>
  sendJson(res, await images.deleteImage(req.valid.params.id)),
)

module.exports = { addImages, setPrimary, deleteImage }
