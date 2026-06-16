import { asyncHandler } from '../../lib/ApiError.js'
import { sendJson } from '../../lib/serialize.js'
import * as customers from '../../services/admin/customer.service.js'

export const listCustomers = asyncHandler(async (_req, res) => sendJson(res, await customers.listCustomers()))
