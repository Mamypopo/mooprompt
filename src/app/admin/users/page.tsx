'use client'

import { useTranslations } from '@/lib/i18n'

export default function UsersPage() {
  const t = useTranslations()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.users')}</h1>
      <p className="text-muted-foreground">จัดการผู้ใช้</p>
    </div>
  )
}

