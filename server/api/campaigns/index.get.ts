import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const campaigns = await prisma.campaign.findMany({
    include: {
      _count: {
        select: { locations: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
  return campaigns
})
