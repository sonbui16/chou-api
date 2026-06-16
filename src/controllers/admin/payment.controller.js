import { asyncHandler } from '../../lib/ApiError.js'
import { sendJson } from '../../lib/serialize.js'
import * as payments from '../../services/admin/payment.service.js'

export const listPayments = asyncHandler(async (_req, res) => sendJson(res, await payments.listPayments()))
