import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const redeemVoucherSchema = z.object({
  location: z.string().optional(),
  notes: z.string().optional(),
})

// POST /api/vouchers/[id]/redeem - Redeem a voucher
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to redeem vouchers' },
        { status: 401 }
      )
    }

    // Get voucher
    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        redemptions: {
          where: {
            userId: session.user.id
          }
        },
        partner: {
          select: {
            businessName: true
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

    // Check if voucher is active
    if (!voucher.isActive) {
      return NextResponse.json(
        { error: 'This voucher is no longer active' },
        { status: 400 }
      )
    }

    // Check validity dates
    const now = new Date()
    if (voucher.validFrom > now) {
      return NextResponse.json(
        { error: 'This voucher is not yet valid' },
        { status: 400 }
      )
    }

    if (voucher.validUntil && voucher.validUntil < now) {
      return NextResponse.json(
        { error: 'This voucher has expired' },
        { status: 400 }
      )
    }

    // Check max redemptions
    if (voucher.maxRedemptions !== null && voucher.redemptionsUsed >= voucher.maxRedemptions) {
      return NextResponse.json(
        { error: 'This voucher has reached its maximum redemption limit' },
        { status: 400 }
      )
    }

    // Check if user has already redeemed this voucher
    if (voucher.redemptions.length > 0) {
      return NextResponse.json(
        { error: 'You have already redeemed this voucher' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = redeemVoucherSchema.parse(body)

    // Create redemption and increment counter
    const redemption = await prisma.$transaction(async (tx) => {
      const newRedemption = await tx.voucherRedemption.create({
        data: {
          voucherId: voucher.id,
          userId: session.user.id,
          location: validatedData.location,
          notes: validatedData.notes,
        },
        include: {
          voucher: {
            include: {
              partner: {
                select: {
                  businessName: true,
                  address: true,
                  phone: true,
                }
              },
              category: true,
            }
          }
        }
      })

      await tx.voucher.update({
        where: { id: voucher.id },
        data: {
          redemptionsUsed: {
            increment: 1
          }
        }
      })

      return newRedemption
    })

    return NextResponse.json({
      success: true,
      redemption,
      message: 'Voucher successfully redeemed!'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error redeeming voucher:', error)
    return NextResponse.json(
      { error: 'Failed to redeem voucher' },
      { status: 500 }
    )
  }
}

// GET /api/vouchers/[id]/redeem - Check if voucher can be redeemed
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({
        canRedeem: false,
        reason: 'Not authenticated'
      })
    }

    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        redemptions: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    if (!voucher) {
      return NextResponse.json({
        canRedeem: false,
        reason: 'Voucher not found'
      })
    }

    const now = new Date()
    let canRedeem = true
    let reason = ''

    if (!voucher.isActive) {
      canRedeem = false
      reason = 'Voucher is not active'
    } else if (voucher.validFrom > now) {
      canRedeem = false
      reason = 'Voucher is not yet valid'
    } else if (voucher.validUntil && voucher.validUntil < now) {
      canRedeem = false
      reason = 'Voucher has expired'
    } else if (voucher.maxRedemptions !== null && voucher.redemptionsUsed >= voucher.maxRedemptions) {
      canRedeem = false
      reason = 'Maximum redemptions reached'
    } else if (voucher.redemptions.length > 0) {
      canRedeem = false
      reason = 'Already redeemed by you'
    }

    return NextResponse.json({
      canRedeem,
      reason,
      redemptionsLeft: voucher.maxRedemptions
        ? voucher.maxRedemptions - voucher.redemptionsUsed
        : null
    })
  } catch (error) {
    console.error('Error checking voucher redemption status:', error)
    return NextResponse.json(
      { error: 'Failed to check voucher status' },
      { status: 500 }
    )
  }
}
