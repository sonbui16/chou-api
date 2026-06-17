import { asyncHandler } from '../../lib/ApiError.js'
import { sendJson } from '../../lib/serialize.js'
import * as inventory from '../../services/admin/inventory.service.js'

export const listInventory = asyncHandler(async (req, res) =>
  sendJson(res, await inventory.listInventory(req.valid.query.status)),
)

export const updateInventory = asyncHandler(async (req, res) =>
  sendJson(res, await inventory.updateInventoryItem(req.valid.params.id, req.valid.body)),
)

export const addItems = asyncHandler(async (req, res) =>
  sendJson(res, await inventory.addInventoryItems(req.valid.params.id, req.valid.body), 201),
)

export const deleteItem = asyncHandler(async (req, res) =>
  sendJson(res, await inventory.deleteInventoryItem(req.valid.params.id)),
)
