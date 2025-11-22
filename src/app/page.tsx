'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useTranslations } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/language-switcher'
import Swal from 'sweetalert2'

export default function HomePage() {
  const router = useRouter()
  const t = useTranslations()
  const [tableNumber, setTableNumber] = useState('')

  const handleScanQR = () => {
    // In a real app, this would open camera for QR scanning
    Swal.fire({
      title: 'สแกน QR Code',
      text: 'กรุณาใช้กล้องสแกน QR Code บนโต๊ะ',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'สแกน',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        // Simulate QR scan result
        const scannedTableId = prompt('กรอก Table ID (สำหรับทดสอบ):')
        if (scannedTableId) {
          router.push(`/session/${scannedTableId}`)
        }
      }
    })
  }

  const handleEnterTable = () => {
    if (!tableNumber) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณากรอกหมายเลขโต๊ะ',
      })
      return
    }

    router.push(`/session/${tableNumber}`)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">ยินดีต้อนรับ</CardTitle>
          <CardDescription>
            สแกน QR Code หรือกรอกหมายเลขโต๊ะเพื่อเริ่มต้น
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleScanQR}
            className="w-full"
            size="lg"
          >
            <QrCode className="w-5 h-5 mr-2" />
            {t('table.scan_qr')}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                หรือ
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              type="number"
              placeholder="กรอกหมายเลขโต๊ะ"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleEnterTable()
                }
              }}
            />
            <Button
              onClick={handleEnterTable}
              className="w-full"
              variant="outline"
            >
              เข้าสู่โต๊ะ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

