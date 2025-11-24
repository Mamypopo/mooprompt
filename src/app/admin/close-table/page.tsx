'use client'

import { useEffect, useState, useCallback } from 'react'
import { Receipt, Users, Clock, Package as PackageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslations } from '@/lib/i18n'
import { useStaffLocale } from '@/lib/i18n-staff'
import Swal from 'sweetalert2'

interface ActiveSession {
  id: number
  tableId: number
  peopleCount: number
  packageId: number | null
  startTime: string
  expireTime: string | null
  status: 'ACTIVE' | 'CLOSED'
  table: {
    id: number
    name: string
    status: 'AVAILABLE' | 'OCCUPIED'
  }
  package: {
    id: number
    name: string
    pricePerPerson: number
  } | null
  orders: Array<{ id: number }>
  _count: {
    orders: number
  }
}

export default function CloseTablePage() {
  useStaffLocale() // Force Thai locale for admin
  const t = useTranslations()
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH')
  const [closing, setClosing] = useState(false)

  const fetchActiveSessions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sessions/active')
      
      if (!response.ok) {
        throw new Error('Failed to fetch active sessions')
      }
      
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Error fetching active sessions:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActiveSessions()
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchActiveSessions, 5000)
    return () => clearInterval(interval)
  }, [fetchActiveSessions])

  const handleCloseTable = async () => {
    if (!selectedSession) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกโต๊ะ',
        text: 'กรุณาเลือกโต๊ะที่ต้องการปิด',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    const result = await Swal.fire({
      title: 'ยืนยันการปิดโต๊ะ',
      text: 'คุณต้องการปิดโต๊ะและสร้างบิลหรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ปิดโต๊ะ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#FF6A8B',
    })

    if (!result.isConfirmed) return

    setClosing(true)

    try {
      const response = await fetch('/api/billing/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: parseInt(selectedSession, 10),
          paymentMethod,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to close table')
      }

      const data = await response.json()
      const billing = data.billing

      const paymentMethodText = paymentMethod === 'CASH' ? 'เงินสด' : paymentMethod === 'QR' ? 'QR Code' : 'บัตรเครดิต'
      Swal.fire({
        icon: 'success',
        title: 'ปิดโต๊ะสำเร็จ',
        text: `ยอดรวม: ${billing.subtotal.toFixed(2)} บาท | ค่าบริการ: ${billing.extraCharge.toFixed(2)} บาท | ส่วนลด: ${billing.discount.toFixed(2)} บาท | ยอดสุทธิ: ${billing.grandTotal.toFixed(2)} บาท | วิธีชำระ: ${paymentMethodText}`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      })

      // Reset
      setSelectedSession('')
      setPaymentMethod('CASH')
      
      // Refresh sessions
      fetchActiveSessions()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถปิดโต๊ะได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    } finally {
      setClosing(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDuration = (startTime: string) => {
    const start = new Date(startTime)
    const now = new Date()
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60) // minutes
    const hours = Math.floor(diff / 60)
    const minutes = diff % 60
    return `${hours} ชม. ${minutes} นาที`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        {t('admin.close_table')}
      </h1>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">ไม่มีโต๊ะที่เปิดอยู่</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Active Sessions List */}
          <div className="lg:col-span-2 space-y-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`cursor-pointer transition-all ${
                  selectedSession === session.id.toString()
                    ? 'ring-2 ring-primary'
                    : ''
                }`}
                onClick={() => setSelectedSession(session.id.toString())}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">
                        โต๊ะที่ {session.table.tableNumber}
                      </CardTitle>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{session.peopleCount} คน</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{getDuration(session.startTime)}</span>
                        </div>
                        {session.package && (
                          <div className="flex items-center gap-1">
                            <PackageIcon className="w-4 h-4" />
                            <span>{session.package.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        เริ่ม: {formatTime(session.startTime)}
                      </p>
                      <p className="text-sm font-semibold text-primary mt-1">
                        {session._count.orders} ออเดอร์
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Close Table Form */}
          <Card>
            <CardHeader>
              <CardTitle>ปิดโต๊ะ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">เลือกโต๊ะ *</label>
                <Select
                  value={selectedSession}
                  onValueChange={setSelectedSession}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกโต๊ะ" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem
                        key={session.id}
                        value={session.id.toString()}
                      >
                        {session.table.name} ({session.peopleCount} คน)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">วิธีการชำระเงิน *</label>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">เงินสด</SelectItem>
                    <SelectItem value="QR">QR Code</SelectItem>
                    <SelectItem value="CREDIT">บัตรเครดิต</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCloseTable}
                disabled={!selectedSession || closing}
                className="w-full"
              >
                {closing ? 'กำลังปิดโต๊ะ...' : 'ปิดโต๊ะและสร้างบิล'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
