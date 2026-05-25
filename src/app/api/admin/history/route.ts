import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date') // YYYY-MM-DD
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = 20

    let dateFilter: { gte: Date; lt: Date } | undefined
    if (dateStr) {
      const d = new Date(dateStr)
      const dNext = new Date(dateStr)
      dNext.setDate(dNext.getDate() + 1)
      dateFilter = { gte: d, lt: dNext }
    } else {
      // Default: last 7 days
      const from = new Date()
      from.setDate(from.getDate() - 7)
      from.setHours(0, 0, 0, 0)
      dateFilter = { gte: from, lt: new Date() }
    }

    const [sessions, total] = await Promise.all([
      prisma.tableSession.findMany({
        where: {
          status: 'CLOSED',
          startTime: dateFilter,
        },
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          table: { select: { name: true } },
          package: { select: { name: true, pricePerPerson: true } },
          orders: {
            include: {
              items: {
                include: { menuItem: { select: { name: true, price: true } } },
              },
            },
          },
        },
      }),
      prisma.tableSession.count({
        where: { status: 'CLOSED', startTime: dateFilter },
      }),
    ])

    const sessionsWithTotals = sessions.map((session) => {
      let total = 0
      if (session.package) {
        total += session.package.pricePerPerson * session.peopleCount
      }
      for (const order of session.orders) {
        for (const item of order.items) {
          if (item.itemType !== 'BUFFET_INCLUDED') {
            total += item.menuItem.price * item.qty
          }
        }
      }
      return { ...session, total }
    })

    return NextResponse.json({
      sessions: sessionsWithTotals,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
