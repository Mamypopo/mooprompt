import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: 'OPEN',
        items: { some: { status: 'DONE' } },
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        session: {
          select: {
            table: { select: { id: true, name: true } },
          },
        },
        items: {
          where: { status: 'DONE' },
          select: {
            id: true,
            qty: true,
            status: true,
            menuItem: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching runner orders:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}
