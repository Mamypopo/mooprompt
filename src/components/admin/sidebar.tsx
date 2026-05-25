'use client'

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
  LayoutDashboard,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="hidden lg:block w-64 bg-card border-r min-h-screen p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              onClick={() => router.push(item.href)}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start',
                isActive && 'bg-primary text-primary-foreground'
              )}
            >
              <Icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
          )
        })}
      </nav>
    </aside>
  )
}

