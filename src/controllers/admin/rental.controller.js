import { asyncHandler } from '../../lib/ApiError.js'
import { sendJson } from '../../lib/serialize.js'
import * as rentals from '../../services/admin/rental.service.js'

export const listRentals = asyncHandler(async (req, res) =>
  sendJson(res, await rentals.listRentals(req.valid.query.status)),
)

export const getRental = asyncHandler(async (req, res) =>
  sendJson(res, await rentals.getRental(req.valid.params.id)),
)

export const updateRentalStatus = asyncHandler(async (req, res) =>
  sendJson(res, await rentals.updateRentalStatus(req.valid.params.id, req.valid.body.status, req.valid.body.condition_in)),
)

export const refundDeposit = asyncHandler(async (req, res) =>
  sendJson(res, await rentals.refundDeposit(req.valid.params.id)),
)
