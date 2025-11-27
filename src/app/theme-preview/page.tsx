'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ธีมสีทั้งหมด
const themes = {
  current: {
    name: 'ปัจจุบัน (ชมพู/ฟ้า)',
    colors: {
      primary: '#FF6A8B',
      secondary: '#8ED7FF',
      accent: '#FFEA80',
      bgLight: '#FFF6F9',
      bgDark: '#1D1D1D',
    },
    description: 'สีชมพูสดใส ฟ้าอ่อน เหลือง - อบอุ่น สดใส',
  },
  minimalist: {
    name: 'Modern Minimalist',
    colors: {
      primary: '#6366F1',
      secondary: '#64748B',
      accent: '#10B981',
      bgLight: '#FFFFFF',
      bgDark: '#0F172A',
    },
    description: 'เรียบ สะอาด สมัยใหม่ - เหมาะกับคาเฟ่',
  },
  warm: {
    name: 'Warm & Cozy',
    colors: {
      primary: '#F59E0B',
      secondary: '#E07A5F',
      accent: '#84A98C',
      bgLight: '#FFF8F0',
      bgDark: '#2D2D2D',
    },
    description: 'อบอุ่น สบายตา - เหมาะกับร้านอาหาร',
  },
  professional: {
    name: 'Professional',
    colors: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      accent: '#14B8A6',
      bgLight: '#F9FAFB',
      bgDark: '#111827',
    },
    description: 'มืออาชีพ น่าเชื่อถือ - เหมาะกับ POS',
  },
  vibrant: {
    name: 'Vibrant & Energetic',
    colors: {
      primary: '#A855F7',
      secondary: '#EC4899',
      accent: '#06B6D4',
      bgLight: '#F5F3FF',
      bgDark: '#581C87',
    },
    description: 'สดใส มีชีวิตชีวา - เหมาะกับร้านสนุก',
  },
  earthy: {
    name: 'Earthy & Natural',
    colors: {
      primary: '#22C55E',
      secondary: '#A16207',
      accent: '#84CC16',
      bgLight: '#FEFBF3',
      bgDark: '#1A2E1A',
    },
    description: 'ธรรมชาติ สงบ - เหมาะกับร้านสุขภาพ',
  },
  modernRed: {
    name: 'Modern Red (จากตัวอย่าง)',
    colors: {
      primary: '#EF4444', // Red-500 - สีแดงสดใส
      secondary: '#F87171', // Red-400 - สีแดงอ่อน
      accent: '#FBBF24', // Amber-400 - สีเหลืองทอง
      bgLight: '#FFFFFF', // ขาวสะอาด
      bgDark: '#1F1F1F', // เทาเข้ม
    },
    description: 'สีแดงสดใส สะอาด - เหมือนตัวอย่าง Facebook',
  },
  // 2024-2025 Trends
  softPastel: {
    name: 'Soft Pastel (2024 Trend)',
    colors: {
      primary: '#A78BFA', // Purple-400 - ม่วงอ่อนนุ่ม
      secondary: '#F0ABFC', // Fuchsia-300 - ชมพูอ่อน
      accent: '#FCD34D', // Yellow-300 - เหลืองอ่อน
      bgLight: '#FDF4FF', // ม่วงอ่อนมาก
      bgDark: '#1E1B2E', // ม่วงเข้ม
    },
    description: 'สีอ่อนนุ่ม สบายตา - เทรนด์ 2024',
  },
  glassmorphism: {
    name: 'Glassmorphism (Modern)',
    colors: {
      primary: '#3B82F6', // Blue-500
      secondary: '#8B5CF6', // Purple-500
      accent: '#06B6D4', // Cyan-500
      bgLight: '#F0F9FF', // Sky-50
      bgDark: '#0F172A', // Slate-900
    },
    description: 'Glass effect สมัยใหม่ - 2024',
  },
  warmNeutral: {
    name: 'Warm Neutral (2024)',
    colors: {
      primary: '#D97706', // Amber-600 - ส้มอบอุ่น
      secondary: '#92400E', // Amber-800 - น้ำตาล
      accent: '#F59E0B', // Amber-500 - ส้มทอง
      bgLight: '#FFFBEB', // Amber-50
      bgDark: '#1C1917', // Stone-900
    },
    description: 'อบอุ่น เป็นมิตร - เทรนด์ 2024',
  },
  oceanBreeze: {
    name: 'Ocean Breeze (2024)',
    colors: {
      primary: '#0891B2', // Cyan-600 - ฟ้าทะเล
      secondary: '#06B6D4', // Cyan-500 - ฟ้าสดใส
      accent: '#22D3EE', // Cyan-400 - ฟ้าอ่อน
      bgLight: '#ECFEFF', // Cyan-50
      bgDark: '#0C4A6E', // Cyan-900
    },
    description: 'ฟ้าทะเล สดใส - 2024',
  },
  sunsetGradient: {
    name: 'Sunset Gradient (2024)',
    colors: {
      primary: '#F97316', // Orange-500 - ส้ม
      secondary: '#EC4899', // Pink-500 - ชมพู
      accent: '#FBBF24', // Amber-400 - เหลือง
      bgLight: '#FFF7ED', // Orange-50
      bgDark: '#1C1917', // Stone-900
    },
    description: 'สีพระอาทิตย์ตก - 2024',
  },
  forestGreen: {
    name: 'Forest Green (Natural)',
    colors: {
      primary: '#059669', // Emerald-600 - เขียว
      secondary: '#10B981', // Emerald-500 - เขียวสด
      accent: '#34D399', // Emerald-400 - เขียวอ่อน
      bgLight: '#ECFDF5', // Emerald-50
      bgDark: '#064E3B', // Emerald-900
    },
    description: 'เขียวธรรมชาติ สงบ - 2024',
  },
  midnightBlue: {
    name: 'Midnight Blue (Premium)',
    colors: {
      primary: '#2563EB', // Blue-600 - น้ำเงิน
      secondary: '#3B82F6', // Blue-500 - น้ำเงินสด
      accent: '#60A5FA', // Blue-400 - น้ำเงินอ่อน
      bgLight: '#EFF6FF', // Blue-50
      bgDark: '#1E3A8A', // Blue-900
    },
    description: 'น้ำเงินพรีเมียม - 2024',
  },
  roseGold: {
    name: 'Rose Gold (Luxury)',
    colors: {
      primary: '#E11D48', // Rose-600 - ชมพูเข้ม
      secondary: '#F43F5E', // Rose-500 - ชมพูสด
      accent: '#FB7185', // Rose-400 - ชมพูอ่อน
      bgLight: '#FFF1F2', // Rose-50
      bgDark: '#881337', // Rose-900
    },
    description: 'โรสโกลด์หรูหรา - 2024',
  },
}

export default function ThemePreviewPage() {
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof themes>('current')
  const [isDark, setIsDark] = useState(false)

  const currentTheme = themes[selectedTheme]

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`} style={{
      backgroundColor: isDark ? currentTheme.colors.bgDark : currentTheme.colors.bgLight,
      color: isDark ? '#F9FAFB' : '#111827',
      transition: 'background-color 0.3s ease, color 0.3s ease',
    }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🎨 Theme Preview</h1>
          <p className="text-muted-foreground">เลือกธีมที่ชอบและดูตัวอย่าง UI</p>
        </div>

        {/* Theme Selector */}
        <Card className="mb-8" style={{
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderColor: isDark ? '#374151' : '#E5E7EB',
        }}>
          <CardHeader>
            <CardTitle>เลือกธีม</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(Object.keys(themes) as Array<keyof typeof themes>).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedTheme(key)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTheme === key
                      ? 'border-primary scale-105'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
                  }`}
                  style={{
                    backgroundColor: isDark ? '#111827' : '#F9FAFB',
                    borderColor: selectedTheme === key ? themes[key].colors.primary : undefined,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: themes[key].colors.primary }}
                    />
                    <span className="font-semibold text-sm">{themes[key].name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    {themes[key].description}
                  </p>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 pt-4">
              <Button
                onClick={() => setIsDark(!isDark)}
                style={{
                  backgroundColor: currentTheme.colors.primary,
                  color: '#FFFFFF',
                }}
              >
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card className="mb-8" style={{
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderColor: isDark ? '#374151' : '#E5E7EB',
        }}>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div
                  className="w-full h-24 rounded-lg mb-2"
                  style={{ backgroundColor: currentTheme.colors.primary }}
                />
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-muted-foreground">{currentTheme.colors.primary}</p>
              </div>
              <div>
                <div
                  className="w-full h-24 rounded-lg mb-2"
                  style={{ backgroundColor: currentTheme.colors.secondary }}
                />
                <p className="text-sm font-medium">Secondary</p>
                <p className="text-xs text-muted-foreground">{currentTheme.colors.secondary}</p>
              </div>
              <div>
                <div
                  className="w-full h-24 rounded-lg mb-2"
                  style={{ backgroundColor: currentTheme.colors.accent }}
                />
                <p className="text-sm font-medium">Accent</p>
                <p className="text-xs text-muted-foreground">{currentTheme.colors.accent}</p>
              </div>
              <div>
                <div
                  className="w-full h-24 rounded-lg mb-2 border"
                  style={{
                    backgroundColor: isDark ? currentTheme.colors.bgDark : currentTheme.colors.bgLight,
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                  }}
                />
                <p className="text-sm font-medium">Background</p>
                <p className="text-xs text-muted-foreground">
                  {isDark ? currentTheme.colors.bgDark : currentTheme.colors.bgLight}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UI Components Preview */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Buttons */}
          <Card style={{
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isDark ? '#374151' : '#E5E7EB',
          }}>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                style={{
                  backgroundColor: currentTheme.colors.primary,
                  color: '#FFFFFF',
                }}
              >
                Primary Button
              </Button>
              <Button
                variant="outline"
                style={{
                  borderColor: currentTheme.colors.primary,
                  color: currentTheme.colors.primary,
                }}
              >
                Outline Button
              </Button>
              <Button
                style={{
                  backgroundColor: currentTheme.colors.secondary,
                  color: '#FFFFFF',
                }}
              >
                Secondary Button
              </Button>
              <Button
                style={{
                  backgroundColor: currentTheme.colors.accent,
                  color: '#111827',
                }}
              >
                Accent Button
              </Button>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card style={{
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isDark ? '#374151' : '#E5E7EB',
          }}>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">ชื่อ</Label>
                <Input
                  id="name"
                  placeholder="กรอกชื่อ..."
                  style={{
                    borderColor: isDark ? '#374151' : '#D1D5DB',
                  }}
                />
              </div>
              <div>
                <Label htmlFor="select">เลือก</Label>
                <Select>
                  <SelectTrigger style={{
                    borderColor: isDark ? '#374151' : '#D1D5DB',
                  }}>
                    <SelectValue placeholder="เลือกตัวเลือก..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">ตัวเลือก 1</SelectItem>
                    <SelectItem value="2">ตัวเลือก 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card style={{
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isDark ? '#374151' : '#E5E7EB',
          }}>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge
                  style={{
                    backgroundColor: currentTheme.colors.primary,
                    color: '#FFFFFF',
                  }}
                >
                  Primary
                </Badge>
                <Badge
                  style={{
                    backgroundColor: currentTheme.colors.secondary,
                    color: '#FFFFFF',
                  }}
                >
                  Secondary
                </Badge>
                <Badge
                  style={{
                    backgroundColor: currentTheme.colors.accent,
                    color: '#111827',
                  }}
                >
                  Accent
                </Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card Example */}
          <Card style={{
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isDark ? '#374151' : '#E5E7EB',
          }}>
            <CardHeader>
              <CardTitle>Card Example</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: isDark ? '#111827' : '#F9FAFB',
                  borderLeft: `4px solid ${currentTheme.colors.primary}`,
                }}
              >
                <h3 className="font-semibold mb-2">ตัวอย่าง Card</h3>
                <p className="text-sm text-muted-foreground">
                  นี่คือตัวอย่างการ์ดที่ใช้สีจากธีมที่เลือก
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Detail Example (inspired by the image) */}
        <Card className="mb-8" style={{
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderColor: isDark ? '#374151' : '#E5E7EB',
        }}>
          <CardHeader>
            <CardTitle>ตัวอย่าง Product Detail (จากภาพ)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Product Image Placeholder */}
            <div
              className="w-full h-64 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: isDark ? '#111827' : '#F3F4F6',
                backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <span className="text-white text-lg font-semibold">🍕 Product Image</span>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="font-semibold mb-3">เลือกขนาด</h3>
              <div className="grid grid-cols-3 gap-3">
                {['6" - Small', '8" - Medium', '10" - Large'].map((size, index) => {
                  const isSelected = index === 1
                  return (
                    <button
                      key={size}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected ? 'scale-105' : ''
                      }`}
                      style={{
                        backgroundColor: isDark ? '#111827' : '#FFFFFF',
                        borderColor: isSelected
                          ? currentTheme.colors.primary
                          : isDark
                          ? '#374151'
                          : '#E5E7EB',
                        borderWidth: isSelected ? '2px' : '1px',
                      }}
                    >
                      <div
                        className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                          isSelected ? '' : 'border-2'
                        }`}
                        style={{
                          backgroundColor: isSelected ? currentTheme.colors.primary : 'transparent',
                          borderColor: isSelected ? 'transparent' : (isDark ? '#6B7280' : '#9CA3AF'),
                        }}
                      />
                      <p className="text-sm font-medium mb-1">{size}</p>
                      <p
                        className="text-xs"
                        style={{ color: currentTheme.colors.primary }}
                      >
                        ${5.99 + index * 2}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="flex items-center justify-between pt-4 border-t" style={{
              borderColor: isDark ? '#374151' : '#E5E7EB',
            }}>
              <div className="flex items-center gap-3">
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#F3F4F6',
                    color: currentTheme.colors.primary,
                  }}
                >
                  -
                </button>
                <span className="font-semibold">2x</span>
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#F3F4F6',
                    color: currentTheme.colors.primary,
                  }}
                >
                  +
                </button>
              </div>
              <Button
                size="lg"
                className="flex-1 max-w-xs"
                style={{
                  backgroundColor: currentTheme.colors.primary,
                  color: '#FFFFFF',
                }}
              >
                Add to Cart
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cart Example (inspired by the image) */}
        <Card className="mb-8" style={{
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderColor: isDark ? '#374151' : '#E5E7EB',
        }}>
          <CardHeader>
            <CardTitle>ตัวอย่าง Cart/Checkout (จากภาพ)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-4">
              {[
                { name: 'Italian Cheez Pizza', price: 7.99, qty: 2 },
                { name: 'Spicy Chili Chicken', price: 5.99, qty: 2 },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#F9FAFB',
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: isDark ? '#1F2937' : '#E5E7EB',
                    }}
                  >
                    <span className="text-2xl">🍕</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p
                      className="text-sm"
                      style={{ color: currentTheme.colors.primary }}
                    >
                      ${item.price}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{
                          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                        }}
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{item.qty}x</span>
                      <button
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{
                          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="text-red-500 hover:text-red-600"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Billing Summary */}
            <div className="pt-4 border-t space-y-2" style={{
              borderColor: isDark ? '#374151' : '#E5E7EB',
            }}>
              <div className="flex justify-between text-sm">
                <span>Sub total</span>
                <span>$13.98</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxes & Fees</span>
                <span>$10.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>$5.00</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t" style={{
                borderColor: isDark ? '#374151' : '#E5E7EB',
              }}>
                <span>Total</span>
                <span style={{ color: currentTheme.colors.primary }}>$28.98</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              size="lg"
              className="w-full mt-4"
              style={{
                backgroundColor: currentTheme.colors.primary,
                color: '#FFFFFF',
              }}
            >
              Checkout
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button
            size="lg"
            style={{
              backgroundColor: currentTheme.colors.primary,
              color: '#FFFFFF',
            }}
            onClick={() => {
              alert(`คุณเลือกธีม: ${currentTheme.name}\n\nต้องการให้ผมสร้างไฟล์ CSS สำหรับธีมนี้ไหม?`)
            }}
          >
            ✅ เลือกธีมนี้
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              setSelectedTheme('current')
              setIsDark(false)
            }}
          >
            🔄 รีเซ็ต
          </Button>
        </div>
      </div>
    </div>
  )
}

