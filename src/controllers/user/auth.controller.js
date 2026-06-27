const { asyncHandler } = require('@/lib/ApiError.js')
const { httpCodes } = require('@/config/constants.js')
const auth = require('@/services/user/auth.service.js')

const register = asyncHandler(async (req, res) => {
  res.success(await auth.register(req.valid.body), httpCodes.created)
})

const login = asyncHandler(async (req, res) => {
  res.success(await auth.login(req.valid.body))
})

const refresh = asyncHandler(async (req, res) => {
  res.success(await auth.refresh(req.valid.body.refresh_token))
})

const logout = asyncHandler(async (req, res) => {
  res.success(await auth.logout(req.valid.body.refresh_token))
})

const me = asyncHandler(async (req, res) => {
  res.success(await auth.getMe(req.user.id))
})

module.exports = { register, login, refresh, logout, me }
