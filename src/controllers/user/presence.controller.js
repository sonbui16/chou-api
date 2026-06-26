const { asyncHandler } = require('@/lib/ApiError.js')
const presence = require('@/services/user/presence.service.js')

const heartbeat = asyncHandler(async (req, res) => {
  const session = await presence.recordHeartbeat({
    ...req.valid.body,
    userId: req.user?.id ?? null,
    userAgent: req.get('user-agent') ?? '',
  })
  res.success(session)
})

module.exports = { heartbeat }
