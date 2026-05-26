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

    console.log('[middleware] path:', pathname, '| role:', role)

    for (const { path, roles } of ROLE_ROUTES) {
      if (pathname.startsWith(path) && !roles.includes(role)) {
        console.log('[middleware] BLOCKED — role', role, 'not allowed on', path)
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    const headers = new Headers(request.headers)
    headers.set('x-user-id', String(payload.id))
    headers.set('x-user-role', role)

    return NextResponse.next({ request: { headers } })
  } catch (err) {
    console.error('[middleware] JWT verify failed:', err)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/admin/:path*', '/kitchen/:path*', '/runner/:path*'],
}
