'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Edit, Trash2, Search, Filter, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import Swal from 'sweetalert2'

interface Table {
  id: number
  name: string
  status: 'AVAILABLE' | 'OCCUPIED'
  sessions?: Array<{
    id: number
    peopleCount: number
    startTime: string
  }>
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [formData, setFormData] = useState({
    name: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'floor'>('floor')

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true)
      const url =
        statusFilter !== 'all'
          ? `/api/tables?status=${statusFilter}`
          : '/api/tables'
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tables')
      }
      
      const data = await response.json()
      setTables(data.tables || [])
    } catch (error) {
      console.error('Error fetching tables:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลโต๊ะได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  const handleOpenDialog = useCallback((table?: Table) => {
    if (table) {
      setEditingTable(table)
      setFormData({
        name: table.name,
      })
    } else {
      setEditingTable(null)
      setFormData({
        name: '',
      })
    }
    setIsDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    if (isSubmitting) return // Prevent closing during submission
    setIsDialogOpen(false)
    setEditingTable(null)
    setFormData({ name: '' })
  }, [isSubmitting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    setIsSubmitting(true)

    // Blur any focused element to prevent aria-hidden warning when dialog closes
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    if (!formData.name || formData.name.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'ชื่อโต๊ะไม่ถูกต้อง',
        text: 'กรุณากรอกชื่อโต๊ะ',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      setIsSubmitting(false)
      return
    }

    try {
      const url = editingTable
        ? `/api/tables/${editingTable.id}`
        : '/api/tables'
      const method = editingTable ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${editingTable ? 'update' : 'create'} table`)
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

      handleCloseDialog()
      fetchTables()
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

  const handleDelete = useCallback(async (tableId: number, tableName: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: `คุณต้องการลบโต๊ะ "${tableName}" หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#FF7A7A',
    })

    if (!result.isConfirmed) return

    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete table')
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
      fetchTables()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถลบโต๊ะได้',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
    }
  }, [fetchTables])

  const filteredTables = useMemo(() => {
    if (!searchTerm.trim()) {
      return tables
    }
    return tables.filter((table) =>
      table.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
  }, [tables, searchTerm])

  // Skeleton component for table cards
  const TableSkeleton = () => (
    <Card className="border-l-4 border-l-muted animate-pulse">
      <CardHeader className="p-4 sm:p-6">
        <div className="space-y-3">
          <div className="h-6 bg-muted rounded w-24"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
          <div className="h-3 bg-muted rounded w-12"></div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="flex gap-2">
          <div className="flex-1 h-9 bg-muted rounded"></div>
          <div className="flex-1 h-9 bg-muted rounded"></div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">จัดการโต๊ะ</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มโต๊ะ
            </Button>
          </DialogTrigger>
          <DialogContent
            onOpenAutoFocus={(e) => {
              // Focus on input field instead of close button
              e.preventDefault()
              const input = document.getElementById('tableName')
              if (input) {
                setTimeout(() => input.focus(), 0)
              }
            }}
          >
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTable ? 'แก้ไขโต๊ะ' : 'เพิ่มโต๊ะใหม่'}
                </DialogTitle>
                <DialogDescription>
                  {editingTable
                    ? 'แก้ไขข้อมูลโต๊ะ'
                    : 'กรอกข้อมูลเพื่อเพิ่มโต๊ะใหม่'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tableName">ชื่อโต๊ะ</Label>
                  <Input
                    id="tableName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                    }}
                    required
                    placeholder="เช่น โต๊ะ 1, VIP 1, ห้องส่วนตัว A"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    ตั้งชื่อโต๊ะตามต้องการ (เช่น โต๊ะ 1, VIP 1, ห้องส่วนตัว A)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="ค้นหา"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="กรองตามสถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="AVAILABLE">ว่าง</SelectItem>
            <SelectItem value="OCCUPIED">ถูกใช้งาน</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-lg border overflow-hidden h-10">
          <Button
            size="sm"
            variant={viewMode === 'floor' ? 'default' : 'ghost'}
            className="rounded-none px-3 h-full"
            onClick={() => setViewMode('floor')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            className="rounded-none px-3 h-full"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      {!loading && filteredTables.length > 0 && (
        <div className="flex gap-4 mb-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-success"></span>
            ว่าง {filteredTables.filter((t) => t.status === 'AVAILABLE').length}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-primary"></span>
            ถูกใช้งาน {filteredTables.filter((t) => t.status === 'OCCUPIED').length}
          </span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <TableSkeleton key={i} />
          ))}
        </div>
      ) : filteredTables.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">ไม่มีข้อมูล</p>
          </CardContent>
        </Card>
      ) : viewMode === 'floor' ? (
        /* ===== FLOOR PLAN VIEW ===== */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {filteredTables.map((table) => {
            const occupied = table.status === 'OCCUPIED'
            return (
              <div
                key={table.id}
                className={`relative rounded-xl border-2 p-4 flex flex-col items-center justify-between gap-2 min-h-[110px] transition-all cursor-default ${
                  occupied
                    ? 'bg-primary/10 border-primary'
                    : 'bg-success/10 border-success'
                }`}
              >
                <div className="text-center">
                  <p className="font-bold text-base leading-tight">{table.name}</p>
                  <p className={`text-xs mt-0.5 font-medium ${occupied ? 'text-primary' : 'text-success'}`}>
                    {occupied ? 'ถูกใช้งาน' : 'ว่าง'}
                  </p>
                  {table.sessions && table.sessions.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">{table.sessions[0].peopleCount} คน</p>
                  )}
                </div>
                <div className="flex gap-1 w-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(table)}
                    className="flex-1 h-7"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(table.id, table.name)}
                    className="flex-1 h-7 text-destructive hover:text-destructive"
                    disabled={occupied}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ===== LIST VIEW ===== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => (
            <Card
              key={table.id}
              className={`${
                table.status === 'OCCUPIED'
                  ? 'border-l-4 border-l-primary'
                  : 'border-l-4 border-l-success'
              }`}
            >
              <CardHeader className="p-4 sm:p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">{table.name}</CardTitle>
                    <p className={`text-sm mt-1 ${table.status === 'OCCUPIED' ? 'text-primary font-semibold' : 'text-success font-semibold'}`}>
                      {table.status === 'OCCUPIED' ? 'ถูกใช้งาน' : 'ว่าง'}
                    </p>
                    {table.sessions && table.sessions.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{table.sessions[0].peopleCount} คน</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(table)} className="flex-1">
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">แก้ไข</span>
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => handleDelete(table.id, table.name)}
                    className="flex-1 text-destructive hover:text-destructive"
                    disabled={table.status === 'OCCUPIED'}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">ลบ</span>
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
