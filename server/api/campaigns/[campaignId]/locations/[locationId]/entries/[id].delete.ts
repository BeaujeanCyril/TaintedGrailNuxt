import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'campaignId') || '')
  const locationId = parseInt(getRouterParam(event, 'locationId') || '')
  const id = parseInt(getRouterParam(event, 'id') || '')

  if (isNaN(campaignId) || isNaN(locationId) || isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID invalide'
    })
  }

  // Vérifier que le lieu existe et appartient à la campagne
  const location = await prisma.location.findFirst({
    where: { id: locationId, campaignId }
  })

  if (!location) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Lieu non trouve'
    })
  }

  // Vérifier que l'entrée existe
  const existing = await prisma.entry.findFirst({
    where: { id, locationId }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Entree non trouvee'
    })
  }

  await prisma.entry.delete({
    where: { id }
  })

  return { success: true }
})
