import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createOTPToken, isPartnerDomain } from '@/lib/otp'
import { sendOTPEmail } from '@/lib/exchange-email'
import { prisma } from '@/lib/prisma'

const requestOTPSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
})

/**
 * POST /api/auth/otp/request
 * Fordert einen OTP-Code an und sendet ihn per E-Mail
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = requestOTPSchema.parse(body)

    const normalizedEmail = email.toLowerCase().trim()

    // Prüfe ob die Domain für Partner-Login erlaubt ist
    if (!isPartnerDomain(normalizedEmail)) {
      return NextResponse.json(
        {
          error: 'Diese E-Mail-Domain ist nicht für Partner-Login zugelassen.',
          message: 'Bitte verwenden Sie Ihre geschäftliche E-Mail-Adresse.',
        },
        { status: 400 }
      )
    }

    // Rate Limiting: Prüfe ob bereits kürzlich ein OTP angefordert wurde
    const recentOTP = await prisma.otpToken.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Letzte 60 Sekunden
        },
      },
    })

    if (recentOTP) {
      return NextResponse.json(
        {
          error: 'Bitte warten Sie eine Minute, bevor Sie einen neuen Code anfordern.',
        },
        { status: 429 }
      )
    }

    // Generiere OTP
    const otp = await createOTPToken(normalizedEmail)

    // Sende OTP per E-Mail via Exchange Online
    const emailSent = await sendOTPEmail(normalizedEmail, otp)

    if (!emailSent) {
      return NextResponse.json(
        {
          error: 'Fehler beim Versenden der E-Mail. Bitte versuchen Sie es später erneut.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Ein Login-Code wurde an Ihre E-Mail-Adresse gesendet.',
      email: normalizedEmail,
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

    console.error('Error requesting OTP:', error)
    return NextResponse.json(
      {
        error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      },
      { status: 500 }
    )
  }
}
