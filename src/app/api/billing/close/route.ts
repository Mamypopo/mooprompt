import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/logger'
import { z } from 'zod'
import { PaymentMethod } from '@prisma/client'

const closeBillingSchema = z.object({
  sessionId: z.number().int().positive(),
  paymentMethod: z.enum(['CASH', 'QR', 'CREDIT']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, paymentMethod } = closeBillingSchema.parse(body)

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        orders: {
          where: {
            status: 'OPEN',
          },
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        package: true,
        table: true,
      },
    })

    if (!session || session.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'ไม่พบ session หรือ session ไม่ได้เปิดใช้งาน' },
        { status: 400 }
      )
    }

    // Calculate subtotal from orders
    let subtotal = 0
    const billingItems: Array<{
      name: string
      qty: number | null
      unitPrice: number
      totalPrice: number
      type: 'MENU'
    }> = []

    for (const order of session.orders) {
      for (const item of order.items) {
        const itemTotal = item.menuItem.price * item.qty
        subtotal += itemTotal
        billingItems.push({
          name: item.menuItem.name,
          qty: item.qty,
          unitPrice: item.menuItem.price,
          totalPrice: itemTotal,
          type: 'MENU',
        })
      }
    }

    // Add package cost if exists
    if (session.package) {
      const packageTotal = session.package.pricePerPerson * session.peopleCount
      subtotal += packageTotal
      billingItems.push({
        name: session.package.name,
        qty: session.peopleCount,
        unitPrice: session.package.pricePerPerson,
        totalPrice: packageTotal,
        type: 'MENU',
      })
    }

    // Calculate extra charges
    const extraCharges = await prisma.extraCharge.findMany({
      where: { active: true },
    })

    let extraChargeTotal = 0
    for (const charge of extraCharges) {
      let chargeAmount = 0
      if (charge.chargeType === 'PER_PERSON') {
        chargeAmount = charge.price * session.peopleCount
      } else {
        chargeAmount = charge.price
      }
      extraChargeTotal += chargeAmount
      billingItems.push({
        name: charge.name,
        qty: charge.chargeType === 'PER_PERSON' ? session.peopleCount : 1,
        unitPrice: charge.price,
        totalPrice: chargeAmount,
        type: 'EXTRA',
      })
    }

    // Calculate discount (promotions)
    const promotions = await prisma.promotion.findMany({
      where: { active: true },
    })

    let discountTotal = 0
    // Apply promotions logic here (simplified)
    for (const promo of promotions) {
      if (promo.type === 'PERCENT') {
        discountTotal += (subtotal * promo.value) / 100
      } else if (promo.type === 'FIXED') {
        discountTotal += promo.value
      }
    }

    const grandTotal = subtotal + extraChargeTotal - discountTotal

    // Create billing summary
    const billing = await prisma.billingSummary.create({
      data: {
        sessionId,
        subtotal,
        extraCharge: extraChargeTotal,
        discount: discountTotal,
        grandTotal,
        paymentMethod: paymentMethod as PaymentMethod,
        items: {
          create: billingItems,
        },
      },
      include: {
        items: true,
      },
    })

    // Mark all orders as served
    await prisma.order.updateMany({
      where: {
        tableSessionId: sessionId,
        status: 'OPEN',
      },
      data: {
        status: 'SERVED',
      },
    })

    // Mark all order items as served
    await prisma.orderItem.updateMany({
      where: {
        order: {
          tableSessionId: sessionId,
        },
      },
      data: {
        status: 'SERVED',
      },
    })

    // Close session
    await prisma.tableSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED' },
    })

    // Update table status
    await prisma.table.update({
      where: { id: session.tableId },
      data: { status: 'AVAILABLE' },
    })

    await logAction(null, 'CLOSE_BILLING', {
      sessionId,
      billingId: billing.id,
      grandTotal,
      paymentMethod,
    })

    // Emit socket event
    if (typeof global !== 'undefined' && (global as any).io) {
      (global as any).io.emit('billing:closed', { billing })
    }

    return NextResponse.json({ billing }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error closing billing:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}
