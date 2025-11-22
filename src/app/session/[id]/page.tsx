'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ShoppingCart, Menu as MenuIcon, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/language-switcher'
import Swal from 'sweetalert2'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
  const sessionId = params.id as string
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, fetch session data
    // For now, just set a mock session
    setSession({
      id: sessionId,
      tableNumber: sessionId,
      peopleCount: 2,
    })
    setLoading(false)
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex justify-between items-start mb-4 sm:mb-6 gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">โต๊ะที่ {session?.tableNumber}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              จำนวนคน: {session?.peopleCount} คน
            </p>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button
            onClick={() => router.push(`/menu?session=${sessionId}`)}
            className="h-16 sm:h-20 flex-col"
            variant="outline"
          >
            <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
            <span className="text-xs sm:text-sm">เมนู</span>
          </Button>
          <Button
            onClick={() => router.push(`/cart?session=${sessionId}`)}
            className="h-16 sm:h-20 flex-col"
            variant="outline"
          >
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
            <span className="text-xs sm:text-sm">ตะกร้า</span>
          </Button>
          <Button
            onClick={() => router.push(`/orders?session=${sessionId}`)}
            className="h-16 sm:h-20 flex-col"
            variant="outline"
          >
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
            <span className="text-xs sm:text-sm">ออเดอร์</span>
          </Button>
        </div>

        <div className="bg-card rounded-lg p-3 sm:p-4 shadow-sm">
          <h2 className="font-semibold mb-2 text-sm sm:text-base">สถานะโต๊ะ</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            เซสชัน: {sessionId}
          </p>
        </div>
      </div>
    </div>
  )
}

