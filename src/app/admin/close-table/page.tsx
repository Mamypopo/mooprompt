'use client'

import { useEffect, useState, useCallback } from 'react'
import { Receipt, Users, Clock, Package as PackageIcon, QrCode, XCircle, AlertCircle } from 'lucide-react'
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
import { getSocket } from '@/lib/socket-client'
import Swal from '@/lib/swal-config'

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

interface ExtraCharge {
  id: number
  name: string
  price: number
  chargeType: 'PER_PERSON' | 'PER_SESSION'
  active: boolean
}

export default function CloseTablePage() {
  useStaffLocale() // Force Thai locale for admin
  const t = useTranslations()
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH')
  const [selectedExtraCharges, setSelectedExtraCharges] = useState<number[]>([])
  const [closing, setClosing] = useState(false)
  const [cancelling, setCancelling] = useState<number | null>(null)
  const [newSessionIds, setNewSessionIds] = useState<Set<number>>(new Set())
  const [previousSessionIds, setPreviousSessionIds] = useState<Set<number>>(new Set())

  const fetchActiveSessions = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const [sessionsRes, extraChargesRes] = await Promise.all([
        fetch('/api/sessions/active'),
        fetch('/api/extra-charges'),
      ])
      
      if (!sessionsRes.ok) {
        throw new Error('Failed to fetch active sessions')
      }
      
      const sessionsData = await sessionsRes.json()
      const extraChargesData = await extraChargesRes.json()
      
      const newSessions = sessionsData.sessions || []
      const newSessionIdsSet = new Set<number>(newSessions.map((s: ActiveSession) => s.id))
      
      // Detect new sessions (only when not showing loading - i.e., from socket updates)
      if (!showLoading && previousSessionIds.size > 0) {
        const addedSessions = newSessions.filter((s: ActiveSession) => !previousSessionIds.has(s.id))
        const removedSessions = Array.from(previousSessionIds).filter(id => !newSessionIdsSet.has(id))
        
        // Show toast for new sessions
        if (addedSessions.length > 0) {
          const session = addedSessions[0]
          Swal.fire({
            icon: 'info',
            title: 'มีโต๊ะใหม่',
            text: `${session.table.name} - ${session.peopleCount} คน`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
          })
          
          // Highlight new sessions
          setNewSessionIds(new Set(addedSessions.map((s: ActiveSession) => s.id)))
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setNewSessionIds((prev) => {
              const next = new Set(prev)
              addedSessions.forEach((s: ActiveSession) => next.delete(s.id))
              return next
            })
          }, 3000)
        }
        
        // Show toast for closed sessions
        if (removedSessions.length > 0 && sessions.length > 0) {
          const removedSession = sessions.find((s: ActiveSession) => removedSessions.includes(s.id))
          if (removedSession) {
            Swal.fire({
              icon: 'success',
              title: 'ปิดโต๊ะแล้ว',
              text: `${removedSession.table.name}`,
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
            })
          }
        }
      }
      
      setSessions(newSessions)
      setExtraCharges((extraChargesData.extraCharges || []).filter((ec: ExtraCharge) => ec.active))
      setPreviousSessionIds(newSessionIdsSet)
    } catch (error) {
      console.error('Error fetching data:', error)
      if (showLoading) {
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
      }
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchActiveSessions(true) // Show loading on initial load

    // Setup socket.io for real-time updates
    const socket = getSocket()

    socket.on('billing:closed', () => {
      // When a billing is closed, refresh sessions silently (no loading)
      fetchActiveSessions(false)
    })

    socket.on('session:opened', () => {
      // When a new session is opened, refresh sessions silently (no loading)
      fetchActiveSessions(false)
    })

    socket.on('order:new', () => {
      // When a new order is created, refresh to update order count silently (no loading)
      fetchActiveSessions(false)
    })

    return () => {
      socket.off('billing:closed')
      socket.off('session:opened')
      socket.off('session:cancelled')
      socket.off('order:new')
    }
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
          extraChargeIds: selectedExtraCharges,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to close table')
      }

      const data = await response.json()
      const billing = data.billing

      const paymentMethodText = paymentMethod === 'CASH' ? 'เงินสด' : 'QR Code'
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
      setSelectedExtraCharges([])
      
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

  // Helper function to check if session can be cancelled
  const canCancelSession = (session: ActiveSession): boolean => {
    // Can cancel if no orders at all
    return session._count.orders === 0
  }

  const handleCancelSession = async (session: ActiveSession, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!canCancelSession(session)) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่สามารถยกเลิกได้',
        text: 'Session นี้มีออเดอร์อยู่แล้ว กรุณาปิดบิลแทน',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    const result = await Swal.fire({
      title: 'ยืนยันการยกเลิก',
      html: `
        <div class="text-left">
          <p class="mb-2">คุณต้องการยกเลิก session นี้หรือไม่?</p>
          <div class="mt-3 space-y-1 text-sm">
            <p><strong>โต๊ะ:</strong> ${session.table.name}</p>
            <p><strong>จำนวนคน:</strong> ${session.peopleCount} คน</p>
            ${session.package ? `<p><strong>แพ็กเกจ:</strong> ${session.package.name}</p>` : ''}
            <p><strong>ออเดอร์:</strong> ${session._count.orders} ออเดอร์</p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยกเลิก Session',
      cancelButtonText: 'ไม่ยกเลิก',
      confirmButtonColor: '#FF8C42',
      cancelButtonColor: '#6B7280',
    })

    if (!result.isConfirmed) return

    setCancelling(session.id)

    try {
      const response = await fetch('/api/session/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel session')
      }

      Swal.fire({
        icon: 'success',
        title: 'ยกเลิกสำเร็จ',
        text: `ยกเลิก session สำหรับ ${session.table.name} เรียบร้อยแล้ว`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })

      // Refresh sessions silently
      fetchActiveSessions(false)
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถยกเลิก session ได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    } finally {
      setCancelling(null)
    }
  }

  // Skeleton component for session cards
  const SessionCardSkeleton = () => (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="h-6 bg-muted rounded w-24 mb-2"></div>
            <div className="flex gap-4 mt-2">
              <div className="h-4 bg-muted rounded w-16"></div>
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="h-3 bg-muted rounded w-20 mb-2"></div>
            <div className="h-4 bg-muted rounded w-16 mb-2"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-muted rounded w-20"></div>
              <div className="h-8 bg-muted rounded w-20"></div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  )

  // Skeleton component for billing form
  const BillingFormSkeleton = () => (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 bg-muted rounded w-32"></div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-4 bg-muted rounded w-24"></div>
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-4 bg-muted rounded w-32"></div>
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-4 bg-muted rounded w-24"></div>
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-4 bg-muted rounded w-16"></div>
        <div className="h-10 bg-muted rounded"></div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div>
        <div className="h-7 bg-muted rounded w-32 mb-4 sm:mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Sessions List Skeleton */}
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <SessionCardSkeleton key={i} />
            ))}
          </div>
          {/* Billing Form Skeleton */}
          <div>
            <BillingFormSkeleton />
          </div>
        </div>
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
                className={`cursor-pointer transition-all duration-500 ${
                  selectedSession === session.id.toString()
                    ? 'ring-2 ring-primary'
                    : ''
                } ${
                  newSessionIds.has(session.id)
                    ? 'ring-2 ring-success bg-success/10 shadow-lg scale-[1.02]'
                    : ''
                } animate-in fade-in slide-in-from-top-2`}
                onClick={() => setSelectedSession(session.id.toString())}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg sm:text-xl">
                          {session.table.name}
                        </CardTitle>
                        {canCancelSession(session) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/20 dark:bg-warning/10 text-warning-foreground dark:text-warning border border-warning/30 dark:border-warning/20">
                            <AlertCircle className="w-3 h-3" />
                            ยังไม่มีออเดอร์
                          </span>
                        )}
                      </div>
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
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-xs text-muted-foreground">
                        เริ่ม: {formatTime(session.startTime)}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {session._count.orders} ออเดอร์
                      </p>
                      <div className="flex gap-2">
                        {canCancelSession(session) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-warning/80 dark:border-warning/60 bg-warning/10 dark:bg-warning/10 text-warning-foreground dark:text-warning font-medium hover:bg-warning/20 dark:hover:bg-warning/20 hover:border-warning dark:hover:border-warning/80 shadow-sm"
                            onClick={(e) => handleCancelSession(session, e)}
                            disabled={cancelling === session.id}
                          >
                            {cancelling === session.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-warning-foreground dark:border-warning/80 mr-1"></div>
                                <span>กำลังยกเลิก...</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                ยกเลิก
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border/80 hover:border-primary/50 hover:text-primary shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`/api/qr/pdf?sessionId=${session.id}`, '_blank')
                          }}
                        >
                          <QrCode className="w-3 h-3 mr-1" />
                          พิมพ์ QR
                        </Button>
                      </div>
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
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">เลือกโต๊ะ *</label>
                  {selectedSession && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.open(`/api/qr/pdf?sessionId=${selectedSession}`, '_blank')
                      }}
                    >
                      <QrCode className="w-3 h-3 mr-1" />
                      พิมพ์ QR Code
                    </Button>
                  )}
                </div>
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
                  </SelectContent>
                </Select>
              </div>

              {extraCharges.length > 0 && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">ค่าบริการเพิ่มเติม</label>
                  <div className="space-y-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
                    {extraCharges.map((extraCharge) => {
                      const isSelected = selectedExtraCharges.includes(extraCharge.id)
                      const selectedSessionData = sessions.find(s => s.id.toString() === selectedSession)
                      const peopleCount = selectedSessionData?.peopleCount || 0
                      
                      const chargeLabel = extraCharge.chargeType === 'PER_PERSON'
                        ? `ต่อคน`
                        : `ต่อเซสชัน`
                      
                      const totalAmount = extraCharge.chargeType === 'PER_PERSON'
                        ? extraCharge.price * peopleCount
                        : extraCharge.price
                      
                      return (
                        <div
                          key={extraCharge.id}
                          className={`flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer ${
                            isSelected ? 'bg-primary/5 border border-primary' : ''
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedExtraCharges(selectedExtraCharges.filter(id => id !== extraCharge.id))
                            } else {
                              setSelectedExtraCharges([...selectedExtraCharges, extraCharge.id])
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{extraCharge.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {extraCharge.price.toLocaleString()} บาท ({chargeLabel})
                              {isSelected && selectedSession && (
                                <span className="ml-2 text-primary font-semibold">
                                  รวม: {totalAmount.toLocaleString()} บาท
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

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
