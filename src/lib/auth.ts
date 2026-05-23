import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

export type JWTPayload = {
  id: number
  username: string
  role: UserRole
  name: string
}

function getJWTSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getJWTSecret())
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getJWTSecret())
  return payload as unknown as JWTPayload
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<{ id: number; username: string; role: UserRole; name: string } | null> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, role: true, name: true, passwordHash: true, active: true },
  })

  if (!user || !user.active) return null

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) return null

  return { id: user.id, username: user.username, role: user.role, name: user.name }
}

export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}
