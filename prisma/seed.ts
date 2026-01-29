import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const statuses = [
  { name: 'Abandonnés', checkboxCount: 2 },
  { name: 'Actes notables', checkboxCount: 8 },
  { name: 'Affaires personnelles', checkboxCount: 15 },
  { name: 'Alliance de Sombrebois', checkboxCount: 4 },
  { name: 'Ami de la noblesse', checkboxCount: 5 },
  { name: 'Approvisionnement', checkboxCount: 9 },
  { name: 'Au bout du chemin', checkboxCount: 8 },
  { name: 'Avantage : eau', checkboxCount: 3 },
  { name: 'Avantage : Wyrd', checkboxCount: 3 },
  { name: 'Avenir d\'Avalon', checkboxCount: 11 },
  { name: 'Bâtisseurs de Sorlois', checkboxCount: 4 },
  { name: 'Braises', checkboxCount: 6 },
  { name: 'Bureaucratie', checkboxCount: 5 },
  { name: 'Cartographie du marais', checkboxCount: 5 },
  { name: 'Champion du petit peuple', checkboxCount: 7 },
  { name: 'Chants d\'Avalon', checkboxCount: 3 },
  { name: 'Circuit vénédien', checkboxCount: 10 },
  { name: 'Clés et mots de passe', checkboxCount: 2 },
  { name: 'Cœur de pierre', checkboxCount: 10 },
  { name: 'Compagnons', checkboxCount: 4 },
  { name: 'Conspirations et manigances', checkboxCount: 9 },
  { name: 'Coup du sort', checkboxCount: 4 },
  { name: 'Curiosités', checkboxCount: 10 },
  { name: 'Dette', checkboxCount: 5 },
  { name: 'Échecs du Déchu', checkboxCount: 4 },
  { name: 'Épilogues', checkboxCount: 3 },
  { name: 'Étranges leçons', checkboxCount: 9 },
  { name: 'Faire face à la Ruine', checkboxCount: 4 },
  { name: 'Festivités', checkboxCount: 2 },
  { name: 'Fonte', checkboxCount: 5 },
  { name: 'Fouille', checkboxCount: 9 },
  { name: 'Funérailles royales', checkboxCount: 5 },
  { name: 'Histoires au coin du feu', checkboxCount: 5 },
  { name: 'Indices', checkboxCount: 2 },
  { name: 'Informateur', checkboxCount: 6 },
  { name: 'Insolent', checkboxCount: 5 },
  { name: 'Isolut', checkboxCount: 7 },
  { name: 'Itinéraires bis', checkboxCount: 12 },
  { name: 'Kendrick', checkboxCount: 7 },
  { name: 'Leçons de ruse', checkboxCount: 3 },
  { name: 'Leçons d\'inspiration', checkboxCount: 4 },
  { name: 'Leçons du passé', checkboxCount: 4 },
  { name: 'Liberté', checkboxCount: 8 },
  { name: 'Mains baladeuses', checkboxCount: 8 },
  { name: 'Marchandises étrangères', checkboxCount: 4 },
  { name: 'Messages secrets', checkboxCount: 3 },
  { name: 'Négociateur', checkboxCount: 9 },
  { name: 'Obstacles', checkboxCount: 4 },
  { name: 'Pays interdit', checkboxCount: 8 },
  { name: 'Péchés de l\'Évêque', checkboxCount: 5 },
  { name: 'Petite faveur', checkboxCount: 10 },
  { name: 'Pisteur', checkboxCount: 4 },
  { name: 'Prise de risque', checkboxCount: 7 },
  { name: 'Pressentiment', checkboxCount: 9 },
  { name: 'Queue porte-bonheur', checkboxCount: 5 },
  { name: 'Réaliste', checkboxCount: 4 },
  { name: 'Récolte de Wyrd', checkboxCount: 8 },
  { name: 'Reconstruire Lothian', checkboxCount: 8 },
  { name: 'Remboursement', checkboxCount: 5 },
  { name: 'Rencontres fortuites', checkboxCount: 9 },
  { name: 'Représentations', checkboxCount: 4 },
  { name: 'Révélations du Verre-de-Wyrd', checkboxCount: 11 },
  { name: 'Rues de Sorlois', checkboxCount: 3 },
  { name: 'Rumeurs et ouï-dire', checkboxCount: 7 },
  { name: 'Sécheresse', checkboxCount: 8 },
  { name: 'Secrets de famille', checkboxCount: 10 },
  { name: 'Secrets de l\'Ambre-reine', checkboxCount: 4 },
  { name: 'Stock limité', checkboxCount: 5 },
  { name: 'Suppression', checkboxCount: 6 },
  { name: 'Terreurs et périls', checkboxCount: 10 },
  { name: 'Topographie', checkboxCount: 10 },
  { name: 'Trouvaille', checkboxCount: 11 },
  { name: 'Vérité crue', checkboxCount: 5 },
  { name: 'Vieux dossiers', checkboxCount: 5 },
  { name: 'Voyageurs du passé', checkboxCount: 4 },
]

async function main() {
  console.log('Seeding statuses...')

  for (const status of statuses) {
    await prisma.status.upsert({
      where: { name: status.name },
      update: { checkboxCount: status.checkboxCount },
      create: status
    })
    console.log(`  - ${status.name} (${status.checkboxCount} checkboxes)`)
  }

  console.log(`\nSeeding complete! ${statuses.length} statuses added.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
