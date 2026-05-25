'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/auth-helpers'
import { MobileSidebar } from './mobile-sidebar'

export function Topbar() {
  return (
    <header className="h-14 sm:h-16 border-b bg-background flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <MobileSidebar />
        <span className="text-sm text-muted-foreground font-medium lg:hidden">Mooprompt</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={logout}
        className="text-muted-foreground hover:text-foreground gap-1.5"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline text-sm">ออกจากระบบ</span>
      </Button>
    </header>
  )
}
