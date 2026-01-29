import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const saveId = parseInt(getRouterParam(event, 'saveId') as string)

  await prisma.save.delete({
    where: { id: saveId }
  })

  return { success: true }
})
