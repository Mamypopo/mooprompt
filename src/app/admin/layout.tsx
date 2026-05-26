'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/admin/sidebar'
import { Topbar } from '@/components/admin/topbar'
import { getUser } from '@/lib/auth-helpers'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user has admin access
    const allowedRoles = ['ADMIN', 'MANAGER', 'CASHIER']
    if (!allowedRoles.includes(user.role)) {
      router.push('/login')
      return
    }
  }, [router])

  return (
    <div className="min-h-screen flex bg-stone-50 dark:bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 sm:p-10 overflow-x-auto">{children}</main>
      </div>
    </div>
  )
}

