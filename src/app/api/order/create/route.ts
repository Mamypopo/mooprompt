import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/logger'
import { z } from 'zod'

const createOrderSchema = z.object({
  tableSessionId: z.number().int().positive(),
  items: z.array(
    z.object({
      menuItemId: z.number().int().positive(),
      qty: z.number().int().positive(),
      note: z.string().optional(),
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
        { error: 'Session not found or not active' },
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

    // Emit socket event (in production, use proper socket server)
    if (typeof global !== 'undefined' && (global as any).io) {
      (global as any).io.emit('order:new', { order })
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
