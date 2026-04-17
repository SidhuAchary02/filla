import { useState, useEffect, useCallback, useRef } from 'react'
import { getCurrentUser } from './authService'

const DEFAULT_EXPIRY_MS = 4 * 24 * 60 * 60 * 1000

const clearAuthStorage = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_id')
  localStorage.removeItem('auth_expiry')
  localStorage.removeItem('onboarding_complete')
  sessionStorage.removeItem('auth_token')
  sessionStorage.removeItem('user_id')
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const logoutTimerRef = useRef(null)

  // Try to restore session from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
        const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id')
        const expiryRaw = localStorage.getItem('auth_expiry')
        const expiry = expiryRaw ? Number(expiryRaw) : null

        if (!token || !userId) {
          clearAuthStorage()
          setUser(null)
          return
        }

        if (expiry && Number.isFinite(expiry) && Date.now() >= expiry) {
          clearAuthStorage()
          setUser(null)
          return
        }

        if (token && userId) {
          const userData = await getCurrentUser(token)
          setUser(userData)

          const isPersistentSession = Boolean(localStorage.getItem('auth_token'))
          const effectiveExpiry = expiry && Number.isFinite(expiry) ? expiry : (isPersistentSession ? Date.now() + DEFAULT_EXPIRY_MS : null)

          if (effectiveExpiry) {
            localStorage.setItem('auth_expiry', String(effectiveExpiry))
          }

          if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current)
          }

          if (effectiveExpiry) {
            const remainingMs = Math.max(effectiveExpiry - Date.now(), 0)
            logoutTimerRef.current = window.setTimeout(() => {
              clearAuthStorage()
              setUser(null)
            }, remainingMs)
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        clearAuthStorage()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current)
      }
    }
  }, [])

  // Update user in state
  const updateUser = useCallback((userData) => {
    setUser(userData)
  }, [])

  // Logout helper
  const logoutUser = useCallback(() => {
    clearAuthStorage()
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
    }
    setUser(null)
  }, [])

  // Get token helper (memoized to prevent dependency updates)
  const getToken = useCallback(() => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
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
