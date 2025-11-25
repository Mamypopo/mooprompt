'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslations } from '@/lib/i18n'
import { useCartStore } from '@/store/cart-store'
import { LanguageSwitcher } from '@/components/language-switcher'
import Swal from 'sweetalert2'

interface MenuItem {
  id: number
  name: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  isBuffetItem?: boolean
  isALaCarteItem?: boolean
}

interface Category {
  id: number
  name: string
  items: MenuItem[]
}

export default function MenuPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations()
  const sessionId = searchParams.get('session')
  const [categories, setCategories] = useState<Category[]>([])
  const [sessionType, setSessionType] = useState<'buffet' | 'a_la_carte'>('a_la_carte')
  const [loading, setLoading] = useState(true)
  const { addItem } = useCartStore()

  useEffect(() => {
    if (!sessionId) {
      router.push('/')
      return
    }

    fetchMenu()
  }, [sessionId, router])

  const fetchMenu = async () => {
    try {
      const sessionIdNum = sessionId ? parseInt(sessionId, 10) : null
      const url = sessionIdNum
        ? `/api/menu?sessionId=${sessionIdNum}`
        : '/api/menu'
      
      const response = await fetch(url)
      const data = await response.json()
      setCategories(data.categories || [])
      setSessionType(data.sessionType || 'a_la_carte')
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (item: MenuItem) => {
    if (!item.isAvailable) {
      Swal.fire({
        icon: 'warning',
        title: 'สินค้าไม่พร้อมให้บริการ',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    // กำหนด itemType ตาม session type และ item properties
    let itemType: 'BUFFET_INCLUDED' | 'A_LA_CARTE' = 'A_LA_CARTE'
    
    if (sessionType === 'buffet') {
      // ถ้าเป็นบุฟเฟ่ต์ และ item นี้เป็น buffet item → ฟรี
      if (item.isBuffetItem) {
        itemType = 'BUFFET_INCLUDED'
      } else {
        // ถ้าไม่ใช่ buffet item → จ่ายเพิ่ม
        itemType = 'A_LA_CARTE'
      }
    } else {
      // ถ้าเป็น à la carte → จ่ายตามราคา
      itemType = 'A_LA_CARTE'
    }

    addItem({
      menuItemId: item.id,
      name: item.name,
      price: itemType === 'BUFFET_INCLUDED' ? 0 : item.price, // ฟรีถ้าเป็น BUFFET_INCLUDED
      qty: 1,
      itemType,
    })

    Swal.fire({
      icon: 'success',
      title: 'เพิ่มลงตะกร้าแล้ว',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    })
  }

  // Skeleton component for menu items
  const MenuItemSkeleton = () => (
    <Card className="overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted"></div>
      <CardContent className="p-3 sm:p-4">
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
        <div className="h-9 bg-muted rounded"></div>
      </CardContent>
    </Card>
  )

  const CategorySkeleton = () => (
    <div className="mb-6 sm:mb-8">
      <div className="h-6 bg-muted rounded w-32 mb-3 sm:mb-4 animate-pulse"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <MenuItemSkeleton key={i} />
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
            <div className="h-7 bg-muted rounded w-32 animate-pulse"></div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 bg-muted rounded animate-pulse"></div>
              <div className="h-9 w-9 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          {[...Array(3)].map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-24">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{t('menu.title')}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <LanguageSwitcher />
            <Button
              onClick={() => router.push(`/cart?session=${sessionId}`)}
              variant="outline"
              size="icon"
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {categories.map((category) => {
          // แยก items เป็นบุฟเฟ่ต์และ à la carte (ถ้าเป็น session บุฟเฟ่ต์)
          const buffetItems = sessionType === 'buffet' 
            ? category.items.filter(item => item.isBuffetItem)
            : []
          const aLaCarteItems = sessionType === 'buffet'
            ? category.items.filter(item => item.isALaCarteItem && !item.isBuffetItem)
            : category.items

          // ถ้าไม่มี items ในหมวดนี้ ให้ข้าม
          if (buffetItems.length === 0 && aLaCarteItems.length === 0) {
            return null
          }

          return (
            <div key={category.id} className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{category.name}</h2>
              
              {/* แสดงเมนูบุฟเฟ่ต์ (ถ้ามี) */}
              {sessionType === 'buffet' && buffetItems.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-muted-foreground">
                    เมนูบุฟเฟ่ต์ (ฟรี)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {buffetItems.map((item) => (
                      <Card
                        key={item.id}
                        className={`overflow-hidden ${
                          !item.isAvailable ? 'opacity-60' : ''
                        }`}
                      >
                        {item.imageUrl && (
                          <div className="aspect-square bg-muted">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-3 sm:p-4">
                          <h3 className="font-semibold mb-1 text-sm sm:text-base line-clamp-2">{item.name}</h3>
                          <p className="text-primary font-bold mb-2 sm:mb-3 text-sm sm:text-base">
                            ฿0 <span className="text-xs text-muted-foreground">(รวมในบุฟเฟ่ต์)</span>
                          </p>
                          <Button
                            onClick={() => handleAddToCart(item)}
                            className="w-full text-xs sm:text-sm"
                            size="sm"
                            disabled={!item.isAvailable}
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{t('menu.add_to_cart')}</span>
                            <span className="sm:hidden">เพิ่ม</span>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* แสดงเมนู à la carte */}
              {aLaCarteItems.length > 0 && (
                <div>
                  {sessionType === 'buffet' && (
                    <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-muted-foreground">
                      เมนูเพิ่มเติม (จ่ายเพิ่ม)
                    </h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {aLaCarteItems.map((item) => (
                      <Card
                        key={item.id}
                        className={`overflow-hidden ${
                          !item.isAvailable ? 'opacity-60' : ''
                        }`}
                      >
                        {item.imageUrl && (
                          <div className="aspect-square bg-muted">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-3 sm:p-4">
                          <h3 className="font-semibold mb-1 text-sm sm:text-base line-clamp-2">{item.name}</h3>
                          <p className="text-primary font-bold mb-2 sm:mb-3 text-sm sm:text-base">
                            ฿{item.price.toLocaleString()}
                          </p>
                          <Button
                            onClick={() => handleAddToCart(item)}
                            className="w-full text-xs sm:text-sm"
                            size="sm"
                            disabled={!item.isAvailable}
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{t('menu.add_to_cart')}</span>
                            <span className="sm:hidden">เพิ่ม</span>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

