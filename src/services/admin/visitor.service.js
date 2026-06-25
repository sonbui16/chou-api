const { prisma } = require('@/lib/prisma.js')

const ONLINE_WINDOW_MS = 75 * 1000
const userSelect = { id: true, full_name: true, email: true, phone: true }
const REPORT_TIME_ZONE = 'Asia/Ho_Chi_Minh'

function onlineCutoff() {
  return new Date(Date.now() - ONLINE_WINDOW_MS)
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function dateKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function visitorTrend(sessions, days = 7) {
  const rows = []
  const byDate = new Map()

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - offset)
    const key = dateKey(date)
    const row = { date: key, sessions: 0, visitors: 0, page_views: 0, visitorIds: new Set() }
    rows.push(row)
    byDate.set(key, row)
  }

  for (const session of sessions) {
    const row = byDate.get(dateKey(session.started_at))
    if (!row) continue
    row.sessions += 1
    row.page_views += session.page_views
    row.visitorIds.add(session.visitor_id)
  }

  return rows.map(({ visitorIds, ...row }) => ({ ...row, visitors: visitorIds.size }))
}

function dedupeLatestByVisitor(sessions) {
  const seen = new Set()
  return sessions.filter((session) => {
    if (seen.has(session.visitor_id)) return false
    seen.add(session.visitor_id)
    return true
  })
}

function matchesSearch(session, search) {
  if (!search) return true
  const needle = search.toLocaleLowerCase('vi')
  return [
    session.visitor_id,
    session.user?.full_name,
    session.user?.email,
    session.user?.phone,
  ].some((value) => value?.toLocaleLowerCase('vi').includes(needle))
}

async function getVisitorSummary() {
  const trendStart = new Date()
  // Lấy dư một ngày rồi gom theo múi giờ báo cáo để không hụt dữ liệu ở biên UTC.
  trendStart.setDate(trendStart.getDate() - 8)
  trendStart.setHours(0, 0, 0, 0)

  const [onlineSessions, sessionsToday, recentSessions] = await Promise.all([
    prisma.visitorSession.findMany({
      where: { last_seen_at: { gte: onlineCutoff() } },
      orderBy: { last_seen_at: 'desc' },
      select: { visitor_id: true, user_id: true },
    }),
    prisma.visitorSession.count({ where: { started_at: { gte: startOfToday() } } }),
    prisma.visitorSession.findMany({
      where: { started_at: { gte: trendStart } },
      select: { visitor_id: true, started_at: true, page_views: true },
    }),
  ])

  const online = dedupeLatestByVisitor(onlineSessions)
  const authenticated = online.filter((session) => session.user_id).length

  return {
    online: online.length,
    authenticated,
    anonymous: online.length - authenticated,
    sessions_today: sessionsToday,
    trend: visitorTrend(recentSessions),
  }
}

async function listVisitors({ status, page, limit, search }) {
  if (status === 'online') {
    const sessions = await prisma.visitorSession.findMany({
      where: { last_seen_at: { gte: onlineCutoff() } },
      include: { user: { select: userSelect } },
      orderBy: { last_seen_at: 'desc' },
    })
    const filtered = dedupeLatestByVisitor(sessions).filter((session) => matchesSearch(session, search))
    const start = (page - 1) * limit
    return {
      items: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
    }
  }

  const where = search
    ? {
        OR: [
          { visitor_id: { contains: search, mode: 'insensitive' } },
          { user: { is: { full_name: { contains: search, mode: 'insensitive' } } } },
          { user: { is: { email: { contains: search, mode: 'insensitive' } } } },
          { user: { is: { phone: { contains: search, mode: 'insensitive' } } } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.visitorSession.findMany({
      where,
      include: { user: { select: userSelect } },
      orderBy: { last_seen_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.visitorSession.count({ where }),
  ])

  return { items, total, page, limit }
}

module.exports = { getVisitorSummary, listVisitors }
