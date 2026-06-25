const { prisma } = require('@/lib/prisma.js')

const DEVICE_PATTERNS = [
  [/iPad|Tablet|PlayBook|Silk/i, 'Máy tính bảng'],
  [/Mobi|Android|iPhone|iPod/i, 'Điện thoại'],
]

function detectBrowser(userAgent) {
  if (/Edg\//i.test(userAgent)) return 'Edge'
  if (/OPR\//i.test(userAgent)) return 'Opera'
  if (/Chrome\//i.test(userAgent)) return 'Chrome'
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return 'Safari'
  if (/Firefox\//i.test(userAgent)) return 'Firefox'
  return 'Trình duyệt khác'
}

function detectDevice(userAgent) {
  const kind = DEVICE_PATTERNS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? 'Máy tính'
  return `${kind} · ${detectBrowser(userAgent)}`
}

async function recordHeartbeat({ visitor_id, session_id, path, referrer, event, userId, userAgent }) {
  const now = new Date()

  const persist = () => prisma.$transaction(async (tx) => {
    const existing = await tx.visitorSession.findUnique({ where: { session_id } })

    if (!existing) {
      return tx.visitorSession.create({
        data: {
          visitor_id,
          session_id,
          user_id: userId,
          first_path: path,
          current_path: path,
          referrer: referrer || null,
          device: detectDevice(userAgent),
          started_at: now,
          last_seen_at: now,
        },
        select: { session_id: true, last_seen_at: true },
      })
    }

    const pathChanged = event === 'pageview' && existing.current_path !== path
    return tx.visitorSession.update({
      where: { session_id },
      data: {
        visitor_id,
        user_id: userId ?? existing.user_id,
        current_path: path,
        last_seen_at: now,
        ...(pathChanged ? { page_views: { increment: 1 } } : {}),
      },
      select: { session_id: true, last_seen_at: true },
    })
  })

  try {
    return await persist()
  } catch (error) {
    // Hai tab có thể cùng tạo phiên lần đầu; tab thua unique race chỉ cần thử lại.
    if (error?.code === 'P2002') return persist()
    throw error
  }
}

module.exports = { recordHeartbeat }
