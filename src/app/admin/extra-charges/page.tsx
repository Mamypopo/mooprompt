'use client'

import { useTranslations } from '@/lib/i18n'

export default function ExtraChargesPage() {
  const t = useTranslations()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.extra_charges')}</h1>
      <p className="text-muted-foreground">จัดการค่าบริการเพิ่มเติม</p>
    </div>
  )
}

