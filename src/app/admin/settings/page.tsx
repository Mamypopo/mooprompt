'use client'

import { useTranslations } from '@/lib/i18n'

export default function SettingsPage() {
  const t = useTranslations()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.settings')}</h1>
      <p className="text-muted-foreground">ตั้งค่าร้าน</p>
    </div>
  )
}

