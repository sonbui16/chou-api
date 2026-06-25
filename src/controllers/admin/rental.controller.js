const { asyncHandler } = require('@/lib/ApiError.js')
const { sendJson } = require('@/lib/serialize.js')
const rentals = require('@/services/admin/rental.service.js')

const listRentals = asyncHandler(async (req, res) =>
  sendJson(res, await rentals.listRentals(req.valid.query.status)),
)

const getRental = asyncHandler(async (req, res) =>
  sendJson(res, await rentals.getRental(req.valid.params.id)),
)

const updateRentalStatus = asyncHandler(async (req, res) =>
  sendJson(res, await rentals.updateRentalStatus(req.valid.params.id, req.valid.body.status, req.valid.body.condition_in)),
)

const refundDeposit = asyncHandler(async (req, res) =>
  sendJson(res, await rentals.refundDeposit(req.valid.params.id)),
)

module.exports = { listRentals, getRental, updateRentalStatus, refundDeposit }
