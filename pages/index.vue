<script setup lang="ts">
interface Location {
  id: number
  number: number
  name: string
  dreammare: 'dream' | 'nightmare' | null
  hasMenhir: boolean
  entries: string | null
  status: 'explored' | 'partial' | 'unknown' | null
  notes: string | null
}

const locations = ref<Location[]>([])
const loading = ref(true)
const showModal = ref(false)
const editingLocation = ref<Location | null>(null)
const deleteConfirm = ref<Location | null>(null)

// Form data
const form = ref({
  number: 0,
  name: '',
  dreammare: null as 'dream' | 'nightmare' | null,
  hasMenhir: false,
  entries: '',
  status: null as 'explored' | 'partial' | 'unknown' | null,
  notes: ''
})

const formError = ref('')

// Charger les lieux
async function loadLocations() {
  loading.value = true
  try {
    locations.value = await $fetch<Location[]>('/api/locations')
  } catch (e) {
    console.error('Erreur chargement:', e)
  } finally {
    loading.value = false
  }
}

// Ouvrir le modal pour créer
function openCreateModal() {
  editingLocation.value = null
  form.value = {
    number: 0,
    name: '',
    dreammare: null,
    hasMenhir: false,
    entries: '',
    status: null,
    notes: ''
  }
  formError.value = ''
  showModal.value = true
}

// Ouvrir le modal pour éditer
function openEditModal(location: Location) {
  editingLocation.value = location
  form.value = {
    number: location.number,
    name: location.name,
    dreammare: location.dreammare,
    hasMenhir: location.hasMenhir,
    entries: location.entries || '',
    status: location.status,
    notes: location.notes || ''
  }
  formError.value = ''
  showModal.value = true
}

// Sauvegarder (créer ou modifier)
async function saveLocation() {
  formError.value = ''

  if (!form.value.number || !form.value.name.trim()) {
    formError.value = 'Le numéro et le nom sont requis'
    return
  }

  try {
    const data = {
      number: form.value.number,
      name: form.value.name.trim(),
      dreammare: form.value.dreammare,
      hasMenhir: form.value.hasMenhir,
      entries: form.value.entries.trim() || null,
      status: form.value.status,
      notes: form.value.notes.trim() || null
    }

    if (editingLocation.value) {
      await $fetch(`/api/locations/${editingLocation.value.id}`, {
        method: 'PUT',
        body: data
      })
    } else {
      await $fetch('/api/locations', {
        method: 'POST',
        body: data
      })
    }

    showModal.value = false
    await loadLocations()
  } catch (e: any) {
    formError.value = e.data?.statusMessage || 'Erreur lors de la sauvegarde'
  }
}

// Supprimer un lieu
async function deleteLocation() {
  if (!deleteConfirm.value) return

  try {
    await $fetch(`/api/locations/${deleteConfirm.value.id}`, {
      method: 'DELETE'
    })
    deleteConfirm.value = null
    await loadLocations()
  } catch (e: any) {
    console.error('Erreur suppression:', e)
  }
}

// Status badge color
function getStatusColor(status: string | null) {
  switch (status) {
    case 'explored': return 'bg-green-600'
    case 'partial': return 'bg-yellow-600'
    case 'unknown': return 'bg-gray-600'
    default: return 'bg-gray-700'
  }
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case 'explored': return 'Exploré'
    case 'partial': return 'Partiel'
    case 'unknown': return 'Inconnu'
    default: return '-'
  }
}

onMounted(loadLocations)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
    <!-- Header -->
    <header class="bg-stone-800/50 border-b border-stone-700 py-6">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-amber-400">Tainted Grail</h1>
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

      <!-- Empty state -->
      <div v-else-if="locations.length === 0" class="text-center py-16">
        <svg class="w-16 h-16 mx-auto text-stone-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p class="text-stone-400 text-lg">Aucun lieu enregistré</p>
        <p class="text-stone-500 mt-2">Commencez par ajouter votre premier lieu</p>
      </div>

      <!-- Locations Grid -->
      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
            v-for="location in locations"
            :key="location.id"
            class="bg-stone-800/60 rounded-xl border border-stone-700 p-5 hover:border-amber-600/50 transition-colors"
        >
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div>
              <div class="flex items-center gap-3">
                <span class="text-2xl font-bold text-amber-400">#{{ location.number }}</span>
                <h3 class="text-xl font-semibold">{{ location.name }}</h3>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <!-- Dreammare badge -->
                <span
                    v-if="location.dreammare"
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="location.dreammare === 'dream' ? 'bg-blue-600' : 'bg-purple-600'"
                >
                  {{ location.dreammare === 'dream' ? 'Rêve' : 'Cauchemar' }}
                </span>
                <!-- Menhir badge -->
                <span
                    v-if="location.hasMenhir"
                    class="px-2 py-1 rounded text-xs font-medium bg-emerald-600"
                >
                  Menhir
                </span>
                <!-- Status badge -->
                <span
                    :class="getStatusColor(location.status)"
                    class="px-2 py-1 rounded text-xs font-medium"
                >
                  {{ getStatusLabel(location.status) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                  @click="openEditModal(location)"
                  class="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-700 rounded-lg transition-colors"
                  title="Modifier"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                  @click="deleteConfirm = location"
                  class="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-700 rounded-lg transition-colors"
                  title="Supprimer"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Entries -->
          <div v-if="location.entries" class="mb-3">
            <p class="text-xs text-stone-500 uppercase tracking-wide mb-1">Entrées</p>
            <p class="text-stone-300">{{ location.entries }}</p>
          </div>

          <!-- Notes -->
          <div v-if="location.notes" class="mt-3 pt-3 border-t border-stone-700">
            <p class="text-xs text-stone-500 uppercase tracking-wide mb-1">Notes</p>
            <p class="text-stone-400 text-sm">{{ location.notes }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div
          v-if="showModal"
          class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          @click.self="showModal = false"
      >
        <div class="bg-stone-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-stone-400 mb-2">Numéro *</label>
                <input
                    v-model.number="form.number"
                    type="number"
                    min="1"
                    class="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none"
                    required
                />
              </div>
              <div class="col-span-2">
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

            <!-- Dreammare -->
            <div>
              <label class="block text-sm font-medium text-stone-400 mb-2">Rêve / Cauchemar</label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                      v-model="form.dreammare"
                      type="radio"
                      :value="null"
                      class="w-4 h-4 text-amber-600"
                  />
                  <span>Aucun</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                      v-model="form.dreammare"
                      type="radio"
                      value="dream"
                      class="w-4 h-4 text-blue-600"
                  />
                  <span class="text-blue-400">Rêve</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                      v-model="form.dreammare"
                      type="radio"
                      value="nightmare"
                      class="w-4 h-4 text-purple-600"
                  />
                  <span class="text-purple-400">Cauchemar</span>
                </label>
              </div>
            </div>

            <!-- Menhir -->
            <div>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                    v-model="form.hasMenhir"
                    type="checkbox"
                    class="w-5 h-5 rounded text-emerald-600 bg-stone-700 border-stone-600"
                />
                <span>Présence d'un Menhir</span>
              </label>
            </div>

            <!-- Entries -->
            <div>
              <label class="block text-sm font-medium text-stone-400 mb-2">Entrées</label>
              <input
                  v-model="form.entries"
                  type="text"
                  class="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none"
                  placeholder="ex: 45, 67, 89"
              />
              <p class="text-xs text-stone-500 mt-1">Numéros des entrées séparés par des virgules</p>
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-stone-400 mb-2">Status</label>
              <select
                  v-model="form.status"
                  class="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none"
              >
                <option :value="null">Non défini</option>
                <option value="explored">Exploré</option>
                <option value="partial">Partiellement exploré</option>
                <option value="unknown">Inconnu</option>
              </select>
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
                {{ editingLocation ? 'Modifier' : 'Créer' }}
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
            Êtes-vous sûr de vouloir supprimer
            <span class="font-semibold text-amber-400">#{{ deleteConfirm.number }} - {{ deleteConfirm.name }}</span> ?
            Cette action est irréversible.
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
