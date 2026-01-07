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

  // Mise a jour du lieu
  const location = await prisma.location.update({
    where: { id },
    data: {
      number: body.number ?? existing.number,
      name: body.name ?? existing.name,
      dream: body.dream !== undefined ? body.dream : existing.dream,
      nightmare: body.nightmare !== undefined ? body.nightmare : existing.nightmare,
      hasMenhir: body.hasMenhir !== undefined ? body.hasMenhir : existing.hasMenhir,
      menhirNote: body.menhirNote !== undefined ? body.menhirNote : existing.menhirNote,
      notes: body.notes !== undefined ? body.notes : existing.notes
    }
  })

  // Mise a jour des entrees si fournies
  if (body.entries !== undefined) {
    // Supprimer les anciennes entrees
    await prisma.entry.deleteMany({
      where: { locationId: id }
    })

    // Creer les nouvelles entrees
    if (body.entries?.length) {
      await prisma.entry.createMany({
        data: body.entries.map((e: { number: number, info?: string, status?: string }) => ({
          locationId: id,
          number: e.number,
          info: e.info || null,
          status: e.status || null
        }))
      })
    }
  }

  // Retourner le lieu avec ses entrees
  const result = await prisma.location.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: { number: 'asc' }
      }
    }
  })

  return result
})
