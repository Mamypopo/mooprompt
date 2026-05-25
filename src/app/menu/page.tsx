'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { determineItemType } from '@/lib/menu-item-type'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Minus, ShoppingCart, ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useCartStore } from '@/store/cart-store'
import { getSocket } from '@/lib/socket-client'
import Swal from 'sweetalert2'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface MenuItem {
  id: number
  name: string
  description?: string | null
  price: number
  imageUrl?: string
  isAvailable: boolean
  isBuffetItem?: boolean
  isALaCarteItem?: boolean
  isFreeInBuffet?: boolean
  isFeatured?: boolean
  isPopular?: boolean
}

interface Category {
  id: number
  name: string
  items: MenuItem[]
}

export default function MenuPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session')
  const [categories, setCategories] = useState<Category[]>([])
  const [sessionType, setSessionType] = useState<'buffet' | 'a_la_carte'>('a_la_carte')
  const [loading, setLoading] = useState(true)
  const { addItem, items } = useCartStore()
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [itemNote, setItemNote] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)
  const hasLoadedRef = useRef(false)
  const fetchingRef = useRef(false)
  const lastSessionIdRef = useRef<string | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchMenu = useCallback(async (silent = false) => {
    if (fetchingRef.current) return
    try {
      fetchingRef.current = true
      if (!silent) setLoading(true)
      const sessionIdNum = sessionId ? parseInt(sessionId, 10) : null
      const url = sessionIdNum ? `/api/menu?sessionId=${sessionIdNum}` : '/api/menu'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch menu')
      const data = await response.json()
      setCategories(data.categories || [])
      setSessionType(data.sessionType || 'a_la_carte')
      setIsExpired(!!data.isExpired)
      if (!silent) {
        hasLoadedRef.current = true
        lastSessionIdRef.current = sessionId
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      fetchingRef.current = false
      if (!silent) setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) { router.push('/'); return }
    if (lastSessionIdRef.current !== sessionId) {
      hasLoadedRef.current = false
      lastSessionIdRef.current = sessionId
      fetchMenu()
    }
    const socket = getSocket()
    const handleMenuUnavailable = () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = setTimeout(() => fetchMenu(true), 200)
    }
    socket.on('menu:unavailable', handleMenuUnavailable)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => {
      if (debounceTimeoutRef.current) { clearTimeout(debounceTimeoutRef.current); debounceTimeoutRef.current = null }
      socket.off('menu:unavailable', handleMenuUnavailable)
      window.removeEventListener('resize', checkMobile)
    }
  }, [sessionId, fetchMenu, router])

  const getQuantity = (id: number) => itemQuantities[id] || 1
  const getCartQuantity = (id: number) => items.find(i => i.menuItemId === id)?.qty ?? 0
  const totalCartItems = items.reduce((t, i) => t + i.qty, 0)

  const updateQuantity = (id: number, delta: number) =>
    setItemQuantities(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + delta) }))

  const handleItemClick = (item: MenuItem) => {
    if (!item.isAvailable || isExpired) return
    setSelectedItem(item)
    setIsDetailOpen(true)
    if (!itemQuantities[item.id]) setItemQuantities(prev => ({ ...prev, [item.id]: 1 }))
    setItemNote('')
  }

  // One-tap add — no sheet, no confirmation dialog
  const quickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!item.isAvailable) return
    if (isExpired) {
      Swal.fire({ icon: 'warning', title: 'หมดเวลาบุฟเฟ่ต์', toast: true, position: 'top', showConfirmButton: false, timer: 2000 })
      return
    }
    const itemType = determineItemType(sessionType, item)
    addItem({ menuItemId: item.id, name: item.name, price: itemType === 'BUFFET_INCLUDED' ? 0 : item.price, qty: 1, itemType })
    Swal.fire({ icon: 'success', title: `เพิ่ม ${item.name}`, toast: true, position: 'top', showConfirmButton: false, timer: 1200, timerProgressBar: true })
  }

  const handleAddToCart = (item: MenuItem) => {
    if (!item.isAvailable) return
    if (isExpired) {
      Swal.fire({ icon: 'warning', title: 'Session หมดอายุแล้ว', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
      return
    }
    const qty = getQuantity(item.id)
    const itemType = determineItemType(sessionType, item)
    addItem({ menuItemId: item.id, name: item.name, price: itemType === 'BUFFET_INCLUDED' ? 0 : item.price, qty, itemType, note: itemNote.trim() || undefined })
    setItemQuantities(prev => ({ ...prev, [item.id]: 1 }))
    Swal.fire({ icon: 'success', title: `เพิ่ม ${qty} รายการ`, toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true })
    setIsDetailOpen(false)
    setSelectedItem(null)
    setItemNote('')
  }

  // Categories visible in the tab strip
  const visibleCategories = categories.filter(cat => {
    const items = sessionType === 'buffet'
      ? cat.items.filter(i => i.isBuffetItem || i.isALaCarteItem)
      : cat.items.filter(i => i.isALaCarteItem)
    return items.length > 0
  })

  // Categories + items shown in the grid
  const displayCategories = categories
    .filter(cat => selectedCategory === 'all' || cat.id.toString() === selectedCategory)
    .map(cat => ({
      ...cat,
      items: sessionType === 'buffet'
        ? cat.items.filter(i => i.isBuffetItem || i.isALaCarteItem)
        : cat.items.filter(i => i.isALaCarteItem),
    }))
    .filter(cat => cat.items.length > 0)

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-background border-b">
          <div className="flex items-center gap-2 px-4 h-14">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-6 w-28 flex-1" />
            <Skeleton className="w-11 h-11 rounded-full" />
          </div>
          <div className="flex gap-2 px-4 pb-3 pt-1 overflow-hidden">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-9 w-20 rounded-full flex-shrink-0" />)}
          </div>
        </div>
        <div className="px-3 pt-4">
          <Skeleton className="h-5 w-20 mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i}>
                <Skeleton className="aspect-square rounded-2xl mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* ── Sticky header + tabs ── */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 h-14">
          <button
            onClick={() => router.push(`/session/${sessionId}`)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="กลับ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-lg font-bold">เมนูทั้งหมด</h1>
          <button
            onClick={() => router.push(`/cart?session=${sessionId}`)}
            className="relative w-11 h-11 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
            aria-label="ตะกร้า"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {totalCartItems > 99 ? '99+' : totalCartItems}
              </span>
            )}
          </button>
        </div>

        {/* Category tab pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3 pt-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'flex-shrink-0 px-4 h-9 rounded-full text-sm font-semibold transition-colors',
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            ทั้งหมด
          </button>
          {visibleCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id.toString())}
              className={cn(
                'flex-shrink-0 px-4 h-9 rounded-full text-sm font-semibold transition-colors whitespace-nowrap',
                selectedCategory === cat.id.toString()
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-3 pt-4">

        {/* Expired banner */}
        {isExpired && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive font-semibold">หมดเวลาบุฟเฟ่ต์ — ไม่สามารถสั่งเพิ่มได้</p>
          </div>
        )}

        {displayCategories.map(category => (
          <div key={category.id} className="mb-8">
            {/* Category heading */}
            <h2 className="text-base font-bold px-1 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-primary inline-block" />
              {category.name}
            </h2>

            {/* 2-col mobile, 3-col tablet, 4-col desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {category.items.map(item => {
                const isBuffetItem = sessionType === 'buffet' && item.isBuffetItem && !item.isALaCarteItem
                const inCart = getCartQuantity(item.id)
                const tappable = item.isAvailable && !isExpired
                return (
                  <div
                    key={item.id}
                    onClick={() => tappable && handleItemClick(item)}
                    className={cn(
                      'bg-card rounded-2xl overflow-hidden shadow-sm border border-border/40 transition-transform',
                      tappable ? 'cursor-pointer active:scale-[0.97]' : 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    {/* Square image */}
                    <div className="relative aspect-square bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl select-none">🍽️</div>
                      )}

                      {!item.isAvailable ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-lg">หมด</span>
                        </div>
                      ) : (
                        <>
                          {/* In-cart quantity badge */}
                          {inCart > 0 && (
                            <div className="absolute top-2 left-2 min-w-[24px] h-6 bg-primary rounded-full flex items-center justify-center px-1.5 shadow">
                              <span className="text-[11px] font-bold text-primary-foreground">{inCart}</span>
                            </div>
                          )}
                          {/* One-tap add button — 44px minimum touch target */}
                          {!isExpired && (
                            <button
                              onClick={e => quickAdd(item, e)}
                              className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md active:scale-90 transition-transform"
                              aria-label={`เพิ่ม ${item.name}`}
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Text body */}
                    <div className="p-2.5">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">{item.name}</h3>
                      <p className={cn('font-bold', isBuffetItem ? 'text-xs text-muted-foreground' : 'text-base text-primary')}>
                        {isBuffetItem ? 'รวมบุฟเฟ่ต์' : `฿${item.price.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Item detail — bottom sheet (mobile) ── */}
      {selectedItem && (
        <>
          <Sheet open={isDetailOpen && isMobile} onOpenChange={setIsDetailOpen}>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle className="text-xl">{selectedItem.name}</SheetTitle>
                <SheetDescription>
                  {sessionType === 'buffet' && selectedItem.isBuffetItem && !selectedItem.isALaCarteItem
                    ? 'รวมในบุฟเฟ่ต์'
                    : `฿${selectedItem.price.toLocaleString()}`}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-5">
                {selectedItem.imageUrl && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-muted">
                    <Image src={selectedItem.imageUrl} alt={selectedItem.name} fill sizes="90vw" className="object-cover" />
                  </div>
                )}
                {selectedItem.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedItem.description}</p>
                )}
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => updateQuantity(selectedItem.id, -1)} className="h-12 w-12 rounded-full" disabled={getQuantity(selectedItem.id) <= 1}>
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="text-3xl font-bold w-14 text-center tabular-nums">{getQuantity(selectedItem.id)}</span>
                  <Button variant="outline" size="icon" onClick={() => updateQuantity(selectedItem.id, 1)} className="h-12 w-12 rounded-full">
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-note" className="text-sm font-semibold">หมายเหตุ (ไม่บังคับ)</Label>
                  <Input id="item-note" placeholder="เช่น ไม่เผ็ด, ไม่ใส่ผัก" value={itemNote} onChange={e => setItemNote(e.target.value)} className="h-11" />
                </div>
              </div>
              <SheetFooter className="pt-4">
                <Button
                  onClick={() => handleAddToCart(selectedItem)}
                  className="w-full h-14 text-base font-bold rounded-xl"
                  disabled={!selectedItem.isAvailable}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  เพิ่มลงตะกร้า
                  {!(sessionType === 'buffet' && selectedItem.isBuffetItem && !selectedItem.isALaCarteItem) && (
                    <span className="ml-1 opacity-90">— ฿{(selectedItem.price * getQuantity(selectedItem.id)).toLocaleString()}</span>
                  )}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Item detail — dialog (desktop) */}
          <Dialog open={isDetailOpen && !isMobile} onOpenChange={setIsDetailOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedItem.name}</DialogTitle>
                <DialogDescription className="text-lg">
                  {sessionType === 'buffet' && selectedItem.isBuffetItem && !selectedItem.isALaCarteItem
                    ? 'รวมในบุฟเฟ่ต์'
                    : `฿${selectedItem.price.toLocaleString()}`}
                </DialogDescription>
              </DialogHeader>
              {selectedItem.imageUrl && (
                <div className="relative w-full h-64 rounded-xl overflow-hidden">
                  <Image src={selectedItem.imageUrl} alt={selectedItem.name} fill sizes="448px" className="object-cover" />
                </div>
              )}
              {selectedItem.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedItem.description}</p>
              )}
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="icon" onClick={() => updateQuantity(selectedItem.id, -1)} className="h-12 w-12 rounded-full" disabled={getQuantity(selectedItem.id) <= 1}>
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="text-3xl font-bold w-14 text-center tabular-nums">{getQuantity(selectedItem.id)}</span>
                <Button variant="outline" size="icon" onClick={() => updateQuantity(selectedItem.id, 1)} className="h-12 w-12 rounded-full">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-note-desktop" className="text-sm font-semibold">หมายเหตุ (ไม่บังคับ)</Label>
                <Input id="item-note-desktop" placeholder="เช่น ไม่เผ็ด, ไม่ใส่ผัก" value={itemNote} onChange={e => setItemNote(e.target.value)} className="h-11" />
              </div>
              <DialogFooter>
                <Button onClick={() => handleAddToCart(selectedItem)} className="w-full h-12 text-base font-bold" disabled={!selectedItem.isAvailable}>
                  <Plus className="w-5 h-5 mr-2" />
                  เพิ่มลงตะกร้า
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
