import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') || '')

  if (isNaN(campaignId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID campagne invalide'
    })
  }

  const characters = await prisma.character.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'asc' }
  })

  return characters
})
