import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function VouchersPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const whereCondition: any = {
    isActive: true,
    validFrom: { lte: new Date() },
    OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
  };

  if (category) {
    const selectedCategory = await prisma.category.findUnique({
      where: { slug: category },
    });
    if (selectedCategory) {
      whereCondition.categoryId = selectedCategory.id;
    }
  }

  if (search) {
    whereCondition.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      {
        partner: {
          businessName: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const vouchers = await prisma.voucher.findMany({
    where: whereCondition,
    include: {
      partner: {
        select: {
          businessName: true,
          logo: true,
        },
      },
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Alle Gutscheine</h1>
          <p className="text-xl text-purple-100">
            Entdecke {vouchers.length} aktuelle Angebote
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Filter</h2>

              {/* Search */}
              <form method="GET" className="mb-6">
                <label htmlFor="search" className="block text-sm font-semibold mb-2">
                  Suche
                </label>
                <input
                  type="text"
                  name="search"
                  id="search"
                  defaultValue={search}
                  placeholder="Gutschein suchen..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button
                  type="submit"
                  className="w-full mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Suchen
                </button>
              </form>

              {/* Category Filter */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Kategorien</h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/vouchers"
                      className={`block px-3 py-2 rounded hover:bg-gray-100 transition ${
                        !category ? "bg-purple-100 text-purple-700 font-semibold" : ""
                      }`}
                    >
                      Alle Kategorien
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/vouchers?category=${cat.slug}`}
                        className={`block px-3 py-2 rounded hover:bg-gray-100 transition ${
                          category === cat.slug
                            ? "bg-purple-100 text-purple-700 font-semibold"
                            : ""
                        }`}
                      >
                        {cat.icon} {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {category && (
                <div className="mt-4">
                  <Link
                    href="/vouchers"
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Filter zurücksetzen
                  </Link>
                </div>
              )}
            </div>
          </aside>

          {/* Vouchers Grid */}
          <main className="flex-1">
            {vouchers.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 text-lg">
                  Keine Gutscheine gefunden.
                </p>
                <Link
                  href="/vouchers"
                  className="text-purple-600 hover:text-purple-700 font-semibold mt-4 inline-block"
                >
                  Alle Gutscheine anzeigen
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vouchers.map((voucher) => (
                  <Link
                    key={voucher.id}
                    href={`/vouchers/${voucher.id}`}
                    className="bg-white rounded-lg shadow hover:shadow-xl transition overflow-hidden group"
                  >
                    {voucher.imageUrl ? (
                      <div className="h-48 bg-gradient-to-br from-purple-400 to-blue-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-purple-400 to-blue-500" />
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded">
                          {voucher.category.name}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-purple-600 transition">
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
                        {voucher.value && (
                          <span className="text-2xl font-bold text-purple-600">
                            {voucher.value}€
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
