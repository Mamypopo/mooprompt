'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, TableIcon, ShoppingBag, TrendingUp, Clock, Users, RefreshCw, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardData {
  activeSessions: number
  availableTables: number
  occupiedTables: number
  totalTables: number
  pendingOrderItems: number
  todayRevenue: number
  todayOrders: number
  todayClosedSessions: number
  recentOrders: Array<{
    id: number
    createdAt: string
    status: string
    session: { table: { name: string } }
    items: Array<{ qty: number; menuItem: { name: string } }>
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  const statCards = data ? [
    {
      title: 'โต๊ะที่เปิดอยู่',
      value: data.activeSessions,
      sub: `ว่าง ${data.availableTables} / ทั้งหมด ${data.totalTables} โต๊ะ`,
      icon: TableIcon,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      action: () => router.push('/admin/tables'),
    },
    {
      title: 'รอทำในครัว',
      value: data.pendingOrderItems,
      sub: 'รายการที่ยังไม่เสร็จ',
      icon: ShoppingBag,
      color: data.pendingOrderItems > 10 ? 'text-destructive' : 'text-orange-500',
      bg: data.pendingOrderItems > 10 ? 'bg-destructive/10' : 'bg-orange-500/10',
      action: () => router.push('/kitchen'),
    },
    {
      title: 'ยอดขายวันนี้',
      value: `฿${data.todayRevenue.toLocaleString()}`,
      sub: `${data.todayClosedSessions} โต๊ะปิดแล้ว`,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      action: () => router.push('/admin/history'),
    },
    {
      title: 'ออเดอร์วันนี้',
      value: data.todayOrders,
      sub: 'จากทุกโต๊ะ',
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      action: null,
    },
  ] : []

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold">ภาพรวม</h1>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground hidden sm:block">
            อัพเดท {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <Button variant="outline" size="sm" onClick={fetchDashboard}>
            <RefreshCw className="w-4 h-4 mr-1.5" />รีเฟรช
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.title}
              className={`transition-all ${card.action ? 'cursor-pointer hover:shadow-md hover:border-primary/30' : ''}`}
              onClick={card.action ?? undefined}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">{card.title}</p>
                  <div className={`p-1.5 rounded-lg ${card.bg}`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <p className={`text-2xl sm:text-3xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Table occupancy visual */}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-base">สถานะโต๊ะ</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2">
              <div className="flex gap-2 mb-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="w-3 h-3 rounded-full bg-primary inline-block" />
                  ถูกใช้งาน {data.occupiedTables}
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="w-3 h-3 rounded-full bg-success inline-block" />
                  ว่าง {data.availableTables}
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: data.totalTables > 0 ? `${(data.occupiedTables / data.totalTables) * 100}%` : '0%' }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {data.totalTables > 0 ? Math.round((data.occupiedTables / data.totalTables) * 100) : 0}% ถูกใช้งาน
              </p>
              <Button
                variant="outline" size="sm" className="mt-3 w-full"
                onClick={() => router.push('/admin/tables')}
              >
                ดูโต๊ะทั้งหมด <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent orders */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />ออเดอร์ล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2">
              {data.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">ยังไม่มีออเดอร์วันนี้</p>
              ) : (
                <div className="space-y-2">
                  {data.recentOrders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {order.session.table.name} — #{order.id}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {order.items.map((i) => `${i.menuItem.name}×${i.qty}`).join(', ')}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {new Date(order.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline" size="sm" className="mt-3 w-full"
                onClick={() => router.push('/admin/history')}
              >
                ดูประวัติทั้งหมด <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick actions */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base">การดำเนินการด่วน</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'เปิดโต๊ะ', href: '/admin/open-table', icon: TableIcon },
              { label: 'ปิดโต๊ะ', href: '/admin/close-table', icon: ShoppingBag },
              { label: 'จัดการเมนู', href: '/admin/menu', icon: Users },
              { label: 'ดูครัว', href: '/kitchen', icon: TrendingUp },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-16 flex-col gap-1"
                  onClick={() => router.push(action.href)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
