import { asyncHandler } from '../../lib/ApiError.js'
import { sendJson } from '../../lib/serialize.js'
import * as addresses from '../../services/user/address.service.js'
import * as rentals from '../../services/user/rental.service.js'
import * as reviews from '../../services/user/review.service.js'

/* Addresses */
export const listAddresses = asyncHandler(async (req, res) => {
  sendJson(res, await addresses.listAddresses(req.user.id))
})
export const createAddress = asyncHandler(async (req, res) => {
  sendJson(res, await addresses.createAddress(req.user.id, req.valid.body), 201)
})
export const updateAddress = asyncHandler(async (req, res) => {
  sendJson(res, await addresses.updateAddress(req.user.id, req.valid.params.id, req.valid.body))
})
export const deleteAddress = asyncHandler(async (req, res) => {
  sendJson(res, await addresses.deleteAddress(req.user.id, req.valid.params.id))
})

/* Rentals */
export const createRental = asyncHandler(async (req, res) => {
  sendJson(res, await rentals.createRental(req.user.id, req.valid.body), 201)
})
export const myRentals = asyncHandler(async (req, res) => {
  sendJson(res, await rentals.listMyRentals(req.user.id))
})
export const myRental = asyncHandler(async (req, res) => {
  sendJson(res, await rentals.getMyRentalByNo(req.user.id, req.valid.params.rentalNo))
})

/* Reviews */
export const createReview = asyncHandler(async (req, res) => {
  sendJson(res, await reviews.upsertReview(req.user.id, req.valid.body), 201)
})
