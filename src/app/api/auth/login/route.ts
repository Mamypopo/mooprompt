import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, signJWT } from '@/lib/auth'
import { logAction } from '@/lib/logger'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 hours

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const { allowed } = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { username, password } = loginSchema.parse(body)

    const user = await authenticateUser(username, password)

    if (!user) {
      await logAction(null, 'LOGIN_FAILED', {
        username,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      })
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    await logAction(user.id, 'LOGIN', {
      username,
      role: user.role,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    const token = await signJWT({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    })

    const response = NextResponse.json({ user })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error during login:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}
