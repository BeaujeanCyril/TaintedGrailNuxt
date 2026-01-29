import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') || '')
  const characterId = parseInt(getRouterParam(event, 'characterId') || '')

  if (isNaN(campaignId) || isNaN(characterId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID invalide'
    })
  }

  // Verifier que le personnage existe et appartient a la campagne
  const existing = await prisma.character.findFirst({
    where: { id: characterId, campaignId }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnage non trouve'
    })
  }

  await prisma.character.delete({
    where: { id: characterId }
  })

  return { success: true }
})
