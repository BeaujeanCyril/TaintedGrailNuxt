import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  const body = await readBody(event)

  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID invalide'
    })
  }

  if (!body.name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom de la campagne est requis'
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

  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      name: body.name.trim()
    }
  })

  return campaign
})
