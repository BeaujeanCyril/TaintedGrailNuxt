import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  const body = await readBody(event)

  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID invalide'
    })
  }

  // Vérifier que le lieu existe
  const existing = await prisma.location.findUnique({
    where: { id }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Lieu non trouvé'
    })
  }

  // Si le numéro change, vérifier qu'il n'est pas déjà pris
  if (body.number && body.number !== existing.number) {
    const numberTaken = await prisma.location.findUnique({
      where: { number: body.number }
    })
    if (numberTaken) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Ce numéro de lieu existe déjà'
      })
    }
  }

  const location = await prisma.location.update({
    where: { id },
    data: {
      number: body.number ?? existing.number,
      name: body.name ?? existing.name,
      dreammare: body.dreammare !== undefined ? body.dreammare : existing.dreammare,
      hasMenhir: body.hasMenhir !== undefined ? body.hasMenhir : existing.hasMenhir,
      entries: body.entries !== undefined ? body.entries : existing.entries,
      status: body.status !== undefined ? body.status : existing.status,
      notes: body.notes !== undefined ? body.notes : existing.notes
    }
  })

  return location
})
