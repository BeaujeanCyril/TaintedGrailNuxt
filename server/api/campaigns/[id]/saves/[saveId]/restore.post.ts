import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') as string)
  const saveId = parseInt(getRouterParam(event, 'saveId') as string)

  // Récupérer la sauvegarde avec ses personnages
  const save = await prisma.save.findUnique({
    where: { id: saveId },
    include: { characters: true }
  })

  if (!save) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Sauvegarde non trouvée'
    })
  }

  // Restaurer chaque personnage
  for (const savedChar of save.characters) {
    await prisma.character.updateMany({
      where: {
        campaignId,
        characterType: savedChar.characterType
      },
      data: {
        food: savedChar.food,
        wealth: savedChar.wealth,
        experience: savedChar.experience,
        magic: savedChar.magic,
        energy: savedChar.energy,
        health: savedChar.health,
        terror: savedChar.terror
      }
    })
  }

  return { success: true, restoredFrom: save.name }
})
