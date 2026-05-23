import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await verifyJWT(token)
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
