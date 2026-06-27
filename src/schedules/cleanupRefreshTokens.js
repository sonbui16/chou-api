const { prisma } = require('@/lib/prisma.js')

// Dọn refresh token đã hết hạn, hoặc đã revoke quá 7 ngày (giữ lại 1 thời gian để truy vết reuse).
async function cleanupRefreshTokens() {
  const now = new Date()
  const revokedCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  try {
    const { count } = await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expires_at: { lt: now } }, { revoked_at: { lt: revokedCutoff } }],
      },
    })
    console.log(`Dọn refresh token: xoá ${count} bản ghi`)
  } catch (err) {
    console.error('Dọn refresh token thất bại:', err.message)
  }
}

module.exports = cleanupRefreshTokens
