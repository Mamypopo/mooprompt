import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Fetch session data
    const session = await prisma.tableSession.findUnique({
      where: { id: parseInt(sessionId, 10) },
      include: {
        table: true,
        package: true,
      },
    })

    if (!session || session.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Session not found or not active' },
        { status: 404 }
      )
    }

    // Fetch restaurant info
    let restaurantInfo = await prisma.restaurantInfo.findFirst()
    if (!restaurantInfo) {
      restaurantInfo = await prisma.restaurantInfo.create({
        data: {
          name: 'Mooprompt Restaurant',
          address: '',
          phone: '',
        },
      })
    }

    // Generate QR Code
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3001'
    const baseUrl = `${protocol}://${host}`
    const qrUrl = `${baseUrl}/session/${sessionId}`
    const qrCodeBuffer = await QRCode.toBuffer(qrUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    // Create PDF for Thermal Printer (80mm width)
    const doc = new PDFDocument({
      size: [226.77, 'auto'], // 80mm in points (80mm = 226.77pt)
      margins: {
        top: 20,
        bottom: 20,
        left: 15,
        right: 15,
      },
    })

    // Set up Promise to collect PDF data
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const buffers: Buffer[] = []
      doc.on('data', (chunk) => buffers.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', (err) => reject(err))

    // Header - Restaurant Info
    doc.fontSize(14).font('Helvetica-Bold').text(restaurantInfo.name, {
      align: 'center',
    })

    if (restaurantInfo.address) {
      doc.fontSize(8).font('Helvetica').text(restaurantInfo.address, {
        align: 'center',
      })
    }

    if (restaurantInfo.phone) {
      doc.fontSize(8).font('Helvetica').text(`โทร: ${restaurantInfo.phone}`, {
        align: 'center',
      })
    }

    if (restaurantInfo.openTime || restaurantInfo.closeTime) {
      doc.fontSize(8).font('Helvetica').text(
        `เปิดบริการ: ${restaurantInfo.openTime || '-'} - ${restaurantInfo.closeTime || '-'}`,
        {
          align: 'center',
        }
      )
    }

    // Divider
    doc.moveDown(0.5)
    doc.moveTo(15, doc.y).lineTo(211.77, doc.y).stroke()
    doc.moveDown(0.5)

    // Table Number
    doc.fontSize(12).font('Helvetica-Bold').text(`โต๊ะที่ ${session.table.tableNumber}`, {
      align: 'center',
    })

    // QR Code
    doc.moveDown(0.5)
    doc.image(qrCodeBuffer, {
      fit: [120, 120],
      align: 'center',
    })

    doc.moveDown(0.5)
    doc.fontSize(8).font('Helvetica').text('สแกน QR Code เพื่อเข้าสู่ระบบสั่งอาหาร', {
      align: 'center',
    })

    doc.fontSize(6).font('Helvetica').text(qrUrl, {
      align: 'center',
      width: 196.77,
    })

    // Divider
    doc.moveDown(0.5)
    doc.moveTo(15, doc.y).lineTo(211.77, doc.y).stroke()
    doc.moveDown(0.5)

    // Session Details
    doc.fontSize(8).font('Helvetica')
    const details = [
      { label: 'จำนวนคน:', value: `${session.peopleCount} คน` },
    ]

    if (session.package) {
      details.push(
        { label: 'แพ็กเกจ:', value: session.package.name },
        {
          label: 'ราคา/คน:',
          value: `${session.package.pricePerPerson.toFixed(2)} บาท`,
        }
      )
      if (session.package.durationMinutes) {
        details.push({
          label: 'ระยะเวลา:',
          value: `${session.package.durationMinutes} นาที`,
        })
      }
    }

    details.push({
      label: 'เวลาเริ่ม:',
      value: new Date(session.startTime).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    })

    details.forEach((detail) => {
      doc.text(detail.label, 15, doc.y, {
        width: 80,
        continued: true,
      })
      doc.text(detail.value, {
        width: 121.77,
        align: 'right',
      })
      doc.moveDown(0.3)
    })

    // WiFi Info
    if (restaurantInfo.wifiName || restaurantInfo.wifiPassword) {
      doc.moveDown(0.5)
      doc.moveTo(15, doc.y).lineTo(211.77, doc.y).stroke()
      doc.moveDown(0.5)

      doc.fontSize(8).font('Helvetica-Bold').text('WiFi', {
        align: 'center',
      })

      if (restaurantInfo.wifiName) {
        doc.fontSize(8).font('Helvetica').text(`ชื่อ: ${restaurantInfo.wifiName}`, {
          align: 'center',
        })
      }

      if (restaurantInfo.wifiPassword) {
        doc.fontSize(8).font('Helvetica').text(
          `รหัสผ่าน: ${restaurantInfo.wifiPassword}`,
          {
            align: 'center',
          }
        )
      }
    }

    // Footer
    doc.moveDown(1)
    doc.moveTo(15, doc.y).lineTo(211.77, doc.y).stroke()
    doc.moveDown(0.5)

    doc.fontSize(8).font('Helvetica').text('ขอบคุณที่ใช้บริการ', {
      align: 'center',
    })

    doc.fontSize(6).font('Helvetica').text(`Session: ${session.id}`, {
      align: 'center',
    })

    // Finalize PDF
    doc.end()
    })

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="qr-table-${session.table.tableNumber}-${sessionId}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

