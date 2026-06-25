const { asyncHandler } = require('@/lib/ApiError.js')
const { sendJson } = require('@/lib/serialize.js')
const addresses = require('@/services/user/address.service.js')
const rentals = require('@/services/user/rental.service.js')
const reviews = require('@/services/user/review.service.js')

/* Addresses */
const listAddresses = asyncHandler(async (req, res) => {
  sendJson(res, await addresses.listAddresses(req.user.id))
})
const createAddress = asyncHandler(async (req, res) => {
  sendJson(res, await addresses.createAddress(req.user.id, req.valid.body), 201)
})
const updateAddress = asyncHandler(async (req, res) => {
  sendJson(res, await addresses.updateAddress(req.user.id, req.valid.params.id, req.valid.body))
})
const deleteAddress = asyncHandler(async (req, res) => {
  sendJson(res, await addresses.deleteAddress(req.user.id, req.valid.params.id))
})

/* Rentals */
const createRental = asyncHandler(async (req, res) => {
  sendJson(res, await rentals.createRental(req.user.id, req.valid.body), 201)
})
const myRentals = asyncHandler(async (req, res) => {
  sendJson(res, await rentals.listMyRentals(req.user.id))
})
const myRental = asyncHandler(async (req, res) => {
  sendJson(res, await rentals.getMyRentalByNo(req.user.id, req.valid.params.rentalNo))
})

/* Reviews */
const createReview = asyncHandler(async (req, res) => {
  sendJson(res, await reviews.upsertReview(req.user.id, req.valid.body), 201)
})

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress, createRental, myRentals, myRental, createReview }
