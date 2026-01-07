import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const locations = await prisma.location.findMany({
    include: {
      entries: {
        orderBy: { number: 'asc' }
      }
    },
    orderBy: { number: 'asc' }
  })
  return locations
})
