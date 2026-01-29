import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'campaignId') || '')
  const id = parseInt(getRouterParam(event, 'id') || '')

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

  await prisma.location.delete({
    where: { id }
  })

  return { success: true }
})
