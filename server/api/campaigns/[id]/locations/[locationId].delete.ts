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

  // Vérifier que le lieu existe et appartient à la campagne
  const existing = await prisma.location.findFirst({
    where: { id: locationId, campaignId }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Lieu non trouve'
    })
  }

  await prisma.location.delete({
    where: { id: locationId }
  })

  return { success: true }
})
