import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') || '')
  const locationId = parseInt(getRouterParam(event, 'locationId') || '')
  const body = await readBody(event)

  if (isNaN(campaignId) || isNaN(locationId)) {
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

  // Vérifier qu'une entrée avec ce numéro n'existe pas déjà
  const existing = await prisma.entry.findFirst({
    where: {
      locationId,
      number: body.number
    }
  })

  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Une entree avec ce numero existe deja pour ce lieu'
    })
  }

  const entry = await prisma.entry.create({
    data: {
      number: body.number,
      info: body.info || null,
      status: body.status || 'unknown',
      locationId
    }
  })

  return entry
})
