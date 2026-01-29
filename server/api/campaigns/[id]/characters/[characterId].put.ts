import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') || '')
  const characterId = parseInt(getRouterParam(event, 'characterId') || '')
  const body = await readBody(event)

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

  // Mettre a jour uniquement les champs fournis
  const character = await prisma.character.update({
    where: { id: characterId },
    data: {
      playerName: body.playerName?.trim() ?? existing.playerName,
      // Ressources
      food: body.food ?? existing.food,
      wealth: body.wealth ?? existing.wealth,
      experience: body.experience ?? existing.experience,
      magic: body.magic ?? existing.magic,
      // Stats
      energy: body.energy ?? existing.energy,
      health: body.health ?? existing.health,
      terror: body.terror ?? existing.terror
    }
  })

  return character
})
