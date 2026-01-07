import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const locations = await prisma.location.findMany({
    orderBy: { number: 'asc' }
  })
  return locations
})
