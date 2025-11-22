import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = parseInt(params.id, 10)

    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: 'รหัส session ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        table: {
          select: {
            id: true,
            tableNumber: true,
            status: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            pricePerPerson: true,
            durationMinutes: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'ไม่พบ session' },
        { status: 404 }
      )
    }

    // Check if session is active
    if (session.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Session ไม่ได้เปิดใช้งาน', session },
        { status: 400 }
      )
    }

    // Check if session has expired
    if (session.expireTime && new Date(session.expireTime) < new Date()) {
      return NextResponse.json(
        { error: 'Session หมดอายุแล้ว', session },
        { status: 400 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

