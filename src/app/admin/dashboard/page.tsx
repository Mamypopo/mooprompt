'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, TableIcon, ShoppingBag, TrendingUp, Clock, Users, RefreshCw, ChevronRight, QrCode, Menu as MenuIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      valueColor: 'text-blue-600',
      action: () => router.push('/admin/tables'),
    },
    {
      title: 'รอทำในครัว',
      value: data.pendingOrderItems,
      sub: 'รายการที่ยังไม่เสร็จ',
      icon: ShoppingBag,
      iconColor: data.pendingOrderItems > 10 ? 'text-destructive' : 'text-orange-500',
      iconBg: data.pendingOrderItems > 10 ? 'bg-destructive/10' : 'bg-orange-500/10',
      valueColor: data.pendingOrderItems > 10 ? 'text-destructive' : 'text-orange-600',
      action: () => router.push('/kitchen'),
    },
    {
      title: 'ยอดขายวันนี้',
      value: `฿${data.todayRevenue.toLocaleString()}`,
      sub: `${data.todayClosedSessions} โต๊ะปิดแล้ว`,
      icon: TrendingUp,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
      valueColor: 'text-emerald-600',
      action: () => router.push('/admin/history'),
    },
    {
      title: 'ออเดอร์วันนี้',
      value: data.todayOrders,
      sub: 'จากทุกโต๊ะ',
      icon: Users,
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/10',
      valueColor: 'text-violet-600',
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
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">ภาพรวม</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            อัพเดทล่าสุด {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboard} className="gap-1.5">
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">รีเฟรช</span>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.title}
              className={`transition-all ${card.action ? 'cursor-pointer hover:shadow-md hover:border-primary/40 active:scale-[0.98]' : ''}`}
              onClick={card.action ?? undefined}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-tight pr-2">{card.title}</p>
                  <div className={`p-2 rounded-lg flex-shrink-0 ${card.iconBg}`}>
                    <Icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                </div>
                <p className={`text-2xl sm:text-3xl font-bold ${card.valueColor}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{card.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {data && (
        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          {/* Table occupancy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">สถานะโต๊ะ</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                  <span className="text-muted-foreground">ถูกใช้งาน</span>
                  <span className="font-semibold">{data.occupiedTables}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-muted-foreground">ว่าง</span>
                  <span className="font-semibold">{data.availableTables}</span>
                </div>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: data.totalTables > 0 ? `${(data.occupiedTables / data.totalTables) * 100}%` : '0%' }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {data.totalTables > 0 ? Math.round((data.occupiedTables / data.totalTables) * 100) : 0}% ถูกใช้งาน ({data.occupiedTables}/{data.totalTables})
              </p>
              <Button
                variant="outline" size="sm" className="mt-4 w-full gap-1.5"
                onClick={() => router.push('/admin/tables')}
              >
                ดูโต๊ะทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent orders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                ออเดอร์ล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">ยังไม่มีออเดอร์วันนี้</p>
              ) : (
                <div className="space-y-0 divide-y">
                  {data.recentOrders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {order.session.table.name}
                          <span className="text-muted-foreground font-normal ml-1">#{order.id}</span>
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {order.items.map((i) => `${i.menuItem.name}×${i.qty}`).join(', ')}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground ml-3 flex-shrink-0 tabular-nums">
                        {new Date(order.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline" size="sm" className="mt-4 w-full gap-1.5"
                onClick={() => router.push('/admin/history')}
              >
                ดูประวัติทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">การดำเนินการด่วน</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'เปิดโต๊ะ', href: '/admin/open-table', icon: QrCode, color: 'text-blue-500' },
              { label: 'ปิดโต๊ะ', href: '/admin/close-table', icon: ShoppingBag, color: 'text-orange-500' },
              { label: 'จัดการเมนู', href: '/admin/menu', icon: MenuIcon, color: 'text-violet-500' },
              { label: 'ดูครัว', href: '/kitchen', icon: TrendingUp, color: 'text-emerald-500' },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-16 flex-col gap-1.5 hover:border-primary/40"
                  onClick={() => router.push(action.href)}
                >
                  <Icon className={`w-5 h-5 ${action.color}`} />
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
