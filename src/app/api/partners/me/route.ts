import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const updatePartnerSchema = z.object({
  businessName: z.string().min(1).optional(),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
})

// GET /api/partners/me - Get current user's partner profile
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      include: {
        vouchers: {
          include: {
            category: true,
            _count: {
              select: {
                redemptions: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            vouchers: true
          }
        }
      }
    })

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(partner)
  } catch (error) {
    console.error('Error fetching partner profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch partner profile' },
      { status: 500 }
    )
  }
}

// PATCH /api/partners/me - Update current user's partner profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id }
    })

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updatePartnerSchema.parse(body)

    const updatedPartner = await prisma.partner.update({
      where: { userId: session.user.id },
      data: validatedData
    })

    return NextResponse.json(updatedPartner)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating partner profile:', error)
    return NextResponse.json(
      { error: 'Failed to update partner profile' },
      { status: 500 }
    )
  }
}
