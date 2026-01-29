<script setup lang="ts">
interface Entry {
  id: number
  number: number
  info: string | null
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

const route = useRoute()
const campaignId = computed(() => parseInt(route.params.id as string))
const locationId = computed(() => parseInt(route.params.locationId as string))

const location = ref<Location | null>(null)
const loading = ref(true)

// Entry editing
const editingEntry = ref<Entry | null>(null)
const showEntryModal = ref(false)
const entryForm = ref({
  number: 0,
  info: '',
  status: null as 'explored' | 'partial' | 'unknown' | null
})
const entryFormError = ref('')
const deleteEntryConfirm = ref<Entry | null>(null)

// Charger le lieu
async function loadLocation() {
  loading.value = true
  try {
    location.value = await $fetch<Location>(`/api/campaigns/${campaignId.value}/locations/${locationId.value}`)
  } catch (e: any) {
    if (e.statusCode === 404) {
      navigateTo(`/campaigns/${campaignId.value}`)
    }
    console.error('Erreur chargement:', e)
  } finally {
    loading.value = false
  }
}

// Ouvrir modal pour creer entree
function openCreateEntryModal() {
  editingEntry.value = null
  entryForm.value = {
    number: 0,
    info: '',
    status: null
  }
  entryFormError.value = ''
  showEntryModal.value = true
}

// Ouvrir modal pour editer entree
function openEditEntryModal(entry: Entry) {
  editingEntry.value = entry
  entryForm.value = {
    number: entry.number,
    info: entry.info || '',
    status: entry.status
  }
  entryFormError.value = ''
  showEntryModal.value = true
}

// Sauvegarder entree
async function saveEntry() {
  entryFormError.value = ''

  if (!entryForm.value.number) {
    entryFormError.value = 'Le numero est requis'
    return
  }

  try {
    const data = {
      number: entryForm.value.number,
      info: entryForm.value.info.trim() || null,
      status: entryForm.value.status
    }

    if (editingEntry.value) {
      await $fetch(`/api/campaigns/${campaignId.value}/locations/${locationId.value}/entries/${editingEntry.value.id}`, {
        method: 'PUT',
        body: data
      })
    } else {
      await $fetch(`/api/campaigns/${campaignId.value}/locations/${locationId.value}/entries`, {
        method: 'POST',
        body: data
      })
    }

    showEntryModal.value = false
    await loadLocation()
  } catch (e: any) {
    entryFormError.value = e.data?.statusMessage || 'Erreur lors de la sauvegarde'
  }
}

// Supprimer entree
async function deleteEntry() {
  if (!deleteEntryConfirm.value) return

  try {
    await $fetch(`/api/campaigns/${campaignId.value}/locations/${locationId.value}/entries/${deleteEntryConfirm.value.id}`, {
      method: 'DELETE'
    })
    deleteEntryConfirm.value = null
    await loadLocation()
  } catch (e: any) {
    console.error('Erreur suppression:', e)
  }
}

// Changer le status d'une entree rapidement
async function toggleEntryStatus(entry: Entry) {
  const statuses: Array<'explored' | 'partial' | 'unknown' | null> = ['unknown', 'partial', 'explored', null]
  const currentIndex = statuses.indexOf(entry.status)
  const nextStatus = statuses[(currentIndex + 1) % statuses.length]

  try {
    await $fetch(`/api/campaigns/${campaignId.value}/locations/${locationId.value}/entries/${entry.id}`, {
      method: 'PUT',
      body: { status: nextStatus }
    })
    await loadLocation()
  } catch (e) {
    console.error('Erreur mise a jour status:', e)
  }
}

// Status helpers
function getStatusColor(status: string | null) {
  switch (status) {
    case 'explored': return 'bg-green-600 text-green-100'
    case 'partial': return 'bg-yellow-600 text-yellow-100'
    case 'unknown': return 'bg-gray-600 text-gray-100'
    default: return 'bg-stone-700 text-stone-300'
  }
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case 'explored': return 'Explore'
    case 'partial': return 'Partiel'
    case 'unknown': return 'Inconnu'
    default: return 'Non defini'
  }
}

onMounted(loadLocation)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
    <!-- Header -->
    <header class="bg-stone-800/50 border-b border-stone-700 py-6">
      <div class="container mx-auto px-4">
        <NuxtLink
            :to="`/campaigns/${campaignId}`"
            class="text-stone-400 hover:text-amber-400 text-sm flex items-center gap-1 mb-3 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux lieux
        </NuxtLink>

        <div v-if="location" class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="px-4 py-2 bg-amber-600/30 text-amber-400 rounded-lg font-bold text-2xl">
                #{{ location.number }}
              </span>
              <h1 class="text-3xl font-bold text-white">{{ location.name }}</h1>
            </div>

            <!-- Indicators -->
            <div class="flex flex-wrap gap-2 mt-3">
              <span v-if="location.hasMenhir" class="px-3 py-1 bg-emerald-900/50 text-emerald-400 rounded-lg text-sm flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Menhir
              </span>
              <span v-if="location.dream" class="px-3 py-1 bg-blue-900/50 text-blue-400 rounded-lg text-sm">
                Reve disponible
              </span>
              <span v-if="location.nightmare" class="px-3 py-1 bg-purple-900/50 text-purple-400 rounded-lg text-sm">
                Cauchemar disponible
              </span>
            </div>
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

      <template v-else-if="location">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Dream / Nightmare -->
            <div v-if="location.dream || location.nightmare" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-if="location.dream" class="bg-blue-900/20 border border-blue-800 rounded-xl p-5">
                <h3 class="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Reve
                </h3>
                <p class="text-stone-300 whitespace-pre-wrap">{{ location.dream }}</p>
              </div>

              <div v-if="location.nightmare" class="bg-purple-900/20 border border-purple-800 rounded-xl p-5">
                <h3 class="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Cauchemar
                </h3>
                <p class="text-stone-300 whitespace-pre-wrap">{{ location.nightmare }}</p>
              </div>
            </div>

            <!-- Menhir -->
            <div v-if="location.hasMenhir" class="bg-emerald-900/20 border border-emerald-800 rounded-xl p-5">
              <h3 class="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Menhir present
              </h3>
              <p v-if="location.menhirNote" class="text-stone-300">{{ location.menhirNote }}</p>
              <p v-else class="text-stone-500 italic">Aucune note sur le menhir</p>
            </div>

            <!-- Entries -->
            <div class="bg-stone-800/60 border border-stone-700 rounded-xl p-5">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-amber-400 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Entrees
                </h3>
                <button
                    @click="openCreateEntryModal"
                    class="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter
                </button>
              </div>

              <div v-if="location.entries.length === 0" class="text-center py-8 text-stone-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Aucune entree pour ce lieu</p>
              </div>

              <div v-else class="space-y-3">
                <div
                    v-for="entry in location.entries"
                    :key="entry.id"
                    class="flex items-start gap-4 bg-stone-700/50 rounded-lg p-4"
                >
                  <!-- Number -->
                  <span class="px-3 py-1 bg-stone-600 text-stone-200 rounded font-bold text-lg min-w-[60px] text-center">
                    {{ entry.number }}
                  </span>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <p v-if="entry.info" class="text-stone-300">{{ entry.info }}</p>
                    <p v-else class="text-stone-500 italic">Pas d'information</p>
                  </div>

                  <!-- Status badge (clickable) -->
                  <button
                      @click="toggleEntryStatus(entry)"
                      :class="['px-3 py-1 rounded text-sm font-medium transition-colors', getStatusColor(entry.status)]"
                      title="Cliquez pour changer le status"
                  >
                    {{ getStatusLabel(entry.status) }}
                  </button>

                  <!-- Actions -->
                  <div class="flex gap-1">
                    <button
                        @click="openEditEntryModal(entry)"
                        class="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-600 rounded-lg transition-colors"
                        title="Modifier"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                        @click="deleteEntryConfirm = entry"
                        class="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-600 rounded-lg transition-colors"
                        title="Supprimer"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Notes -->
            <div class="bg-stone-800/60 border border-stone-700 rounded-xl p-5">
              <h3 class="text-lg font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notes
              </h3>
              <p v-if="location.notes" class="text-stone-300 whitespace-pre-wrap">{{ location.notes }}</p>
              <p v-else class="text-stone-500 italic">Aucune note</p>
            </div>

            <!-- Summary -->
            <div class="bg-stone-800/60 border border-stone-700 rounded-xl p-5">
              <h3 class="text-lg font-semibold text-amber-400 mb-3">Resume</h3>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-stone-400">Entrees</span>
                  <span class="text-white font-medium">{{ location.entries.length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-stone-400">Explorees</span>
                  <span class="text-green-400 font-medium">{{ location.entries.filter(e => e.status === 'explored').length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-stone-400">Partielles</span>
                  <span class="text-yellow-400 font-medium">{{ location.entries.filter(e => e.status === 'partial').length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-stone-400">Inconnues</span>
                  <span class="text-gray-400 font-medium">{{ location.entries.filter(e => e.status === 'unknown').length }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Entry Modal -->
    <Teleport to="body">
      <div
          v-if="showEntryModal"
          class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          @click.self="showEntryModal = false"
      >
        <div class="bg-stone-800 rounded-2xl w-full max-w-md">
          <div class="p-6 border-b border-stone-700">
            <h2 class="text-xl font-bold text-amber-400">
              {{ editingEntry ? 'Modifier l\'entree' : 'Nouvelle entree' }}
            </h2>
          </div>

          <form @submit.prevent="saveEntry" class="p-6 space-y-5">
            <!-- Error -->
            <div v-if="entryFormError" class="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {{ entryFormError }}
            </div>

            <!-- Number -->
            <div>
              <label class="block text-sm font-medium text-stone-400 mb-2">Numero *</label>
              <input
                  v-model.number="entryForm.number"
                  type="number"
                  min="1"
                  class="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none"
                  required
              />
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-stone-400 mb-2">Status</label>
              <select
                  v-model="entryForm.status"
                  class="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none"
              >
                <option :value="null">Non defini</option>
                <option value="explored">Explore</option>
                <option value="partial">Partiel</option>
                <option value="unknown">Inconnu</option>
              </select>
            </div>

            <!-- Info -->
            <div>
              <label class="block text-sm font-medium text-stone-400 mb-2">Information</label>
              <textarea
                  v-model="entryForm.info"
                  rows="3"
                  class="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none resize-none"
                  placeholder="Description de l'entree..."
              ></textarea>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button
                  type="button"
                  @click="showEntryModal = false"
                  class="flex-1 px-6 py-3 bg-stone-700 hover:bg-stone-600 rounded-lg font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                  type="submit"
                  class="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-semibold transition-colors"
              >
                {{ editingEntry ? 'Modifier' : 'Creer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Entry Confirmation Modal -->
    <Teleport to="body">
      <div
          v-if="deleteEntryConfirm"
          class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          @click.self="deleteEntryConfirm = null"
      >
        <div class="bg-stone-800 rounded-2xl w-full max-w-md p-6">
          <h2 class="text-xl font-bold text-red-400 mb-4">Supprimer cette entree ?</h2>
          <p class="text-stone-300 mb-6">
            Etes-vous sur de vouloir supprimer l'entree
            <span class="font-semibold text-amber-400">#{{ deleteEntryConfirm.number }}</span> ?
            Cette action est irreversible.
          </p>
          <div class="flex gap-3">
            <button
                @click="deleteEntryConfirm = null"
                class="flex-1 px-6 py-3 bg-stone-700 hover:bg-stone-600 rounded-lg font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
                @click="deleteEntry"
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
