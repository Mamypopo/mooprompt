'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStaffLocale } from '@/lib/i18n-staff'
import Swal from 'sweetalert2'
import Image from 'next/image'
import { X, Upload } from 'lucide-react'

interface RestaurantInfo {
  id: number
  name: string
  address?: string | null
  phone?: string | null
  logoUrl?: string | null
  coverImageUrl?: string | null
  wifiName?: string | null
  wifiPassword?: string | null
  openTime?: string | null
  closeTime?: string | null
}

export default function SettingsPage() {
  useStaffLocale()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [info, setInfo] = useState<RestaurantInfo | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [wifiName, setWifiName] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [openTime, setOpenTime] = useState('')
  const [closeTime, setCloseTime] = useState('')
  
  // Image states
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false)

  useEffect(() => {
    fetchRestaurantInfo()
  }, [])

  const fetchRestaurantInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/restaurant-info')
      const data = await response.json()
      const restaurantInfo = data.info

      setInfo(restaurantInfo)
      setName(restaurantInfo.name || '')
      setAddress(restaurantInfo.address || '')
      setPhone(restaurantInfo.phone || '')
      setWifiName(restaurantInfo.wifiName || '')
      setWifiPassword(restaurantInfo.wifiPassword || '')
      setOpenTime(restaurantInfo.openTime || '')
      setCloseTime(restaurantInfo.closeTime || '')
      setLogoUrl(restaurantInfo.logoUrl || null)
      setLogoPreview(restaurantInfo.logoUrl || null)
      setCoverImageUrl(restaurantInfo.coverImageUrl || null)
      setCoverImagePreview(restaurantInfo.coverImageUrl || null)
    } catch (error) {
      console.error('Error fetching restaurant info:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

    setCoverImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return logoUrl

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', logoFile)

      const response = await fetch('/api/upload/restaurant', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Error uploading logo:', error)
      Swal.fire({
        icon: 'error',
        title: 'อัพโหลดรูปภาพไม่สำเร็จ',
        text: 'กรุณาลองใหม่อีกครั้ง',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return null
    } finally {
      setUploadingLogo(false)
    }
  }

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverImageFile) return coverImageUrl

    setUploadingCoverImage(true)
    try {
      const formData = new FormData()
      formData.append('file', coverImageFile)

      const response = await fetch('/api/upload/restaurant', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Error uploading cover image:', error)
      Swal.fire({
        icon: 'error',
        title: 'อัพโหลดรูปภาพไม่สำเร็จ',
        text: 'กรุณาลองใหม่อีกครั้ง',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return null
    } finally {
      setUploadingCoverImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกชื่อร้าน',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    setSaving(true)

    try {
      // Upload images first if there are new files
      let finalLogoUrl = logoUrl
      if (logoFile) {
        const uploadedUrl = await uploadLogo()
        if (uploadedUrl) {
          finalLogoUrl = uploadedUrl
        } else {
          setSaving(false)
          return
        }
      }

      let finalCoverImageUrl = coverImageUrl
      if (coverImageFile) {
        const uploadedUrl = await uploadCoverImage()
        if (uploadedUrl) {
          finalCoverImageUrl = uploadedUrl
        } else {
          setSaving(false)
          return
        }
      }

      // Update restaurant info
      const response = await fetch('/api/restaurant-info', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
          logoUrl: finalLogoUrl,
          coverImageUrl: finalCoverImageUrl,
          wifiName: wifiName.trim() || null,
          wifiPassword: wifiPassword.trim() || null,
          openTime: openTime.trim() || null,
          closeTime: closeTime.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update')
      }

      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })

      // Reset file states
      setLogoFile(null)
      setCoverImageFile(null)
      fetchRestaurantInfo()
    } catch (error: any) {
      console.error('Error saving restaurant info:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">ตั้งค่าร้าน</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">ชื่อร้าน *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น Mooprompt Restaurant"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">ที่อยู่</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="เช่น 123 ถนนสุขุมวิท กรุงเทพฯ"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 02-123-4567"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>รูปภาพ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="logo">โลโก้ร้าน</Label>
              <div className="space-y-2">
                {(logoPreview || logoUrl) && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <Image
                      src={logoPreview || logoUrl || ''}
                      alt="Logo Preview"
                      fill
                      className="object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setLogoPreview(null)
                        setLogoFile(null)
                        setLogoUrl(null)
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="cursor-pointer"
                    disabled={uploadingLogo}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  รองรับไฟล์ JPEG, PNG, WebP (ขนาดไม่เกิน 5MB)
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="coverImage">รูปภาพปก</Label>
              <div className="space-y-2">
                {(coverImagePreview || coverImageUrl) && (
                  <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                    <Image
                      src={coverImagePreview || coverImageUrl || ''}
                      alt="Cover Preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setCoverImagePreview(null)
                        setCoverImageFile(null)
                        setCoverImageUrl(null)
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="coverImage"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="cursor-pointer"
                    disabled={uploadingCoverImage}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  รองรับไฟล์ JPEG, PNG, WebP (ขนาดไม่เกิน 5MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WiFi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="wifiName">ชื่อ WiFi</Label>
              <Input
                id="wifiName"
                value={wifiName}
                onChange={(e) => setWifiName(e.target.value)}
                placeholder="เช่น Restaurant_WiFi"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="wifiPassword">รหัสผ่าน WiFi</Label>
              <Input
                id="wifiPassword"
                type="password"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="เช่น password123"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>เวลาทำการ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="openTime">เวลาเปิด</Label>
                <Input
                  id="openTime"
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  placeholder="เช่น 10:00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="closeTime">เวลาปิด</Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  placeholder="เช่น 22:00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={fetchRestaurantInfo}
            disabled={saving}
          >
            ยกเลิก
          </Button>
          <Button type="submit" disabled={saving || uploadingLogo || uploadingCoverImage}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </div>
      </form>
    </div>
  )
}
