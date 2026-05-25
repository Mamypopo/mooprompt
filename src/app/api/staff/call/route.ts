import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    const session = await prisma.tableSession.findUnique({
      where: { id: Number(sessionId) },
      include: { table: { select: { name: true } } },
    })

    if (!session || session.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const io = (global as any).io
    if (io) {
      io.emit('staff:call', {
        sessionId: session.id,
        tableName: session.table.name,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error calling staff:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
