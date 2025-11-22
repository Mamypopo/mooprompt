'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Minus, Plus, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useTranslations } from '@/lib/i18n'
import { useCartStore } from '@/store/cart-store'
import { LanguageSwitcher } from '@/components/language-switcher'
import Swal from 'sweetalert2'

export default function CartPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations()
  const sessionId = searchParams.get('session')
  const { items, removeItem, updateItem, clearCart, getTotal } = useCartStore()
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!sessionId) {
      router.push('/')
      return
    }
  }, [sessionId, router])

  const handleCheckout = async () => {
    if (items.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ตะกร้าว่างเปล่า',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    try {
      const response = await fetch('/api/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableSessionId: parseInt(sessionId!),
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            qty: item.qty,
            note: item.note,
          })),
          note: note || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      Swal.fire({
        icon: 'success',
        title: 'สั่งอาหารสำเร็จ',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })

      clearCart()
      router.push(`/orders?session=${sessionId}`)
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถสั่งอาหารได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={() => router.push(`/menu?session=${sessionId}`)}
              variant="ghost"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปเมนู
            </Button>
            <LanguageSwitcher />
          </div>
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">{t('cart.empty')}</p>
              <Button
                onClick={() => router.push(`/menu?session=${sessionId}`)}
                className="mt-4"
              >
                ดูเมนู
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-28">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex justify-between items-center mb-4 gap-2">
          <Button
            onClick={() => router.push(`/menu?session=${sessionId}`)}
            variant="ghost"
            className="text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">กลับไปเมนู</span>
            <span className="sm:hidden">กลับ</span>
          </Button>
          <LanguageSwitcher />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t('cart.title')}</h1>

        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          {items.map((item) => (
            <Card key={item.menuItemId}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                    <p className="text-primary font-bold text-sm sm:text-base">
                      ฿{item.price.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => removeItem(item.menuItemId)}
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      updateItem(item.menuItemId, item.qty - 1, item.note)
                    }
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <span className="w-10 sm:w-12 text-center text-sm sm:text-base">{item.qty}</span>
                  <Button
                    onClick={() =>
                      updateItem(item.menuItemId, item.qty + 1, item.note)
                    }
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4 mb-4">
          <Input
            placeholder="หมายเหตุ (ถ้ามี)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <Card className="sticky bottom-0 left-0 right-0 mb-4 sm:mb-6 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <span className="text-base sm:text-lg font-semibold">{t('cart.total')}</span>
              <span className="text-xl sm:text-2xl font-bold text-primary">
                ฿{getTotal().toLocaleString()}
              </span>
            </div>
            <Button onClick={handleCheckout} className="w-full text-sm sm:text-base" size="lg">
              {t('cart.checkout')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

