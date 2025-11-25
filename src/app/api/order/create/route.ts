import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/logger'
import { z } from 'zod'
import { emitSocketEvent } from '@/lib/socket'

const createOrderSchema = z.object({
  tableSessionId: z.number().int().positive(),
  items: z.array(
    z.object({
      menuItemId: z.number().int().positive(),
      qty: z.number().int().positive(),
      note: z.string().optional(),
      itemType: z.enum(['BUFFET_INCLUDED', 'A_LA_CARTE']).optional(), // เพิ่ม itemType
    })
  ),
  note: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createOrderSchema.parse(body)

    // Verify session exists and is active
    const session = await prisma.tableSession.findUnique({
      where: { id: data.tableSessionId },
    })

    if (!session || session.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'ไม่พบ session หรือ session ไม่ได้เปิดใช้งาน' },
        { status: 400 }
      )
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        tableSessionId: data.tableSessionId,
        note: data.note,
        status: 'OPEN',
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            qty: item.qty,
            note: item.note,
            status: 'WAITING',
            itemType: item.itemType || 'A_LA_CARTE', // ใช้ itemType ที่ส่งมา หรือ default = A_LA_CARTE
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    await logAction(null, 'ORDER_CREATE', {
      orderId: order.id,
      tableSessionId: data.tableSessionId,
      itemCount: data.items.length,
    })

    // Emit socket event
    emitSocketEvent('order:new', { order })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}
