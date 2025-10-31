import { randomInt } from 'crypto'
import { prisma } from './prisma'

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return randomInt(100000, 999999).toString()
}

/**
 * Create and store an OTP token for a user
 */
export async function createOTPToken(email: string, userId?: string): Promise<string> {
  const token = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // If no userId provided, find or create user
  let finalUserId = userId
  if (!finalUserId) {
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          authMethod: 'OTP',
          emailVerified: null,
        }
      })
    }

    finalUserId = user.id
  }

  await prisma.otpToken.create({
    data: {
      userId: finalUserId,
      email,
      token,
      expiresAt,
    }
  })

  return token
}

/**
 * Verify an OTP token
 */
export async function verifyOTPToken(email: string, token: string): Promise<{ valid: boolean; userId?: string }> {
  const otpToken = await prisma.otpToken.findFirst({
    where: {
      email,
      token,
      used: false,
      expiresAt: {
        gte: new Date()
      }
    },
    include: {
      user: true
    }
  })

  if (!otpToken) {
    return { valid: false }
  }

  // Mark token as used
  await prisma.otpToken.update({
    where: { id: otpToken.id },
    data: { used: true }
  })

  // Update email verification
  if (!otpToken.user.emailVerified) {
    await prisma.user.update({
      where: { id: otpToken.userId },
      data: { emailVerified: new Date() }
    })
  }

  return {
    valid: true,
    userId: otpToken.userId
  }
}

/**
 * Clean up expired OTP tokens (run periodically)
 */
export async function cleanupExpiredOTPTokens(): Promise<number> {
  const result = await prisma.otpToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // 24h old used tokens
      ]
    }
  })

  return result.count
}

/**
 * Check if email domain is allowed for partner OTP
 */
export function isPartnerDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()

  // Configure allowed domains for partners
  const blockedDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'proton.me',
    'protonmail.com',
  ]

  return !blockedDomains.includes(domain)
}
