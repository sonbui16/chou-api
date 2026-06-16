import { asyncHandler } from '../../lib/ApiError.js'
import { sendJson } from '../../lib/serialize.js'
import * as auth from '../../services/user/auth.service.js'

export const register = asyncHandler(async (req, res) => {
  sendJson(res, await auth.register(req.valid.body), 201)
})

export const login = asyncHandler(async (req, res) => {
  sendJson(res, await auth.login(req.valid.body))
})

export const me = asyncHandler(async (req, res) => {
  sendJson(res, await auth.getMe(req.user.id))
})
