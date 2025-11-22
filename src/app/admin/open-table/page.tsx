'use client'

import { useTranslations } from '@/lib/i18n'

export default function OpenTablePage() {
  const t = useTranslations()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.open_table')}</h1>
      <p className="text-muted-foreground">เปิดโต๊ะ</p>
    </div>
  )
}

