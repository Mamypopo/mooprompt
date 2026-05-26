'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  TableIcon, ShoppingBag, TrendingUp, Clock,
  Users, RefreshCw, ChevronRight, QrCode,
  Menu as MenuIcon, Flame, ArrowUpRight,
} from 'lucide-react'
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

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-5">
                <Skeleton className="h-10 w-10 rounded-xl mb-3" />
                <Skeleton className="h-8 w-16 mb-1.5" />
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const urgentOrders = data?.pendingOrderItems ?? 0

  return (
    <div className="space-y-5">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C1C1E] via-[#2C2C2E] to-[#1C1C1E] border border-white/10 p-6 sm:p-7">
        {/* glow blobs */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 bg-primary/25 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 bg-blue-500/15 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-0.5">
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">ภาพรวมวันนี้</h1>
            <p className="text-gray-500 text-xs mt-1">
              อัพเดทล่าสุด {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {urgentOrders > 10 && (
              <div className="flex items-center gap-1.5 bg-destructive/20 border border-destructive/40 text-destructive rounded-full px-3 py-1.5 text-xs font-medium">
                <Flame className="w-3.5 h-3.5" />
                {urgentOrders} รอทำ!
              </div>
            )}
            <Button
              size="sm"
              onClick={fetchDashboard}
              className="bg-white/10 hover:bg-white/20 text-white border-0 gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">รีเฟรช</span>
            </Button>
          </div>
        </div>

        {/* mini stat strip */}
        {data && (
          <div className="relative mt-5 flex flex-wrap gap-2">
            {[
              { label: 'โต๊ะที่เปิด', value: data.activeSessions },
              { label: 'ยอดขาย', value: `฿${data.todayRevenue.toLocaleString()}` },
              { label: 'ออเดอร์', value: data.todayOrders },
              { label: 'ปิดโต๊ะแล้ว', value: data.todayClosedSessions },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                <p className="text-white/50 text-xs leading-none mb-1">{s.label}</p>
                <p className="text-white font-bold text-lg leading-none">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              title: 'โต๊ะที่เปิดอยู่',
              value: data.activeSessions,
              sub: `ว่าง ${data.availableTables} จาก ${data.totalTables} โต๊ะ`,
              icon: TableIcon,
              gradient: 'from-blue-500 to-blue-600',
              glow: 'shadow-blue-500/20',
              action: () => router.push('/admin/tables'),
            },
            {
              title: 'รอทำในครัว',
              value: data.pendingOrderItems,
              sub: 'รายการที่ยังไม่เสร็จ',
              icon: ShoppingBag,
              gradient: urgentOrders > 10 ? 'from-destructive to-red-600' : 'from-orange-500 to-orange-600',
              glow: urgentOrders > 10 ? 'shadow-destructive/30' : 'shadow-orange-500/20',
              action: () => router.push('/kitchen'),
            },
            {
              title: 'ยอดขายวันนี้',
              value: `฿${data.todayRevenue.toLocaleString()}`,
              sub: `${data.todayClosedSessions} โต๊ะปิดแล้ว`,
              icon: TrendingUp,
              gradient: 'from-emerald-500 to-emerald-600',
              glow: 'shadow-emerald-500/20',
              action: () => router.push('/admin/history'),
            },
            {
              title: 'ออเดอร์วันนี้',
              value: data.todayOrders,
              sub: 'จากทุกโต๊ะ',
              icon: Users,
              gradient: 'from-violet-500 to-violet-600',
              glow: 'shadow-violet-500/20',
              action: null,
            },
          ].map((card) => {
            const Icon = card.icon
            return (
              <Card
                key={card.title}
                onClick={card.action ?? undefined}
                className={`
                  group relative overflow-hidden transition-all duration-200 border-border/60
                  ${card.action ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg ' + card.glow : ''}
                `}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight">{card.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">{card.title}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 leading-tight">{card.sub}</p>
                  {card.action && (
                    <ArrowUpRight className="absolute top-4 right-4 w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Table Status + Recent Orders ── */}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Table occupancy */}
          <Card className="overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-orange-400 to-yellow-400" />
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>สถานะโต๊ะ</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {data.totalTables > 0 ? Math.round((data.occupiedTables / data.totalTables) * 100) : 0}% ถูกใช้
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: data.totalTables > 0 ? `${(data.occupiedTables / data.totalTables) * 100}%` : '0%' }}
                />
              </div>
              <div className="flex gap-4 mb-5">
                <div className="flex-1 rounded-xl bg-primary/5 border border-primary/20 p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{data.occupiedTables}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">ถูกใช้งาน</p>
                </div>
                <div className="flex-1 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{data.availableTables}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">ว่าง</p>
                </div>
                <div className="flex-1 rounded-xl bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold">{data.totalTables}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">ทั้งหมด</p>
                </div>
              </div>
              <Button
                variant="outline" size="sm" className="w-full gap-1.5 hover:border-primary/40"
                onClick={() => router.push('/admin/tables')}
              >
                ดูโต๊ะทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent orders */}
          <Card className="overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-blue-500" />
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                ออเดอร์ล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">ยังไม่มีออเดอร์วันนี้</p>
              ) : (
                <div className="divide-y divide-border/50">
                  {data.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-3 py-2.5">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-violet-600 text-xs font-bold">#{order.id}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{order.session.table.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {order.items.map((i) => `${i.menuItem.name}×${i.qty}`).join(', ')}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
                        {new Date(order.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline" size="sm" className="mt-4 w-full gap-1.5 hover:border-primary/40"
                onClick={() => router.push('/admin/history')}
              >
                ดูประวัติทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <CardHeader className="pb-3 pt-5">
          <CardTitle className="text-base font-semibold">การดำเนินการด่วน</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'เปิดโต๊ะ', href: '/admin/open-table', icon: QrCode, gradient: 'from-blue-500 to-blue-600', glow: 'hover:shadow-blue-500/20' },
              { label: 'ปิดโต๊ะ', href: '/admin/close-table', icon: ShoppingBag, gradient: 'from-orange-500 to-orange-600', glow: 'hover:shadow-orange-500/20' },
              { label: 'จัดการเมนู', href: '/admin/menu', icon: MenuIcon, gradient: 'from-violet-500 to-violet-600', glow: 'hover:shadow-violet-500/20' },
              { label: 'ดูครัว', href: '/kitchen', icon: Flame, gradient: 'from-emerald-500 to-emerald-600', glow: 'hover:shadow-emerald-500/20' },
            ].map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className={`group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${action.glow}`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
