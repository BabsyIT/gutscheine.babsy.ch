/**
 * Babsy App API Client
 * Integration with Babsy App for Sitter/Parent authentication
 */

export interface BabsyUser {
  id: string
  email: string
  name: string
  type: 'SITTER' | 'PARENT'
  verified: boolean
}

export interface BabsyAuthResponse {
  success: boolean
  user?: BabsyUser
  error?: string
}

/**
 * Verify a Babsy App auth token
 */
export async function verifyBabsyToken(token: string): Promise<BabsyAuthResponse> {
  const apiUrl = process.env.BABSY_APP_API_URL
  const apiKey = process.env.BABSY_APP_API_KEY

  if (!apiUrl || !apiKey) {
    console.error('Babsy App API not configured')
    return {
      success: false,
      error: 'Babsy App API not configured'
    }
  }

  try {
    const response = await fetch(`${apiUrl}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      return {
        success: false,
        error: 'Invalid token'
      }
    }

    const data = await response.json()

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || data.user.firstName + ' ' + data.user.lastName,
        type: data.user.type,
        verified: data.user.verified || false,
      }
    }
  } catch (error) {
    console.error('Error verifying Babsy token:', error)
    return {
      success: false,
      error: 'Failed to verify token'
    }
  }
}

/**
 * Get user info from Babsy App API
 */
export async function getBabsyUser(userId: string): Promise<BabsyUser | null> {
  const apiUrl = process.env.BABSY_APP_API_URL
  const apiKey = process.env.BABSY_APP_API_KEY

  if (!apiUrl || !apiKey) {
    return null
  }

  try {
    const response = await fetch(`${apiUrl}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    return {
      id: data.id,
      email: data.email,
      name: data.name || data.firstName + ' ' + data.lastName,
      type: data.type,
      verified: data.verified || false,
    }
  } catch (error) {
    console.error('Error getting Babsy user:', error)
    return null
  }
}

/**
 * Check if user is active in Babsy App
 */
export async function isBabsyUserActive(userId: string): Promise<boolean> {
  const user = await getBabsyUser(userId)
  return user !== null && user.verified
}
