'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react'
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
import { useTranslations } from '@/lib/i18n'
import Swal from 'sweetalert2'

interface Table {
  id: number
  tableNumber: number
  status: 'AVAILABLE' | 'OCCUPIED'
  sessions?: Array<{
    id: number
    peopleCount: number
    startTime: string
  }>
}

export default function TablesPage() {
  const t = useTranslations()
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [formData, setFormData] = useState({
    tableNumber: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        tableNumber: table.tableNumber.toString(),
      })
    } else {
      setEditingTable(null)
      setFormData({
        tableNumber: '',
      })
    }
    setIsDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    if (isSubmitting) return // Prevent closing during submission
    setIsDialogOpen(false)
    setEditingTable(null)
    setFormData({ tableNumber: '' })
  }, [isSubmitting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    setIsSubmitting(true)

    // Blur any focused element to prevent aria-hidden warning when dialog closes
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    const tableNumber = parseInt(formData.tableNumber, 10)
    if (isNaN(tableNumber) || tableNumber < 1) {
      Swal.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ถูกต้อง',
        text: 'กรุณากรอกหมายเลขโต๊ะที่ถูกต้อง',
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
        body: JSON.stringify({ tableNumber }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${editingTable ? 'update' : 'create'} table`)
      }

      await Swal.fire({
        icon: 'success',
        title: editingTable ? 'แก้ไขสำเร็จ' : 'เพิ่มโต๊ะสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      })

      handleCloseDialog()
      fetchTables()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = useCallback(async (tableId: number, tableNumber: number) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: `คุณต้องการลบโต๊ะที่ ${tableNumber} หรือไม่?`,
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

      await Swal.fire({
        icon: 'success',
        title: 'ลบสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      })

      fetchTables()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถลบโต๊ะได้',
      })
    }
  }, [fetchTables])

  const filteredTables = useMemo(() => {
    if (!searchTerm.trim()) {
      return tables
    }
    return tables.filter((table) =>
      table.tableNumber.toString().includes(searchTerm.trim())
    )
  }, [tables, searchTerm])

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
        <h1 className="text-xl sm:text-2xl font-bold">{t('admin.tables')}</h1>
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
              const input = document.getElementById('tableNumber')
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
                  <Label htmlFor="tableNumber">หมายเลขโต๊ะ</Label>
                  <Input
                    id="tableNumber"
                    type="number"
                    min="1"
                    value={formData.tableNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, tableNumber: e.target.value })
                    }
                    required
                    placeholder="กรอกหมายเลขโต๊ะ"
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'กำลังบันทึก...' : t('common.save')}
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
              placeholder={t('common.search')}
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
      </div>

      {filteredTables.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">{t('common.no_data')}</p>
          </CardContent>
        </Card>
      ) : (
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
                    <CardTitle className="text-lg sm:text-xl">
                      โต๊ะที่ {table.tableNumber}
                    </CardTitle>
                    <p
                      className={`text-sm mt-1 ${
                        table.status === 'OCCUPIED'
                          ? 'text-primary font-semibold'
                          : 'text-success font-semibold'
                      }`}
                    >
                      {table.status === 'OCCUPIED' ? 'ถูกใช้งาน' : 'ว่าง'}
                    </p>
                    {table.sessions && table.sessions.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {table.sessions[0].peopleCount} คน
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(table)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">แก้ไข</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(table.id, table.tableNumber)}
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
