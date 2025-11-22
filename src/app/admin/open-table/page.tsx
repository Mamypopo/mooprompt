'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, Users, Package as PackageIcon, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useTranslations } from '@/lib/i18n'
import { useStaffLocale } from '@/lib/i18n-staff'
import Swal from 'sweetalert2'
import QRCode from 'qrcode'

interface Table {
  id: number
  tableNumber: number
  status: 'AVAILABLE' | 'OCCUPIED'
}

interface Package {
  id: number
  name: string
  pricePerPerson: number
  durationMinutes: number | null
}

interface Session {
  id: number
  tableId: number
  peopleCount: number
  packageId: number | null
  startTime: string
  expireTime: string | null
  status: 'ACTIVE' | 'CLOSED'
  table: {
    id: number
    tableNumber: number
  }
  package: Package | null
}

export default function OpenTablePage() {
  useStaffLocale() // Force Thai locale for admin
  const router = useRouter()
  const t = useTranslations()
  const [tables, setTables] = useState<Table[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [peopleCount, setPeopleCount] = useState<string>('')
  // Use undefined to keep Select uncontrolled (Radix UI supports this natively)
  // This avoids the controlled/uncontrolled warning
  const [selectedPackage, setSelectedPackage] = useState<string | undefined>(undefined)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [createdSession, setCreatedSession] = useState<Session | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [tablesRes, packagesRes] = await Promise.all([
        fetch('/api/tables?status=AVAILABLE'),
        fetch('/api/packages'),
      ])

      const tablesData = await tablesRes.json()
      const packagesData = await packagesRes.json()

      setTables(tablesData.tables || [])
      setPackages(packagesData.packages || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลได้',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const generateQRCode = async (sessionId: number) => {
    try {
      // Use NEXT_PUBLIC_BASE_URL from env if available, otherwise use window.location
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      const url = `${baseUrl}/session/${sessionId}`
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
      return qrDataUrl
    } catch (error) {
      console.error('Error generating QR code:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTable || !peopleCount) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูลให้ครบ',
        text: 'กรุณาเลือกโต๊ะและระบุจำนวนคน',
      })
      return
    }

    const peopleCountNum = parseInt(peopleCount, 10)
    if (isNaN(peopleCountNum) || peopleCountNum < 1) {
      Swal.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ถูกต้อง',
        text: 'กรุณากรอกจำนวนคนที่ถูกต้อง',
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/session/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: parseInt(selectedTable, 10),
          peopleCount: peopleCountNum,
          packageId: selectedPackage ? parseInt(selectedPackage, 10) : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to open table')
      }

      const data = await response.json()
      const session: Session = data.session

      // Generate QR code
      const qrUrl = await generateQRCode(session.id)
      if (qrUrl) {
        setQrCodeUrl(qrUrl)
      }

      setCreatedSession(session)

      await Swal.fire({
        icon: 'success',
        title: 'เปิดโต๊ะสำเร็จ',
        text: `โต๊ะที่ ${session.table.tableNumber} เปิดแล้ว`,
        timer: 2000,
        showConfirmButton: false,
      })

      // Reset form
      setSelectedTable('')
      setPeopleCount('')
      setSelectedPackage(undefined)

      // Refresh tables
      fetchData()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถเปิดโต๊ะได้',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrintQR = async () => {
    if (!createdSession) return

    try {
      // Generate and open PDF in new window for printing
      const pdfUrl = `/api/qr/pdf?sessionId=${createdSession.id}`
      window.open(pdfUrl, '_blank')
      
      Swal.fire({
        icon: 'success',
        title: 'เปิด PDF แล้ว',
        text: 'สามารถพิมพ์ได้จากหน้าต่างใหม่',
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถสร้าง PDF ได้',
      })
    }
  }

  const handleCloseQR = () => {
    setQrCodeUrl('')
    setCreatedSession(null)
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
        {t('admin.open_table')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>เปิดโต๊ะใหม่</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="table">เลือกโต๊ะ *</Label>
                <Select
                  value={selectedTable}
                  onValueChange={setSelectedTable}
                  required
                >
                  <SelectTrigger id="table">
                    <SelectValue placeholder="เลือกโต๊ะ" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.length === 0 ? (
                      <SelectItem value="none" disabled>
                        ไม่มีโต๊ะว่าง
                      </SelectItem>
                    ) : (
                      tables.map((table) => (
                        <SelectItem key={table.id} value={table.id.toString()}>
                          โต๊ะที่ {table.tableNumber}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="peopleCount">จำนวนคน *</Label>
                <Input
                  id="peopleCount"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={peopleCount}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d+$/.test(value)) {
                      setPeopleCount(value)
                    }
                  }}
                  placeholder="ระบุจำนวนคน"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="package">แพ็กเกจ (ไม่บังคับ)</Label>
                {packages.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground border rounded-md bg-muted">
                    ไม่มีแพ็กเกจ
                  </div>
                ) : (
                  <>
                    <Select
                      key={selectedPackage ? 'controlled' : 'uncontrolled'}
                      {...(selectedPackage ? { value: selectedPackage } : {})}
                      onValueChange={setSelectedPackage}
                    >
                      <SelectTrigger id="package">
                        <SelectValue placeholder="เลือกแพ็กเกจ (ถ้ามี)" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id.toString()}>
                            {pkg.name} - {pkg.pricePerPerson.toFixed(2)} บาท/คน
                            {pkg.durationMinutes &&
                              ` (${pkg.durationMinutes} นาที)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedPackage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPackage(undefined)}
                        className="w-full justify-start text-xs"
                      >
                        ล้างการเลือกแพ็กเกจ
                      </Button>
                    )}
                  </>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting || tables.length === 0}
                className="w-full"
              >
                {submitting ? 'กำลังเปิดโต๊ะ...' : 'เปิดโต๊ะ'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* QR Code Display */}
        {qrCodeUrl && createdSession && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code สำหรับโต๊ะ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">
                  โต๊ะที่ {createdSession.table.tableNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  จำนวนคน: {createdSession.peopleCount} คน
                </p>
                {createdSession.package && (
                  <p className="text-sm text-muted-foreground">
                    แพ็กเกจ: {createdSession.package.name}
                  </p>
                )}
              </div>

              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-full max-w-[300px] h-auto"
                />
              </div>

              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  ลูกค้าสามารถสแกน QR Code นี้เพื่อเข้าสู่ระบบสั่งอาหาร
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={handlePrintQR}
                    className="flex-1"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    พิมพ์
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCloseQR}
                    className="flex-1"
                  >
                    ปิด
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
