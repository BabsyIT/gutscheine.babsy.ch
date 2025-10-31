import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create categories
  const categories = [
    { name: 'Restaurant & Café', slug: 'restaurant-cafe', icon: '🍽️', description: 'Gutscheine für Restaurants und Cafés' },
    { name: 'Beauty & Wellness', slug: 'beauty-wellness', icon: '💆', description: 'Beauty-Behandlungen und Wellness-Angebote' },
    { name: 'Sport & Fitness', slug: 'sport-fitness', icon: '🏋️', description: 'Fitness-Studios und Sport-Angebote' },
    { name: 'Shopping', slug: 'shopping', icon: '🛍️', description: 'Mode, Elektronik und mehr' },
    { name: 'Freizeit & Events', slug: 'freizeit-events', icon: '🎭', description: 'Events, Konzerte und Freizeitaktivitäten' },
    { name: 'Gesundheit', slug: 'gesundheit', icon: '⚕️', description: 'Gesundheitsdienstleistungen' },
    { name: 'Bildung', slug: 'bildung', icon: '📚', description: 'Kurse und Weiterbildung' },
    { name: 'Reisen', slug: 'reisen', icon: '✈️', description: 'Hotels und Reiseangebote' },
    { name: 'Auto & Mobilität', slug: 'auto-mobilitaet', icon: '🚗', description: 'Auto-Services und Mobilität' },
    { name: 'Sonstiges', slug: 'sonstiges', icon: '🎁', description: 'Weitere Angebote' },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
    console.log(`Created category: ${category.name}`)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
