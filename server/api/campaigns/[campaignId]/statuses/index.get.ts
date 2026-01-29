import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'campaignId') || '')

  if (isNaN(campaignId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID campagne invalide'
    })
  }

  // Recuperer tous les statuts globaux
  const allStatuses = await prisma.status.findMany({
    orderBy: { name: 'asc' }
  })

  // Recuperer les statuts de la campagne
  const campaignStatuses = await prisma.campaignStatus.findMany({
    where: { campaignId }
  })

  // Combiner les donnees
  const result = allStatuses.map(status => {
    const campaignStatus = campaignStatuses.find(cs => cs.statusId === status.id)
    return {
      id: status.id,
      name: status.name,
      checkboxCount: status.checkboxCount,
      checkedBoxes: campaignStatus?.checkedBoxes || '',
      campaignStatusId: campaignStatus?.id || null
    }
  })

  return result
})
