'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Home, Menu as MenuIcon, ShoppingCart, Receipt } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { cn } from '@/lib/utils'

export function CustomerFooter() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items } = useCartStore()
  const sessionId = searchParams.get('session') || pathname.split('/')[2]

  const totalCartItems = items.reduce((sum, item) => sum + item.qty, 0)

  const navItems = [
    {
      href: `/session/${sessionId}`,
      icon: Home,
      label: 'หน้าหลัก',
      isActive: pathname.startsWith('/session/'),
    },
    {
      href: `/menu?session=${sessionId}`,
      icon: MenuIcon,
      label: 'เมนู',
      isActive: pathname === '/menu',
    },
    {
      href: `/cart?session=${sessionId}`,
      icon: ShoppingCart,
      label: 'ตะกร้า',
      isActive: pathname === '/cart',
      badge: totalCartItems > 0 ? totalCartItems : undefined,
    },
    {
      href: `/orders?session=${sessionId}`,
      icon: Receipt,
      label: 'ออเดอร์',
      isActive: pathname === '/orders',
    },
  ]

  if (pathname === '/' || !sessionId) return null

  const customerPages = ['/menu', '/cart', '/orders', '/session']
  if (!customerPages.some(p => pathname.startsWith(p))) return null

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg md:hidden pb-safe">
      <div className="grid grid-cols-4 h-[72px]">
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 transition-colors',
                item.isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {/* Active indicator bar */}
              {item.isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}

              <div className="relative">
                <Icon className={cn('w-6 h-6 transition-transform', item.isActive && 'scale-110')} />
                {item.badge !== undefined && (
                  <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span className={cn('text-[11px] font-medium', item.isActive && 'font-bold')}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </footer>
  )
}
