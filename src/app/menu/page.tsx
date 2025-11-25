'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Minus, ShoppingCart, CheckCircle2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  const { addItem, items } = useCartStore()
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

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

  // Get quantity to add (from local state only, default to 1)
  // ไม่ sync กับ cart เพื่อให้ผู้ใช้เลือกจำนวนใหม่ได้เสมอ
  const getQuantity = (menuItemId: number) => {
    return itemQuantities[menuItemId] || 1
  }

  // Get quantity in cart for an item
  const getCartQuantity = (menuItemId: number) => {
    const cartItem = items.find(i => i.menuItemId === menuItemId)
    return cartItem ? cartItem.qty : 0
  }

  // Get total items in cart
  const getTotalCartItems = () => {
    return items.reduce((total, item) => total + item.qty, 0)
  }

  const updateQuantity = (menuItemId: number, delta: number) => {
    const currentQty = getQuantity(menuItemId)
    const newQty = Math.max(1, currentQty + delta)
    setItemQuantities(prev => ({ ...prev, [menuItemId]: newQty }))
  }

  const setQuantity = (menuItemId: number, qty: number) => {
    const newQty = Math.max(1, qty)
    setItemQuantities(prev => ({ ...prev, [menuItemId]: newQty }))
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

    const qty = getQuantity(item.id)

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
      qty,
      itemType,
    })

    // Reset quantity to 1 after adding (ไม่ใช้จำนวนจาก cart)
    setItemQuantities(prev => ({ ...prev, [item.id]: 1 }))

    Swal.fire({
      icon: 'success',
      title: `เพิ่ม ${qty} รายการลงตะกร้าแล้ว`,
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

  const totalCartItems = getTotalCartItems()

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-24">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{t('menu.title')}</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="กรองหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                {categories.map((category) => {
                  const hasItems = sessionType === 'buffet'
                    ? category.items.some(item => item.isBuffetItem || (item.isALaCarteItem && !item.isBuffetItem))
                    : category.items.some(item => item.isALaCarteItem)
                  if (!hasItems) return null
                  return (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <LanguageSwitcher />
            <Button
              onClick={() => router.push(`/cart?session=${sessionId}`)}
              variant="outline"
              size="icon"
              className="relative flex-shrink-0"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </span>
              )}
            </Button>
          </div>
        </div>

        {categories
          .filter((category) => {
            // กรองตามหมวดหมู่ที่เลือก
            if (selectedCategory !== 'all') {
              return category.id.toString() === selectedCategory
            }
            return true
          })
          .map((category) => {
            // กรอง items ตาม session type
            const filteredItems = sessionType === 'buffet'
              ? category.items.filter(item => item.isBuffetItem || item.isALaCarteItem)
              : category.items.filter(item => item.isALaCarteItem)

            // ถ้าไม่มี items ในหมวดนี้ ให้ข้าม
            if (filteredItems.length === 0) {
              return null
            }

            return (
              <div key={category.id} className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{category.name}</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredItems.map((item) => {
                    // ตรวจสอบว่าเป็นเมนูบุฟเฟ่ต์หรือไม่ (สำหรับแสดงราคา)
                    const isBuffetItem = sessionType === 'buffet' && item.isBuffetItem && !item.isALaCarteItem
                    
                    return (
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
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-sm sm:text-base line-clamp-2 flex-1">{item.name}</h3>
                            {getCartQuantity(item.id) > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                {getCartQuantity(item.id)} ในตะกร้า
                              </span>
                            )}
                          </div>
                          <p className="text-primary font-bold mb-2 sm:mb-3 text-sm sm:text-base">
                            {isBuffetItem ? (
                              <>
                                ฿0 <span className="text-xs text-muted-foreground">(รวมในบุฟเฟ่ต์)</span>
                              </>
                            ) : (
                              <>฿{item.price.toLocaleString()}</>
                            )}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 border rounded-md">
                              <Button
                                onClick={() => updateQuantity(item.id, -1)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
                                disabled={!item.isAvailable || getQuantity(item.id) <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-semibold">
                                {getQuantity(item.id)}
                              </span>
                              <Button
                                onClick={() => updateQuantity(item.id, 1)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
                                disabled={!item.isAvailable}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <Button
                              onClick={() => handleAddToCart(item)}
                              className="flex-1 text-xs sm:text-sm"
                              size="sm"
                              disabled={!item.isAvailable}
                            >
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">{t('menu.add_to_cart')}</span>
                              <span className="sm:hidden">เพิ่ม</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
      </div>

      {/* Floating Cart Button */}
      {totalCartItems > 0 && (
        <Button
          onClick={() => router.push(`/cart?session=${sessionId}`)}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 p-0"
          size="lg"
        >
          <div className="relative flex items-center justify-center w-full h-full">
            <ShoppingCart className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
            <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[22px] h-5.5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold border-2 border-background shadow-lg">
              {totalCartItems > 99 ? '99+' : totalCartItems}
            </span>
          </div>
        </Button>
      )}
    </div>
  )
}

