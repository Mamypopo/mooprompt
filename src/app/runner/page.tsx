'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Utensils, CheckCircle, Clock, AlertTriangle, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getUser, logout } from '@/lib/auth-helpers'
import { getSocket } from '@/lib/socket-client'
import { playNotificationBeep } from '@/lib/notification-sound'
import Swal from 'sweetalert2'
import { OrderCardSkeleton } from '@/components/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

interface OrderItem {
  id: number
  menuItem: { name: string }
  qty: number
  status: 'WAITING' | 'COOKING' | 'DONE' | 'SERVED'
  doneAt?: string
}

interface Order {
  id: number
  createdAt: string
  session: { table: { name: string } }
  items: OrderItem[]
}

function useElapsedMinutes(isoString: string) {
  const [mins, setMins] = useState(0)
  useEffect(() => {
    const update = () => {
      const elapsed = (Date.now() - new Date(isoString).getTime()) / 60000
      setMins(Math.floor(elapsed))
    }
    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [isoString])
  return mins
}

function OrderCard({ order, onServe }: { order: Order; onServe: (itemId: number) => void }) {
  const mins = useElapsedMinutes(order.createdAt)
  const isWarning = mins >= 5 && mins < 10
  const isUrgent = mins >= 10

  return (
    <Card className={`border-l-4 transition-all ${
      isUrgent ? 'border-l-destructive bg-destructive/5' :
      isWarning ? 'border-l-yellow-500 bg-yellow-500/5' :
      'border-l-success'
    }`}>
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{order.session.table.name} — #{order.id}</CardTitle>
            {isUrgent && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                <AlertTriangle className="w-3 h-3 mr-1" />รอนาน {mins} นาที
              </Badge>
            )}
            {isWarning && !isUrgent && (
              <Badge variant="warning" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />{mins} นาที
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="font-semibold text-sm">{item.menuItem.name} ×{item.qty}</span>
              </div>
              <Button onClick={() => onServe(item.id)} variant="success" size="sm">
                เสิร์ฟแล้ว
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function RunnerPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [callAlerts, setCallAlerts] = useState<Array<{ tableName: string; id: number }>>([])
  const callAlertIdRef = useRef(0)

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser || (currentUser.role !== 'RUNNER' && currentUser.role !== 'ADMIN')) {
      router.push('/login')
      return
    }
    fetchOrders()
    const socket = getSocket()
    socket.on('order:done', () => fetchOrders())
    socket.on('order:served', () => fetchOrders())
    socket.on('staff:call', (data: { tableName: string; timestamp: string }) => {
      playNotificationBeep()
      const alertId = ++callAlertIdRef.current
      setCallAlerts((prev) => [...prev, { tableName: data.tableName, id: alertId }])
      Swal.fire({
        icon: 'info',
        title: `🔔 ${data.tableName} เรียกพนักงาน`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 8000,
        timerProgressBar: true,
      })
      // Auto-dismiss alert after 15s
      setTimeout(() => {
        setCallAlerts((prev) => prev.filter((a) => a.id !== alertId))
      }, 15000)
    })
    return () => {
      socket.off('order:done')
      socket.off('order:served')
      socket.off('staff:call')
    }
  }, [router])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/runner/orders')
      const data = await response.json()
      // Sort: oldest first (most urgent at top)
      const sorted = (data.orders || []).sort(
        (a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      setOrders(sorted)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkServed = async (itemId: number) => {
    try {
      const response = await fetch('/api/order/item-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId: itemId, status: 'SERVED' }),
      })
      if (!response.ok) throw new Error('Failed')
      Swal.fire({ icon: 'success', title: 'เสิร์ฟแล้ว', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true })
      fetchOrders()
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded" />
              <Skeleton className="h-6 sm:h-7 w-32 sm:w-40" />
            </div>
            <Skeleton className="h-9 w-20 sm:w-24" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} variant="runner" itemCount={2} />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Utensils className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">พนักงานเสิร์ฟ</h1>
            {orders.length > 0 && (
              <Badge variant="secondary" className="text-xs">{orders.length} ออเดอร์</Badge>
            )}
          </div>
          <Button onClick={logout} variant="outline" className="text-sm">ออกจากระบบ</Button>
        </div>

        {/* Call staff alerts */}
        {callAlerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {callAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-primary animate-bounce" />
                  <span className="font-semibold text-sm">{alert.tableName} เรียกพนักงาน</span>
                </div>
                <Button
                  size="sm" variant="outline"
                  onClick={() => setCallAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                  className="text-xs"
                >
                  รับทราบ
                </Button>
              </div>
            ))}
          </div>
        )}

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">ยังไม่มีออเดอร์ที่ต้องเสิร์ฟ</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} onServe={handleMarkServed} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
