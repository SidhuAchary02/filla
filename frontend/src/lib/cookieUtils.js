/**
 * Cookie Utilities for Authentication
 * Simple and reliable cookie management
 */

const COOKIE_DEFAULTS = {
  path: '/',
  domain: window.location.hostname === 'localhost' ? undefined : `.${window.location.hostname}`,
}

export function setCookie(name, value, options = {}) {
  const config = { ...COOKIE_DEFAULTS, ...options }
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
  
  if (config.maxAge) {
    cookieString += `; Max-Age=${config.maxAge}`
  }
  if (config.path) {
    cookieString += `; path=${config.path}`
  }
  if (config.domain) {
    cookieString += `; domain=${config.domain}`
  }
  if (config.secure) {
    cookieString += '; Secure'
  }
  if (config.sameSite) {
    cookieString += `; SameSite=${config.sameSite}`
  }
  
  document.cookie = cookieString
}

export function getCookie(name) {
  const nameEQ = `${encodeURIComponent(name)}=`
  const cookies = document.cookie.split(';')
  
  for (let cookie of cookies) {
    cookie = cookie.trim()
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }
  
  return null
}

export function removeCookie(name, options = {}) {
  setCookie(name, '', {
    ...options,
    maxAge: -1,
  })
}

export function getAllAuthCookies() {
  return {
    auth_token: getCookie('auth_token'),
    user_id: getCookie('user_id'),
    auth_expiry: getCookie('auth_expiry'),
  }
}

export function clearAuthCookies() {
  removeCookie('auth_token')
  removeCookie('user_id')
  removeCookie('auth_expiry')
  removeCookie('onboarding_complete')
}
