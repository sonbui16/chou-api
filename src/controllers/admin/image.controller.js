const { asyncHandler } = require('@/lib/ApiError.js')
const { httpCodes } = require('@/config/constants.js')
const images = require('@/services/admin/image.service.js')

const addImages = asyncHandler(async (req, res) =>
  res.success(await images.addImages(req.valid.params.id, req.files, req), httpCodes.created),
)

const setPrimary = asyncHandler(async (req, res) =>
  res.success(await images.setPrimaryImage(req.valid.params.id)),
)

const deleteImage = asyncHandler(async (req, res) =>
  res.success(await images.deleteImage(req.valid.params.id)),
)

module.exports = { addImages, setPrimary, deleteImage }
