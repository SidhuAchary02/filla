import { setCookie, removeCookie, getCookie, clearAuthCookies } from './cookieUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const FOUR_DAYS_IN_SECONDS = 4 * 24 * 60 * 60

function persistAuthSession(accessToken, userId, rememberMe = true) {
  if (rememberMe) {
    // Set persistent cookies (4 days)
    setCookie('auth_token', accessToken, { maxAge: FOUR_DAYS_IN_SECONDS })
    setCookie('user_id', userId, { maxAge: FOUR_DAYS_IN_SECONDS })
    const expiry = Date.now() + (FOUR_DAYS_IN_SECONDS * 1000)
    setCookie('auth_expiry', expiry.toString(), { maxAge: FOUR_DAYS_IN_SECONDS })
  } else {
    // Set session-only cookies (browser session)
    setCookie('auth_token', accessToken)
    setCookie('user_id', userId)
  }
}

// ============ SIGNUP ============
export async function signup(email, password, rememberMe = true) {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Signup failed')
    }

    const data = await response.json()
    
    persistAuthSession(data.access_token, data.user_id, rememberMe)
    
    return data;
  } catch (error) {
    console.error('Signup error:', error)
    throw error
  }
}

// ============ LOGIN ============
export async function login(email, password, rememberMe = true) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Login failed')
    }

    const data = await response.json()
    
    persistAuthSession(data.access_token, data.user_id, rememberMe)
    
    return data
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

// ============ GET CURRENT USER ============
export async function getCurrentUser(token) {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user')
    }

    return await response.json()
  } catch (error) {
    console.error('Get current user error:', error)
    throw error
  }
}

// ============ SUBMIT ONBOARDING ============
export async function submitOnboarding(data, token) {
  try {
    const response = await fetch(`${API_URL}/onboarding`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      const detail = error?.detail
      let message = 'Failed to submit onboarding'

      if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0]
        if (typeof first === 'string') {
          message = first
        } else {
          const loc = Array.isArray(first?.loc) ? first.loc.join('.') : 'field'
          message = `${loc}: ${first?.msg || 'Invalid value'}`
        }
      } else if (detail && typeof detail === 'object') {
        message = JSON.stringify(detail)
      }

      throw new Error(message)
    }

    return await response.json()
  } catch (error) {
    console.error('Onboarding submission error:', error)
    throw error
  }
}

// ============ GET ONBOARDING STATUS ============
export async function getOnboardingStatus(token) {
  try {
    const response = await fetch(`${API_URL}/onboarding/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch onboarding status')
    }

    return await response.json()
  } catch (error) {
    console.error('Get onboarding status error:', error)
    throw error
  }
}

// ============ GET USER PROFILE ============
export async function getUserProfile(token) {
  try {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch profile')
    }

    return await response.json()
  } catch (error) {
    console.error('Get user profile error:', error)
    throw error
  }
}

// ============ UPDATE USER PROFILE ============
export async function updateUserProfile(data, token) {
  try {
    const response = await fetch(`${API_URL}/personal-info`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      
      // Handle validation errors properly
      const detail = error.detail
      let message = 'Failed to update profile'

      if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        // Format validation errors properly
        const errorMessages = detail.map(err => {
          if (typeof err === 'string') return err
          if (err && typeof err === 'object') {
            const loc = Array.isArray(err.loc) ? err.loc.join('.') : 'field'
            return `${loc}: ${err.msg || 'Invalid value'}`
          }
          return String(err)
        })
        message = errorMessages.join('; ')
      } else if (detail && typeof detail === 'object') {
        message = JSON.stringify(detail)
      }

      throw new Error(message)
    }

    return await response.json()
  } catch (error) {
    console.error('Update user profile error:', error)
    throw error
  }
}

// ============ LOGOUT ============
export function logout() {
  clearAuthCookies()
}
