const { asyncHandler } = require('@/lib/ApiError.js')
const { httpCodes } = require('@/config/constants.js')
const addresses = require('@/services/user/address.service.js')
const rentals = require('@/services/user/rental.service.js')
const reviews = require('@/services/user/review.service.js')

/* Addresses */
const listAddresses = asyncHandler(async (req, res) => {
  res.success(await addresses.listAddresses(req.user.id))
})
const createAddress = asyncHandler(async (req, res) => {
  res.success(await addresses.createAddress(req.user.id, req.valid.body), httpCodes.created)
})
const updateAddress = asyncHandler(async (req, res) => {
  res.success(await addresses.updateAddress(req.user.id, req.valid.params.id, req.valid.body))
})
const deleteAddress = asyncHandler(async (req, res) => {
  res.success(await addresses.deleteAddress(req.user.id, req.valid.params.id))
})

/* Rentals */
const createRental = asyncHandler(async (req, res) => {
  res.success(await rentals.createRental(req.user.id, req.valid.body), httpCodes.created)
})
const myRentals = asyncHandler(async (req, res) => {
  res.success(await rentals.listMyRentals(req.user.id))
})
const myRental = asyncHandler(async (req, res) => {
  res.success(await rentals.getMyRentalByNo(req.user.id, req.valid.params.rentalNo))
})

/* Reviews */
const createReview = asyncHandler(async (req, res) => {
  res.success(await reviews.upsertReview(req.user.id, req.valid.body), httpCodes.created)
})

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress, createRental, myRentals, myRental, createReview }
