const { prisma } = require('@/lib/prisma.js')

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000

async function cleanupVisitorSessions() {
  const cutoff = new Date(Date.now() - RETENTION_MS)
  try {
    await prisma.visitorSession.deleteMany({ where: { last_seen_at: { lt: cutoff } } })
  } catch (error) {
    console.error('Không thể dọn lịch sử truy cập:', error)
  }
}

function startPresenceCleanup() {
  void cleanupVisitorSessions()
  const timer = setInterval(cleanupVisitorSessions, CLEANUP_INTERVAL_MS)
  timer.unref?.()
}

module.exports = { startPresenceCleanup }
