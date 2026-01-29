import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')

  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID invalide'
    })
  }

  const existing = await prisma.campaign.findUnique({
    where: { id }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campagne non trouvee'
    })
  }

  await prisma.campaign.delete({
    where: { id }
  })

  return { success: true, message: 'Campagne supprimee' }
})
