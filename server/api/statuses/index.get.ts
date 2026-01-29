import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const statuses = await prisma.status.findMany({
    orderBy: { name: 'asc' }
  })
  return statuses
})
