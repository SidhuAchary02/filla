import { useState, useEffect, useCallback, useRef } from 'react'
import { getCurrentUser } from './authService'
import { getCookie, setCookie, clearAuthCookies } from './cookieUtils'

const DEFAULT_EXPIRY_MS = 4 * 24 * 60 * 60 * 1000

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const logoutTimerRef = useRef(null)

  // Try to restore session from cookies
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getCookie('auth_token')
        const userId = getCookie('user_id')
        const expiryRaw = getCookie('auth_expiry')
        const expiry = expiryRaw ? Number(expiryRaw) : null

        if (!token || !userId) {
          clearAuthCookies()
          setUser(null)
          return
        }

        if (expiry && Number.isFinite(expiry) && Date.now() >= expiry) {
          clearAuthCookies()
          setUser(null)
          return
        }

        if (token && userId) {
          const userData = await getCurrentUser(token)
          setUser(userData)

          const effectiveExpiry = expiry && Number.isFinite(expiry) ? expiry : (Date.now() + DEFAULT_EXPIRY_MS)

          if (effectiveExpiry) {
            setCookie('auth_expiry', String(effectiveExpiry), { maxAge: Math.floor((effectiveExpiry - Date.now()) / 1000) })
          }

          if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current)
          }

          if (effectiveExpiry) {
            const remainingMs = Math.max(effectiveExpiry - Date.now(), 0)
            logoutTimerRef.current = window.setTimeout(() => {
              clearAuthCookies()
              setUser(null)
            }, remainingMs)
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        clearAuthCookies()
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
    clearAuthCookies()
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
    }
    setUser(null)
  }, [])

  // Get token helper (memoized to prevent dependency updates)
  const getToken = useCallback(() => {
    return getCookie('auth_token')
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
