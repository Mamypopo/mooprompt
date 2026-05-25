'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat, Clock, CheckCircle, XCircle, Settings, Bell, Utensils, StickyNote, LayoutList, Layers } from 'lucide-react'
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
  menuItem: { id: number; name: string; isAvailable: boolean }
  qty: number
  note?: string
  status: 'WAITING' | 'COOKING' | 'DONE' | 'SERVED'
}

interface Order {
  id: number
  createdAt: string
  session: { table: { name: string } }
  items: OrderItem[]
}

type GroupMode = 'order' | 'item'

export default function KitchenPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [groupMode, setGroupMode] = useState<GroupMode>('order')
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set())
  const previousOrderIdsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser || (currentUser.role !== 'KITCHEN' && currentUser.role !== 'ADMIN')) {
      router.push('/login')
      return
    }
    fetchOrders(true)
    const socket = getSocket()
    socket.on('order:new', () => setTimeout(() => fetchOrders(false), 100))
    socket.on('order:cooking', () => fetchOrders(false))
    socket.on('order:done', () => fetchOrders(false))
    socket.on('order:served', () => fetchOrders(false))
    return () => {
      socket.off('order:new')
      socket.off('order:cooking')
      socket.off('order:done')
      socket.off('order:served')
    }
  }, [router])

  const fetchOrders = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      const response = await fetch('/api/kitchen/orders')
      const data = await response.json()
      const newOrders: Order[] = data.orders || []
      setOrders(newOrders)
      const newIds = new Set<number>(newOrders.map((o) => o.id))
      const prev = previousOrderIdsRef.current
      if (!showLoading && prev.size > 0) {
        const added = newOrders.filter((o) => !prev.has(o.id))
        if (added.length > 0) {
          playNotificationBeep()
          const addedIds = new Set<number>(added.map((o) => o.id))
          setNewOrderIds(addedIds)
          setTimeout(() => {
            setNewOrderIds((prev) => {
              const next = new Set(prev)
              addedIds.forEach((id) => next.delete(id))
              return next
            })
          }, 5000)
          Swal.fire({
            icon: 'info',
            title: 'มีออเดอร์ใหม่!',
            text: `${added[0].session.table.name}`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          })
        }
      }
      previousOrderIdsRef.current = newIds
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const updateItemStatus = async (itemId: number, status: 'COOKING' | 'DONE') => {
    try {
      const response = await fetch('/api/order/item-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId: itemId, status }),
      })
      if (!response.ok) throw new Error('Failed')
      fetchOrders()
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
    }
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
      if (!response.ok) throw new Error('Failed')
      Swal.fire({ icon: 'success', title: 'อัพเดทสำเร็จ', text: `"${menuItemName}" หมดแล้ว`, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
      const socket = getSocket()
      socket.emit('menu:unavailable', { menuItemId })
      fetchOrders()
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
    }
  }

  // Group by item name: aggregate qty across all orders
  const groupedByItem = (() => {
    const map = new Map<string, {
      menuItemId: number
      menuItemName: string
      isAvailable: boolean
      entries: Array<{ itemId: number; orderId: number; tableName: string; qty: number; note?: string; status: 'WAITING' | 'COOKING' | 'DONE' }>
    }>()
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.menuItem.name
        if (!map.has(key)) {
          map.set(key, {
            menuItemId: item.menuItem.id,
            menuItemName: item.menuItem.name,
            isAvailable: item.menuItem.isAvailable,
            entries: [],
          })
        }
        map.get(key)!.entries.push({
          itemId: item.id,
          orderId: order.id,
          tableName: order.session.table.name,
          qty: item.qty,
          note: item.note,
          status: item.status as 'WAITING' | 'COOKING' | 'DONE',
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      // Sort: WAITING first, then COOKING, then DONE
      const priority = (entries: typeof a.entries) => {
        if (entries.some((e) => e.status === 'WAITING')) return 0
        if (entries.some((e) => e.status === 'COOKING')) return 1
        return 2
      }
      return priority(a.entries) - priority(b.entries)
    })
  })()

  const statusColors: Record<string, string> = {
    WAITING: 'bg-yellow-500/10 border-yellow-400',
    COOKING: 'bg-blue-500/10 border-blue-400',
    DONE: 'bg-green-500/10 border-green-400',
  }
  const statusLabels: Record<string, string> = {
    WAITING: 'รอทำ',
    COOKING: 'กำลังทำ',
    DONE: 'พร้อมเสิร์ฟ',
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Skeleton className="h-9 w-28 sm:w-32 flex-1 sm:flex-initial" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-20 sm:w-24 flex-1 sm:flex-initial" />
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">ครัว</h1>
            {orders.length > 0 && (
              <Badge variant="secondary" className="text-xs">{orders.length} ออเดอร์</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* Group toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              <Button
                onClick={() => setGroupMode('order')}
                size="sm"
                variant={groupMode === 'order' ? 'default' : 'ghost'}
                className="rounded-none text-xs px-3"
              >
                <LayoutList className="w-3.5 h-3.5 mr-1.5" />
                ตามออเดอร์
              </Button>
              <Button
                onClick={() => setGroupMode('item')}
                size="sm"
                variant={groupMode === 'item' ? 'default' : 'ghost'}
                className="rounded-none text-xs px-3"
              >
                <Layers className="w-3.5 h-3.5 mr-1.5" />
                ตามเมนู
              </Button>
            </div>
            <Button onClick={() => router.push('/kitchen/menu')} variant="outline" className="flex-1 sm:flex-initial text-sm">
              <Settings className="w-4 h-4 mr-2" />
              จัดการเมนู
            </Button>
            <Button onClick={logout} variant="outline" className="flex-1 sm:flex-initial text-sm">
              ออกจากระบบ
            </Button>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <ChefHat className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">ยังไม่มีออเดอร์</p>
            </CardContent>
          </Card>
        ) : groupMode === 'order' ? (
          /* ===== VIEW: By Order ===== */
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className={`border-l-4 border-l-primary transition-all duration-300 ${
                  newOrderIds.has(order.id)
                    ? 'ring-2 ring-primary bg-primary/5 shadow-lg scale-[1.02] animate-in fade-in slide-in-from-top-2'
                    : ''
                }`}
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base sm:text-lg">
                        {order.session.table.name} — ออเดอร์ #{order.id}
                      </CardTitle>
                      {newOrderIds.has(order.id) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold animate-pulse">
                          <Bell className="w-3 h-3" />ใหม่
                        </span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString('th-TH')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-start p-3 bg-muted/50 rounded-lg gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {item.status === 'WAITING' && <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                            {item.status === 'COOKING' && <Clock className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />}
                            {item.status === 'DONE' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                            <span className="font-semibold text-sm sm:text-base">{item.menuItem.name}</span>
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs sm:text-sm">
                              {item.qty} รายการ
                            </span>
                          </div>
                          {item.note && (
                            <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded-md">
                              <p className="text-xs sm:text-sm font-medium flex items-start gap-1.5">
                                <StickyNote className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                                <span><span className="font-semibold">หมายเหตุ:</span> {item.note}</span>
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                          {item.status === 'WAITING' && (
                            <>
                              <Button onClick={() => updateItemStatus(item.id, 'COOKING')} size="sm" variant="default" className="flex-1 sm:flex-initial text-xs sm:text-sm">กำลังทำ</Button>
                              <Button onClick={() => updateItemStatus(item.id, 'DONE')} variant="success" size="sm" className="flex-1 sm:flex-initial text-xs sm:text-sm">พร้อมเสิร์ฟ</Button>
                              {item.menuItem.isAvailable && (
                                <Button onClick={() => handleMarkUnavailable(item.menuItem.id, item.menuItem.name)} size="sm" variant="outline" className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10 flex-1 sm:flex-initial text-xs sm:text-sm">
                                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />หมด
                                </Button>
                              )}
                            </>
                          )}
                          {item.status === 'COOKING' && (
                            <>
                              <Button onClick={() => updateItemStatus(item.id, 'DONE')} variant="success" size="sm" className="flex-1 sm:flex-initial text-xs sm:text-sm">พร้อมเสิร์ฟ</Button>
                              {item.menuItem.isAvailable && (
                                <Button onClick={() => handleMarkUnavailable(item.menuItem.id, item.menuItem.name)} size="sm" variant="outline" className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10 flex-1 sm:flex-initial text-xs sm:text-sm">
                                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />หมด
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
        ) : (
          /* ===== VIEW: By Item ===== */
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {groupedByItem.map((group) => {
              const totalQty = group.entries.reduce((s, e) => s + e.qty, 0)
              const worstStatus = group.entries.some((e) => e.status === 'WAITING')
                ? 'WAITING'
                : group.entries.some((e) => e.status === 'COOKING')
                ? 'COOKING'
                : 'DONE'
              return (
                <Card key={group.menuItemName} className={`border-l-4 ${statusColors[worstStatus]}`}>
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{group.menuItemName}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">รวม {totalQty} รายการ</p>
                      </div>
                      <Badge variant={worstStatus === 'WAITING' ? 'warning' : worstStatus === 'COOKING' ? 'accent' : 'success'} className="text-xs">
                        {statusLabels[worstStatus]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    {group.entries.map((entry) => (
                      <div key={entry.itemId} className={`flex items-center justify-between p-2.5 rounded-md border ${statusColors[entry.status]} gap-2`}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {entry.status === 'WAITING' && <Clock className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                          {entry.status === 'COOKING' && <Clock className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />}
                          {entry.status === 'DONE' && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                          <span className="text-sm font-medium">{entry.tableName}</span>
                          <span className="text-xs text-muted-foreground">×{entry.qty}</span>
                          {entry.note && (
                            <span className="text-xs text-muted-foreground truncate italic">— {entry.note}</span>
                          )}
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {entry.status === 'WAITING' && (
                            <>
                              <Button onClick={() => updateItemStatus(entry.itemId, 'COOKING')} size="sm" variant="default" className="text-xs h-7 px-2">ทำ</Button>
                              <Button onClick={() => updateItemStatus(entry.itemId, 'DONE')} variant="success" size="sm" className="text-xs h-7 px-2">เสร็จ</Button>
                            </>
                          )}
                          {entry.status === 'COOKING' && (
                            <Button onClick={() => updateItemStatus(entry.itemId, 'DONE')} variant="success" size="sm" className="text-xs h-7 px-2">เสร็จ</Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {group.isAvailable && (
                      <Button
                        onClick={() => handleMarkUnavailable(group.menuItemId, group.menuItemName)}
                        size="sm" variant="outline"
                        className="w-full text-destructive hover:text-destructive border-destructive hover:bg-destructive/10 text-xs mt-1"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        ทำเมนูนี้หมด
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
