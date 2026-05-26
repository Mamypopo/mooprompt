'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Clock, RefreshCw, ChevronRight,
  QrCode, MenuIcon, Flame, ChefHat, ShoppingBag, TrendingUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-20 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-card p-5">
              <Skeleton className="h-3 w-16 mb-3" />
              <Skeleton className="h-8 w-20 mb-1.5" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-5 gap-4">
          <Skeleton className="lg:col-span-3 h-72 rounded-xl" />
          <Skeleton className="lg:col-span-2 h-72 rounded-xl" />
        </div>
      </div>
    )
  }

  const pendingCount = data?.pendingOrderItems ?? 0
  const isUrgent = pendingCount > 10

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">ภาพรวม</h1>
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={fetchDashboard}
          className="gap-2 text-muted-foreground hover:text-foreground mt-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-xs hidden sm:inline">
            {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </Button>
      </div>

      {/* Pending alert */}
      {data && pendingCount > 0 && (
        <button
          onClick={() => router.push('/kitchen')}
          className={cn(
            'w-full flex items-center justify-between rounded-xl px-4 py-3 border text-left transition-opacity hover:opacity-80',
            isUrgent
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          )}
        >
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <Flame className={cn('w-4 h-4 flex-shrink-0', isUrgent && 'animate-pulse')} />
            {pendingCount} รายการรอทำในครัว
          </span>
          <span className="text-xs flex items-center gap-1 opacity-60 flex-shrink-0">
            ดูครัว <ChevronRight className="w-3 h-3" />
          </span>
        </button>
      )}

      {/* Stats — grid tile style */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/60 rounded-xl overflow-hidden border border-border/60">
          {[
            {
              label: 'ยอดขายวันนี้',
              value: `฿${data.todayRevenue.toLocaleString()}`,
              sub: `${data.todayClosedSessions} โต๊ะปิดแล้ว`,
              primary: true,
              onClick: () => router.push('/admin/history'),
            },
            {
              label: 'โต๊ะที่เปิดอยู่',
              value: String(data.activeSessions),
              sub: `ว่างอีก ${data.availableTables} โต๊ะ`,
              onClick: () => router.push('/admin/tables'),
            },
            {
              label: 'รอทำในครัว',
              value: String(data.pendingOrderItems),
              sub: 'รายการที่ยังไม่เสร็จ',
              highlight: pendingCount > 0,
              onClick: () => router.push('/kitchen'),
            },
            {
              label: 'ออเดอร์วันนี้',
              value: String(data.todayOrders),
              sub: 'จากทุกโต๊ะ',
              onClick: null,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              onClick={stat.onClick ?? undefined}
              className={cn(
                'bg-card px-5 py-4 flex flex-col gap-1 transition-colors',
                stat.onClick ? 'cursor-pointer hover:bg-muted/50' : ''
              )}
            >
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={cn(
                'text-3xl font-bold tracking-tight tabular-nums leading-none',
                stat.highlight ? 'text-amber-600' : '',
                (stat as any).primary ? 'text-primary' : ''
              )}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent orders + Table status */}
      {data && (
        <div className="grid lg:grid-cols-5 gap-4">

          {/* Recent orders — wider */}
          <Card className="lg:col-span-3">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <p className="text-sm font-semibold">ออเดอร์ล่าสุด</p>
                <button
                  onClick={() => router.push('/admin/history')}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
                >
                  ดูทั้งหมด <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {data.recentOrders.length === 0 ? (
                <div className="px-5 pb-5">
                  <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
                    ยังไม่มีออเดอร์วันนี้
                  </p>
                </div>
              ) : (
                <div>
                  {data.recentOrders.map((order, idx) => (
                    <div
                      key={order.id}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3',
                        idx !== data.recentOrders.length - 1 && 'border-b border-border/50'
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          #{order.id}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{order.session.table.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {order.items.map(i => `${i.menuItem.name} ×${i.qty}`).join(', ')}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                        {new Date(order.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right column: table status + quick actions */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Table status */}
            <Card className="flex-1">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold">สถานะโต๊ะ</p>
                  <button
                    onClick={() => router.push('/admin/tables')}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
                  >
                    จัดการ <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {data.totalTables === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    ยังไม่มีโต๊ะ
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {Array.from({ length: data.totalTables }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'w-8 h-8 rounded-md text-[11px] font-semibold flex items-center justify-center',
                            i < data.occupiedTables
                              ? 'bg-primary text-white'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-primary inline-block" />
                        ใช้งาน {data.occupiedTables}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-muted-foreground/30 inline-block" />
                        ว่าง {data.availableTables}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardContent className="p-2">
                {[
                  { label: 'เปิดโต๊ะ', href: '/admin/open-table', icon: QrCode },
                  { label: 'ปิดโต๊ะ', href: '/admin/close-table', icon: ShoppingBag },
                  { label: 'จัดการเมนู', href: '/admin/menu', icon: MenuIcon },
                  { label: 'ดูครัว', href: '/kitchen', icon: ChefHat },
                ].map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.label}
                      onClick={() => router.push(action.href)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{action.label}</span>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

          </div>
        </div>
      )}

    </div>
  )
}
