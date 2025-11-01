import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [vouchers, categories] = await Promise.all([
    prisma.voucher.findMany({
      where: {
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      },
      include: {
        partner: {
          select: {
            businessName: true,
            logo: true,
          }
        },
        category: {
          select: {
            name: true,
            slug: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 12
    }),
    prisma.category.findMany({
      include: {
        _count: {
          select: {
            vouchers: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Willkommen bei Babsy Gutscheinen
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100">
              Entdecke exklusive Angebote von lokalen Partnern
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/vouchers"
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition text-center"
              >
                Gutscheine entdecken
              </Link>
              <Link
                href="/partner"
                className="bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-800 transition text-center border border-purple-500"
              >
                Als Partner registrieren
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Kategorien</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/vouchers?category=${category.slug}`}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-center"
            >
              <div className="text-3xl mb-2">{category.icon || '🎁'}</div>
              <h3 className="font-semibold text-gray-800">{category.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {category._count.vouchers} Angebote
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Vouchers */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Aktuelle Gutscheine</h2>
          <Link
            href="/vouchers"
            className="text-purple-600 hover:text-purple-700 font-semibold"
          >
            Alle ansehen →
          </Link>
        </div>

        {vouchers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">
              Noch keine Gutscheine verfügbar. Schau bald wieder vorbei!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vouchers.map((voucher) => (
              <Link
                key={voucher.id}
                href={`/vouchers/${voucher.id}`}
                className="bg-white rounded-lg shadow hover:shadow-xl transition overflow-hidden"
              >
                {voucher.imageUrl && (
                  <div className="h-48 bg-gradient-to-br from-purple-400 to-blue-500" />
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {voucher.category.name}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-800">
                    {voucher.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {voucher.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-200 rounded-full" />
                      <span className="text-sm text-gray-700">
                        {voucher.partner.businessName}
                      </span>
                    </div>
                    {voucher.discount && (
                      <span className="text-2xl font-bold text-purple-600">
                        -{voucher.discount}%
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Babsy Gutscheine</h3>
              <p className="text-gray-400">
                Deine Plattform für lokale Angebote und Gutscheine
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Links</h4>
              <ul className="space-y-2">
                <li><Link href="/vouchers" className="text-gray-400 hover:text-white">Gutscheine</Link></li>
                <li><Link href="/partner" className="text-gray-400 hover:text-white">Partner werden</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Kontakt</h4>
              <p className="text-gray-400">
                Fragen? Kontaktiere uns!
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Babsy. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
