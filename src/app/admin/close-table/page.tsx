'use client'

import { useTranslations } from '@/lib/i18n'

export default function CloseTablePage() {
  const t = useTranslations()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.close_table')}</h1>
      <p className="text-muted-foreground">ปิดโต๊ะ</p>
    </div>
  )
}

