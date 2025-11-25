'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat, Clock, CheckCircle, XCircle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from '@/lib/i18n'
import { useStaffLocale } from '@/lib/i18n-staff'
import { getUser, logout } from '@/lib/auth-helpers'
import { getSocket } from '@/lib/socket-client'
import { ThemeToggle } from '@/components/theme-toggle'
import Swal from 'sweetalert2'

interface OrderItem {
  id: number
  menuItem: {
    id: number
    name: string
    isAvailable: boolean
  }
  qty: number
  note?: string
  status: 'WAITING' | 'COOKING' | 'DONE' | 'SERVED'
}

interface Order {
  id: number
  createdAt: string
  session: {
    table: {
      name: string
    }
  }
  items: OrderItem[]
}

export default function KitchenPage() {
  useStaffLocale() // Force Thai locale for staff
  const router = useRouter()
  const t = useTranslations()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [previousOrderIds, setPreviousOrderIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser || (currentUser.role !== 'KITCHEN' && currentUser.role !== 'ADMIN')) {
      router.push('/login')
      return
    }
    setUser(currentUser)

    fetchOrders(true) // Show loading on initial load
    const socket = getSocket()

    socket.on('order:new', () => {
      fetchOrders(false) // Silent update, will show notification
    })

    socket.on('order:cooking', () => {
      fetchOrders(false) // Silent update
    })

    socket.on('order:done', () => {
      fetchOrders(false) // Silent update
    })

    return () => {
      socket.off('order:new')
      socket.off('order:cooking')
      socket.off('order:done')
    }
  }, [router])

  const fetchOrders = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const response = await fetch('/api/kitchen/orders')
      const data = await response.json()
      const newOrders = data.orders || []
      
      // Detect new orders (only when not showing loading - i.e., from socket updates)
      if (!showLoading && previousOrderIds.size > 0) {
        const newOrderIds = new Set(newOrders.map((o: Order) => o.id))
        const addedOrders = newOrders.filter((o: Order) => !previousOrderIds.has(o.id))
        
        // Show notification for new orders
        if (addedOrders.length > 0) {
          const order = addedOrders[0]
          const itemCount = order.items.reduce((sum: number, item: OrderItem) => sum + item.qty, 0)
          
          Swal.fire({
            icon: 'info',
            title: '🆕 มีออเดอร์ใหม่!',
            html: `
              <div style="text-align: left; margin-top: 1rem; padding: 0.75rem; background: hsl(var(--muted) / 0.3); border-radius: 8px;">
                <p style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: hsl(var(--foreground));">
                  🍽️ โต๊ะ: ${order.session.table.name}
                </p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem;">
                  <span style="font-size: 0.9rem; color: hsl(var(--muted-foreground));">
                    📋 ออเดอร์ #${order.id}
                  </span>
                  <span style="font-size: 0.9rem; color: hsl(var(--muted-foreground));">
                    📦 ${itemCount} รายการ
                  </span>
                </div>
              </div>
            `,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true,
            customClass: {
              popup: 'swal2-popup-kitchen',
              title: 'swal2-title-kitchen',
              htmlContainer: 'swal2-html-container-kitchen',
            },
            didOpen: () => {
              // Play notification sound if browser allows
              try {
                // Create a simple beep sound using Web Audio API
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()
                
                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)
                
                oscillator.frequency.value = 800
                oscillator.type = 'sine'
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
                
                oscillator.start(audioContext.currentTime)
                oscillator.stop(audioContext.currentTime + 0.3)
              } catch (e) {
                // Ignore audio errors
              }
            }
          })
        }
      }
      
      setOrders(newOrders)
      setPreviousOrderIds(new Set(newOrders.map((o: Order) => o.id)))
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const updateItemStatus = async (itemId: number, status: 'COOKING' | 'DONE') => {
    try {
      const response = await fetch('/api/order/item-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderItemId: itemId,
          status,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const socket = getSocket()
      socket.emit(`order:${status.toLowerCase()}`, { itemId })

      fetchOrders()
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    }
  }

  const handleMarkCooking = (itemId: number) => {
    updateItemStatus(itemId, 'COOKING')
  }

  const handleMarkDone = (itemId: number) => {
    updateItemStatus(itemId, 'DONE')
  }

  const handleMarkUnavailable = async (menuItemId: number, menuItemName: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการอัพเดท',
      text: `คุณต้องการทำ "${menuItemName}" ให้หมดหรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    })

    if (!result.isConfirmed) return

    try {
      const response = await fetch(`/api/menu/items/${menuItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: false }),
      })

      if (!response.ok) {
        throw new Error('Failed to update menu availability')
      }

      Swal.fire({
        icon: 'success',
        title: 'อัพเดทสำเร็จ',
        text: `"${menuItemName}" ถูกทำเป็นหมดแล้ว`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })

      // Emit socket event to notify customers
      const socket = getSocket()
      socket.emit('menu:unavailable', { menuItemId })

      fetchOrders()
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถอัพเดทสถานะเมนูได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    }
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">{t('kitchen.title')}</h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => router.push('/kitchen/menu')}
              variant="outline"
              className="flex-1 sm:flex-initial text-sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              จัดการเมนู
            </Button>
            <ThemeToggle />
            <Button onClick={logout} variant="outline" className="flex-1 sm:flex-initial text-sm">
              {t('auth.logout')}
            </Button>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">{t('common.no_data')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-primary">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      {order.session.table.name} - ออเดอร์ #{order.id}
                    </CardTitle>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString('th-TH')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-start p-3 bg-muted/50 rounded-lg gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {item.status === 'WAITING' && (
                              <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            )}
                            {item.status === 'COOKING' && (
                              <Clock className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                            )}
                            {item.status === 'DONE' && (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-sm sm:text-base">
                                {item.menuItem.name}
                              </span>
                              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs sm:text-sm">
                                {item.qty} {item.qty === 1 ? 'รายการ' : 'รายการ'}
                              </span>
                            </div>
                          </div>
                          {item.note && (
                            <div className="mt-2 p-2 bg-warning/10 dark:bg-warning/5 border border-warning/20 dark:border-warning/10 rounded-md">
                              <p className="text-xs sm:text-sm font-medium text-warning-foreground dark:text-warning flex items-start gap-1.5">
                                <span className="mt-0.5">📝</span>
                                <span>
                                  <span className="font-semibold">หมายเหตุ:</span> {item.note}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                          {item.status === 'WAITING' && (
                            <>
                              <Button
                                onClick={() => handleMarkCooking(item.id)}
                                size="sm"
                                variant="outline"
                                className="flex-1 sm:flex-initial text-xs sm:text-sm"
                              >
                                {t('kitchen.mark_cooking')}
                              </Button>
                              {item.menuItem.isAvailable && (
                                <Button
                                  onClick={() => handleMarkUnavailable(item.menuItem.id, item.menuItem.name)}
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10 flex-1 sm:flex-initial text-xs sm:text-sm"
                                >
                                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  หมด
                                </Button>
                              )}
                            </>
                          )}
                          {item.status === 'COOKING' && (
                            <>
                              <Button
                                onClick={() => handleMarkDone(item.id)}
                                variant="success"
                                size="sm"
                                className="flex-1 sm:flex-initial text-xs sm:text-sm"
                              >
                                {t('kitchen.mark_done')}
                              </Button>
                              {item.menuItem.isAvailable && (
                                <Button
                                  onClick={() => handleMarkUnavailable(item.menuItem.id, item.menuItem.name)}
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10 flex-1 sm:flex-initial text-xs sm:text-sm"
                                >
                                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  หมด
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

