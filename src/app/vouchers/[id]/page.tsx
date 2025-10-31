import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { generateVoucherQRCode } from "@/lib/qrcode";
import Image from "next/image";

export default async function VoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: {
      partner: {
        select: {
          businessName: true,
          description: true,
          logo: true,
          address: true,
          phone: true,
          website: true,
        },
      },
      category: true,
      redemptions: session?.user
        ? {
            where: {
              userId: session.user.id,
            },
            take: 1,
          }
        : undefined,
      _count: {
        select: {
          redemptions: true,
        },
      },
    },
  });

  if (!voucher) {
    notFound();
  }

  // Check if voucher is valid
  const now = new Date();
  const isExpired = voucher.validUntil && voucher.validUntil < now;
  const isNotYetValid = voucher.validFrom > now;
  const isRedeemable =
    voucher.isActive && !isExpired && !isNotYetValid;

  const hasRedeemed = session?.user && voucher.redemptions && voucher.redemptions.length > 0;
  const canRedeem = isRedeemable && session?.user && !hasRedeemed;

  const redemptionsLeft = voucher.maxRedemptions
    ? voucher.maxRedemptions - voucher.redemptionsUsed
    : null;

  // Generate QR code for display
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const qrCodeImage = await generateVoucherQRCode(voucher.qrCode, appUrl);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/vouchers"
          className="text-purple-600 hover:text-purple-700 font-semibold mb-6 inline-block"
        >
          ← Zurück zur Übersicht
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Image */}
          {voucher.imageUrl ? (
            <div className="h-64 bg-gradient-to-br from-purple-400 to-blue-500 relative">
              <Image
                src={voucher.imageUrl}
                alt={voucher.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-purple-400 to-blue-500" />
          )}

          <div className="p-8">
            {/* Badge and Title */}
            <div className="mb-6">
              <span className="bg-purple-100 text-purple-700 text-sm font-semibold px-3 py-1 rounded">
                {voucher.category.name}
              </span>
              {!isRedeemable && (
                <span className="ml-2 bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded">
                  {isExpired ? "Abgelaufen" : isNotYetValid ? "Noch nicht gültig" : "Inaktiv"}
                </span>
              )}
              {hasRedeemed && (
                <span className="ml-2 bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded">
                  Bereits eingelöst
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold mb-4 text-gray-900">
              {voucher.title}
            </h1>

            {/* Discount/Value */}
            <div className="mb-6">
              {voucher.discount && (
                <div className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg">
                  <span className="text-3xl font-bold">-{voucher.discount}%</span>
                </div>
              )}
              {voucher.value && (
                <div className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg">
                  <span className="text-3xl font-bold">{voucher.value}€</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-gray-900">Beschreibung</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{voucher.description}</p>
            </div>

            {/* Terms */}
            {voucher.terms && (
              <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-3 text-gray-900">
                  Bedingungen
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{voucher.terms}</p>
              </div>
            )}

            {/* Validity */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Gültig ab</h3>
                <p className="text-gray-700">
                  {voucher.validFrom.toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
              {voucher.validUntil && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Gültig bis</h3>
                  <p className="text-gray-700">
                    {voucher.validUntil.toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Redemption Info */}
            {redemptionsLeft !== null && (
              <div className="mb-8">
                <p className="text-gray-700">
                  <span className="font-semibold">Verbleibende Einlösungen:</span>{" "}
                  {redemptionsLeft} von {voucher.maxRedemptions}
                </p>
              </div>
            )}

            {/* QR Code */}
            {canRedeem && (
              <div className="mb-8 bg-gray-50 p-6 rounded-lg text-center">
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  QR-Code zum Einlösen
                </h2>
                <div className="inline-block bg-white p-4 rounded-lg shadow">
                  <Image
                    src={qrCodeImage}
                    alt="QR Code"
                    width={250}
                    height={250}
                  />
                </div>
                <p className="text-gray-600 mt-4">
                  Zeige diesen QR-Code beim Partner vor, um den Gutschein einzulösen
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Code: {voucher.qrCode}
                </p>
              </div>
            )}

            {/* Redeem Button */}
            {!session?.user ? (
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-gray-700 mb-4">
                  Melde dich an, um diesen Gutschein einzulösen
                </p>
                <Link
                  href="/auth/signin"
                  className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Jetzt anmelden
                </Link>
              </div>
            ) : canRedeem ? (
              <form action={`/api/vouchers/${voucher.id}/redeem`} method="POST" className="mb-8">
                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-purple-700 transition text-lg"
                >
                  Gutschein jetzt einlösen
                </button>
              </form>
            ) : hasRedeemed ? (
              <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <p className="text-green-800 font-semibold">
                  Du hast diesen Gutschein bereits eingelöst
                </p>
              </div>
            ) : null}

            {/* Partner Info */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                Über den Partner
              </h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-purple-200 rounded-full flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {voucher.partner.businessName}
                  </h3>
                  {voucher.partner.description && (
                    <p className="text-gray-700 mt-2">
                      {voucher.partner.description}
                    </p>
                  )}
                  <div className="mt-4 space-y-2">
                    {voucher.partner.address && (
                      <p className="text-gray-600">
                        <span className="font-semibold">Adresse:</span>{" "}
                        {voucher.partner.address}
                      </p>
                    )}
                    {voucher.partner.phone && (
                      <p className="text-gray-600">
                        <span className="font-semibold">Telefon:</span>{" "}
                        {voucher.partner.phone}
                      </p>
                    )}
                    {voucher.partner.website && (
                      <p className="text-gray-600">
                        <span className="font-semibold">Website:</span>{" "}
                        <a
                          href={voucher.partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700"
                        >
                          {voucher.partner.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
