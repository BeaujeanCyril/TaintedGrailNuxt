import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') || '')
  const statusId = parseInt(getRouterParam(event, 'statusId') || '')
  const body = await readBody(event)

  if (isNaN(campaignId) || isNaN(statusId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID invalide'
    })
  }

  // Verifier que le statut existe
  const status = await prisma.status.findUnique({
    where: { id: statusId }
  })

  if (!status) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Statut non trouve'
    })
  }

  // Valider les checkbox (doivent etre entre 1 et checkboxCount)
  const checkedBoxes = body.checkedBoxes || ''
  if (checkedBoxes) {
    const boxes = checkedBoxes.split(',').map(Number).filter((n: number) => !isNaN(n))
    const invalid = boxes.some((n: number) => n < 1 || n > status.checkboxCount)
    if (invalid) {
      throw createError({
        statusCode: 400,
        statusMessage: `Les numeros de checkbox doivent etre entre 1 et ${status.checkboxCount}`
      })
    }
  }

  // Upsert le statut de campagne
  const campaignStatus = await prisma.campaignStatus.upsert({
    where: {
      campaignId_statusId: {
        campaignId,
        statusId
      }
    },
    update: {
      checkedBoxes
    },
    create: {
      campaignId,
      statusId,
      checkedBoxes
    }
  })

  return campaignStatus
})
