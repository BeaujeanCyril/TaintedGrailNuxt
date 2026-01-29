<script setup lang="ts">
interface Entry {
  id?: number
  number: number
  info: string
  status: 'explored' | 'partial' | 'unknown' | null
}

interface Location {
  id: number
  number: number
  name: string
  dream: string | null
  nightmare: string | null
  hasMenhir: boolean
  menhirNote: string | null
  entries: Entry[]
  notes: string | null
}

interface Character {
  id: number
  characterType: string
  playerName: string
  food: number
  wealth: number
  experience: number
  magic: number
  energy: number
  health: number
  terror: number
}

interface Campaign {
  id: number
  name: string
  locations: Location[]
  characters: Character[]
}

interface StatusItem {
  id: number
  name: string
  checkboxCount: number
  checkedBoxes: string
  campaignStatusId: number | null
}

const route = useRoute()
const campaignId = computed(() => parseInt(route.params.id as string))

const campaign = ref<Campaign | null>(null)
const loading = ref(true)
const showModal = ref(false)
const editingLocation = ref<Location | null>(null)
const deleteConfirm = ref<Location | null>(null)
const searchQuery = ref('')

// Form data
const form = ref({
  number: 0,
  name: '',
  dream: '',
  nightmare: '',
  hasMenhir: false,
  menhirNote: '',
  entries: [] as Entry[],
  notes: ''
})

const formError = ref('')

// Character management
const showCharacterModal = ref(false)
const deleteCharacterConfirm = ref<Character | null>(null)
const characterForm = ref({
  characterType: '',
  playerName: ''
})
const characterFormError = ref('')
const charactersExpanded = ref(true)

// Valeurs initiales par personnage
const CHARACTER_DEFAULTS: Record<string, { energy: number; health: number }> = {
  Iunis: { energy: 6, health: 9 },
  Gerdwyn: { energy: 6, health: 8 },
  Elgan: { energy: 6, health: 7 },
  Osbert: { energy: 7, health: 5 }
}

const AVAILABLE_CHARACTERS = ['Iunis', 'Gerdwyn', 'Elgan', 'Osbert']

// Status management
const showStatusModal = ref(false)
const statuses = ref<StatusItem[]>([])
const statusLoading = ref(false)
const statusSearchQuery = ref('')

// Statuts filtres par recherche intelligente
const filteredStatuses = computed(() => {
  if (!statusSearchQuery.value.trim()) {
    return statuses.value
  }
  const query = statusSearchQuery.value.trim().toLowerCase()
  // Recherche intelligente: supprime les accents pour la comparaison
  const normalizeString = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const normalizedQuery = normalizeString(query)

  return statuses.value.filter((status: StatusItem) => {
    const normalizedName = normalizeString(status.name)
    return normalizedName.includes(normalizedQuery) || status.name.toLowerCase().includes(query)
  })
})

// Personnages disponibles (non encore dans la campagne)
const availableCharacterTypes = computed(() => {
  if (!campaign.value) return AVAILABLE_CHARACTERS
  const usedTypes = campaign.value.characters.map((c: Character) => c.characterType)
  return AVAILABLE_CHARACTERS.filter(t => !usedTypes.includes(t))
})

// Locations filtrees par recherche
const filteredLocations = computed(() => {
  if (!campaign.value?.locations) return []
  if (!searchQuery.value.trim()) {
    return campaign.value.locations
  }
  const query = searchQuery.value.trim().toLowerCase()
  return campaign.value.locations.filter(loc =>
    loc.number.toString().includes(query) ||
    loc.name.toLowerCase().includes(query)
  )
})

// Charger la campagne et ses lieux
async function loadCampaign() {
  loading.value = true
  try {
    campaign.value = await $fetch<Campaign>(`/api/campaigns/${campaignId.value}`)
  } catch (e: any) {
    if (e.statusCode === 404) {
      navigateTo('/')
    }
    console.error('Erreur chargement:', e)
  } finally {
    loading.value = false
  }
}

// Ouvrir le modal pour creer
function openCreateModal() {
  editingLocation.value = null
  form.value = {
    number: 0,
    name: '',
    dream: '',
    nightmare: '',
    hasMenhir: false,
    menhirNote: '',
    entries: [],
    notes: ''
  }
  formError.value = ''
  showModal.value = true
}

// Ouvrir le modal pour editer
function openEditModal(location: Location, event: Event) {
  event.stopPropagation()
  editingLocation.value = location
  form.value = {
    number: location.number,
    name: location.name,
    dream: location.dream || '',
    nightmare: location.nightmare || '',
    hasMenhir: location.hasMenhir,
    menhirNote: location.menhirNote || '',
    entries: location.entries.map(e => ({
      id: e.id,
      number: e.number,
      info: e.info || '',
      status: e.status
    })),
    notes: location.notes || ''
  }
  formError.value = ''
  showModal.value = true
}

// Ajouter une entree au formulaire
function addEntry() {
  form.value.entries.push({
    number: 0,
    info: '',
    status: null
  })
}

// Supprimer une entree du formulaire
function removeEntry(index: number) {
  form.value.entries.splice(index, 1)
}

// Sauvegarder (creer ou modifier)
async function saveLocation() {
  formError.value = ''

  if (!form.value.number || !form.value.name.trim()) {
    formError.value = 'Le numero et le nom sont requis'
    return
  }

  // Verifier que toutes les entrees ont un numero
  const invalidEntry = form.value.entries.find(e => !e.number)
  if (invalidEntry) {
    formError.value = 'Toutes les entrees doivent avoir un numero'
    return
  }

  try {
    const data = {
      number: form.value.number,
      name: form.value.name.trim(),
      dream: form.value.dream.trim() || null,
      nightmare: form.value.nightmare.trim() || null,
      hasMenhir: form.value.hasMenhir,
      menhirNote: form.value.hasMenhir ? (form.value.menhirNote.trim() || null) : null,
      entries: form.value.entries.map(e => ({
        number: e.number,
        info: e.info?.trim() || null,
        status: e.status
      })),
      notes: form.value.notes.trim() || null
    }

    if (editingLocation.value) {
      await $fetch(`/api/campaigns/${campaignId.value}/locations/${editingLocation.value.id}`, {
        method: 'PUT',
        body: data
      })
    } else {
      await $fetch(`/api/campaigns/${campaignId.value}/locations`, {
        method: 'POST',
        body: data
      })
    }

    showModal.value = false
    await loadCampaign()
  } catch (e: any) {
    formError.value = e.data?.statusMessage || 'Erreur lors de la sauvegarde'
  }
}

// Confirmer suppression
function confirmDelete(location: Location, event: Event) {
  event.stopPropagation()
  deleteConfirm.value = location
}

// Supprimer un lieu
async function deleteLocation() {
  if (!deleteConfirm.value) return

  try {
    await $fetch(`/api/campaigns/${campaignId.value}/locations/${deleteConfirm.value.id}`, {
      method: 'DELETE'
    })
    deleteConfirm.value = null
    await loadCampaign()
  } catch (e: any) {
    console.error('Erreur suppression:', e)
  }
}

// Naviguer vers le detail d'un lieu
function goToLocation(location: Location) {
  navigateTo(`/campaigns/${campaignId.value}/locations/${location.id}`)
}

// Compter les entrees explorees
function getExploredCount(entries: Entry[]) {
  return entries.filter(e => e.status === 'explored').length
}

// === Character Management ===

function openCharacterModal() {
  characterForm.value = {
    characterType: availableCharacterTypes.value[0] || '',
    playerName: ''
  }
  characterFormError.value = ''
  showCharacterModal.value = true
}

async function createCharacter() {
  characterFormError.value = ''

  if (!characterForm.value.characterType) {
    characterFormError.value = 'Choisissez un personnage'
    return
  }

  if (!characterForm.value.playerName.trim()) {
    characterFormError.value = 'Entrez votre prenom'
    return
  }

  try {
    await $fetch(`/api/campaigns/${campaignId.value}/characters`, {
      method: 'POST',
      body: {
        characterType: characterForm.value.characterType,
        playerName: characterForm.value.playerName.trim()
      }
    })
    showCharacterModal.value = false
    await loadCampaign()
  } catch (e: any) {
    characterFormError.value = e.data?.statusMessage || 'Erreur lors de la creation'
  }
}

async function updateCharacterStat(character: Character, stat: string, delta: number) {
  const newValue = (character as any)[stat] + delta
  if (newValue < 0) return

  try {
    await $fetch(`/api/campaigns/${campaignId.value}/characters/${character.id}`, {
      method: 'PUT',
      body: { [stat]: newValue }
    })
    await loadCampaign()
  } catch (e) {
    console.error('Erreur mise a jour:', e)
  }
}

async function deleteCharacter() {
  if (!deleteCharacterConfirm.value) return

  try {
    await $fetch(`/api/campaigns/${campaignId.value}/characters/${deleteCharacterConfirm.value.id}`, {
      method: 'DELETE'
    })
    deleteCharacterConfirm.value = null
    await loadCampaign()
  } catch (e) {
    console.error('Erreur suppression:', e)
  }
}

function getCharacterColor(type: string) {
  switch (type) {
    case 'Iunis': return 'from-blue-600 to-blue-800'
    case 'Gerdwyn': return 'from-emerald-600 to-emerald-800'
    case 'Elgan': return 'from-purple-600 to-purple-800'
    case 'Osbert': return 'from-orange-600 to-orange-800'
    default: return 'from-stone-600 to-stone-800'
  }
}

// === Status Management ===

async function openStatusModal() {
  showStatusModal.value = true
  statusSearchQuery.value = ''
  await loadStatuses()
}

async function loadStatuses() {
  statusLoading.value = true
  try {
    statuses.value = await $fetch<StatusItem[]>(`/api/campaigns/${campaignId.value}/statuses`)
  } catch (e) {
    console.error('Erreur chargement statuts:', e)
  } finally {
    statusLoading.value = false
  }
}

function isBoxChecked(status: StatusItem, boxNumber: number): boolean {
  if (!status.checkedBoxes) return false
  const checked = status.checkedBoxes.split(',').map(Number)
  return checked.includes(boxNumber)
}

async function toggleStatusBox(status: StatusItem, boxNumber: number) {
  const checked = status.checkedBoxes ? status.checkedBoxes.split(',').map(Number).filter(n => n > 0) : []

  let newChecked: number[]
  if (checked.includes(boxNumber)) {
    newChecked = checked.filter(n => n !== boxNumber)
  } else {
    newChecked = [...checked, boxNumber].sort((a, b) => a - b)
  }

  try {
    await $fetch(`/api/campaigns/${campaignId.value}/statuses/${status.id}`, {
      method: 'PUT',
      body: { checkedBoxes: newChecked.join(',') }
    })
    // Mettre a jour localement
    status.checkedBoxes = newChecked.join(',')
  } catch (e) {
    console.error('Erreur mise a jour statut:', e)
  }
}

onMounted(loadCampaign)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
    <!-- Header -->
    <header class="bg-stone-800/50 border-b border-stone-700 py-6">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between">
          <div>
            <NuxtLink
                to="/"
                class="text-stone-400 hover:text-amber-400 text-sm flex items-center gap-1 mb-2 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Campagnes
            </NuxtLink>
            <h1 class="text-3xl font-bold text-amber-400">{{ campaign?.name || 'Chargement...' }}</h1>
            <p class="text-stone-400 mt-1">Gestion des Lieux</p>
          </div>
          <div class="flex gap-3">
            <button
                @click="openStatusModal"
                class="px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Statuts
            </button>
            <button
                @click="openCreateModal"
                class="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nouveau Lieu
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="container mx-auto px-4 py-8">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <svg class="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <template v-else-if="campaign">
        <!-- Characters Section (Accordion) -->
        <div class="mb-8 bg-stone-800/40 rounded-xl border border-stone-700 overflow-hidden">
          <!-- Accordion Header -->
          <button
              @click="charactersExpanded = !charactersExpanded"
              class="w-full flex items-center justify-between p-4 hover:bg-stone-700/30 transition-colors"
          >
            <h2 class="text-xl font-bold text-amber-400 flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Personnages ({{ campaign.characters.length }}/4)
            </h2>
            <div class="flex items-center gap-3">
              <button
                  v-if="campaign.characters.length < 4"
                  @click.stop="openCharacterModal"
                  class="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
              </button>
              <svg
                  class="w-5 h-5 text-stone-400 transition-transform duration-200"
                  :class="{ 'rotate-180': charactersExpanded }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          <!-- Accordion Content -->
          <div
              v-show="charactersExpanded"
              class="p-4 pt-0"
          >
            <!-- No characters -->
            <div v-if="campaign.characters.length === 0" class="text-center py-8">
              <p class="text-stone-400">Aucun personnage dans cette campagne</p>
              <p class="text-stone-500 text-sm mt-1">Ajoutez jusqu'a 4 personnages</p>
            </div>

            <!-- Characters grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                  v-for="char in campaign.characters"
                  :key="char.id"
                class="relative bg-gradient-to-br rounded-xl p-4 border border-white/10"
                :class="getCharacterColor(char.characterType)"
            >
              <!-- Delete button -->
              <button
                  @click="deleteCharacterConfirm = char"
                  class="absolute top-2 right-2 p-1 text-white/50 hover:text-red-400 hover:bg-black/20 rounded transition-colors"
                  title="Supprimer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <!-- Character info -->
              <div class="mb-3">
                <h3 class="font-bold text-white text-lg">{{ char.characterType }}</h3>
                <p class="text-white/70 text-sm">{{ char.playerName }}</p>
              </div>

              <!-- Stats -->
              <div class="space-y-2 mb-3">
                <div class="flex items-center justify-between bg-black/20 rounded px-2 py-1">
                  <span class="text-xs text-white/70">Energie</span>
                  <div class="flex items-center gap-1">
                    <button @click="updateCharacterStat(char, 'energy', -1)" class="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/30 rounded">-</button>
                    <span class="w-6 text-center font-bold text-yellow-300">{{ char.energy }}</span>
                    <button @click="updateCharacterStat(char, 'energy', 1)" class="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/30 rounded">+</button>
                  </div>
                </div>
                <div class="flex items-center justify-between bg-black/20 rounded px-2 py-1">
                  <span class="text-xs text-white/70">Sante</span>
                  <div class="flex items-center gap-1">
                    <button @click="updateCharacterStat(char, 'health', -1)" class="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/30 rounded">-</button>
                    <span class="w-6 text-center font-bold text-red-300">{{ char.health }}</span>
                    <button @click="updateCharacterStat(char, 'health', 1)" class="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/30 rounded">+</button>
                  </div>
                </div>
                <div class="flex items-center justify-between bg-black/20 rounded px-2 py-1">
                  <span class="text-xs text-white/70">Terreur</span>
                  <div class="flex items-center gap-1">
                    <button @click="updateCharacterStat(char, 'terror', -1)" class="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/30 rounded">-</button>
                    <span class="w-6 text-center font-bold text-purple-300">{{ char.terror }}</span>
                    <button @click="updateCharacterStat(char, 'terror', 1)" class="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/30 rounded">+</button>
                  </div>
                </div>
              </div>

              <!-- Resources -->
              <div class="grid grid-cols-2 gap-1 text-xs">
                <div class="flex items-center justify-between bg-black/20 rounded px-2 py-1">
                  <span class="text-white/70">Nourr.</span>
                  <div class="flex items-center gap-1">
                    <button @click="updateCharacterStat(char, 'food', -1)" class="text-white/50 hover:text-white">-</button>
                    <span class="w-4 text-center text-white">{{ char.food }}</span>
                    <button @click="updateCharacterStat(char, 'food', 1)" class="text-white/50 hover:text-white">+</button>
                  </div>
                </div>
                <div class="flex items-center justify-between bg-black/20 rounded px-2 py-1">
                  <span class="text-white/70">Richesse</span>
                  <div class="flex items-center gap-1">
                    <button @click="updateCharacterStat(char, 'wealth', -1)" class="text-white/50 hover:text-white">-</button>
                    <span class="w-4 text-center text-white">{{ char.wealth }}</span>
                    <button @click="updateCharacterStat(char, 'wealth', 1)" class="text-white/50 hover:text-white">+</button>
                  </div>
                </div>
                <div class="flex items-center justify-between bg-black/20 rounded px-2 py-1">
                  <span class="text-white/70">Exp.</span>
                  <div class="flex items-center gap-1">
                    <button @click="updateCharacterStat(char, 'experience', -1)" class="text-white/50 hover:text-white">-</button>
                    <span class="w-4 text-center text-white">{{ char.experience }}</span>
                    <button @click="updateCharacterStat(char, 'experience', 1)" class="text-white/50 hover:text-white">+</button>
                  </div>
                </div>
                <div class="flex items-center justify-between bg-black/20 rounded px-2 py-1">
                  <span class="text-white/70">Magie</span>
                  <div class="flex items-center gap-1">
                    <button @click="updateCharacterStat(char, 'magic', -1)" class="text-white/50 hover:text-white">-</button>
                    <span class="w-4 text-center text-white">{{ char.magic }}</span>
                    <button @click="updateCharacterStat(char, 'magic', 1)" class="text-white/50 hover:text-white">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <!-- Locations Section -->
        <h2 class="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Lieux
        </h2>

        <!-- Search bar -->
        <div class="mb-6">
          <div class="relative max-w-md">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                v-model="searchQuery"
                type="text"
                placeholder="Rechercher par numero ou nom..."
                class="w-full pl-12 pr-4 py-3 bg-stone-800 border border-stone-700 rounded-lg focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="campaign.locations.length === 0" class="text-center py-16">
          <svg class="w-16 h-16 mx-auto text-stone-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p class="text-stone-400 text-lg">Aucun lieu enregistre</p>
          <p class="text-stone-500 mt-2">Commencez par ajouter votre premier lieu</p>
        </div>

        <!-- No results -->
        <div v-else-if="filteredLocations.length === 0" class="text-center py-16">
          <p class="text-stone-400 text-lg">Aucun lieu trouve pour "{{ searchQuery }}"</p>
        </div>

        <!-- Locations Grid (clickable cards) -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
              v-for="location in filteredLocations"
              :key="location.id"
              @click="goToLocation(location)"
              class="group relative bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700 hover:border-amber-500/50 rounded-xl p-5 text-left transition-all duration-200"
          >
            <!-- Actions -->
            <div class="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                  @click="openEditModal(location, $event)"
                  class="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-600 rounded-lg transition-colors"
                  title="Modifier"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                  @click="confirmDelete(location, $event)"
                  class="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-600 rounded-lg transition-colors"
                  title="Supprimer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <!-- Number badge -->
            <div class="flex items-start gap-3 mb-3">
              <span class="px-3 py-1 bg-amber-600/30 text-amber-400 rounded-lg font-bold text-lg">
                #{{ location.number }}
              </span>
            </div>

            <!-- Name -->
            <h3 class="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors mb-3">
              {{ location.name }}
            </h3>

            <!-- Indicators -->
            <div class="flex flex-wrap gap-2 mb-3">
              <span v-if="location.hasMenhir" class="px-2 py-1 bg-emerald-900/40 text-emerald-400 rounded text-xs flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Menhir
              </span>
              <span v-if="location.dream" class="px-2 py-1 bg-blue-900/40 text-blue-400 rounded text-xs">
                Reve
              </span>
              <span v-if="location.nightmare" class="px-2 py-1 bg-purple-900/40 text-purple-400 rounded text-xs">
                Cauchemar
              </span>
            </div>

            <!-- Entries count -->
            <div class="flex items-center justify-between text-sm">
              <span v-if="location.entries.length" class="text-stone-400">
                {{ getExploredCount(location.entries) }}/{{ location.entries.length }} entrees explorees
              </span>
              <span v-else class="text-stone-500">Aucune entree</span>

              <!-- Arrow -->
              <svg class="w-5 h-5 text-stone-500 group-hover:text-amber-400 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>

            <!-- Notes preview -->
            <p v-if="location.notes" class="mt-2 text-xs text-stone-500 truncate">
              {{ location.notes }}
            </p>
          </button>
        </div>

        <!-- Stats -->
        <div v-if="campaign.locations.length" class="mt-6 text-sm text-stone-500">
          {{ campaign.locations.length }} lieu(x) enregistre(s)
        </div>
      </template>
    </main>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div
          v-if="showModal"
          class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          @click.self="showModal = false"
      >
        <div class="bg-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-stone-700">
            <h2 class="text-xl font-bold text-amber-400">
              {{ editingLocation ? 'Modifier le lieu' : 'Nouveau lieu' }}
            </h2>
          </div>

          <form @submit.prevent="saveLocation" class="p-6 space-y-5">
            <!-- Error -->
            <div v-if="formError" class="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {{ formError }}
            </div>

            <!-- Number & Name -->
            <div class="grid grid-cols-4 gap-4">
              <div>
                <label class="block text-sm font-medium text-stone-400 mb-2">Numero *</label>
                <input
                    v-model.number="form.number"
                    type="number"
                    min="1"
                    class="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none"
                    required
                />
              </div>
              <div class="col-span-3">
                <label class="block text-sm font-medium text-stone-400 mb-2">Nom *</label>
                <input
                    v-model="form.name"
                    type="text"
                    class="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none"
                    placeholder="Nom du lieu"
                    required
                />
              </div>
            </div>

            <!-- Dream / Nightmare -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-blue-400 mb-2">Reve</label>
                <textarea
                    v-model="form.dream"
                    rows="2"
                    class="w-full px-4 py-3 bg-blue-900/20 border border-blue-800 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Information du reve..."
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-purple-400 mb-2">Cauchemar</label>
                <textarea
                    v-model="form.nightmare"
                    rows="2"
                    class="w-full px-4 py-3 bg-purple-900/20 border border-purple-800 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                    placeholder="Information du cauchemar..."
                ></textarea>
              </div>
            </div>

            <!-- Menhir -->
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                    v-model="form.hasMenhir"
                    type="checkbox"
                    class="w-5 h-5 rounded text-emerald-600 bg-stone-700 border-stone-600"
                />
                <span>Presence d'un Menhir</span>
              </label>
              <div v-if="form.hasMenhir">
                <input
                    v-model="form.menhirNote"
                    type="text"
                    class="w-full px-4 py-3 bg-emerald-900/20 border border-emerald-800 rounded-lg focus:border-emerald-500 focus:outline-none"
                    placeholder="Note sur le menhir..."
                />
              </div>
            </div>

            <!-- Entries -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-stone-400">Entrees</label>
                <button
                    type="button"
                    @click="addEntry"
                    class="px-3 py-1 text-sm bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter
                </button>
              </div>

              <div v-if="form.entries.length === 0" class="text-center py-4 text-stone-500 text-sm bg-stone-700/30 rounded-lg">
                Aucune entree. Cliquez sur "Ajouter" pour en creer une.
              </div>

              <div v-for="(entry, index) in form.entries" :key="index" class="bg-stone-700/50 rounded-lg p-4 space-y-3">
                <div class="flex items-center gap-3">
                  <div class="w-24">
                    <label class="block text-xs text-stone-500 mb-1">Numero</label>
                    <input
                        v-model.number="entry.number"
                        type="number"
                        min="1"
                        class="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
                        placeholder="#"
                    />
                  </div>
                  <div class="flex-1">
                    <label class="block text-xs text-stone-500 mb-1">Status</label>
                    <select
                        v-model="entry.status"
                        class="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
                    >
                      <option :value="null">Non defini</option>
                      <option value="explored">Explore</option>
                      <option value="partial">Partiel</option>
                      <option value="unknown">Inconnu</option>
                    </select>
                  </div>
                  <button
                      type="button"
                      @click="removeEntry(index)"
                      class="mt-5 p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Supprimer"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div>
                  <label class="block text-xs text-stone-500 mb-1">Information</label>
                  <input
                      v-model="entry.info"
                      type="text"
                      class="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
                      placeholder="Description de l'entree..."
                  />
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-stone-400 mb-2">Notes</label>
              <textarea
                  v-model="form.notes"
                  rows="3"
                  class="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none resize-none"
                  placeholder="Notes sur ce lieu..."
              ></textarea>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-4">
              <button
                  type="button"
                  @click="showModal = false"
                  class="flex-1 px-6 py-3 bg-stone-700 hover:bg-stone-600 rounded-lg font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                  type="submit"
                  class="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-semibold transition-colors"
              >
                {{ editingLocation ? 'Modifier' : 'Creer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
          v-if="deleteConfirm"
          class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          @click.self="deleteConfirm = null"
      >
        <div class="bg-stone-800 rounded-2xl w-full max-w-md p-6">
          <h2 class="text-xl font-bold text-red-400 mb-4">Supprimer ce lieu ?</h2>
          <p class="text-stone-300 mb-6">
            Etes-vous sur de vouloir supprimer
            <span class="font-semibold text-amber-400">#{{ deleteConfirm.number }} - {{ deleteConfirm.name }}</span> ?
            Cette action est irreversible.
          </p>
          <div class="flex gap-3">
            <button
                @click="deleteConfirm = null"
                class="flex-1 px-6 py-3 bg-stone-700 hover:bg-stone-600 rounded-lg font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
                @click="deleteLocation"
                class="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Add Character Modal -->
    <Teleport to="body">
      <div
          v-if="showCharacterModal"
          class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          @click.self="showCharacterModal = false"
      >
        <div class="bg-stone-800 rounded-2xl w-full max-w-md">
          <div class="p-6 border-b border-stone-700">
            <h2 class="text-xl font-bold text-amber-400">Ajouter un personnage</h2>
          </div>

          <form @submit.prevent="createCharacter" class="p-6 space-y-5">
            <div v-if="characterFormError" class="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {{ characterFormError }}
            </div>

            <!-- Character type selection -->
            <div>
              <label class="block text-sm font-medium text-stone-400 mb-3">Personnage *</label>
              <div class="grid grid-cols-2 gap-3">
                <button
                    v-for="charType in availableCharacterTypes"
                    :key="charType"
                    type="button"
                    @click="characterForm.characterType = charType"
                    class="p-4 rounded-xl border-2 transition-all text-left"
                    :class="characterForm.characterType === charType
                      ? 'border-amber-500 bg-amber-500/20'
                      : 'border-stone-600 hover:border-stone-500 bg-stone-700/50'"
                >
                  <div class="font-bold text-white">{{ charType }}</div>
                  <div class="text-xs text-stone-400 mt-1">
                    E:{{ CHARACTER_DEFAULTS[charType].energy }} S:{{ CHARACTER_DEFAULTS[charType].health }} T:0
                  </div>
                </button>
              </div>
              <p v-if="availableCharacterTypes.length === 0" class="text-stone-500 text-sm mt-2">
                Tous les personnages sont deja dans la campagne
              </p>
            </div>

            <!-- Player name -->
            <div>
              <label class="block text-sm font-medium text-stone-400 mb-2">Votre prenom *</label>
              <input
                  v-model="characterForm.playerName"
                  type="text"
                  class="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none"
                  placeholder="Ex: Cyril"
                  required
              />
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button
                  type="button"
                  @click="showCharacterModal = false"
                  class="flex-1 px-6 py-3 bg-stone-700 hover:bg-stone-600 rounded-lg font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                  type="submit"
                  :disabled="!characterForm.characterType"
                  class="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                Ajouter
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Character Confirmation Modal -->
    <Teleport to="body">
      <div
          v-if="deleteCharacterConfirm"
          class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          @click.self="deleteCharacterConfirm = null"
      >
        <div class="bg-stone-800 rounded-2xl w-full max-w-md p-6">
          <h2 class="text-xl font-bold text-red-400 mb-4">Supprimer ce personnage ?</h2>
          <p class="text-stone-300 mb-6">
            Etes-vous sur de vouloir supprimer
            <span class="font-semibold text-amber-400">{{ deleteCharacterConfirm.characterType }}</span>
            ({{ deleteCharacterConfirm.playerName }}) ?
          </p>
          <div class="flex gap-3">
            <button
                @click="deleteCharacterConfirm = null"
                class="flex-1 px-6 py-3 bg-stone-700 hover:bg-stone-600 rounded-lg font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
                @click="deleteCharacter"
                class="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Status Modal -->
    <Teleport to="body">
      <div
          v-if="showStatusModal"
          class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          @click.self="showStatusModal = false"
      >
        <div class="bg-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <!-- Header fixe -->
          <div class="sticky top-0 bg-stone-800 rounded-t-2xl border-b border-stone-700 z-10">
            <div class="p-6 flex items-center justify-between">
              <h2 class="text-xl font-bold text-purple-400 flex items-center gap-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Statuts de la campagne
              </h2>
              <button
                  @click="showStatusModal = false"
                  class="p-2 text-stone-400 hover:text-white hover:bg-stone-700 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Champ de recherche -->
            <div class="px-6 pb-4">
              <div class="relative">
                <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    v-model="statusSearchQuery"
                    type="text"
                    placeholder="Rechercher un statut..."
                    class="w-full pl-12 pr-4 py-3 bg-stone-700 border border-stone-600 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <button
                    v-if="statusSearchQuery"
                    @click="statusSearchQuery = ''"
                    class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-white"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Contenu scrollable -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- Loading -->
            <div v-if="statusLoading" class="flex justify-center py-8">
              <svg class="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <!-- Empty state -->
            <div v-else-if="statuses.length === 0" class="text-center py-8 text-stone-400">
              Aucun statut disponible
            </div>

            <!-- No results -->
            <div v-else-if="filteredStatuses.length === 0" class="text-center py-8 text-stone-400">
              Aucun statut trouve pour "{{ statusSearchQuery }}"
            </div>

            <!-- Status table -->
            <table v-else class="w-full">
              <thead>
                <tr class="border-b border-stone-700">
                  <th class="text-left py-3 px-4 text-stone-400 font-medium">Nom du statut</th>
                  <th class="text-left py-3 px-4 text-stone-400 font-medium">Progression</th>
                </tr>
              </thead>
              <tbody>
                <tr
                    v-for="status in filteredStatuses"
                    :key="status.id"
                    class="border-b border-stone-700/50 hover:bg-stone-700/30"
                >
                  <td class="py-4 px-4">
                    <span class="font-medium text-white">{{ status.name }}</span>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex items-center gap-2 flex-wrap">
                      <button
                          v-for="n in status.checkboxCount"
                          :key="n"
                          @click="toggleStatusBox(status, n)"
                          class="w-8 h-8 rounded border-2 flex items-center justify-center transition-all"
                          :class="isBoxChecked(status, n)
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-stone-700 border-stone-600 text-stone-500 hover:border-purple-500'"
                      >
                        <span v-if="isBoxChecked(status, n)">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span v-else class="text-xs">{{ n }}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Compteur de resultats -->
            <div v-if="!statusLoading && statuses.length > 0" class="mt-4 text-sm text-stone-500 text-center">
              {{ filteredStatuses.length }} / {{ statuses.length }} statut(s)
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
