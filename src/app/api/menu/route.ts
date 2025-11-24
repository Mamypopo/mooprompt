import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeUnavailable = searchParams.get('includeUnavailable') === 'true'
    const sessionId = searchParams.get('sessionId')

    // Fetch session เพื่อดูว่าเป็นบุฟเฟ่ต์หรือ à la carte
    let isBuffet = false
    if (sessionId) {
      try {
        const sessionIdNum = parseInt(sessionId, 10)
        if (!isNaN(sessionIdNum)) {
          const session = await prisma.tableSession.findUnique({
            where: { id: sessionIdNum },
            select: { packageId: true },
          })
          isBuffet = session?.packageId !== null
        }
      } catch (error) {
        // ถ้า session ไม่พบหรือ error ก็ไม่เป็นไร (ใช้ default = à la carte)
        console.error('Error fetching session:', error)
      }
    }

    // Filter menu items ตาม session type
    const where: any = {}
    if (!includeUnavailable) {
      where.isAvailable = true
    }

    if (isBuffet) {
      // บุฟเฟ่ต์: แสดง item ที่ isBuffetItem = true หรือ isALaCarteItem = true
      where.OR = [
        { isBuffetItem: true },
        { isALaCarteItem: true },
      ]
    } else {
      // à la carte: แสดงแค่ item ที่ isALaCarteItem = true
      where.isALaCarteItem = true
    }

    const categories = await prisma.menuCategory.findMany({
      include: {
        items: {
          where,
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      categories,
      sessionType: isBuffet ? 'buffet' : 'a_la_carte',
    })
  } catch (error) {
    console.error('Error fetching menu:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

