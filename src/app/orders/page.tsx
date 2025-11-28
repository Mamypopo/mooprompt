'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from '@/lib/i18n'
import { getSocket } from '@/lib/socket-client'
import { LanguageSwitcher } from '@/components/language-switcher'
import { OrderCardSkeleton } from '@/components/skeletons'
import { CustomerFooter } from '@/components/customer-footer'
import { Skeleton } from '@/components/ui/skeleton'

interface OrderItem {
  id: number
  menuItem: {
    name: string
    price: number
  }
  qty: number
  status: 'WAITING' | 'COOKING' | 'DONE' | 'SERVED'
}

interface Order {
  id: number
  createdAt: string
  status: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations()
  const sessionId = searchParams.get('session')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      router.push('/')
      return
    }

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

    socket.on('order:served', () => {
      fetchOrders()
    })

    return () => {
      socket.off('order:new')
      socket.off('order:cooking')
      socket.off('order:done')
      socket.off('order:served')
    }
  }, [sessionId, router])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      // In a real app, fetch orders for this session
      // For now, we'll use a mock API endpoint
      const response = await fetch(`/api/session/${sessionId}/orders`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WAITING':
      case 'COOKING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'DONE':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'SERVED':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    return t(`order.status.${status.toLowerCase()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex justify-between items-center mb-4 gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-9 rounded" />
          </div>
          <Skeleton className="h-7 w-32 mb-4 sm:mb-6" />
          <div className="space-y-3 sm:space-y-4">
            {[...Array(3)].map((_, i) => (
              <OrderCardSkeleton key={i} itemCount={2} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex justify-between items-center mb-4 gap-2">
          <Button
            onClick={() => router.push(`/session/${sessionId}`)}
            variant="ghost"
            className="text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
          <LanguageSwitcher />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t('order.title')}</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">{t('common.no_data')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      {t('order.order_number', { id: order.id })}
                    </CardTitle>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString('th-TH')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 border-b last:border-0 gap-2"
                      >
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className="text-sm sm:text-base">
                            {item.menuItem.name} x {item.qty}
                          </span>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                          <p className="font-semibold text-sm sm:text-base">
                            ฿{(item.menuItem.price * item.qty).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getStatusText(item.status)}
                          </p>
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
      <CustomerFooter />
    </div>
  )
}

