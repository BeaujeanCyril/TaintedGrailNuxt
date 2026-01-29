<script setup lang="ts">
interface Campaign {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  _count: {
    locations: number
  }
}

const campaigns = ref<Campaign[]>([])
const loading = ref(true)
const showModal = ref(false)
const editingCampaign = ref<Campaign | null>(null)
const deleteConfirm = ref<Campaign | null>(null)
const newCampaignName = ref('')
const formError = ref('')

// Charger les campagnes
async function loadCampaigns() {
  loading.value = true
  try {
    campaigns.value = await $fetch<Campaign[]>('/api/campaigns')
  } catch (e) {
    console.error('Erreur chargement:', e)
  } finally {
    loading.value = false
  }
}

// Ouvrir le modal pour creer
function openCreateModal() {
  editingCampaign.value = null
  newCampaignName.value = ''
  formError.value = ''
  showModal.value = true
}

// Ouvrir le modal pour editer
function openEditModal(campaign: Campaign, event: Event) {
  event.stopPropagation()
  editingCampaign.value = campaign
  newCampaignName.value = campaign.name
  formError.value = ''
  showModal.value = true
}

// Sauvegarder (creer ou modifier)
async function saveCampaign() {
  formError.value = ''

  if (!newCampaignName.value.trim()) {
    formError.value = 'Le nom est requis'
    return
  }

  try {
    if (editingCampaign.value) {
      await $fetch(`/api/campaigns/${editingCampaign.value.id}`, {
        method: 'PUT',
        body: { name: newCampaignName.value.trim() }
      })
    } else {
      const newCampaign = await $fetch<Campaign>('/api/campaigns', {
        method: 'POST',
        body: { name: newCampaignName.value.trim() }
      })
      // Rediriger vers la nouvelle campagne
      navigateTo(`/campaigns/${newCampaign.id}`)
      return
    }

    showModal.value = false
    await loadCampaigns()
  } catch (e: any) {
    formError.value = e.data?.statusMessage || 'Erreur lors de la sauvegarde'
  }
}

// Confirmer suppression
function confirmDelete(campaign: Campaign, event: Event) {
  event.stopPropagation()
  deleteConfirm.value = campaign
}

// Supprimer une campagne
async function deleteCampaign() {
  if (!deleteConfirm.value) return

  try {
    await $fetch(`/api/campaigns/${deleteConfirm.value.id}`, {
      method: 'DELETE'
    })
    deleteConfirm.value = null
    await loadCampaigns()
  } catch (e: any) {
    console.error('Erreur suppression:', e)
  }
}

// Naviguer vers une campagne
function goToCampaign(campaign: Campaign) {
  navigateTo(`/campaigns/${campaign.id}`)
}

// Format date
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

onMounted(loadCampaigns)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
    <!-- Header -->
    <header class="bg-stone-800/50 border-b border-stone-700 py-6">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-amber-400">Tainted Grail</h1>
            <p class="text-stone-400 mt-1">Choisissez une campagne</p>
          </div>
          <a
              href="https://portal.cyriongames.fr"
              class="px-4 py-2 text-sm text-stone-400 hover:text-white hover:bg-stone-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au portail
          </a>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="container mx-auto px-4 py-12">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <svg class="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <template v-else>
        <!-- Create campaign button -->
        <div class="text-center mb-8">
          <button
              @click="openCreateModal"
              class="px-8 py-4 bg-amber-600 hover:bg-amber-500 rounded-xl font-semibold transition-colors inline-flex items-center gap-3 text-lg"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle Campagne
          </button>
        </div>

        <!-- Empty state -->
        <div v-if="campaigns.length === 0" class="text-center py-16">
          <svg class="w-20 h-20 mx-auto text-stone-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p class="text-stone-400 text-xl">Aucune campagne</p>
          <p class="text-stone-500 mt-2">Creez votre premiere campagne pour commencer</p>
        </div>

        <!-- Campaigns grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <button
              v-for="campaign in campaigns"
              :key="campaign.id"
              @click="goToCampaign(campaign)"
              class="group relative bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700 hover:border-amber-500/50 rounded-2xl p-6 text-left transition-all duration-200"
          >
            <!-- Actions -->
            <div class="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                  @click="openEditModal(campaign, $event)"
                  class="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-600 rounded-lg transition-colors"
                  title="Renommer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                  @click="confirmDelete(campaign, $event)"
                  class="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-600 rounded-lg transition-colors"
                  title="Supprimer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <!-- Icon -->
            <div class="w-16 h-16 bg-amber-600/20 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>

            <!-- Name -->
            <h2 class="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
              {{ campaign.name }}
            </h2>

            <!-- Stats -->
            <div class="flex items-center gap-4 text-sm text-stone-400">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {{ campaign._count.locations }} lieu(x)
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ formatDate(campaign.updatedAt) }}
              </span>
            </div>

            <!-- Arrow -->
            <div class="absolute bottom-6 right-6 text-stone-500 group-hover:text-amber-400 transition-colors">
              <svg class="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </template>
    </main>

    <!-- Create/Edit Campaign Modal -->
    <Teleport to="body">
      <div
          v-if="showModal"
          class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          @click.self="showModal = false"
      >
        <div class="bg-stone-800 rounded-2xl w-full max-w-md">
          <div class="p-6 border-b border-stone-700">
            <h2 class="text-xl font-bold text-amber-400">
              {{ editingCampaign ? 'Renommer la campagne' : 'Nouvelle campagne' }}
            </h2>
          </div>

          <form @submit.prevent="saveCampaign" class="p-6 space-y-5">
            <!-- Error -->
            <div v-if="formError" class="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {{ formError }}
            </div>

            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-stone-400 mb-2">Nom de la campagne *</label>
              <input
                  v-model="newCampaignName"
                  type="text"
                  class="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none"
                  placeholder="Ex: Premiere aventure"
                  required
                  autofocus
              />
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
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
                {{ editingCampaign ? 'Renommer' : 'Creer' }}
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
          <h2 class="text-xl font-bold text-red-400 mb-4">Supprimer cette campagne ?</h2>
          <p class="text-stone-300 mb-2">
            Etes-vous sur de vouloir supprimer
            <span class="font-semibold text-amber-400">{{ deleteConfirm.name }}</span> ?
          </p>
          <p class="text-stone-400 text-sm mb-6">
            Tous les lieux et entrees associes seront egalement supprimes.
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
                @click="deleteCampaign"
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
