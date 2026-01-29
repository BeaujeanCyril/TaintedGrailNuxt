import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')

  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID invalide'
    })
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      locations: {
        include: {
          entries: {
            orderBy: { number: 'asc' }
          }
        },
        orderBy: { number: 'asc' }
      }
    }
  })

  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campagne non trouvee'
    })
  }

  return campaign
})
