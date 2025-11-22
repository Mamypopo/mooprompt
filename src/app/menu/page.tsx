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
      const response = await fetch('/api/menu')
      const data = await response.json()
      setCategories(data.categories || [])
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

    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      qty: 1,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
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

        {categories.map((category) => (
          <div key={category.id} className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{category.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {category.items.map((item) => (
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
        ))}
      </div>
    </div>
  )
}

