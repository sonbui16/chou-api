import { asyncHandler } from '../../lib/ApiError.js'
import { sendJson } from '../../lib/serialize.js'
import * as products from '../../services/admin/product.service.js'

export const listProducts = asyncHandler(async (_req, res) => sendJson(res, await products.listProducts()))

export const saveProduct = asyncHandler(async (req, res) =>
  sendJson(res, await products.saveProduct(req.valid.params.id, req.valid.body), req.valid.params.id ? 200 : 201),
)

export const deleteProduct = asyncHandler(async (req, res) =>
  sendJson(res, await products.deleteProduct(req.valid.params.id)),
)
