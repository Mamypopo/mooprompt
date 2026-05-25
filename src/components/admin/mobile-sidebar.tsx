'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  Table as TableIcon,
  Package,
  Receipt,
  Tag,
  Settings,
  Users,
  QrCode,
  X,
  Menu as MenuIcon,
  LayoutDashboard,
  History,
  ChefHat,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const menuItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'ภาพรวม' },
  { href: '/admin/open-table', icon: QrCode, label: 'เปิดโต๊ะ' },
  { href: '/admin/close-table', icon: X, label: 'ปิดโต๊ะ' },
  { href: '/admin/tables', icon: TableIcon, label: 'จัดการโต๊ะ' },
  { href: '/admin/menu', icon: Menu, label: 'จัดการเมนู' },
  { href: '/admin/packages', icon: Package, label: 'จัดการแพ็กเกจ' },
  { href: '/admin/extra-charges', icon: Receipt, label: 'ค่าบริการเพิ่มเติม' },
  { href: '/admin/promotions', icon: Tag, label: 'โปรโมชั่น' },
  { href: '/admin/history', icon: History, label: 'ประวัติการขาย' },
  { href: '/admin/settings', icon: Settings, label: 'ตั้งค่าร้าน' },
  { href: '/admin/users', icon: Users, label: 'จัดการผู้ใช้' },
]

export function MobileSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <MenuIcon className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-gray-900 border-r-0">
        <SheetTitle className="sr-only">เมนูหลัก</SheetTitle>
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none">Mooprompt</p>
            <p className="text-gray-400 text-xs mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href)
                  setOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary' : '')} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
