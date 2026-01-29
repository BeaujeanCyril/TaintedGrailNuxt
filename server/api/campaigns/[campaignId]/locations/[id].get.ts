import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'campaignId') || '')
  const id = parseInt(getRouterParam(event, 'id') || '')

  if (isNaN(campaignId) || isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID invalide'
    })
  }

  const location = await prisma.location.findFirst({
    where: {
      id,
      campaignId
    },
    include: {
      entries: {
        orderBy: { number: 'asc' }
      }
    }
  })

  if (!location) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Lieu non trouve'
    })
  }

  return location
})
