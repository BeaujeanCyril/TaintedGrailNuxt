import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')

  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID invalide'
    })
  }

  const location = await prisma.location.findUnique({
    where: { id }
  })

  if (!location) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Lieu non trouvé'
    })
  }

  return location
})
