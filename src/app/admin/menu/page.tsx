'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStaffLocale } from '@/lib/i18n-staff'
import Swal from 'sweetalert2'
import Image from 'next/image'

interface MenuItem {
  id: number
  name: string
  price: number
  imageUrl?: string | null
  isAvailable: boolean
  menuCategoryId: number
  category?: {
    id: number
    name: string
  }
}

interface Category {
  id: number
  name: string
  items: MenuItem[]
}

export default function MenuManagementPage() {
  useStaffLocale()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Form states for menu item
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [itemCategoryId, setItemCategoryId] = useState<string>('')
  const [itemIsAvailable, setItemIsAvailable] = useState(true)
  const [itemImageUrl, setItemImageUrl] = useState<string | null>(null)
  const [itemImageFile, setItemImageFile] = useState<File | null>(null)
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Form states for category
  const [categoryName, setCategoryName] = useState('')

  useEffect(() => {
    fetchMenu()
    fetchCategories()
  }, [])

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu?includeUnavailable=true')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/menu/categories')
      const data = await response.json()
      // Update categories list for select
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ไม่ถูกต้อง',
        text: 'กรุณาเลือกไฟล์รูปภาพ',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ใหญ่เกินไป',
        text: 'ขนาดไฟล์ต้องไม่เกิน 5MB',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    setItemImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setItemImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!itemImageFile) return itemImageUrl

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', itemImageFile)

      const response = await fetch('/api/upload/menu', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Error uploading image:', error)
      Swal.fire({
        icon: 'error',
        title: 'อัพโหลดรูปภาพล้มเหลว',
        text: 'กรุณาลองใหม่อีกครั้ง',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const resetItemForm = () => {
    setItemName('')
    setItemPrice('')
    setItemCategoryId('')
    setItemIsAvailable(true)
    setItemImageUrl(null)
    setItemImageFile(null)
    setItemImagePreview(null)
    setEditingItem(null)
  }

  const resetCategoryForm = () => {
    setCategoryName('')
    setEditingCategory(null)
  }

  const handleOpenItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item)
      setItemName(item.name)
      setItemPrice(item.price.toString())
      setItemCategoryId(item.menuCategoryId.toString())
      setItemIsAvailable(item.isAvailable)
      setItemImageUrl(item.imageUrl || null)
      setItemImagePreview(item.imageUrl || null)
    } else {
      resetItemForm()
    }
    setIsItemModalOpen(true)
  }

  const handleOpenCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryName(category.name)
    } else {
      resetCategoryForm()
    }
    setIsCategoryModalOpen(true)
  }

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!itemName || !itemPrice || !itemCategoryId) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูลให้ครบ',
        text: 'กรุณากรอกชื่อ, ราคา และเลือกหมวดหมู่',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    const price = parseFloat(itemPrice)
    if (isNaN(price) || price <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'ราคาไม่ถูกต้อง',
        text: 'กรุณากรอกราคาที่เป็นตัวเลขบวก',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    try {
      // Upload image first if there's a new file
      let finalImageUrl = itemImageUrl
      if (itemImageFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl
        } else {
          return // Stop if upload failed
        }
      }

      const payload = {
        name: itemName,
        price,
        imageUrl: finalImageUrl,
        isAvailable: itemIsAvailable,
        menuCategoryId: parseInt(itemCategoryId, 10),
      }

      if (editingItem) {
        // Update
        const response = await fetch(`/api/menu/items/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('Update failed')
        }

        Swal.fire({
          icon: 'success',
          title: 'แก้ไขสำเร็จ',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        })
      } else {
        // Create
        const response = await fetch('/api/menu/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('Create failed')
        }

        Swal.fire({
          icon: 'success',
          title: 'เพิ่มเมนูสำเร็จ',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        })
      }

      setIsItemModalOpen(false)
      resetItemForm()
      fetchMenu()
    } catch (error) {
      console.error('Error saving menu item:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถบันทึกข้อมูลได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    }
  }

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryName) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกชื่อหมวดหมู่',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    try {
      if (editingCategory) {
        // Update
        const response = await fetch(`/api/menu/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryName }),
        })

        if (!response.ok) {
          throw new Error('Update failed')
        }

        Swal.fire({
          icon: 'success',
          title: 'แก้ไขสำเร็จ',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        })
      } else {
        // Create
        const response = await fetch('/api/menu/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryName }),
        })

        if (!response.ok) {
          throw new Error('Create failed')
        }

        Swal.fire({
          icon: 'success',
          title: 'เพิ่มหมวดหมู่สำเร็จ',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        })
      }

      setIsCategoryModalOpen(false)
      resetCategoryForm()
      fetchMenu()
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถบันทึกข้อมูลได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    }
  }

  const handleDeleteItem = async (itemId: number) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบรายการนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#FF7A7A',
    })

    if (!result.isConfirmed) return

    try {
      const response = await fetch(`/api/menu/items/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      Swal.fire({
        icon: 'success',
        title: 'ลบสำเร็จ',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      fetchMenu()
    } catch (error) {
      console.error('Error deleting item:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถลบข้อมูลได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบหมวดหมู่นี้หรือไม่? (ต้องลบเมนูทั้งหมดในหมวดหมู่นี้ก่อน)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#FF7A7A',
    })

    if (!result.isConfirmed) return

    try {
      const response = await fetch(`/api/menu/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Delete failed')
      }

      Swal.fire({
        icon: 'success',
        title: 'ลบสำเร็จ',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      fetchMenu()
      fetchCategories()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถลบข้อมูลได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    }
  }

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0 || searchTerm === '')

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
        <h1 className="text-xl sm:text-2xl font-bold">จัดการเมนู</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={isCategoryModalOpen} onOpenChange={(open) => {
            setIsCategoryModalOpen(open)
            // Blur trigger button when opening dialog to prevent aria-hidden warning
            if (open) {
              const activeElement = document.activeElement
              if (activeElement instanceof HTMLElement) {
                activeElement.blur()
              }
            }
          }}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => {
                  handleOpenCategoryModal()
                  // Blur button immediately to prevent focus retention
                  setTimeout(() => {
                    const activeElement = document.activeElement
                    if (activeElement instanceof HTMLElement) {
                      activeElement.blur()
                    }
                  }, 0)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มหมวดหมู่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? 'แก้ไขข้อมูลหมวดหมู่'
                    : 'กรอกข้อมูลเพื่อเพิ่มหมวดหมู่ใหม่'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitCategory} className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">ชื่อหมวดหมู่</Label>
                  <Input
                    id="categoryName"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="เช่น เนื้อหมู, เครื่องดื่ม"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCategoryModalOpen(false)
                      resetCategoryForm()
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit">บันทึก</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isItemModalOpen} onOpenChange={(open) => {
            setIsItemModalOpen(open)
            // Blur trigger button when opening dialog to prevent aria-hidden warning
            if (open) {
              const activeElement = document.activeElement
              if (activeElement instanceof HTMLElement) {
                activeElement.blur()
              }
            }
          }}>
            <DialogTrigger asChild>
              <Button
                className="flex-1 sm:flex-none"
                onClick={() => {
                  handleOpenItemModal()
                  // Blur button immediately to prevent focus retention
                  setTimeout(() => {
                    const activeElement = document.activeElement
                    if (activeElement instanceof HTMLElement) {
                      activeElement.blur()
                    }
                  }, 0)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มเมนู
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'แก้ไขข้อมูลเมนู'
                    : 'กรอกข้อมูลเพื่อเพิ่มเมนูใหม่'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitItem} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="itemName">ชื่อเมนู *</Label>
                    <Input
                      id="itemName"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="เช่น หมูสไลด์"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemPrice">ราคา (บาท) *</Label>
                    <Input
                      id="itemPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="เช่น 150"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="itemCategory">หมวดหมู่ *</Label>
                  <Select
                    value={itemCategoryId}
                    onValueChange={setItemCategoryId}
                  >
                    <SelectTrigger id="itemCategory">
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="itemImage">รูปภาพ</Label>
                  <div className="space-y-2">
                    {(itemImagePreview || itemImageUrl) && (
                      <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                        <Image
                          src={itemImagePreview || itemImageUrl || ''}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setItemImagePreview(null)
                            setItemImageFile(null)
                            setItemImageUrl(null)
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <Input
                      id="itemImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      รองรับไฟล์ JPEG, PNG, WebP (ขนาดไม่เกิน 5MB)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="itemIsAvailable"
                    checked={itemIsAvailable}
                    onChange={(e) => setItemIsAvailable(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="itemIsAvailable" className="cursor-pointer">
                    พร้อมให้บริการ
                  </Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsItemModalOpen(false)
                      resetItemForm()
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={uploadingImage}>
                    {uploadingImage ? 'กำลังอัพโหลด...' : 'บันทึก'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="ค้นหาเมนู..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm"
        />
      </div>

      <div className="space-y-4 sm:space-y-6">
        {filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">ไม่มีข้อมูลเมนู</p>
            </CardContent>
          </Card>
        ) : (
          filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg sm:text-xl">
                    {category.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenCategoryModal(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {category.items.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    ยังไม่มีเมนูในหมวดหมู่นี้
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {category.items.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        {item.imageUrl && (
                          <div className="relative w-full h-32 sm:h-40">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base truncate">
                                {item.name}
                              </h3>
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
                                {item.isAvailable ? 'พร้อมให้บริการ' : 'ไม่พร้อมให้บริการ'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenItemModal(item)}
                              >
                                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

