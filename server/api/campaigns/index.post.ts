import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom de la campagne est requis'
    })
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: body.name.trim()
    }
  })

  return campaign
})
