import prisma from '~/server/utils/prisma'
import { broadcast } from '~/server/utils/wsHub'

// Met à jour la progression d'un chapitre (1-10) avec un nombre de parts (0-6).
export default defineEventHandler(async (event) => {
  const campaignId = parseInt(getRouterParam(event, 'id') || '')
  const body = await readBody(event)
  const chapter = Number(body?.chapter)
  const slices = Number(body?.slices)

  if (isNaN(campaignId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID campagne invalide' })
  }
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 10) {
    throw createError({ statusCode: 400, statusMessage: 'Chapitre invalide (1-10)' })
  }
  if (!Number.isInteger(slices) || slices < 0 || slices > 6) {
    throw createError({ statusCode: 400, statusMessage: 'Parts invalides (0-6)' })
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
  if (!campaign) {
    throw createError({ statusCode: 404, statusMessage: 'Campagne non trouvée' })
  }

  // Parse, met à jour la position chapter-1, re-serialize
  const arr = (campaign.chapterSlices || '0,0,0,0,0,0,0,0,0,0').split(',').map(s => {
    const n = parseInt(s)
    return isNaN(n) ? 0 : Math.max(0, Math.min(6, n))
  })
  while (arr.length < 10) arr.push(0)
  arr[chapter - 1] = slices

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: { chapterSlices: arr.slice(0, 10).join(',') }
  })

  broadcast(campaignId, { type: 'chapter.updated', data: { chapter, slices, chapterSlices: updated.chapterSlices } })
  return updated
})
