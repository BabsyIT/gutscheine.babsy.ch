import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyOTPToken } from '@/lib/otp'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

const verifyOTPSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Der Code muss 6 Ziffern haben'),
})

/**
 * POST /api/auth/otp/verify
 * Verifiziert einen OTP-Code und erstellt eine Session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = verifyOTPSchema.parse(body)

    const normalizedEmail = email.toLowerCase().trim()

    // Verifiziere OTP
    const result = await verifyOTPToken(normalizedEmail, code)

    if (!result.valid || !result.userId) {
      return NextResponse.json(
        {
          error: 'Ungültiger oder abgelaufener Code',
          message: 'Bitte fordern Sie einen neuen Code an.',
        },
        { status: 401 }
      )
    }

    // Hole User-Daten
    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        authMethod: true,
        emailVerified: true,
        partner: {
          select: {
            id: true,
            businessName: true,
            isApproved: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    // Erstelle Session
    const sessionToken = crypto.randomUUID()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 Tage

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    })

    // Setze Session Cookie
    const cookieStore = await cookies()
    cookieStore.set('next-auth.session-token', sessionToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: 'Erfolgreich angemeldet',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isPartner: !!user.partner,
        partnerApproved: user.partner?.isApproved || false,
      },
      redirectTo: user.partner
        ? user.partner.isApproved
          ? '/partner'
          : '/partner/pending'
        : '/vouchers',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Ungültige Eingabe',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    console.error('Error verifying OTP:', error)
    return NextResponse.json(
      {
        error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      },
      { status: 500 }
    )
  }
}
