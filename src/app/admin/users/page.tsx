'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
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

interface User {
  id: number
  name: string
  username: string
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'RUNNER' | 'STAFF'
  active: boolean
  createdAt: string
  updatedAt: string
}

const roleLabels: Record<User['role'], string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  MANAGER: 'ผู้จัดการ',
  CASHIER: 'แคชเชียร์',
  KITCHEN: 'ครัว',
  RUNNER: 'รันเนอร์',
  STAFF: 'พนักงาน',
}

export default function UsersPage() {
  useStaffLocale()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<User['role']>('STAFF')
  const [active, setActive] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
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

  const resetForm = () => {
    setName('')
    setUsername('')
    setPassword('')
    setRole('STAFF')
    setActive(true)
    setEditingUser(null)
  }

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setName(user.name)
      setUsername(user.username)
      setPassword('') // Don't show password
      setRole(user.role)
      setActive(user.active)
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !username.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูลให้ครบ',
        text: 'กรุณากรอกชื่อและชื่อผู้ใช้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    if (!editingUser && !password.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกรหัสผ่าน',
        text: 'กรุณากรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    if (password.trim() && password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'รหัสผ่านสั้นเกินไป',
        text: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const url = editingUser
        ? `/api/users/${editingUser.id}`
        : '/api/users'
      const method = editingUser ? 'PATCH' : 'POST'

      const payload: any = {
        name: name.trim(),
        username: username.trim(),
        role,
        active,
      }

      // Only include password if it's provided (for new users or when updating)
      if (!editingUser || password.trim()) {
        payload.password = password
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${editingUser ? 'update' : 'create'} user`)
      }

      Swal.fire({
        icon: 'success',
        title: editingUser ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })

      handleCloseDialog()
      fetchUsers()
    } catch (error: any) {
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
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (user: User) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: `คุณต้องการลบผู้ใช้ "${user.name}" (${user.username}) หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    })

    if (!result.isConfirmed) return

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
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

      fetchUsers()
    } catch (error: any) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">จัดการผู้ใช้</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มผู้ใช้
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'แก้ไขข้อมูลผู้ใช้'
                  : 'เพิ่มผู้ใช้ใหม่เข้าสู่ระบบ'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">ชื่อ *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="username">ชื่อผู้ใช้ *</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น somchai"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">
                  รหัสผ่าน {!editingUser && '*'}
                  {editingUser && <span className="text-muted-foreground">(เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)</span>}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? 'เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน' : 'อย่างน้อย 6 ตัวอักษร'}
                  required={!editingUser}
                  minLength={6}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">บทบาท *</Label>
                <Select
                  value={role}
                  onValueChange={(value: User['role']) => setRole(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">ผู้ดูแลระบบ</SelectItem>
                    <SelectItem value="MANAGER">ผู้จัดการ</SelectItem>
                    <SelectItem value="CASHIER">แคชเชียร์</SelectItem>
                    <SelectItem value="KITCHEN">ครัว</SelectItem>
                    <SelectItem value="RUNNER">รันเนอร์</SelectItem>
                    <SelectItem value="STAFF">พนักงาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="active" className="cursor-pointer">
                  เปิดใช้งาน
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'กำลังบันทึก...' : editingUser ? 'บันทึก' : 'เพิ่ม'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">ยังไม่มีผู้ใช้</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user.id} className={!user.active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                  {!user.active && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      ปิดใช้งาน
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">บทบาท</p>
                  <p className="text-lg font-semibold">{roleLabels[user.role]}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  สร้างเมื่อ: {new Date(user.createdAt).toLocaleDateString('th-TH')}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(user)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    แก้ไข
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    ลบ
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
