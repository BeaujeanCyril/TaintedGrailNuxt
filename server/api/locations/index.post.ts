import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.number || !body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le numéro et le nom sont requis'
    })
  }

  // Vérifier si le numéro existe déjà
  const existing = await prisma.location.findUnique({
    where: { number: body.number }
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ce numéro de lieu existe déjà'
    })
  }

  const location = await prisma.location.create({
    data: {
      number: body.number,
      name: body.name,
      dreammare: body.dreammare || null,
      hasMenhir: body.hasMenhir || false,
      entries: body.entries || null,
      status: body.status || null,
      notes: body.notes || null
    }
  })

  return location
})
