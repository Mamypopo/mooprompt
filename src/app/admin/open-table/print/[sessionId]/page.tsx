'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useStaffLocale } from '@/lib/i18n-staff'

interface Session {
  id: number
  table: {
    tableNumber: number
  }
  peopleCount: number
  package?: {
    name: string
    pricePerPerson: number
    durationMinutes?: number
  }
  startTime: string
}

interface RestaurantInfo {
  name: string
  address?: string
  phone?: string
  logoUrl?: string
  wifiName?: string
  wifiPassword?: string
  openTime?: string
  closeTime?: string
}

export default function PrintQRPage() {
  const params = useParams()
  useStaffLocale()
  const sessionId = params.sessionId as string
  const [session, setSession] = useState<Session | null>(null)
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch session
        const sessionRes = await fetch(`/api/session/${sessionId}`)
        if (!sessionRes.ok) throw new Error('Failed to fetch session')
        const sessionData = await sessionRes.json()
        setSession(sessionData.session)

        // Fetch restaurant info
        const infoRes = await fetch('/api/restaurant-info')
        if (!infoRes.ok) throw new Error('Failed to fetch restaurant info')
        const infoData = await infoRes.json()
        setRestaurantInfo(infoData.info)

        // Generate QR Code using API
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const qrRes = await fetch(`${baseUrl}/api/qr/generate?sessionId=${sessionId}`)
        if (!qrRes.ok) throw new Error('Failed to generate QR code')
        const qrData = await qrRes.json()
        setQrCodeUrl(qrData.qrCodeUrl)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchData()
    }
  }, [sessionId])

  useEffect(() => {
    // Auto print when page loads
    if (!loading && session && qrCodeUrl) {
      window.print()
    }
  }, [loading, session, qrCodeUrl])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!session || !restaurantInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-error">ไม่พบข้อมูล</p>
      </div>
    )
  }

  // Get current URL for QR code
  const sessionUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/session/${sessionId}`
    : ''

  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Print-only styles for Thermal Receipt (80mm) */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
            padding: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            width: 80mm;
            margin: 0 auto;
            font-family: 'Courier New', monospace;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-after: always;
          }
          .receipt-container {
            width: 80mm;
            padding: 8mm 5mm;
            margin: 0 auto;
          }
        }
      `}</style>

      <div className="receipt-container max-w-md mx-auto p-6 print:p-0">
        {/* Header - Restaurant Info */}
        <div className="text-center mb-4 print:mb-3 print:border-b print:border-dashed print:border-gray-400 print:pb-3">
          {restaurantInfo.logoUrl && (
            <img
              src={restaurantInfo.logoUrl}
              alt={restaurantInfo.name}
              className="h-12 mx-auto mb-2 print:h-10 print:mb-1"
            />
          )}
          <h1 className="text-xl font-bold print:text-sm print:font-bold print:uppercase">
            {restaurantInfo.name}
          </h1>
          {restaurantInfo.address && (
            <p className="text-xs text-gray-600 print:text-[10px] print:leading-tight mt-1 print:mt-0.5">
              {restaurantInfo.address}
            </p>
          )}
          {restaurantInfo.phone && (
            <p className="text-xs text-gray-600 print:text-[10px] print:leading-tight">
              โทร: {restaurantInfo.phone}
            </p>
          )}
          {(restaurantInfo.openTime || restaurantInfo.closeTime) && (
            <p className="text-xs text-gray-500 print:text-[10px] print:leading-tight mt-0.5">
              เปิดบริการ: {restaurantInfo.openTime || '-'} - {restaurantInfo.closeTime || '-'}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-400 my-3 print:my-2"></div>

        {/* QR Code Section */}
        <div className="text-center mb-4 print:mb-3">
          <h2 className="text-base font-semibold mb-2 print:text-xs print:font-bold print:mb-1">
            โต๊ะที่ {session.table.tableNumber}
          </h2>
          
          <div className="bg-white p-2 rounded-lg inline-block mb-2 print:mb-1 print:p-1">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-40 h-40 print:w-32 print:h-32"
              />
            ) : (
              <div className="w-40 h-40 print:w-32 print:h-32 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400 text-[10px]">กำลังโหลด...</p>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-600 print:text-[10px] print:leading-tight mb-1">
            สแกน QR Code เพื่อเข้าสู่ระบบสั่งอาหาร
          </p>
          <p className="text-[10px] text-gray-500 print:text-[8px] print:leading-tight break-all">
            {sessionUrl}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-400 my-3 print:my-2"></div>

        {/* Session Details */}
        <div className="space-y-2 print:space-y-1 mb-4 print:mb-3">
          <div className="flex justify-between items-center print:border-b print:border-dashed print:border-gray-300 print:pb-1">
            <span className="text-xs print:text-[10px] text-gray-600">จำนวนคน:</span>
            <span className="text-xs print:text-[10px] font-semibold">{session.peopleCount} คน</span>
          </div>
          
          {session.package && (
            <>
              <div className="flex justify-between items-center print:border-b print:border-dashed print:border-gray-300 print:pb-1">
                <span className="text-xs print:text-[10px] text-gray-600">แพ็กเกจ:</span>
                <span className="text-xs print:text-[10px] font-semibold">{session.package.name}</span>
              </div>
              <div className="flex justify-between items-center print:border-b print:border-dashed print:border-gray-300 print:pb-1">
                <span className="text-xs print:text-[10px] text-gray-600">ราคา/คน:</span>
                <span className="text-xs print:text-[10px] font-semibold">
                  {session.package.pricePerPerson.toFixed(2)} บาท
                </span>
              </div>
              {session.package.durationMinutes && (
                <div className="flex justify-between items-center print:border-b print:border-dashed print:border-gray-300 print:pb-1">
                  <span className="text-xs print:text-[10px] text-gray-600">ระยะเวลา:</span>
                  <span className="text-xs print:text-[10px] font-semibold">
                    {session.package.durationMinutes} นาที
                  </span>
                </div>
              )}
            </>
          )}
          
          <div className="flex justify-between items-center print:border-b print:border-dashed print:border-gray-300 print:pb-1">
            <span className="text-xs print:text-[10px] text-gray-600">เวลาเริ่ม:</span>
            <span className="text-xs print:text-[10px] font-semibold">
              {new Date(session.startTime).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* WiFi Info */}
        {(restaurantInfo.wifiName || restaurantInfo.wifiPassword) && (
          <>
            <div className="border-t border-dashed border-gray-400 my-3 print:my-2"></div>
            <div className="mb-4 print:mb-3">
              <h3 className="text-xs font-semibold mb-1 print:text-[10px] print:font-bold text-center">
                WiFi
              </h3>
              {restaurantInfo.wifiName && (
                <p className="text-xs text-gray-600 print:text-[10px] print:leading-tight text-center">
                  ชื่อ: {restaurantInfo.wifiName}
                </p>
              )}
              {restaurantInfo.wifiPassword && (
                <p className="text-xs text-gray-600 print:text-[10px] print:leading-tight text-center">
                  รหัสผ่าน: {restaurantInfo.wifiPassword}
                </p>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-dashed border-gray-400 my-3 print:my-2"></div>
        <div className="text-center text-xs text-gray-400 print:text-[10px] print:leading-tight mt-4 print:mt-3">
          <p className="mb-1 print:mb-0.5">ขอบคุณที่ใช้บริการ</p>
          <p className="text-[10px] print:text-[8px]">Session: {session.id}</p>
        </div>

        {/* Print Button (hidden when printing) */}
        <div className="no-print mt-6 text-center">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            พิมพ์
          </button>
        </div>
      </div>
    </div>
  )
}

