'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { determineItemType } from '@/lib/menu-item-type'
import { ShoppingCart, Menu as MenuIcon, Receipt, Star, ChevronLeft, ChevronRight, Plus, Minus, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslations } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/language-switcher'
import { SessionSkeleton } from '@/components/skeletons'
import { useCartStore } from '@/store/cart-store'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  isFreeInBuffet?: boolean
  isFeatured?: boolean
  isPopular?: boolean
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
  const sessionId = params.id as string
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [popularItems, setPopularItems] = useState<MenuItem[]>([])
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([])
  const [heroSlideIndex, setHeroSlideIndex] = useState(0)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [itemNote, setItemNote] = useState<string>('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const { addItem } = useCartStore()
  const [sessionType, setSessionType] = useState<'buffet' | 'a_la_carte'>('a_la_carte')
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionIdNum = parseInt(sessionId, 10)
        if (isNaN(sessionIdNum)) {
          Swal.fire({
            icon: 'error',
            title: 'Session ไม่ถูกต้อง',
            text: 'กรุณาสแกน QR Code ใหม่',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          })
          router.push('/')
          return
        }

        const response = await fetch(`/api/session/${sessionIdNum}`)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 404) {
            Swal.fire({
              icon: 'error',
              title: 'ไม่พบ Session',
              text: 'กรุณาสแกน QR Code ใหม่',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
            })
            router.push('/')
          } else if (response.status === 400) {
            Swal.fire({
              icon: 'warning',
              title: data.error || 'Session ไม่สามารถใช้งานได้',
              text: 'Session นี้ถูกปิดหรือหมดอายุแล้ว',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
            })
            router.push('/')
          }
          return
        }

        setSession(data.session)
        setSessionType(data.session?.packageId ? 'buffet' : 'a_la_carte')
        
        // Check if session is expired
        if (data.isExpired) {
          setIsExpired(true)
        }
        
        // Calculate time remaining if expireTime exists
        if (data.session?.expireTime) {
          updateTimeRemaining(data.session.expireTime)
        }
      } catch (error) {
        console.error('Error fetching session:', error)
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถโหลดข้อมูลได้',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        })
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
    fetchPopularItems()
    fetchFeaturedItems()

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [sessionId, router])

  const fetchPopularItems = useCallback(async () => {
    try {
      const sessionIdNum = parseInt(sessionId, 10)
      const url = `/api/menu/popular?sessionId=${sessionIdNum}&limit=6`
      const response = await fetch(url)
      const data = await response.json()
      setPopularItems(data.items || [])
    } catch (error) {
      console.error('Error fetching popular items:', error)
    }
  }, [sessionId])

  const fetchFeaturedItems = useCallback(async () => {
    try {
      const sessionIdNum = parseInt(sessionId, 10)
      const url = `/api/menu?sessionId=${sessionIdNum}`
      const response = await fetch(url)
      const data = await response.json()
      
      // Featured items = เมนูที่ isFeatured = true และ available เท่านั้น
      const allItems: MenuItem[] = []
      data.categories?.forEach((category: any) => {
        category.items?.forEach((item: any) => {
          if (item.isFeatured && item.isAvailable) {
            allItems.push(item)
          }
        })
      })
      
      // แสดงเฉพาะเมนูที่กำหนด isFeatured = true (ไม่เกิน 4 รายการ)
      const featured = allItems.slice(0, 4)
      
      setFeaturedItems(featured)
    } catch (error) {
      console.error('Error fetching featured items:', error)
    }
  }, [sessionId])

  const handleItemClick = (item: MenuItem) => {
    if (!item.isAvailable) return
    setSelectedItem(item)
    setItemQuantity(1)
    setItemNote('')
    setIsDetailOpen(true)
  }

  // Calculate and update time remaining
  const updateTimeRemaining = useCallback((expireTime: string) => {
    const update = () => {
      const now = new Date()
      const expire = new Date(expireTime)
      const diff = expire.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('หมดอายุแล้ว')
        setIsExpired(true)
        return
      }

      setIsExpired(false)
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 0) {
        setTimeRemaining(`${hours} ชม. ${minutes} นาที`)
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes} นาที ${seconds} วินาที`)
      } else {
        setTimeRemaining(`${seconds} วินาที`)
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  // Update time remaining when session changes
  useEffect(() => {
    if (session?.expireTime) {
      const cleanup = updateTimeRemaining(session.expireTime)
      return cleanup
    }
  }, [session?.expireTime, updateTimeRemaining])

  const handleAddToCart = (item: MenuItem) => {
    if (!item.isAvailable) return

    // Block if session is expired
    if (isExpired) {
      Swal.fire({
        icon: 'warning',
        title: 'Session หมดอายุแล้ว',
        text: 'ไม่สามารถสั่งอาหารได้ กรุณาติดต่อพนักงาน',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    const qty = itemQuantity
    
    // กำหนด itemType ตาม session type และ item properties
    const itemType = determineItemType(sessionType, item)

    addItem({
      menuItemId: item.id,
      name: item.name,
      price: itemType === 'BUFFET_INCLUDED' ? 0 : item.price, // ฟรีถ้าเป็น BUFFET_INCLUDED
      qty,
      note: itemNote,
      itemType,
    })

    Swal.fire({
      icon: 'success',
      title: t('menu.items_added', { qty }),
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    })

    setIsDetailOpen(false)
    setItemNote('')
    setItemQuantity(1)
  }

  if (loading) {
    return <SessionSkeleton />
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex justify-between items-start mb-4 sm:mb-6 gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">
              {t('table.table_number')} {session?.table?.tableNumber}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t('table.people_count_label', { count: session?.peopleCount })}
            </p>
            {session?.package && (
              <p className="text-sm text-muted-foreground">
                {t('table.package_label', { name: session.package.name })}
              </p>
            )}
            {session?.expireTime && (
              <div className={`flex items-center gap-1.5 mt-2 text-xs ${
                timeRemaining === 'หมดอายุแล้ว' 
                  ? 'text-destructive font-semibold' 
                  : timeRemaining.includes('นาที') && !timeRemaining.includes('ชม.')
                    ? 'text-warning font-medium'
                    : 'text-muted-foreground'
              }`}>
                {timeRemaining === 'หมดอายุแล้ว' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>หมดอายุแล้ว</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>เหลือเวลา: {timeRemaining}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Navigation Buttons - Hidden on mobile (footer handles it), shown on desktop */}
        <div className="hidden md:grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button
            onClick={() => router.push(`/menu?session=${sessionId}`)}
            className="h-16 sm:h-20 flex-col"
            variant="outline"
          >
            <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
            <span className="text-xs sm:text-sm">{t('table.menu')}</span>
          </Button>
          <Button
            onClick={() => router.push(`/cart?session=${sessionId}`)}
            className="h-16 sm:h-20 flex-col"
            variant="outline"
          >
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
            <span className="text-xs sm:text-sm">{t('table.cart')}</span>
          </Button>
          <Button
            onClick={() => router.push(`/orders?session=${sessionId}`)}
            className="h-16 sm:h-20 flex-col"
            variant="outline"
          >
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
            <span className="text-xs sm:text-sm">{t('table.orders')}</span>
          </Button>
        </div>

        {/* Hero Banner / Carousel */}
        {featuredItems.length > 0 && (
          <div className="mb-6 sm:mb-8 relative overflow-hidden rounded-xl">
            <div className="relative h-48 sm:h-64 md:h-80 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${heroSlideIndex * 100}%)` }}
              >
                {featuredItems.slice(0, 4).map((item, index) => (
                  <div
                    key={item.id}
                    className="min-w-full h-full relative flex items-center justify-center cursor-pointer group"
                    onClick={() => handleItemClick(item)}
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                        <div className="text-center">
                          <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{item.name}</h3>
                          <p className="text-lg sm:text-xl text-primary font-semibold">
                            {sessionType === 'buffet' && item.isBuffetItem && !item.isALaCarteItem
                              ? t('menu.buffet_included')
                              : `฿${item.price.toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
                      <div className="p-4 sm:p-6 w-full">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs sm:text-sm text-white/80 line-clamp-2 mb-2">
                            {item.description}
                          </p>
                        )}
                        <p className="text-sm sm:text-base text-white/90">
                          {sessionType === 'buffet' && item.isBuffetItem && !item.isALaCarteItem
                            ? t('menu.buffet_included')
                            : `฿${item.price.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Navigation Arrows */}
              {featuredItems.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      setHeroSlideIndex((prev) => (prev === 0 ? featuredItems.length - 1 : prev - 1))
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      setHeroSlideIndex((prev) => (prev === featuredItems.length - 1 ? 0 : prev + 1))
                    }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
              
              {/* Dots Indicator */}
              {featuredItems.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {featuredItems.slice(0, 4).map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === heroSlideIndex ? 'bg-white w-6' : 'bg-white/50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setHeroSlideIndex(index)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Popular Items Section */}
        {popularItems.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary fill-primary" />
              <h2 className="text-lg sm:text-xl font-bold text-primary">{t('menu.popular')}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {popularItems.map((item) => {
                const isBuffetItem = sessionType === 'buffet' && item.isBuffetItem && !item.isALaCarteItem
                return (
                  <Card
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 ${
                      !item.isAvailable ? 'opacity-60' : ''
                    }`}
                  >
                    {item.imageUrl ? (
                      <div className="relative h-32 sm:h-40 overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                          className="object-cover"
                        />
                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-xs font-semibold text-white bg-destructive/90 px-2 py-1 rounded">
                              {t('menu.out_of_stock')}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-32 sm:h-40 bg-muted flex items-center justify-center">
                        <span className="text-4xl">🍽️</span>
                      </div>
                    )}
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <p className="text-primary font-bold text-sm">
                        {isBuffetItem ? (
                          <span className="text-muted-foreground text-xs">{t('menu.buffet_included')}</span>
                        ) : (
                          `฿${item.price.toLocaleString()}`
                        )}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Sheet for item details */}
      <Sheet open={isDetailOpen && isMobile} onOpenChange={setIsDetailOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">{selectedItem.name}</SheetTitle>
                <SheetDescription>
                  {sessionType === 'buffet' && selectedItem.isBuffetItem && !selectedItem.isALaCarteItem
                    ? t('menu.buffet_included')
                    : `฿${selectedItem.price.toLocaleString()}`}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {selectedItem.imageUrl && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={selectedItem.imageUrl}
                      alt={selectedItem.name}
                      fill
                      sizes="90vw"
                      className="object-cover"
                    />
                  </div>
                )}
                {selectedItem.description && (
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {selectedItem.description}
                  </div>
                )}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="h-12 w-12"
                    disabled={itemQuantity <= 1}
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="text-3xl font-bold w-16 text-center">
                    {itemQuantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="h-12 w-12"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-note" className="text-sm">{t('menu.note_optional')}</Label>
                  <Input
                    id="item-note"
                    placeholder={t('menu.note_placeholder')}
                    value={itemNote}
                    onChange={(e) => setItemNote(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <SheetFooter className="mt-auto pt-4">
                <Button
                  onClick={() => handleAddToCart(selectedItem)}
                  className="w-full h-12 text-lg"
                  size="lg"
                  disabled={!selectedItem.isAvailable}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {t('menu.add_to_cart')}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Desktop: Dialog for item details */}
      <Dialog open={isDetailOpen && !isMobile} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl">{selectedItem.name}</DialogTitle>
                <DialogDescription className="text-lg">
                  {sessionType === 'buffet' && selectedItem.isBuffetItem && !selectedItem.isALaCarteItem
                    ? t('menu.buffet_included')
                    : `฿${selectedItem.price.toLocaleString()}`}
                </DialogDescription>
              </DialogHeader>
              {selectedItem.imageUrl && (
                <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
                  <Image
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    fill
                    sizes="448px"
                    className="object-cover"
                  />
                </div>
              )}
              {selectedItem.description && (
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {selectedItem.description}
                </div>
              )}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="h-12 w-12"
                    disabled={itemQuantity <= 1}
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="text-3xl font-bold w-16 text-center">
                    {itemQuantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="h-12 w-12"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-note-desktop" className="text-sm">{t('menu.note_optional')}</Label>
                  <Input
                    id="item-note-desktop"
                    placeholder={t('menu.note_placeholder')}
                    value={itemNote}
                    onChange={(e) => setItemNote(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => handleAddToCart(selectedItem)}
                  className="w-full h-12 text-lg"
                  size="lg"
                  disabled={!selectedItem.isAvailable}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {t('menu.add_to_cart')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

