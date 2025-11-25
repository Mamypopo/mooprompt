import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeUnavailable = searchParams.get('includeUnavailable') === 'true'
    const sessionId = searchParams.get('sessionId')
    const search = searchParams.get('search') || '' // Search term for menu items

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

    // Filter menu items ตาม session type และ search
    const where: any = {}
    
    // สำหรับลูกค้า: แสดง unavailable items ด้วย (แต่จะ disable)
    // สำหรับ admin: ใช้ includeUnavailable parameter
    // ไม่กรอง unavailable items ออก (แสดงทั้งหมด)

    // Build session type conditions
    const sessionConditions: any[] = []
    if (isBuffet) {
      // บุฟเฟ่ต์: แสดง item ที่ isBuffetItem = true หรือ isALaCarteItem = true
      sessionConditions.push(
        { isBuffetItem: true },
        { isALaCarteItem: true }
      )
    } else {
      // à la carte: แสดงแค่ item ที่ isALaCarteItem = true
      sessionConditions.push({ isALaCarteItem: true })
    }

    // Combine session type with search
    if (search) {
      // If searching, combine search with session conditions using AND
      where.AND = [
        {
          OR: sessionConditions,
        },
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    } else {
      // If not searching, just use session conditions
      if (sessionConditions.length > 1) {
        where.OR = sessionConditions
      } else {
        Object.assign(where, sessionConditions[0])
      }
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

