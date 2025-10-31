import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyBabsyToken } from '@/lib/babsy-api'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

const verifyBabsySchema = z.object({
  token: z.string().min(1, 'Token erforderlich'),
})

/**
 * POST /api/auth/babsy/verify
 * Verifiziert einen Babsy App Token und erstellt/aktualisiert den User
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = verifyBabsySchema.parse(body)

    // Verifiziere Token bei Babsy App API
    const result = await verifyBabsyToken(token)

    if (!result.success || !result.user) {
      return NextResponse.json(
        {
          error: 'Ungültiger Babsy App Token',
          message: 'Bitte melden Sie sich erneut in der Babsy App an.',
        },
        { status: 401 }
      )
    }

    const babsyUser = result.user

    // Finde oder erstelle User
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: babsyUser.email },
          { babsyUserId: babsyUser.id },
        ],
      },
    })

    if (!user) {
      // Erstelle neuen User
      user = await prisma.user.create({
        data: {
          email: babsyUser.email,
          name: babsyUser.name,
          emailVerified: babsyUser.verified ? new Date() : null,
          authMethod: 'BABSY_APP',
          babsyUserId: babsyUser.id,
          babsyUserType: babsyUser.type,
          role: 'USER',
        },
      })
    } else {
      // Aktualisiere existierenden User
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authMethod: 'BABSY_APP',
          babsyUserId: babsyUser.id,
          babsyUserType: babsyUser.type,
          emailVerified: babsyUser.verified ? new Date() : user.emailVerified,
          name: babsyUser.name,
        },
      })
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
      message: 'Erfolgreich über Babsy App angemeldet',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        babsyUserType: user.babsyUserType,
      },
      redirectTo: '/vouchers',
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

    console.error('Error verifying Babsy token:', error)
    return NextResponse.json(
      {
        error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      },
      { status: 500 }
    )
  }
}
