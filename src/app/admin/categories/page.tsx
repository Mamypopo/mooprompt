'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/lib/i18n'

export default function CategoriesPage() {
  const t = useTranslations()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('admin.categories')}</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          {t('common.add')}
        </Button>
      </div>
      <p className="text-muted-foreground">จัดการหมวดหมู่เมนู</p>
    </div>
  )
}

