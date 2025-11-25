import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAction } from '@/lib/logger'

const createPromotionSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['PERCENT', 'FIXED', 'PER_PERSON', 'MIN_PEOPLE', 'MIN_AMOUNT']),
  value: z.number().positive(),
  condition: z.any().optional().nullable(), // สำหรับเก็บข้อมูลเพิ่มเติม เช่น { buy: 4, pay: 3 }
  active: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const promotions = await prisma.promotion.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ promotions })
  } catch (error) {
    console.error('Error fetching promotions:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createPromotionSchema.parse(body)

    const promotion = await prisma.promotion.create({
      data: {
        name: data.name,
        type: data.type,
        value: data.value,
        condition: data.condition || null,
        active: data.active,
      },
    })

    await logAction(null, 'CREATE_PROMOTION', {
      promotionId: promotion.id,
      name: promotion.name,
    })

    return NextResponse.json({ promotion }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating promotion:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

