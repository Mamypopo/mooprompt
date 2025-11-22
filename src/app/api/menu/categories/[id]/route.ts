import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAction } from '@/lib/logger'

const updateCategorySchema = z.object({
  name: z.string().min(1),
})

// PATCH - Update category
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id, 10)

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = updateCategorySchema.parse(body)

    const category = await prisma.menuCategory.update({
      where: { id: categoryId },
      data: {
        name: data.name,
      },
    })

    await logAction(null, 'UPDATE_MENU_CATEGORY', {
      categoryId: category.id,
      name: category.name,
    })

    return NextResponse.json({ category })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id, 10)

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      )
    }

    const category = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: {
        items: true,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    if (category.items.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with items. Please delete or move items first.' },
        { status: 400 }
      )
    }

    await prisma.menuCategory.delete({
      where: { id: categoryId },
    })

    await logAction(null, 'DELETE_MENU_CATEGORY', {
      categoryId: category.id,
      name: category.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

