import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const sessions = await prisma.tableSession.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        table: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            pricePerPerson: true,
          },
        },
        orders: {
          where: {
            status: 'OPEN',
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching active sessions:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

