import type { Metadata } from 'next'
import { Inter, Prompt } from 'next/font/google'
import './globals.css'
import { SwalInit } from '@/components/swal-init'
import { CustomerFooter } from '@/components/customer-footer'

const prompt = Prompt({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-prompt',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Mooprompt Restaurant System',
  description: 'ระบบสั่งอาหารร้านหมูกระทะ/ชาบู',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${prompt.variable} ${inter.variable} font-sans`}>
          <SwalInit />
          {children}
          <CustomerFooter />
      </body>
    </html>
  )
}

