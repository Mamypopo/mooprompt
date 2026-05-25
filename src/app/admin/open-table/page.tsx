'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, Users, Package as PackageIcon, Printer, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Swal from 'sweetalert2'
import QRCode from 'qrcode'

interface Table { id: number; name: string; status: 'AVAILABLE' | 'OCCUPIED' }
interface Package { id: number; name: string; pricePerPerson: number; durationMinutes: number | null }
interface ExtraCharge { id: number; name: string; price: number; chargeType: 'PER_PERSON' | 'PER_SESSION'; active: boolean }
interface Session {
  id: number; tableId: number; peopleCount: number; packageId: number | null
  startTime: string; expireTime: string | null; status: 'ACTIVE' | 'CLOSED'
  table: { id: number; name: string }; package: Package | null
}

const STEPS = ['เลือกโต๊ะ', 'ประเภท / แพ็กเกจ', 'บริการเพิ่มเติม']

export default function OpenTablePage() {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(0)

  // Form fields
  const [selectedTable, setSelectedTable] = useState('')
  const [peopleCount, setPeopleCount] = useState('')
  const [sessionType, setSessionType] = useState<'buffet' | 'a_la_carte' | ''>('')
  const [selectedPackage, setSelectedPackage] = useState('')
  const [selectedExtraCharges, setSelectedExtraCharges] = useState<number[]>([])

  // Result
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [createdSession, setCreatedSession] = useState<Session | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [tablesRes, packagesRes, ecRes] = await Promise.all([
        fetch('/api/tables?status=AVAILABLE'),
        fetch('/api/packages'),
        fetch('/api/extra-charges'),
      ])
      const [td, pd, ecd] = await Promise.all([tablesRes.json(), packagesRes.json(), ecRes.json()])
      setTables(td.tables || [])
      setPackages(pd.packages || [])
      setExtraCharges((ecd.extraCharges || []).filter((ec: ExtraCharge) => ec.active))
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถโหลดข้อมูลได้', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const generateQRCode = async (sessionId: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      return await QRCode.toDataURL(`${baseUrl}/session/${sessionId}`, { width: 300, margin: 2 })
    } catch { return null }
  }

  // Step validation
  const canProceedStep0 = selectedTable && peopleCount && parseInt(peopleCount) >= 1
  const canProceedStep1 = sessionType && (sessionType !== 'buffet' || selectedPackage)

  const handleNext = () => {
    if (step === 0 && !canProceedStep0) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบ', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
      return
    }
    if (step === 1 && !canProceedStep1) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกประเภทและแพ็กเกจ', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
      return
    }
    setStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/session/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: parseInt(selectedTable),
          peopleCount: parseInt(peopleCount),
          packageId: sessionType === 'buffet' && selectedPackage ? parseInt(selectedPackage) : undefined,
          extraChargeIds: selectedExtraCharges,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to open table')
      }
      const data = await response.json()
      const session: Session = data.session
      const qrUrl = await generateQRCode(session.id)
      if (qrUrl) setQrCodeUrl(qrUrl)
      setCreatedSession(session)
      Swal.fire({ icon: 'success', title: 'เปิดโต๊ะสำเร็จ', text: `${session.table.name} เปิดแล้ว`, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
      fetchData()
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message || 'ไม่สามารถเปิดโต๊ะได้', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setStep(0)
    setSelectedTable('')
    setPeopleCount('')
    setSessionType('')
    setSelectedPackage('')
    setSelectedExtraCharges([])
    setQrCodeUrl('')
    setCreatedSession(null)
  }

  const handlePrintQR = () => {
    if (!createdSession) return
    window.open(`/api/qr/pdf?sessionId=${createdSession.id}`, '_blank')
  }

  // Skeleton
  if (loading) {
    return (
      <div>
        <div className="h-7 bg-muted rounded w-32 mb-6 animate-pulse" />
        <div className="max-w-lg">
          <div className="h-12 bg-muted rounded mb-6 animate-pulse" />
          <Card className="animate-pulse">
            <CardContent className="p-6 space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted rounded" />)}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // QR result screen
  if (createdSession && qrCodeUrl) {
    return (
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-6">เปิดโต๊ะ</h1>
        <div className="max-w-sm mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />QR Code สำหรับโต๊ะ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="space-y-1">
                <p className="text-xl font-bold">{createdSession.table.name}</p>
                <p className="text-sm text-muted-foreground">{createdSession.peopleCount} คน</p>
                {createdSession.package && (
                  <Badge variant="secondary">{createdSession.package.name}</Badge>
                )}
              </div>
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <img src={qrCodeUrl} alt="QR Code" className="w-full max-w-[260px] h-auto" />
              </div>
              <p className="text-xs text-muted-foreground">
                ลูกค้าสแกน QR Code นี้เพื่อเข้าสู่ระบบสั่งอาหาร
              </p>
              <div className="flex gap-2">
                <Button onClick={handlePrintQR} className="flex-1">
                  <Printer className="w-4 h-4 mr-2" />พิมพ์
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex-1">เปิดโต๊ะใหม่</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Selected package info
  const selectedPkgObj = packages.find((p) => p.id.toString() === selectedPackage)
  const peopleCountNum = parseInt(peopleCount) || 0

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-6">เปิดโต๊ะ</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8 max-w-lg">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i < step ? 'bg-primary text-primary-foreground' :
                i === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs mt-1 text-center whitespace-nowrap">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="max-w-lg">
        <Card>
          <CardContent className="p-6">
            {/* Step 0: Table + People */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>เลือกโต๊ะ *</Label>
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกโต๊ะ" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.length === 0 ? (
                        <SelectItem value="none" disabled>ไม่มีโต๊ะว่าง</SelectItem>
                      ) : (
                        tables.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {tables.length === 0 && (
                    <p className="text-xs text-destructive">ไม่มีโต๊ะว่างในขณะนี้</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>จำนวนคน *</Label>
                  <Input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    value={peopleCount}
                    onChange={(e) => { if (e.target.value === '' || /^\d+$/.test(e.target.value)) setPeopleCount(e.target.value) }}
                    placeholder="ระบุจำนวนคน"
                  />
                </div>
              </div>
            )}

            {/* Step 1: Type + Package */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setSessionType('a_la_carte'); setSelectedPackage('') }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${sessionType === 'a_la_carte' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
                  >
                    <p className="font-semibold text-sm">À la carte</p>
                    <p className="text-xs text-muted-foreground mt-1">สั่งตามเมนู คิดราคาตามจริง</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionType('buffet')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${sessionType === 'buffet' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
                  >
                    <p className="font-semibold text-sm">บุฟเฟ่ต์</p>
                    <p className="text-xs text-muted-foreground mt-1">จ่ายตามแพ็กเกจ ทานไม่อั้น</p>
                  </button>
                </div>

                {sessionType === 'buffet' && (
                  <div className="grid gap-2">
                    <Label>แพ็กเกจบุฟเฟ่ต์ *</Label>
                    {packages.length === 0 ? (
                      <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted">ไม่มีแพ็กเกจ</p>
                    ) : (
                      <div className="space-y-2">
                        {packages.map((pkg) => (
                          <button
                            key={pkg.id} type="button"
                            onClick={() => setSelectedPackage(pkg.id.toString())}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${selectedPackage === pkg.id.toString() ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm">{pkg.name}</span>
                              <span className="text-primary font-bold text-sm">฿{pkg.pricePerPerson.toLocaleString()}/คน</span>
                            </div>
                            {pkg.durationMinutes && (
                              <p className="text-xs text-muted-foreground mt-0.5">{pkg.durationMinutes} นาที</p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedPkgObj && peopleCountNum > 0 && (
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-sm font-medium">ราคารวม: <span className="text-primary font-bold">฿{(selectedPkgObj.pricePerPerson * peopleCountNum).toLocaleString()}</span></p>
                        <p className="text-xs text-muted-foreground">{selectedPkgObj.pricePerPerson.toLocaleString()} × {peopleCountNum} คน</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Extra charges + summary */}
            {step === 2 && (
              <div className="space-y-4">
                {extraCharges.length > 0 && (
                  <div className="grid gap-2">
                    <Label>ค่าบริการเพิ่มเติม (ไม่บังคับ)</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {extraCharges.map((ec) => {
                        const selected = selectedExtraCharges.includes(ec.id)
                        const total = ec.chargeType === 'PER_PERSON' ? ec.price * peopleCountNum : ec.price
                        return (
                          <div
                            key={ec.id}
                            onClick={() => setSelectedExtraCharges(selected ? selectedExtraCharges.filter((id) => id !== ec.id) : [...selectedExtraCharges, ec.id])}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selected ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'}`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                              {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{ec.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ฿{ec.price.toLocaleString()} {ec.chargeType === 'PER_PERSON' ? 'ต่อคน' : 'ต่อเซสชัน'}
                                {selected && peopleCountNum > 0 && (
                                  <span className="ml-2 text-primary font-semibold">= ฿{total.toLocaleString()}</span>
                                )}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="p-4 bg-muted/50 rounded-xl space-y-2 border">
                  <p className="text-sm font-semibold mb-2">สรุป</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">โต๊ะ</span>
                    <span className="font-medium">{tables.find((t) => t.id.toString() === selectedTable)?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">จำนวนคน</span>
                    <span className="font-medium">{peopleCount} คน</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ประเภท</span>
                    <span className="font-medium">{sessionType === 'buffet' ? 'บุฟเฟ่ต์' : 'À la carte'}</span>
                  </div>
                  {selectedPkgObj && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">แพ็กเกจ</span>
                      <span className="font-medium">{selectedPkgObj.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" />ย้อนกลับ
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} className="flex-1" disabled={tables.length === 0}>
              ถัดไป<ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-1" disabled={submitting}>
              {submitting ? 'กำลังเปิดโต๊ะ...' : 'เปิดโต๊ะ'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
