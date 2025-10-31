import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const createPartnerSchema = z.object({
  businessName: z.string().min(1),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
})

// GET /api/partners - Get all approved partners
export async function GET() {
  try {
    const partners = await prisma.partner.findMany({
      where: {
        isApproved: true
      },
      include: {
        _count: {
          select: {
            vouchers: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        businessName: 'asc'
      }
    })

    return NextResponse.json(partners)
  } catch (error) {
    console.error('Error fetching partners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    )
  }
}

// POST /api/partners - Register as a partner
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is already a partner
    const existingPartner = await prisma.partner.findUnique({
      where: { userId: session.user.id }
    })

    if (existingPartner) {
      return NextResponse.json(
        { error: 'User is already registered as a partner' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = createPartnerSchema.parse(body)

    // Create partner and update user role
    const partner = await prisma.$transaction(async (tx) => {
      const newPartner = await tx.partner.create({
        data: {
          ...validatedData,
          userId: session.user.id,
        }
      })

      await tx.user.update({
        where: { id: session.user.id },
        data: { role: 'PARTNER' }
      })

      return newPartner
    })

    return NextResponse.json(partner, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating partner:', error)
    return NextResponse.json(
      { error: 'Failed to create partner' },
      { status: 500 }
    )
  }
}
