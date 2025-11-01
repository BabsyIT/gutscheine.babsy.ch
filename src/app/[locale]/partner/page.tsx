import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PartnerDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user has a partner profile
  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    include: {
      vouchers: {
        include: {
          category: true,
          _count: {
            select: {
              redemptions: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  // If no partner profile, show registration form
  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-6">Als Partner registrieren</h1>
            <p className="text-gray-600 mb-8">
              Registriere dein Unternehmen als Partner und erstelle Gutscheine
              für deine Kunden.
            </p>

            <form action="/api/partners" method="POST" className="space-y-6">
              <div>
                <label
                  htmlFor="businessName"
                  className="block text-sm font-semibold mb-2"
                >
                  Firmenname *
                </label>
                <input
                  type="text"
                  name="businessName"
                  id="businessName"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold mb-2"
                >
                  Beschreibung
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-semibold mb-2"
                >
                  Adresse
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold mb-2"
                >
                  Telefon
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-semibold mb-2"
                >
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  id="website"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Jetzt registrieren
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Show approval pending message
  if (!partner.isApproved) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⏳</span>
            </div>
            <h1 className="text-2xl font-bold mb-4">Registrierung ausstehend</h1>
            <p className="text-gray-600 mb-6">
              Deine Partner-Registrierung wurde empfangen und wird gerade geprüft.
              Du wirst per E-Mail benachrichtigt, sobald dein Account freigeschaltet wurde.
            </p>
            <Link
              href="/"
              className="inline-block text-purple-600 hover:text-purple-700 font-semibold"
            >
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show partner dashboard
  const stats = {
    totalVouchers: partner.vouchers.length,
    activeVouchers: partner.vouchers.filter((v) => v.isActive).length,
    totalRedemptions: partner.vouchers.reduce(
      (sum, v) => sum + v._count.redemptions,
      0
    ),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Partner Dashboard</h1>
          <p className="text-xl text-purple-100">{partner.businessName}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.totalVouchers}
            </div>
            <div className="text-gray-600">Gesamt Gutscheine</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.activeVouchers}
            </div>
            <div className="text-gray-600">Aktive Gutscheine</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.totalRedemptions}
            </div>
            <div className="text-gray-600">Eingelöste Gutscheine</div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Deine Gutscheine</h2>
            <Link
              href="/partner/vouchers/new"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              + Neuer Gutschein
            </Link>
          </div>
        </div>

        {/* Vouchers List */}
        {partner.vouchers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-6">
              Du hast noch keine Gutscheine erstellt.
            </p>
            <Link
              href="/partner/vouchers/new"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Ersten Gutschein erstellen
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {partner.vouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{voucher.title}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          voucher.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {voucher.isActive ? "Aktiv" : "Inaktiv"}
                      </span>
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
                        {voucher.category.name}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {voucher.description}
                    </p>
                    <div className="flex gap-6 text-sm text-gray-600">
                      <div>
                        <span className="font-semibold">Einlösungen:</span>{" "}
                        {voucher._count.redemptions}
                        {voucher.maxRedemptions && ` / ${voucher.maxRedemptions}`}
                      </div>
                      <div>
                        <span className="font-semibold">Gültig bis:</span>{" "}
                        {voucher.validUntil
                          ? voucher.validUntil.toLocaleDateString("de-DE")
                          : "Unbegrenzt"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/vouchers/${voucher.id}`}
                      className="text-purple-600 hover:text-purple-700 font-semibold px-4 py-2"
                    >
                      Ansehen
                    </Link>
                    <Link
                      href={`/partner/vouchers/${voucher.id}/edit`}
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold transition"
                    >
                      Bearbeiten
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
