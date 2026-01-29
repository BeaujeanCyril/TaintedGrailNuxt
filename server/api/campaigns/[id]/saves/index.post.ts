import prisma from '~/server/utils/prisma'

interface SaveCharacterInput {
  characterType: string
  playerName: string
  food: number
  wealth: number
  experience: number
  magic: number
  energy: number
  health: number
  terror: number
  locationNumber: number | null
}

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') as string)
  const body = await readBody<{
    name: string
    characters: SaveCharacterInput[]
  }>(event)

  if (!body.name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom de la sauvegarde est requis'
    })
  }

  const save = await prisma.save.create({
    data: {
      name: body.name.trim(),
      campaignId,
      characters: {
        create: body.characters.map(char => ({
          characterType: char.characterType,
          playerName: char.playerName,
          food: char.food,
          wealth: char.wealth,
          experience: char.experience,
          magic: char.magic,
          energy: char.energy,
          health: char.health,
          terror: char.terror,
          locationNumber: char.locationNumber
        }))
      }
    },
    include: {
      characters: true
    }
  })

  return save
})
