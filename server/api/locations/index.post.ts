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
      dream: body.dream || null,
      nightmare: body.nightmare || null,
      hasMenhir: body.hasMenhir || false,
      menhirNote: body.menhirNote || null,
      notes: body.notes || null,
      entries: body.entries?.length ? {
        create: body.entries.map((e: { number: number, info?: string, status?: string }) => ({
          number: e.number,
          info: e.info || null,
          status: e.status || null
        }))
      } : undefined
    },
    include: {
      entries: {
        orderBy: { number: 'asc' }
      }
    }
  })

  return location
})
