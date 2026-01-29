import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') || '')
  const locationId = parseInt(getRouterParam(event, 'locationId') || '')
  const entryId = parseInt(getRouterParam(event, 'entryId') || '')
  const body = await readBody(event)

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

  // Si le numéro change, vérifier qu'il n'existe pas déjà
  if (body.number !== undefined && body.number !== existing.number) {
    const duplicate = await prisma.entry.findFirst({
      where: {
        locationId,
        number: body.number,
        NOT: { id: entryId }
      }
    })
    if (duplicate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Une entree avec ce numero existe deja pour ce lieu'
      })
    }
  }

  const entry = await prisma.entry.update({
    where: { id: entryId },
    data: {
      number: body.number ?? existing.number,
      info: body.info,
      status: body.status ?? existing.status
    }
  })

  return entry
})
