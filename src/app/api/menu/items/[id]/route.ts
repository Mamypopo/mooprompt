import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAction } from '@/lib/logger'

// Custom validator for imageUrl (only relative path, no external URLs)
const imageUrlSchema = z.preprocess(
  (val) => {
    // Normalize empty string to null
    if (val === '' || val === undefined) return null
    return val
  },
  z.union([
    z.null(),
    z.string().refine(
      (val) => val.startsWith('/'),
      { message: 'imageUrl must be a relative path starting with /' }
    ),
  ])
)

const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  imageUrl: imageUrlSchema.optional().nullable(),
  isAvailable: z.boolean().optional(),
  menuCategoryId: z.number().int().positive().optional(),
  isBuffetItem: z.boolean().optional(),
  isALaCarteItem: z.boolean().optional(),
})

// GET - Get single menu item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = parseInt(params.id, 10)

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'รหัสเมนูไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'ไม่พบเมนู' },
        { status: 404 }
      )
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error fetching menu item:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

// PATCH - Update menu item
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = parseInt(params.id, 10)

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'รหัสเมนูไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Log for debugging
    console.log('Update menu item payload:', JSON.stringify(body, null, 2))
    
    // Pre-process body to handle edge cases before validation
    const processedBody: any = { ...body }
    
    // Normalize imageUrl: convert empty string or undefined to null
    if (processedBody.imageUrl === '' || processedBody.imageUrl === undefined) {
      processedBody.imageUrl = null
    }
    
    // Remove undefined values to avoid validation issues
    Object.keys(processedBody).forEach(key => {
      if (processedBody[key] === undefined && key !== 'imageUrl') {
        delete processedBody[key]
      }
    })
    
    const data = updateMenuItemSchema.parse(processedBody)

    // Normalize imageUrl: convert empty string to null
    const normalizedImageUrl = data.imageUrl === '' || data.imageUrl === undefined ? null : data.imageUrl

    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.imageUrl !== undefined && { imageUrl: normalizedImageUrl }),
        ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
        ...(data.menuCategoryId && { menuCategoryId: data.menuCategoryId }),
        ...(data.isBuffetItem !== undefined && { isBuffetItem: data.isBuffetItem }),
        ...(data.isALaCarteItem !== undefined && { isALaCarteItem: data.isALaCarteItem }),
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

    await logAction(null, 'UPDATE_MENU_ITEM', {
      itemId: item.id,
      name: item.name,
    })

    return NextResponse.json({ item })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors)
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating menu item:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

// DELETE - Delete menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = parseInt(params.id, 10)

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'รหัสเมนูไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'ไม่พบเมนู' },
        { status: 404 }
      )
    }

    await prisma.menuItem.delete({
      where: { id: itemId },
    })

    await logAction(null, 'DELETE_MENU_ITEM', {
      itemId: item.id,
      name: item.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

