const { asyncHandler } = require('@/lib/ApiError.js')
const visitors = require('@/services/admin/visitor.service.js')

const summary = asyncHandler(async (_req, res) => {
  res.success(await visitors.getVisitorSummary())
})

const listVisitors = asyncHandler(async (req, res) => {
  res.success(await visitors.listVisitors(req.valid.query))
})

module.exports = { summary, listVisitors }
