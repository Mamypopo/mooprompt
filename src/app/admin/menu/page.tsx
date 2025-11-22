'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useTranslations } from '@/lib/i18n'
import Swal from 'sweetalert2'

interface MenuItem {
  id: number
  name: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  menuCategoryId: number
}

interface Category {
  id: number
  name: string
  items: MenuItem[]
}

export default function MenuManagementPage() {
  const t = useTranslations()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (itemId: number) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบรายการนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    })

    if (result.isConfirmed) {
      // Implement delete API call
      Swal.fire({
        icon: 'success',
        title: 'ลบสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      })
      fetchMenu()
    }
  }

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">{t('admin.menu')}</h1>
        <Button className="w-full sm:w-auto text-sm">
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มเมนู
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder={t('common.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm"
        />
      </div>

      <div className="space-y-4 sm:space-y-6">
        {filteredCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">{category.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                      <p className="text-primary font-bold text-sm sm:text-base">
                        ฿{item.price.toLocaleString()}
                      </p>
                      <span
                        className={`text-xs ${
                          item.isAvailable
                            ? 'text-success'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {item.isAvailable
                          ? t('menu.available')
                          : t('menu.unavailable')}
                      </span>
                    </div>
                    <div className="flex gap-2 self-end sm:self-auto">
                      <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

