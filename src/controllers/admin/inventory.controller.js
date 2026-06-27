const { asyncHandler } = require('@/lib/ApiError.js')
const { httpCodes } = require('@/config/constants.js')
const inventory = require('@/services/admin/inventory.service.js')

const listInventory = asyncHandler(async (req, res) =>
  res.success(await inventory.listInventory(req.valid.query.status)),
)

const updateInventory = asyncHandler(async (req, res) =>
  res.success(await inventory.updateInventoryItem(req.valid.params.id, req.valid.body)),
)

const addItems = asyncHandler(async (req, res) =>
  res.success(await inventory.addInventoryItems(req.valid.params.id, req.valid.body), httpCodes.created),
)

const deleteItem = asyncHandler(async (req, res) =>
  res.success(await inventory.deleteInventoryItem(req.valid.params.id)),
)

module.exports = { listInventory, updateInventory, addItems, deleteItem }
