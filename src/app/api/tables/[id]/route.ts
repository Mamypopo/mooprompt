import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/logger'
import { z } from 'zod'

// PATCH - แก้ไขโต๊ะ
const updateTableSchema = z.object({
  tableNumber: z.number().int().positive().optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED']).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tableId = parseInt(params.id)
    const body = await request.json()
    const data = updateTableSchema.parse(body)

    // Check if table exists
    const existingTable = await prisma.table.findUnique({
      where: { id: tableId },
    })

    if (!existingTable) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      )
    }

    // Check if table number already exists (if changing)
    if (data.tableNumber && data.tableNumber !== existingTable.tableNumber) {
      const duplicateTable = await prisma.table.findFirst({
        where: {
          tableNumber: data.tableNumber,
          id: { not: tableId },
        },
      })

      if (duplicateTable) {
        return NextResponse.json(
          { error: 'Table number already exists' },
          { status: 400 }
        )
      }
    }

    // Check if trying to set OCCUPIED when there's no active session
    if (data.status === 'OCCUPIED') {
      const activeSession = await prisma.tableSession.findFirst({
        where: {
          tableId,
          status: 'ACTIVE',
        },
      })

      if (!activeSession) {
        return NextResponse.json(
          { error: 'Cannot set table as OCCUPIED without active session' },
          { status: 400 }
        )
      }
    }

    const table = await prisma.table.update({
      where: { id: tableId },
      data,
    })

    await logAction(null, 'UPDATE_TABLE', {
      tableId,
      changes: data,
    })

    return NextResponse.json({ table })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating table:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - ลบโต๊ะ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tableId = parseInt(params.id)

    // Check if table exists
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        sessions: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    })

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      )
    }

    // Check if table has active session
    if (table.sessions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete table with active session' },
        { status: 400 }
      )
    }

    // Check if table is occupied
    if (table.status === 'OCCUPIED') {
      return NextResponse.json(
        { error: 'Cannot delete occupied table' },
        { status: 400 }
      )
    }

    await prisma.table.delete({
      where: { id: tableId },
    })

    await logAction(null, 'DELETE_TABLE', {
      tableId,
      tableNumber: table.tableNumber,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting table:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

