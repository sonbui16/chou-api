const { asyncHandler } = require('@/lib/ApiError.js')
const { sendJson } = require('@/lib/serialize.js')
const inventory = require('@/services/admin/inventory.service.js')

const listInventory = asyncHandler(async (req, res) =>
  sendJson(res, await inventory.listInventory(req.valid.query.status)),
)

const updateInventory = asyncHandler(async (req, res) =>
  sendJson(res, await inventory.updateInventoryItem(req.valid.params.id, req.valid.body)),
)

const addItems = asyncHandler(async (req, res) =>
  sendJson(res, await inventory.addInventoryItems(req.valid.params.id, req.valid.body), 201),
)

const deleteItem = asyncHandler(async (req, res) =>
  sendJson(res, await inventory.deleteInventoryItem(req.valid.params.id)),
)

module.exports = { listInventory, updateInventory, addItems, deleteItem }
