'use client'

import { useTranslations } from '@/lib/i18n'

export default function TablesPage() {
  const t = useTranslations()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.tables')}</h1>
      <p className="text-muted-foreground">จัดการโต๊ะ</p>
    </div>
  )
}

