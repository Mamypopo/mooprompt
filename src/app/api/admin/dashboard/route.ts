import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [
      activeSessions,
      allTables,
      pendingOrderItems,
      todaySessions,
    ] = await Promise.all([
      prisma.tableSession.count({ where: { status: 'ACTIVE' } }),
      prisma.table.findMany({ select: { id: true, status: true } }),
      prisma.orderItem.count({ where: { status: { in: ['WAITING', 'COOKING'] } } }),
      prisma.tableSession.findMany({
        where: {
          status: 'CLOSED',
          startTime: { gte: todayStart },
        },
        include: {
          orders: {
            include: {
              items: { include: { menuItem: { select: { price: true } } } },
            },
          },
          package: { select: { pricePerPerson: true } },
        },
      }),
    ])

    const availableTables = allTables.filter((t) => t.status === 'AVAILABLE').length
    const occupiedTables = allTables.filter((t) => t.status === 'OCCUPIED').length

    // Calculate today's revenue from closed sessions
    let todayRevenue = 0
    let todayOrders = 0
    for (const session of todaySessions) {
      if (session.package) {
        todayRevenue += session.package.pricePerPerson * session.peopleCount
      }
      for (const order of session.orders) {
        todayOrders++
        for (const item of order.items) {
          if (item.itemType !== 'BUFFET_INCLUDED') {
            todayRevenue += item.menuItem.price * item.qty
          }
        }
      }
    }

    // Recent activity: last 5 orders from today
    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: todayStart } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        status: true,
        session: {
          select: { table: { select: { name: true } } },
        },
        items: { select: { qty: true, menuItem: { select: { name: true } } } },
      },
    })

    return NextResponse.json({
      activeSessions,
      availableTables,
      occupiedTables,
      totalTables: allTables.length,
      pendingOrderItems,
      todayRevenue,
      todayOrders,
      todayClosedSessions: todaySessions.length,
      recentOrders,
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
