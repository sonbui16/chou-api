const { prisma } = require('@/lib/prisma.js')

const PREFIX = 'CD-'

/**
 * Sinh `count` mã váy kế tiếp dạng CD-#### nối tiếp mã lớn nhất hiện có.
 * Dùng trong transaction khi thêm bản váy để tránh trùng mã.
 * @param {number} count
 * @param {import('@prisma/client').PrismaClient} [client] - prisma hoặc tx
 * @returns {Promise<string[]>}
 */
async function nextAssetCodes(count, client = prisma) {
  const rows = await client.inventoryItem.findMany({
    where: { asset_code: { startsWith: PREFIX } },
    select: { asset_code: true },
  })
  let max = 0
  for (const { asset_code } of rows) {
    const n = parseInt(asset_code.slice(PREFIX.length), 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return Array.from({ length: count }, (_, i) => `${PREFIX}${String(max + 1 + i).padStart(4, '0')}`)
}

module.exports = { nextAssetCodes }
