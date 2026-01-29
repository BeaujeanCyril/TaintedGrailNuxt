import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'campaignId') || '')
  const id = parseInt(getRouterParam(event, 'id') || '')
  const body = await readBody(event)

  if (isNaN(campaignId) || isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID invalide'
    })
  }

  // Vérifier que le lieu existe et appartient à la campagne
  const existing = await prisma.location.findFirst({
    where: { id, campaignId }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Lieu non trouve'
    })
  }

  // Si le numéro change, vérifier qu'il n'existe pas déjà
  if (body.number !== undefined && body.number !== existing.number) {
    const duplicate = await prisma.location.findFirst({
      where: {
        campaignId,
        number: body.number,
        NOT: { id }
      }
    })
    if (duplicate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Un lieu avec ce numero existe deja dans cette campagne'
      })
    }
  }

  const location = await prisma.location.update({
    where: { id },
    data: {
      number: body.number ?? existing.number,
      name: body.name ?? existing.name,
      dream: body.dream,
      nightmare: body.nightmare,
      hasMenhir: body.hasMenhir ?? existing.hasMenhir,
      menhirNote: body.menhirNote,
      notes: body.notes
    },
    include: {
      entries: {
        orderBy: { number: 'asc' }
      }
    }
  })

  return location
})
