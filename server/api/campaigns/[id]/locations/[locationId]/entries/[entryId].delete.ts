import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') || '')
  const locationId = parseInt(getRouterParam(event, 'locationId') || '')
  const entryId = parseInt(getRouterParam(event, 'entryId') || '')

  if (isNaN(campaignId) || isNaN(locationId) || isNaN(entryId)) {
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
    where: { id: entryId, locationId }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Entree non trouvee'
    })
  }

  await prisma.entry.delete({
    where: { id: entryId }
  })

  return { success: true }
})
