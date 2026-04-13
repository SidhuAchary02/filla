import { useState, useEffect, useCallback } from 'react'
import { getCurrentUser } from './authService'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Try to restore session from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const userId = localStorage.getItem('user_id')

        if (token && userId) {
          const userData = await getCurrentUser(token)
          setUser(userData)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        // Clear invalid token and onboarding flag
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_id')
        localStorage.removeItem('onboarding_complete')
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  // Update user in state
  const updateUser = useCallback((userData) => {
    setUser(userData)
  }, [])

  // Logout helper
  const logoutUser = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('onboarding_complete')
    setUser(null)
  }, [])

  // Get token helper (memoized to prevent dependency updates)
  const getToken = useCallback(() => {
    return localStorage.getItem('auth_token')
  }, [])

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    updateUser,
    logout: logoutUser,
    getToken,
  }
}
