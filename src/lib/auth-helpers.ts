'use client'

import Swal from 'sweetalert2'

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

export async function logout() {
  if (typeof window === 'undefined') return

  const result = await Swal.fire({
    title: 'ยืนยันการออกจากระบบ',
    text: 'คุณต้องการออกจากระบบหรือไม่?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ออกจากระบบ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#FF6A8B',
  })

  if (!result.isConfirmed) return

  // Clear httpOnly cookie via API + clear local user info
  await fetch('/api/auth/logout', { method: 'POST' })
  localStorage.removeItem('user')

  Swal.fire({
    icon: 'success',
    title: 'ออกจากระบบสำเร็จ',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  }).then(() => {
    window.location.href = '/login'
  })
}

export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}
