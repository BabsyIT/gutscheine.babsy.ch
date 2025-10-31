import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const updateVoucherSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  terms: z.string().optional(),
  categoryId: z.string().optional(),
  value: z.number().optional(),
  discount: z.number().int().min(0).max(100).optional(),
  maxRedemptions: z.number().int().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/vouchers/[id] - Get voucher by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
          }
        },
        category: true,
        _count: {
          select: {
            redemptions: true
          }
        }
      }
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Voucher not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(voucher)
  } catch (error) {
    console.error('Error fetching voucher:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voucher' },
      { status: 500 }
    )
  }
}

// PATCH /api/vouchers/[id] - Update voucher (Partner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get voucher and check ownership
    const existingVoucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        partner: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!existingVoucher) {
      return NextResponse.json(
        { error: 'Voucher not found' },
        { status: 404 }
      )
    }

    // Check if user owns this voucher or is admin
    if (existingVoucher.partner.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to update this voucher' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateVoucherSchema.parse(body)

    const voucher = await prisma.voucher.update({
      where: { id },
      data: {
        ...validatedData,
        validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : undefined,
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

    return NextResponse.json(voucher)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating voucher:', error)
    return NextResponse.json(
      { error: 'Failed to update voucher' },
      { status: 500 }
    )
  }
}

// DELETE /api/vouchers/[id] - Delete voucher (Partner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get voucher and check ownership
    const existingVoucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        partner: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!existingVoucher) {
      return NextResponse.json(
        { error: 'Voucher not found' },
        { status: 404 }
      )
    }

    // Check if user owns this voucher or is admin
    if (existingVoucher.partner.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to delete this voucher' },
        { status: 403 }
      )
    }

    await prisma.voucher.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting voucher:', error)
    return NextResponse.json(
      { error: 'Failed to delete voucher' },
      { status: 500 }
    )
  }
}
