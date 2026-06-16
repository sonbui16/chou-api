import { prisma } from '../../lib/prisma.js'

export function listSettings() {
  return prisma.setting.findMany()
}

export async function updateSettings(entries) {
  const ops = Object.entries(entries).map(([key, value]) =>
    prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
  )
  await prisma.$transaction(ops)
  return prisma.setting.findMany()
}
