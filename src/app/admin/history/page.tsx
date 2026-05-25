'use client'

import { useEffect, useState, useCallback } from 'react'
import { History, Calendar, ChevronDown, ChevronUp, Users, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface SessionHistory {
  id: number
  startTime: string
  peopleCount: number
  total: number
  table: { name: string }
  package: { name: string; pricePerPerson: number } | null
  orders: Array<{
    id: number
    items: Array<{
      qty: number
      itemType: string | null
      menuItem: { name: string; price: number }
    }>
  }>
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [dayRevenue, setDayRevenue] = useState(0)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/history?date=${date}&page=${page}`)
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
        setTotalPages(data.pages || 1)
        setTotalCount(data.total || 0)
        const revenue = (data.sessions || []).reduce((s: number, sess: SessionHistory) => s + sess.total, 0)
        setDayRevenue(revenue)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }, [date, page])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <History className="w-6 h-6 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold">ประวัติการขาย</h1>
      </div>

      {/* Date filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setPage(1) }}
            className="max-w-[180px]"
          />
        </div>
        {!loading && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{totalCount} เซสชัน</span>
            <span className="font-bold text-green-600">฿{dayRevenue.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Summary card */}
      {!loading && sessions.length > 0 && (
        <Card className="mb-4 bg-green-500/5 border-green-500/30">
          <CardContent className="p-4 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-muted-foreground">ยอดขายรวม</p>
              <p className="text-2xl font-bold text-green-600">฿{dayRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">จำนวนโต๊ะ</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">วันที่</p>
              <p className="text-base font-semibold">{formatDate(date + 'T00:00:00')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">ไม่มีข้อมูลในวันที่เลือก</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isOpen = expanded.has(session.id)
            const allItems = session.orders.flatMap((o) => o.items)
            return (
              <Card key={session.id} className="overflow-hidden">
                <button
                  className="w-full text-left"
                  onClick={() => toggleExpand(session.id)}
                >
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{session.table.name}</CardTitle>
                          {session.package && (
                            <Badge variant="secondary" className="text-xs">
                              <Package className="w-3 h-3 mr-1" />{session.package.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{formatTime(session.startTime)}</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />{session.peopleCount} คน
                          </span>
                          <span>{session.orders.length} ออเดอร์</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-lg font-bold text-green-600">
                          ฿{session.total.toLocaleString()}
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isOpen && (
                  <CardContent className="p-4 pt-0 border-t">
                    <div className="space-y-1">
                      {allItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1.5 text-sm border-b last:border-0">
                          <div className="flex items-center gap-2">
                            <span>{item.menuItem.name}</span>
                            <span className="text-xs text-muted-foreground">×{item.qty}</span>
                            {item.itemType === 'BUFFET_INCLUDED' && (
                              <Badge variant="outline" className="text-xs py-0">บุฟเฟ่ต์</Badge>
                            )}
                          </div>
                          <span className="font-medium">
                            {item.itemType === 'BUFFET_INCLUDED'
                              ? <span className="text-muted-foreground text-xs">รวม</span>
                              : `฿${(item.menuItem.price * item.qty).toLocaleString()}`}
                          </span>
                        </div>
                      ))}
                      {session.package && (
                        <div className="flex justify-between items-center py-1.5 text-sm border-b">
                          <span className="text-muted-foreground">แพ็กเกจ {session.package.name} ×{session.peopleCount}</span>
                          <span className="font-medium">฿{(session.package.pricePerPerson * session.peopleCount).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 font-bold">
                        <span>รวมทั้งหมด</span>
                        <span className="text-green-600">฿{session.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>ก่อนหน้า</Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>ถัดไป</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
