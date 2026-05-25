'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon, X, ChevronDown, Filter } from 'lucide-react'
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
import Swal from 'sweetalert2'
import Image from 'next/image'

interface MenuItem {
  id: number
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  isAvailable: boolean
  menuCategoryId: number
  isBuffetItem?: boolean
  isALaCarteItem?: boolean
  isFreeInBuffet?: boolean
  isFeatured?: boolean
  isPopular?: boolean
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
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Form states for menu item
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [itemCategoryId, setItemCategoryId] = useState<string>('')
  const [itemIsAvailable, setItemIsAvailable] = useState(true)
  const [itemImageUrl, setItemImageUrl] = useState<string | null>(null)
  const [itemImageFile, setItemImageFile] = useState<File | null>(null)
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [itemIsBuffetItem, setItemIsBuffetItem] = useState(true)
  const [itemIsALaCarteItem, setItemIsALaCarteItem] = useState(true)
  const [itemIsFreeInBuffet, setItemIsFreeInBuffet] = useState(true)
  const [itemIsFeatured, setItemIsFeatured] = useState(false)
  const [itemIsPopular, setItemIsPopular] = useState(false)

  // Form states for category
  const [categoryName, setCategoryName] = useState('')

  // Pagination state: เก็บจำนวนรายการที่แสดงในแต่ละหมวดหมู่
  const [itemsPerCategory, setItemsPerCategory] = useState<Record<number, number>>({})
  const ITEMS_PER_PAGE = 12 // แสดง 12 รายการต่อครั้ง (3 columns x 4 rows)

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('includeUnavailable', 'true')
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm)
      }
      
      const response = await fetch(`/api/admin/menu?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu')
      }
      
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching menu:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลเมนูได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchTerm])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  useEffect(() => {
    fetchCategories()
  }, [])

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
    setItemDescription('')
    setItemPrice('')
    setItemCategoryId('')
    setItemIsAvailable(true)
    setItemImageUrl(null)
    setItemIsFeatured(false)
    setItemIsPopular(false)
    setItemImageFile(null)
    setItemImagePreview(null)
    setEditingItem(null)
    setItemIsBuffetItem(true)
    setItemIsALaCarteItem(true)
    setItemIsFreeInBuffet(true)
  }

  const resetCategoryForm = () => {
    setCategoryName('')
    setEditingCategory(null)
  }

  const handleOpenItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item)
      setItemName(item.name)
      setItemDescription(item.description || '')
      setItemPrice(item.price.toString())
      setItemCategoryId(item.menuCategoryId.toString())
      setItemIsAvailable(item.isAvailable)
      setItemImageUrl(item.imageUrl || null)
      setItemImagePreview(item.imageUrl || null)
      setItemIsBuffetItem(item.isBuffetItem ?? true)
      setItemIsALaCarteItem(item.isALaCarteItem ?? true)
      setItemIsFreeInBuffet(item.isFreeInBuffet ?? true)
      setItemIsFeatured(item.isFeatured ?? false)
      setItemIsPopular(item.isPopular ?? false)
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

    const categoryIdNum = parseInt(itemCategoryId, 10)
    if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'หมวดหมู่ไม่ถูกต้อง',
        text: 'กรุณาเลือกหมวดหมู่',
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

      const payload: any = {
        name: itemName.trim(),
        description: itemDescription.trim() || null,
        price: Number(price),
        isAvailable: Boolean(itemIsAvailable),
        menuCategoryId: categoryIdNum,
        isBuffetItem: Boolean(itemIsBuffetItem),
        isALaCarteItem: Boolean(itemIsALaCarteItem),
        isFreeInBuffet: Boolean(itemIsFreeInBuffet),
        isFeatured: Boolean(itemIsFeatured),
        isPopular: Boolean(itemIsPopular),
      }
      
      payload.imageUrl = finalImageUrl && finalImageUrl.trim() !== '' ? finalImageUrl.trim() : null
      

      if (editingItem) {
        // Update
        const response = await fetch(`/api/menu/items/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Update failed')
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
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Create failed')
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

  // Reset pagination when search or category filter changes
  useEffect(() => {
    setItemsPerCategory({})
  }, [debouncedSearchTerm, selectedCategoryFilter])

  // Function to load more items for a category
  const loadMoreItems = (categoryId: number, currentCount: number) => {
    setItemsPerCategory((prev) => ({
      ...prev,
      [categoryId]: (currentCount || ITEMS_PER_PAGE) + ITEMS_PER_PAGE,
    }))
  }

  const filteredCategories = categories
    .filter((cat) => selectedCategoryFilter === 'all' || cat.id.toString() === selectedCategoryFilter)
    .filter((cat) => !debouncedSearchTerm || cat.items.length > 0)

  // Skeleton component for menu items
  const MenuItemSkeleton = () => (
    <Card className="overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted"></div>
      <CardContent className="p-3 sm:p-4">
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-muted rounded flex-1"></div>
          <div className="h-8 bg-muted rounded flex-1"></div>
        </div>
      </CardContent>
    </Card>
  )

  const CategorySkeleton = () => (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
        <div className="h-8 bg-muted rounded w-24 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(8)].map((_, i) => (
          <MenuItemSkeleton key={i} />
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <div className="h-7 bg-muted rounded w-32 animate-pulse"></div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="h-9 bg-muted rounded flex-1 sm:flex-none sm:w-32 animate-pulse"></div>
            <div className="h-9 bg-muted rounded flex-1 sm:flex-none sm:w-28 animate-pulse"></div>
          </div>
        </div>
        <div className="mb-4 sm:mb-6">
          <div className="h-10 bg-muted rounded w-full max-w-md animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <CategorySkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">จัดการเมนู</h1>
          <p className="text-sm text-muted-foreground mt-0.5">เพิ่ม แก้ไข และจัดการเมนูอาหาร</p>
        </div>
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
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="space-y-3 pb-4 border-b">
                <DialogTitle className="text-2xl">
                  {editingItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {editingItem
                    ? 'แก้ไขข้อมูลเมนู'
                    : 'กรอกข้อมูลเพื่อเพิ่มเมนูใหม่'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitItem} className="space-y-6 pt-4">
                {/* แถวแรก: ชื่อเมนู + ราคา */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* รายละเอียดเมนู */}
                <div>
                  <Label htmlFor="itemDescription">รายละเอียดเมนู</Label>
                  <textarea
                    id="itemDescription"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="เช่น ส่วนประกอบ, วิธีทำ, ข้อมูลเพิ่มเติม (ไม่บังคับ)"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    rows={3}
                  />
                </div>

                {/* แถวที่สอง: หมวดหมู่ + พร้อมให้บริการ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="flex items-end">
                    <div className="flex items-center space-x-3 bg-muted/30 rounded-lg p-4 w-full">
                      <input
                        type="checkbox"
                        id="itemIsAvailable"
                        checked={itemIsAvailable}
                        onChange={(e) => setItemIsAvailable(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 accent-accent cursor-pointer"
                      />
                      <Label htmlFor="itemIsAvailable" className="cursor-pointer font-medium">
                        พร้อมให้บริการ
                      </Label>
                    </div>
                  </div>
                </div>

                {/* รูปภาพ - ขยายเต็มความกว้าง */}
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

                {/* แถวที่สาม: ประเภทเมนู + การแสดงผล */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold mb-3 block">ประเภทเมนู</Label>
                      <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="itemIsBuffetItem"
                            checked={itemIsBuffetItem}
                            onChange={(e) => setItemIsBuffetItem(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 accent-accent cursor-pointer"
                          />
                          <Label htmlFor="itemIsBuffetItem" className="cursor-pointer text-sm">
                            เมนูบุฟเฟ่ต์ (ใช้ได้กับบุฟเฟ่ต์)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="itemIsALaCarteItem"
                            checked={itemIsALaCarteItem}
                            onChange={(e) => setItemIsALaCarteItem(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 accent-accent cursor-pointer"
                          />
                          <Label htmlFor="itemIsALaCarteItem" className="cursor-pointer text-sm">
                            เมนู à la carte (ใช้ได้กับ à la carte)
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                          💡 สามารถเลือกได้ทั้งสองแบบ (เมนูจะแสดงในทั้งสองประเภท)
                        </p>
                      </div>
                    </div>
                    
                    {/* แสดง checkbox "ฟรีในบุฟเฟ่ต์" เฉพาะเมื่อเลือก "เมนูบุฟเฟ่ต์" */}
                    {itemIsBuffetItem && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <Label className="text-base font-semibold mb-3 block">การคิดเงินในบุฟเฟ่ต์</Label>
                        <div className="space-y-3 bg-muted/30 rounded-lg p-4 border-l-4 border-primary">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="itemIsFreeInBuffet"
                              checked={itemIsFreeInBuffet}
                              onChange={(e) => setItemIsFreeInBuffet(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 accent-accent cursor-pointer"
                            />
                            <Label htmlFor="itemIsFreeInBuffet" className="cursor-pointer text-sm font-medium">
                              ฟรีในบุฟเฟ่ต์ (รวมในบุฟเฟ่ต์)
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 pl-7">
                            {itemIsFreeInBuffet 
                              ? '✅ เมนูนี้จะฟรีสำหรับลูกค้าบุฟเฟ่ต์'
                              : '💰 เมนูนี้จะจ่ายเพิ่มสำหรับลูกค้าบุฟเฟ่ต์ (เมนูเพิ่มเติม)'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* แสดงข้อความแนะนำเมื่อเลือก "เมนู à la carte" เท่านั้น */}
                    {!itemIsBuffetItem && itemIsALaCarteItem && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                          <div className="flex items-start space-x-2">
                            <span className="text-blue-600 text-lg">ℹ️</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                เมนูเพิ่มเติมสำหรับบุฟเฟ่ต์
                              </p>
                              <p className="text-xs text-blue-700">
                                เมนูนี้จะแสดงในบุฟเฟ่ต์และจะจ่ายเพิ่ม (ไม่รวมในบุฟเฟ่ต์)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">การแสดงผล</Label>
                    <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="itemIsFeatured"
                          checked={itemIsFeatured}
                          onChange={(e) => setItemIsFeatured(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 accent-accent cursor-pointer"
                        />
                        <Label htmlFor="itemIsFeatured" className="cursor-pointer text-sm">
                          เมนูแนะนำ (แสดงใน Hero Banner)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="itemIsPopular"
                          checked={itemIsPopular}
                          onChange={(e) => setItemIsPopular(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 accent-accent cursor-pointer"
                        />
                        <Label htmlFor="itemIsPopular" className="cursor-pointer text-sm">
                          เมนูยอดนิยม (แสดงในส่วนเมนูยอดนิยม)
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 สามารถเลือกได้ทั้งสองแบบ หรือเลือกอย่างใดอย่างหนึ่ง
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-border/50">
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

      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="ค้นหาเมนู..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm"
          autoFocus
        />
        <Select
          value={selectedCategoryFilter}
          onValueChange={(val) => {
            setSelectedCategoryFilter(val)
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="กรองหมวดหมู่" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name} ({cat.items.length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {category.items
                        .slice(0, itemsPerCategory[category.id] || ITEMS_PER_PAGE)
                        .map((item) => (
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
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-1 leading-relaxed">
                                      {item.description}
                                    </p>
                                  )}
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
                    {category.items.length > (itemsPerCategory[category.id] || ITEMS_PER_PAGE) && (
                      <div className="flex justify-center mt-4">
                        <Button
                          variant="outline"
                          onClick={() =>
                            loadMoreItems(
                              category.id,
                              itemsPerCategory[category.id] || ITEMS_PER_PAGE
                            )
                          }
                          className="w-full sm:w-auto"
                        >
                          <ChevronDown className="w-4 h-4 mr-2" />
                          โหลดเพิ่ม ({category.items.length - (itemsPerCategory[category.id] || ITEMS_PER_PAGE)} รายการ)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

