const { asyncHandler } = require('@/lib/ApiError.js')
const { sendJson } = require('@/lib/serialize.js')
const visitors = require('@/services/admin/visitor.service.js')

const summary = asyncHandler(async (_req, res) => {
  sendJson(res, await visitors.getVisitorSummary())
})

const listVisitors = asyncHandler(async (req, res) => {
  sendJson(res, await visitors.listVisitors(req.valid.query))
})

module.exports = { summary, listVisitors }
