import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAction } from '@/lib/logger'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN', 'RUNNER', 'STAFF']),
  active: z.boolean().default(true),
})

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createUserSchema.parse(body)

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        passwordHash,
        role: data.role,
        active: data.active,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await logAction(null, 'CREATE_USER', {
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

