const { prisma } = require('@/lib/prisma.js')

function listSettings() {
  return prisma.setting.findMany()
}

async function updateSettings(entries) {
  const ops = Object.entries(entries).map(([key, value]) =>
    prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
  )
  await prisma.$transaction(ops)
  return prisma.setting.findMany()
}

module.exports = { listSettings, updateSettings }
