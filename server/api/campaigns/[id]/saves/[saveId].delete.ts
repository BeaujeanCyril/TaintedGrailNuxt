import prisma from '~/server/utils/prisma'
import { broadcast } from '~/server/utils/wsHub'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') as string)
  const saveId = parseInt(getRouterParam(event, 'saveId') as string)

  await prisma.save.delete({
    where: { id: saveId }
  })

  broadcast(campaignId, { type: 'save.deleted', data: { id: saveId } })
  return { success: true }
})
