const { prisma } = require('@/lib/prisma.js')
const { ApiError } = require('@/lib/ApiError.js')

function listAddresses(userId) {
  return prisma.address.findMany({
    where: { user_id: userId },
    orderBy: [{ is_default: 'desc' }, { created_at: 'asc' }],
  })
}

async function clearDefaults(userId, exceptId) {
  await prisma.address.updateMany({
    where: { user_id: userId, is_default: true, NOT: { id: exceptId } },
    data: { is_default: false },
  })
}

async function createAddress(userId, data) {
  const count = await prisma.address.count({ where: { user_id: userId } })
  const is_default = data.is_default || count === 0
  return prisma.$transaction(async (tx) => {
    if (is_default) {
      await tx.address.updateMany({
        where: { user_id: userId, is_default: true },
        data: { is_default: false },
      })
    }
    return tx.address.create({ data: { ...data, is_default, user_id: userId } })
  })
}

async function updateAddress(userId, id, data) {
  const addr = await prisma.address.findFirst({ where: { id, user_id: userId } })
  if (!addr) throw ApiError.notFound('Không tìm thấy địa chỉ')
  return prisma.$transaction(async (tx) => {
    if (data.is_default) {
      await tx.address.updateMany({
        where: { user_id: userId, is_default: true, NOT: { id } },
        data: { is_default: false },
      })
    }
    return tx.address.update({ where: { id }, data })
  })
}

async function deleteAddress(userId, id) {
  const addr = await prisma.address.findFirst({ where: { id, user_id: userId } })
  if (!addr) throw ApiError.notFound('Không tìm thấy địa chỉ')
  await prisma.address.delete({ where: { id } })
  return { ok: true }
}

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress }
