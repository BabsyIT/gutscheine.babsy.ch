import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateUniqueVoucherCode, generateVoucherQRCode } from "@/lib/qrcode"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const createVoucherSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  terms: z.string().optional(),
  categoryId: z.string(),
  value: z.number().optional(),
  discount: z.number().int().min(0).max(100).optional(),
  maxRedemptions: z.number().int().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  imageUrl: z.string().url().optional(),
})

// GET /api/vouchers - Get all active vouchers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const partnerId = searchParams.get('partnerId')

    const where: any = {
      isActive: true,
      validFrom: { lte: new Date() },
      OR: [
        { validUntil: null },
        { validUntil: { gte: new Date() } }
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (partnerId) {
      where.partnerId = partnerId
    }

    const vouchers = await prisma.voucher.findMany({
      where,
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
        },
        _count: {
          select: {
            redemptions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(vouchers)
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    )
  }
}

// POST /api/vouchers - Create a new voucher (Partner only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a partner
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id }
    })

    if (!partner || !partner.isApproved) {
      return NextResponse.json(
        { error: 'Not authorized as partner' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createVoucherSchema.parse(body)

    // Generate unique voucher code
    const voucherCode = generateUniqueVoucherCode()

    // Generate QR code
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const qrCodeDataUrl = await generateVoucherQRCode(voucherCode, appUrl)

    // Create voucher
    const voucher = await prisma.voucher.create({
      data: {
        ...validatedData,
        partnerId: partner.id,
        qrCode: voucherCode,
        validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : new Date(),
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined,
      },
      include: {
        category: true,
        partner: {
          select: {
            businessName: true,
          }
        }
      }
    })

    return NextResponse.json({ ...voucher, qrCodeImage: qrCodeDataUrl }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating voucher:', error)
    return NextResponse.json(
      { error: 'Failed to create voucher' },
      { status: 500 }
    )
  }
}
