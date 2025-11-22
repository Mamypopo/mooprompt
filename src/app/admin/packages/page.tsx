'use client'

import { useTranslations } from '@/lib/i18n'

export default function PackagesPage() {
  const t = useTranslations()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.packages')}</h1>
      <p className="text-muted-foreground">จัดการแพ็กเกจ</p>
    </div>
  )
}

