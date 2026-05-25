'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { determineItemType } from '@/lib/menu-item-type'
import {
  ShoppingCart, Receipt, ChevronLeft, ChevronRight,
  Plus, Minus, Clock, AlertCircle, BellRing, Users, Package, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SessionSkeleton } from '@/components/skeletons'
import { useCartStore } from '@/store/cart-store'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import Swal from 'sweetalert2'

interface MenuItem {
  id: number
  name: string
  description?: string | null
  price: number
  imageUrl?: string
  isAvailable: boolean
  isBuffetItem?: boolean
  isALaCarteItem?: boolean
  isFeatured?: boolean
  isPopular?: boolean
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [popularItems, setPopularItems] = useState<MenuItem[]>([])
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([])
  const [heroSlideIndex, setHeroSlideIndex] = useState(0)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [itemNote, setItemNote] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const { addItem, items } = useCartStore()
  const [sessionType, setSessionType] = useState<'buffet' | 'a_la_carte'>('a_la_carte')
  const [timeRemaining, setTimeRemaining] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [callCooldownSec, setCallCooldownSec] = useState(0)

  const totalCartItems = items.reduce((t, i) => t + i.qty, 0)

  const updateTimeRemaining = useCallback((expireTime: string) => {
    const update = () => {
      const diff = new Date(expireTime).getTime() - Date.now()
      if (diff <= 0) { setTimeRemaining('หมดอายุแล้ว'); setIsExpired(true); return }
      setIsExpired(false)
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeRemaining(h > 0 ? `${h} ชม. ${m} นาที` : m > 0 ? `${m} นาที ${s} วินาที` : `${s} วินาที`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  const fetchPopularItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/menu/popular?sessionId=${parseInt(sessionId, 10)}&limit=6`)
      const data = await res.json()
      setPopularItems(data.items || [])
    } catch (e) { console.error(e) }
  }, [sessionId])

  const fetchFeaturedItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/menu?sessionId=${parseInt(sessionId, 10)}`)
      const data = await res.json()
      const featured: MenuItem[] = []
      data.categories?.forEach((cat: any) => cat.items?.forEach((item: any) => {
        if (item.isFeatured && item.isAvailable) featured.push(item)
      }))
      setFeaturedItems(featured.slice(0, 4))
    } catch (e) { console.error(e) }
  }, [sessionId])

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const n = parseInt(sessionId, 10)
        if (isNaN(n)) { Swal.fire({ icon: 'error', title: 'Session ไม่ถูกต้อง', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 }); router.push('/'); return }
        const res = await fetch(`/api/session/${n}`)
        const data = await res.json()
        if (!res.ok) { router.push('/'); return }
        setSession(data.session)
        setSessionType(data.session?.packageId ? 'buffet' : 'a_la_carte')
        if (data.isExpired) setIsExpired(true)
        if (data.session?.expireTime) updateTimeRemaining(data.session.expireTime)
      } catch { router.push('/') }
      finally { setLoading(false) }
    }
    fetchSession()
    fetchPopularItems()
    fetchFeaturedItems()
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [sessionId, router, fetchPopularItems, fetchFeaturedItems, updateTimeRemaining])

  useEffect(() => {
    if (session?.expireTime) return updateTimeRemaining(session.expireTime)
  }, [session?.expireTime, updateTimeRemaining])

  const handleCallStaff = async () => {
    if (isCalling || callCooldownSec > 0) return
    setIsCalling(true)
    try {
      await fetch('/api/staff/call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
      Swal.fire({ icon: 'success', title: 'เรียกพนักงานแล้ว', text: 'พนักงานกำลังมาหาคุณ', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 })
      setCallCooldownSec(60)
      const tick = setInterval(() => setCallCooldownSec(p => { if (p <= 1) { clearInterval(tick); return 0 } return p - 1 }), 1000)
    } catch { Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 }) }
    finally { setIsCalling(false) }
  }

  const handleItemClick = (item: MenuItem) => {
    if (!item.isAvailable || isExpired) return
    setSelectedItem(item); setItemQuantity(1); setItemNote(''); setIsDetailOpen(true)
  }

  // One-tap add from card + button
  const quickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!item.isAvailable || isExpired) return
    const itemType = determineItemType(sessionType, item)
    addItem({ menuItemId: item.id, name: item.name, price: itemType === 'BUFFET_INCLUDED' ? 0 : item.price, qty: 1, itemType })
    Swal.fire({ icon: 'success', title: `เพิ่ม ${item.name}`, toast: true, position: 'top', showConfirmButton: false, timer: 1200, timerProgressBar: true })
  }

  const handleAddToCart = (item: MenuItem) => {
    if (!item.isAvailable || isExpired) return
    const itemType = determineItemType(sessionType, item)
    addItem({ menuItemId: item.id, name: item.name, price: itemType === 'BUFFET_INCLUDED' ? 0 : item.price, qty: itemQuantity, note: itemNote, itemType })
    Swal.fire({ icon: 'success', title: `เพิ่ม ${itemQuantity} รายการ`, toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true })
    setIsDetailOpen(false); setItemNote(''); setItemQuantity(1)
  }

  if (loading) return <SessionSkeleton />

  const isTimeLow = timeRemaining && !timeRemaining.includes('ชม.') && timeRemaining.includes('นาที')

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* ── Session expired overlay ── */}
      {isExpired && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm text-center shadow-xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-9 h-9 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">หมดเวลาบุฟเฟ่ต์แล้ว</h2>
            <p className="text-sm text-muted-foreground">เวลาบุฟเฟ่ต์หมดแล้ว ไม่สามารถสั่งเพิ่มได้ กรุณาติดต่อพนักงาน</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push(`/orders?session=${sessionId}`)} className="w-full h-12">ดูออเดอร์ทั้งหมด</Button>
              <Button onClick={handleCallStaff} variant="outline" className="w-full h-12" disabled={isCalling || callCooldownSec > 0}>
                <BellRing className="w-4 h-4 mr-2" />
                {callCooldownSec > 0 ? `เรียกแล้ว (${callCooldownSec}s)` : 'เรียกพนักงาน'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Table + info chips */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-lg font-bold truncate">โต๊ะ {session?.table?.tableNumber}</span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              <Users className="w-3 h-3" />{session?.peopleCount} คน
            </span>

            {session?.package && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary">
                <Package className="w-3 h-3" />{session.package.name}
              </span>
            )}

            {timeRemaining && timeRemaining !== 'หมดอายุแล้ว' && (
              <span className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                isTimeLow ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'
              )}>
                <Clock className="w-3 h-3" />{timeRemaining}
              </span>
            )}
          </div>

          {/* Right: cart + call staff */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCallStaff}
              disabled={isCalling || callCooldownSec > 0}
              className={cn(
                'flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-semibold border transition-colors',
                callCooldownSec > 0
                  ? 'bg-muted text-muted-foreground border-border'
                  : 'bg-background text-foreground border-border hover:bg-muted'
              )}
            >
              <BellRing className="w-3.5 h-3.5" />
              {callCooldownSec > 0 ? `${callCooldownSec}s` : 'เรียก'}
            </button>

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
        </div>
      </div>

      <div className="px-3 pt-4">

        {/* ── Hero banner / carousel ── */}
        {featuredItems.length > 0 && (
          <div className="mb-6 relative overflow-hidden rounded-2xl">
            <div className="relative h-52 sm:h-64 md:h-80 bg-muted rounded-2xl overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${heroSlideIndex * 100}%)` }}
              >
                {featuredItems.map(item => (
                  <div
                    key={item.id}
                    className="min-w-full h-full relative cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill sizes="100vw" className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <span className="text-6xl">🍽️</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent flex items-end">
                      <div className="p-4 sm:p-5 w-full">
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs text-white/75 line-clamp-1 mb-1">{item.description}</p>
                        )}
                        <p className="text-sm font-semibold text-white/90">
                          {sessionType === 'buffet' && item.isBuffetItem && !item.isALaCarteItem
                            ? 'รวมในบุฟเฟ่ต์' : `฿${item.price.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {featuredItems.length > 1 && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center"
                    onClick={e => { e.stopPropagation(); setHeroSlideIndex(p => p === 0 ? featuredItems.length - 1 : p - 1) }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center"
                    onClick={e => { e.stopPropagation(); setHeroSlideIndex(p => p === featuredItems.length - 1 ? 0 : p + 1) }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {featuredItems.map((_, i) => (
                      <button
                        key={i}
                        onClick={e => { e.stopPropagation(); setHeroSlideIndex(i) }}
                        className={cn('h-1.5 rounded-full transition-all bg-white', i === heroSlideIndex ? 'w-6 opacity-100' : 'w-1.5 opacity-50')}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Popular items ── */}
        {popularItems.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base font-bold flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-primary inline-block" />
                เมนูยอดนิยม
              </h2>
              <button
                onClick={() => router.push(`/menu?session=${sessionId}`)}
                className="flex items-center gap-1 text-xs font-semibold text-primary"
              >
                ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {popularItems.map(item => {
                const isBuffetItem = sessionType === 'buffet' && item.isBuffetItem && !item.isALaCarteItem
                const inCart = items.find(i => i.menuItemId === item.id)?.qty ?? 0
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
                    <div className="relative aspect-square bg-muted">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill sizes="(max-width:640px) 50vw, 33vw" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl select-none">🍽️</div>
                      )}
                      {!item.isAvailable ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-lg">หมด</span>
                        </div>
                      ) : (
                        <>
                          {inCart > 0 && (
                            <div className="absolute top-2 left-2 min-w-[24px] h-6 bg-primary rounded-full flex items-center justify-center px-1.5 shadow">
                              <span className="text-[11px] font-bold text-primary-foreground">{inCart}</span>
                            </div>
                          )}
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
        )}

        {/* ── Quick nav cards (desktop hidden on mobile — footer handles it) ── */}
        <div className="hidden md:grid grid-cols-2 gap-3 mt-2">
          <button
            onClick={() => router.push(`/menu?session=${sessionId}`)}
            className="flex items-center gap-3 p-4 rounded-2xl border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">ดูเมนูทั้งหมด</div>
              <div className="text-xs text-muted-foreground">เลือกสั่งได้เลย</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>
          <button
            onClick={() => router.push(`/orders?session=${sessionId}`)}
            className="flex items-center gap-3 p-4 rounded-2xl border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">ติดตามออเดอร์</div>
              <div className="text-xs text-muted-foreground">ดูสถานะอาหาร</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>
        </div>
      </div>

      {/* ── Item detail — bottom sheet (mobile) ── */}
      <Sheet open={isDetailOpen && isMobile} onOpenChange={setIsDetailOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">{selectedItem.name}</SheetTitle>
                <SheetDescription>
                  {sessionType === 'buffet' && selectedItem.isBuffetItem && !selectedItem.isALaCarteItem
                    ? 'รวมในบุฟเฟ่ต์' : `฿${selectedItem.price.toLocaleString()}`}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-5">
                {selectedItem.imageUrl && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-muted">
                    <Image src={selectedItem.imageUrl} alt={selectedItem.name} fill sizes="90vw" className="object-cover" />
                  </div>
                )}
                {selectedItem.description && <p className="text-sm text-muted-foreground leading-relaxed">{selectedItem.description}</p>}
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))} className="h-12 w-12 rounded-full" disabled={itemQuantity <= 1}>
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="text-3xl font-bold w-14 text-center tabular-nums">{itemQuantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setItemQuantity(itemQuantity + 1)} className="h-12 w-12 rounded-full">
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-note" className="text-sm font-semibold">หมายเหตุ (ไม่บังคับ)</Label>
                  <Input id="item-note" placeholder="เช่น ไม่เผ็ด, ไม่ใส่ผัก" value={itemNote} onChange={e => setItemNote(e.target.value)} className="h-11" />
                </div>
              </div>
              <SheetFooter className="pt-4">
                <Button onClick={() => handleAddToCart(selectedItem)} className="w-full h-14 text-base font-bold rounded-xl" disabled={!selectedItem.isAvailable}>
                  <Plus className="w-5 h-5 mr-2" />
                  เพิ่มลงตะกร้า
                  {!(sessionType === 'buffet' && selectedItem.isBuffetItem && !selectedItem.isALaCarteItem) && (
                    <span className="ml-1 opacity-90">— ฿{(selectedItem.price * itemQuantity).toLocaleString()}</span>
                  )}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Item detail — dialog (desktop) ── */}
      <Dialog open={isDetailOpen && !isMobile} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedItem.name}</DialogTitle>
                <DialogDescription className="text-lg">
                  {sessionType === 'buffet' && selectedItem.isBuffetItem && !selectedItem.isALaCarteItem
                    ? 'รวมในบุฟเฟ่ต์' : `฿${selectedItem.price.toLocaleString()}`}
                </DialogDescription>
              </DialogHeader>
              {selectedItem.imageUrl && (
                <div className="relative w-full h-64 rounded-xl overflow-hidden">
                  <Image src={selectedItem.imageUrl} alt={selectedItem.name} fill sizes="448px" className="object-cover" />
                </div>
              )}
              {selectedItem.description && <p className="text-sm text-muted-foreground leading-relaxed">{selectedItem.description}</p>}
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))} className="h-12 w-12 rounded-full" disabled={itemQuantity <= 1}>
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="text-3xl font-bold w-14 text-center tabular-nums">{itemQuantity}</span>
                <Button variant="outline" size="icon" onClick={() => setItemQuantity(itemQuantity + 1)} className="h-12 w-12 rounded-full">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-note-desktop" className="text-sm font-semibold">หมายเหตุ (ไม่บังคับ)</Label>
                <Input id="item-note-desktop" placeholder="เช่น ไม่เผ็ด, ไม่ใส่ผัก" value={itemNote} onChange={e => setItemNote(e.target.value)} className="h-11" />
              </div>
              <DialogFooter>
                <Button onClick={() => handleAddToCart(selectedItem)} className="w-full h-12 text-base font-bold" disabled={!selectedItem.isAvailable}>
                  <Plus className="w-5 h-5 mr-2" />เพิ่มลงตะกร้า
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
