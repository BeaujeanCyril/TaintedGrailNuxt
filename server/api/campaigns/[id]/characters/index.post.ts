import prisma from '~/server/utils/prisma'

// Valeurs initiales par type de personnage
const CHARACTER_DEFAULTS: Record<string, { energy: number; health: number }> = {
  Iunis: { energy: 6, health: 9 },
  Gerdwyn: { energy: 6, health: 8 },
  Elgan: { energy: 6, health: 7 },
  Osbert: { energy: 7, health: 5 }
}

const VALID_CHARACTERS = ['Iunis', 'Gerdwyn', 'Elgan', 'Osbert']

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') || '')
  const body = await readBody(event)

  if (isNaN(campaignId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID campagne invalide'
    })
  }

  // Valider le type de personnage
  if (!body.characterType || !VALID_CHARACTERS.includes(body.characterType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Type de personnage invalide. Choisir parmi: Iunis, Gerdwyn, Elgan, Osbert'
    })
  }

  // Valider le prenom
  if (!body.playerName?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le prenom du joueur est requis'
    })
  }

  // Verifier que la campagne existe
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { characters: true }
  })

  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campagne non trouvee'
    })
  }

  // Verifier qu'il n'y a pas deja 4 personnages
  if (campaign.characters.length >= 4) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Une campagne ne peut avoir que 4 personnages maximum'
    })
  }

  // Verifier que ce type de personnage n'est pas deja pris
  const existingCharacter = campaign.characters.find(c => c.characterType === body.characterType)
  if (existingCharacter) {
    throw createError({
      statusCode: 400,
      statusMessage: `${body.characterType} est deja dans cette campagne`
    })
  }

  // Obtenir les valeurs par defaut pour ce personnage
  const defaults = CHARACTER_DEFAULTS[body.characterType]

  const character = await prisma.character.create({
    data: {
      characterType: body.characterType,
      playerName: body.playerName.trim(),
      energy: defaults.energy,
      health: defaults.health,
      terror: 0,
      food: 0,
      wealth: 0,
      experience: 0,
      magic: 0,
      campaignId
    }
  })

  return character
})
