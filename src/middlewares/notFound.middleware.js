const { httpCodes } = require('@/config/constants.js')

// Middleware cuối cùng cho route không khớp — trả 404 qua res.error (chuẩn hoá).
// res.error có sẵn vì response middleware được mount trước routes.
function notFound(req, res) {
  res.error({  message: `Endpoint: ${req.url} không tồn tại` }, httpCodes.notFound)
}

module.exports = notFound
