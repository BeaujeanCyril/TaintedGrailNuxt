import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const statuses = [
  { name: 'Abandonnes', checkboxCount: 2 },
  { name: 'Actes notables', checkboxCount: 8 }
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

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
