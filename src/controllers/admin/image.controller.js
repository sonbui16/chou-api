import { asyncHandler } from '../../lib/ApiError.js'
import { sendJson } from '../../lib/serialize.js'
import * as images from '../../services/admin/image.service.js'

export const addImages = asyncHandler(async (req, res) =>
  sendJson(res, await images.addImages(req.valid.params.id, req.files, req), 201),
)

export const setPrimary = asyncHandler(async (req, res) =>
  sendJson(res, await images.setPrimaryImage(req.valid.params.id)),
)

export const deleteImage = asyncHandler(async (req, res) =>
  sendJson(res, await images.deleteImage(req.valid.params.id)),
)
