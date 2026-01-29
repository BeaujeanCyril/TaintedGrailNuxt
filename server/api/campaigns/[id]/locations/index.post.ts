import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') || '')
  const body = await readBody(event)

  if (isNaN(campaignId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de campagne invalide'
    })
  }

  if (!body.number || !body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le numero et le nom sont requis'
    })
  }

  // Verifier que la campagne existe
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId }
  })

  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campagne non trouvee'
    })
  }

  // Verifier si le numero existe deja dans cette campagne
  const existing = await prisma.location.findUnique({
    where: {
      campaignId_number: {
        campaignId,
        number: body.number
      }
    }
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ce numero de lieu existe deja dans cette campagne'
    })
  }

  const location = await prisma.location.create({
    data: {
      campaignId,
      number: body.number,
      name: body.name,
      dream: body.dream || null,
      nightmare: body.nightmare || null,
      hasMenhir: body.hasMenhir || false,
      menhirNote: body.menhirNote || null,
      notes: body.notes || null,
      entries: body.entries?.length ? {
        create: body.entries.map((e: { number: number, info?: string, status?: string }) => ({
          number: e.number,
          info: e.info || null,
          status: e.status || null
        }))
      } : undefined
    },
    include: {
      entries: {
        orderBy: { number: 'asc' }
      }
    }
  })

  return location
})
