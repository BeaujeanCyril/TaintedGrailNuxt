import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') || '')
  const locationId = parseInt(getRouterParam(event, 'locationId') || '')

  if (isNaN(campaignId) || isNaN(locationId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID invalide'
    })
  }

  const location = await prisma.location.findFirst({
    where: {
      id: locationId,
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
