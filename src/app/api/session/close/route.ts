import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/logger'
import { z } from 'zod'

const closeSessionSchema = z.object({
  sessionId: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = closeSessionSchema.parse(body)

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        table: true,
        orders: {
          where: {
            status: 'OPEN',
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (session.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Session is already closed' },
        { status: 400 }
      )
    }

    // Check if there are open orders
    if (session.orders.length > 0) {
      return NextResponse.json(
        { error: 'Cannot close session with open orders' },
        { status: 400 }
      )
    }

    // Close session
    await prisma.tableSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED' },
    })

    // Update table status
    await prisma.table.update({
      where: { id: session.tableId },
      data: { status: 'AVAILABLE' },
    })

    await logAction(null, 'CLOSE_TABLE', {
      sessionId,
      tableId: session.tableId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error closing session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

