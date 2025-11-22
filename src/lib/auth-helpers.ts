'use client'

export function getUser() {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function logout() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  window.location.href = '/login'
}

export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

