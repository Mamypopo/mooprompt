'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Swal from 'sweetalert2'

export default function HomePage() {
  const router = useRouter()

  const handleScanQR = () => {
    // In a real app, this would open camera for QR scanning
    const scannedTableId = prompt('กรอก Session ID (สำหรับทดสอบ):')
    if (scannedTableId) {
      const sessionIdNum = parseInt(scannedTableId, 10)
      if (!isNaN(sessionIdNum)) {
        router.push(`/session/${sessionIdNum}`)
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Session ID ไม่ถูกต้อง',
          text: 'กรุณาติดต่อพนักงานเพื่อขอ QR Code ใหม่',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">ยินดีต้อนรับ</CardTitle>
          <CardDescription>
            สแกน QR Code เพื่อเริ่มต้นสั่งอาหาร
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleScanQR}
            className="w-full"
            size="lg"
          >
            <QrCode className="w-5 h-5 mr-2" />
            สแกน QR Code
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              💡 ถ้าทำ QR Code หาย กรุณาติดต่อพนักงานเพื่อขอ QR Code ใหม่
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

