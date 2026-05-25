'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Minus, Plus, Trash2, ArrowLeft, CheckCircle, UtensilsCrossed, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCartStore } from '@/store/cart-store'
import { CartItemSkeleton } from '@/components/skeletons'
import { Skeleton } from '@/components/ui/skeleton'
import Swal from 'sweetalert2'

export default function CartPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session')
  const { items, removeItem, updateItem, clearCart, getTotal } = useCartStore()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [isExpired, setIsExpired] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null)

  useEffect(() => {
    if (!sessionId) {
      router.push('/')
      return
    }
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [sessionId, router])

  useEffect(() => {
    const checkSession = async () => {
      if (!sessionId) return
      const id = parseInt(sessionId, 10)
      if (isNaN(id)) return
      try {
        const res = await fetch(`/api/session/${id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.isExpired) setIsExpired(true)
        }
      } catch {}
    }
    checkSession()
    const interval = setInterval(checkSession, 30000)
    return () => clearInterval(interval)
  }, [sessionId])

  const handleCheckout = async () => {
    if (items.length === 0) {
      Swal.fire({ icon: 'warning', title: 'ตะกร้าว่างเปล่า', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
      return
    }
    if (isExpired) {
      Swal.fire({ icon: 'warning', title: 'Session หมดอายุแล้ว', text: 'ไม่สามารถสั่งอาหารได้ กรุณาติดต่อพนักงาน', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
      return
    }
    if (isSubmitting) return
    setIsSubmitting(true)
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
            itemType: item.itemType || 'A_LA_CARTE',
          })),
          note: note || undefined,
        }),
      })
      if (!response.ok) throw new Error('Failed to create order')
      const data = await response.json()
      setConfirmedOrderId(data.order?.id ?? null)
      setOrderConfirmed(true)
      clearCart()
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถสั่งอาหารได้', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Order confirmed screen
  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-14 h-14 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">สั่งอาหารสำเร็จ!</h1>
            {confirmedOrderId && (
              <p className="text-muted-foreground">ออเดอร์ #{confirmedOrderId}</p>
            )}
            <p className="text-sm text-muted-foreground">ครัวได้รับออเดอร์ของคุณแล้ว กรุณารอสักครู่</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push(`/orders?session=${sessionId}`)}
              className="w-full"
              size="lg"
            >
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              ดูสถานะออเดอร์
            </Button>
            <Button
              onClick={() => router.push(`/session/${sessionId}`)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              สั่งเพิ่ม
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 sm:pb-28">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex justify-between items-center mb-4 gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9 rounded" />
          </div>
          <Skeleton className="h-7 w-32 mb-4 sm:mb-6" />
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {[...Array(3)].map((_, i) => <CartItemSkeleton key={i} />)}
          </div>
          <Card className="sticky bottom-0 mb-4 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-6 w-16 mb-3" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <Button onClick={() => router.push(`/session/${sessionId}`)} variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับ
            </Button>
          </div>
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">ตะกร้าว่างเปล่า</p>
              <Button onClick={() => router.push(`/session/${sessionId}`)}>
                เลือกเมนู
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-28">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex justify-between items-center mb-4 gap-2">
          <Button
            onClick={() => router.push(`/session/${sessionId}`)}
            variant="ghost"
            className="text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </Button>
          <Button
            onClick={() => router.push(`/session/${sessionId}`)}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            เพิ่มรายการ
          </Button>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">ตะกร้าสินค้า</h1>

        {isExpired && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium">
            ⚠️ Session หมดอายุแล้ว — ไม่สามารถสั่งอาหารเพิ่มได้ กรุณาติดต่อพนักงาน
          </div>
        )}

        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          {items.map((item) => (
            <Card key={item.menuItemId}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                    <p className="text-primary font-bold text-sm sm:text-base">
                      {item.itemType === 'BUFFET_INCLUDED' ? (
                        <>฿0 <span className="text-xs text-muted-foreground">(รวมในบุฟเฟ่ต์)</span></>
                      ) : (
                        <>฿{item.price.toLocaleString()}</>
                      )}
                    </p>
                  </div>
                  <Button onClick={() => removeItem(item.menuItemId)} variant="ghost" size="icon" className="flex-shrink-0">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    onClick={() => updateItem(item.menuItemId, item.qty - 1, item.note)}
                    variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <span className="w-10 sm:w-12 text-center text-sm sm:text-base">{item.qty}</span>
                  <Button
                    onClick={() => updateItem(item.menuItemId, item.qty + 1, item.note)}
                    variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
                <Input
                  placeholder="หมายเหตุสำหรับรายการนี้ (เช่น ไม่เผ็ด, เพิ่มไข่)"
                  value={item.note || ''}
                  onChange={(e) => updateItem(item.menuItemId, item.qty, e.target.value)}
                  className="text-xs sm:text-sm"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">หมายเหตุสำหรับออเดอร์ (ถ้ามี)</label>
          <Input
            placeholder="เช่น ต้องการช้อนส้อมเพิ่ม, ต้องการน้ำแข็ง"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">หมายเหตุนี้จะใช้กับทั้งออเดอร์</p>
        </div>

        <Card className="fixed bottom-16 left-0 right-0 md:sticky md:bottom-0 md:mb-4 shadow-lg z-40 md:z-auto">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <span className="text-base sm:text-lg font-semibold">รวม</span>
              <span className="text-xl sm:text-2xl font-bold text-primary">
                ฿{getTotal().toLocaleString()}
              </span>
            </div>
            <Button
              onClick={handleCheckout}
              className="w-full text-sm sm:text-base"
              size="lg"
              disabled={isSubmitting || isExpired}
            >
              {isSubmitting ? 'กำลังส่งออเดอร์...' : 'สั่งอาหาร'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
