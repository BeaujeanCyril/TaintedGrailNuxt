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

interface Campaign {
  id: number
  name: string
  locations: Location[]
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
  </div>
</template>
