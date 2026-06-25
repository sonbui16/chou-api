const { asyncHandler } = require('@/lib/ApiError.js')
const { sendJson } = require('@/lib/serialize.js')
const products = require('@/services/admin/product.service.js')

const listProducts = asyncHandler(async (_req, res) => sendJson(res, await products.listProducts()))

const getProduct = asyncHandler(async (req, res) => sendJson(res, await products.getProduct(req.valid.params.id)))

const saveProduct = asyncHandler(async (req, res) =>
  sendJson(res, await products.saveProduct(req.valid.params.id, req.valid.body), req.valid.params.id ? 200 : 201),
)

const deleteProduct = asyncHandler(async (req, res) =>
  sendJson(res, await products.deleteProduct(req.valid.params.id)),
)

module.exports = { listProducts, getProduct, saveProduct, deleteProduct }
