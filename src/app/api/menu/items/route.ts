import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAction } from '@/lib/logger'

const createMenuItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  imageUrl: z.string().url().optional().nullable(),
  isAvailable: z.boolean().default(true),
  menuCategoryId: z.number().int().positive(),
})

const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional().nullable(),
  isAvailable: z.boolean().optional(),
  menuCategoryId: z.number().int().positive().optional(),
})

// GET - Get all menu items (for admin, includes unavailable)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const includeUnavailable = searchParams.get('includeUnavailable') === 'true'

    const where: any = {}
    if (categoryId) {
      where.menuCategoryId = parseInt(categoryId, 10)
    }
    if (!includeUnavailable) {
      where.isAvailable = true
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create menu item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createMenuItemSchema.parse(body)

    const item = await prisma.menuItem.create({
      data: {
        name: data.name,
        price: data.price,
        imageUrl: data.imageUrl || null,
        isAvailable: data.isAvailable,
        menuCategoryId: data.menuCategoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    await logAction(null, 'CREATE_MENU_ITEM', {
      itemId: item.id,
      name: item.name,
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

