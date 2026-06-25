const path = require('node:path')
const crypto = require('node:crypto')
const multer = require('multer')
const { ApiError } = require('@/lib/ApiError.js')

// chou-api/uploads (cùng cấp với src/)
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`)
  },
})

const fileFilter = (_req, file, cb) => {
  if (/^image\/(jpe?g|png|webp|gif|avif)$/.test(file.mimetype)) return cb(null, true)
  cb(new ApiError(400, 'BAD_REQUEST', 'Chỉ chấp nhận tệp ảnh (jpg, png, webp, gif, avif)'))
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
})

/** Middleware nhận tối đa 8 ảnh ở field `files`. */
const uploadImages = upload.array('files', 8)

module.exports = { UPLOAD_DIR, uploadImages }
