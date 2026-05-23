import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

function getJWTSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || '')
}

// ระบุว่า role ไหนเข้า path ไหนได้
const ROLE_ROUTES: Array<{ path: string; roles: string[] }> = [
  { path: '/kitchen', roles: ['ADMIN', 'MANAGER', 'KITCHEN', 'STAFF'] },
  { path: '/runner', roles: ['ADMIN', 'MANAGER', 'RUNNER', 'STAFF'] },
  { path: '/admin', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'STAFF'] },
]

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, getJWTSecret())
    const role = payload.role as string
    const pathname = request.nextUrl.pathname

    for (const { path, roles } of ROLE_ROUTES) {
      if (pathname.startsWith(path) && !roles.includes(role)) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Forward user id/role as headers for server components
    const headers = new Headers(request.headers)
    headers.set('x-user-id', String(payload.id))
    headers.set('x-user-role', role)
    headers.set('x-user-name', String(payload.name))

    return NextResponse.next({ request: { headers } })
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/admin/:path*', '/kitchen/:path*', '/runner/:path*'],
}
