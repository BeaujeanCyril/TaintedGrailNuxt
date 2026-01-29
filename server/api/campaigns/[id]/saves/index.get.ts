import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') as string)

  const saves = await prisma.save.findMany({
    where: { campaignId },
    include: {
      characters: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return saves
})
