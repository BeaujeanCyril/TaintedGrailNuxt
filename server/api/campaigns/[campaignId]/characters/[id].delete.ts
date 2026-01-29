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

  // Verifier que le personnage existe et appartient a la campagne
  const existing = await prisma.character.findFirst({
    where: { id, campaignId }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnage non trouve'
    })
  }

  await prisma.character.delete({
    where: { id }
  })

  return { success: true }
})
