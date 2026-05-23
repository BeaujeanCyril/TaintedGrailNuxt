<script setup lang="ts">
import { useCampaignSync } from '~/composables/useCampaignSync'

interface CampaignDto {
  id: number
  name: string
  chapterSlices: string
}

const route = useRoute()
const campaignId = computed(() => parseInt(route.params.id as string))

const campaign = ref<CampaignDto | null>(null)
const loading = ref(true)
const saving = ref<number | null>(null)

const TOTAL_CHAPTERS = 10
const SLICES_PER_CHAPTER = 6

const slices = computed<number[]>(() => {
  const raw = campaign.value?.chapterSlices || '0,0,0,0,0,0,0,0,0,0'
  const arr = raw.split(',').map(s => {
    const n = parseInt(s)
    return isNaN(n) ? 0 : Math.max(0, Math.min(SLICES_PER_CHAPTER, n))
  })
  while (arr.length < TOTAL_CHAPTERS) arr.push(0)
  return arr.slice(0, TOTAL_CHAPTERS)
})

async function loadCampaign() {
  loading.value = true
  try {
    campaign.value = await $fetch<CampaignDto>(`/api/campaigns/${campaignId.value}`)
  } catch (e: any) {
    if (e.statusCode === 404) navigateTo('/')
  } finally {
    loading.value = false
  }
}

async function setSlices(chapter: number, value: number) {
  if (saving.value !== null) return
  const safe = Math.max(0, Math.min(SLICES_PER_CHAPTER, value))
  saving.value = chapter
  try {
    campaign.value = await $fetch<CampaignDto>(`/api/campaigns/${campaignId.value}/chapters`, {
      method: 'PUT',
      body: { chapter, slices: safe }
    })
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = null
  }
}

function increment(i: number) {
  setSlices(i + 1, slices.value[i] + 1)
}
function decrement(i: number) {
  setSlices(i + 1, slices.value[i] - 1)
}

// === WebSocket synchro temps reel ===
const sync = useCampaignSync(campaignId.value)
onMounted(async () => {
  await loadCampaign()
  sync.on('chapter.updated', () => loadCampaign())
  sync.on('campaign.updated', () => loadCampaign())
  sync.connect()
})
onUnmounted(() => sync.disconnect())

// Construit les paths SVG des 6 pointes pour un cercle au centre (cx,cy) rayon r.
// Retourne un tableau de strings "d" pour <path>.
function sliceSegments(cx: number, cy: number, r: number, count: number): string[] {
  const paths: string[] = []
  const step = (Math.PI * 2) / count
  for (let i = 0; i < count; i++) {
    const a0 = -Math.PI / 2 + i * step
    const a1 = a0 + step
    const x0 = cx + Math.cos(a0) * r
    const y0 = cy + Math.sin(a0) * r
    const x1 = cx + Math.cos(a1) * r
    const y1 = cy + Math.sin(a1) * r
    paths.push(`M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`)
  }
  return paths
}

const segments = sliceSegments(50, 50, 45, SLICES_PER_CHAPTER)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
    <div class="max-w-5xl mx-auto p-6">
      <!-- Header -->
      <header class="flex items-center justify-between mb-6">
        <NuxtLink :to="`/campaigns/${campaignId}`" class="text-amber-400 hover:text-amber-300 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à la campagne
        </NuxtLink>
        <h1 class="text-2xl font-bold text-amber-400">🧀 Chapitres</h1>
        <div class="w-32"></div>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-16">
        <svg class="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      </div>

      <!-- Cheeses grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="(value, i) in slices"
          :key="i"
          class="bg-stone-800/60 border border-stone-700 rounded-xl p-4 flex flex-col items-center"
        >
          <div class="text-sm font-semibold text-stone-300 mb-2">Chapitre {{ i + 1 }}</div>

          <!-- Fromage SVG -->
          <svg viewBox="0 0 100 100" class="w-24 h-24">
            <path
              v-for="(d, idx) in segments"
              :key="idx"
              :d="d"
              :fill="idx < value ? '#f59e0b' : '#44403c'"
              stroke="#1c1917"
              stroke-width="1.5"
              class="transition-colors"
            />
          </svg>

          <div class="text-xs text-stone-400 mt-2 mb-3">{{ value }} / {{ SLICES_PER_CHAPTER }}</div>

          <!-- Controls -->
          <div class="flex gap-2">
            <button
              type="button"
              :disabled="value <= 0 || saving === i + 1"
              class="w-9 h-9 flex items-center justify-center rounded-lg bg-red-600/30 text-red-300 hover:bg-red-600/50 transition-colors text-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              title="Retirer une part"
              @click="decrement(i)"
            >−</button>
            <button
              type="button"
              :disabled="value >= SLICES_PER_CHAPTER || saving === i + 1"
              class="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 transition-colors text-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              title="Ajouter une part"
              @click="increment(i)"
            >+</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
