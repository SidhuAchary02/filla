const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// ============ SIGNUP ============
export async function signup(email, password) {
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
    
    // Store token in localStorage
    localStorage.setItem('auth_token', data.access_token)
    localStorage.setItem('user_id', data.user_id)
    
    return data;
  } catch (error) {
    console.error('Signup error:', error)
    throw error
  }
}

// ============ LOGIN ============
export async function login(email, password) {
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
    
    // Store token in localStorage
    localStorage.setItem('auth_token', data.access_token)
    localStorage.setItem('user_id', data.user_id)
    
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
      throw new Error(error.detail || 'Failed to submit onboarding')
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

// ============ LOGOUT ============
export function logout() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_id')
}
