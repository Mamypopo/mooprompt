import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let info = await prisma.restaurantInfo.findFirst()

    if (!info) {
      // Create default info if not exists
      info = await prisma.restaurantInfo.create({
        data: {
          name: 'Mooprompt Restaurant',
          address: '',
          phone: '',
        },
      })
    }

    return NextResponse.json({ info })
  } catch (error) {
    console.error('Error fetching restaurant info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

