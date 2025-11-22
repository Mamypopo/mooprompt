'use client'

import { useTranslations } from '@/lib/i18n'

export default function PromotionsPage() {
  const t = useTranslations()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.promotions')}</h1>
      <p className="text-muted-foreground">จัดการโปรโมชั่น</p>
    </div>
  )
}

