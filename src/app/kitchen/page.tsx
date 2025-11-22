'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from '@/lib/i18n'
import { getUser, logout } from '@/lib/auth-helpers'
import { getSocket } from '@/lib/socket-client'
import { LanguageSwitcher } from '@/components/language-switcher'
import Swal from 'sweetalert2'

interface OrderItem {
  id: number
  menuItem: {
    name: string
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
      tableNumber: number
    }
  }
  items: OrderItem[]
}

export default function KitchenPage() {
  const router = useRouter()
  const t = useTranslations()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser || (currentUser.role !== 'KITCHEN' && currentUser.role !== 'ADMIN')) {
      router.push('/login')
      return
    }
    setUser(currentUser)

    fetchOrders()
    const socket = getSocket()

    socket.on('order:new', () => {
      fetchOrders()
    })

    socket.on('order:cooking', () => {
      fetchOrders()
    })

    socket.on('order:done', () => {
      fetchOrders()
    })

    return () => {
      socket.off('order:new')
      socket.off('order:cooking')
      socket.off('order:done')
    }
  }, [router])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/kitchen/orders')
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
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
      })
    }
  }

  const handleMarkCooking = (itemId: number) => {
    updateItemStatus(itemId, 'COOKING')
  }

  const handleMarkDone = (itemId: number) => {
    updateItemStatus(itemId, 'DONE')
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
            <LanguageSwitcher />
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
                      โต๊ะที่ {order.session.table.tableNumber} - ออเดอร์ #{order.id}
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
                          <div className="flex items-center gap-2 mb-1">
                            {item.status === 'WAITING' && (
                              <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            )}
                            {item.status === 'COOKING' && (
                              <Clock className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                            )}
                            {item.status === 'DONE' && (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                            <span className="font-semibold text-sm sm:text-base">
                              {item.menuItem.name} x {item.qty}
                            </span>
                          </div>
                          {item.note && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              หมายเหตุ: {item.note}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {item.status === 'WAITING' && (
                            <Button
                              onClick={() => handleMarkCooking(item.id)}
                              size="sm"
                              variant="outline"
                              className="flex-1 sm:flex-initial text-xs sm:text-sm"
                            >
                              {t('kitchen.mark_cooking')}
                            </Button>
                          )}
                          {item.status === 'COOKING' && (
                            <Button
                              onClick={() => handleMarkDone(item.id)}
                              size="sm"
                              className="bg-success hover:bg-success/90 flex-1 sm:flex-initial text-xs sm:text-sm"
                            >
                              {t('kitchen.mark_done')}
                            </Button>
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

