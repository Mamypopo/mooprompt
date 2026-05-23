import { describe, it, expect } from 'vitest'
import { calculateBilling } from './billing-calculator'

describe('calculateBilling', () => {
  it('คำนวณยอดรวมปกติ (ไม่มี discount/VAT)', () => {
    const result = calculateBilling({
      subtotal: 1000,
      extraChargeTotal: 100,
      peopleCount: 2,
    })
    expect(result.discountTotal).toBe(0)
    expect(result.vatAmount).toBe(0)
    expect(result.grandTotal).toBe(1100)
  })

  it('VAT 7% คำนวณถูกต้อง', () => {
    const result = calculateBilling({
      subtotal: 1000,
      extraChargeTotal: 0,
      peopleCount: 2,
      vatRate: 7,
    })
    expect(result.vatAmount).toBe(70)
    expect(result.grandTotal).toBe(1070)
  })

  it('discount แบบ PERCENT ลดจาก subtotal', () => {
    const result = calculateBilling({
      subtotal: 1000,
      extraChargeTotal: 0,
      peopleCount: 2,
      discountType: 'PERCENT',
      discountValue: 10,
    })
    expect(result.discountTotal).toBe(100)
    expect(result.grandTotal).toBe(900)
  })

  it('discount แบบ FIXED ลดจำนวนบาทคงที่', () => {
    const result = calculateBilling({
      subtotal: 1000,
      extraChargeTotal: 0,
      peopleCount: 2,
      discountType: 'FIXED',
      discountValue: 200,
    })
    expect(result.discountTotal).toBe(200)
    expect(result.grandTotal).toBe(800)
  })

  it('promotion PERCENT ลด 20%', () => {
    const result = calculateBilling({
      subtotal: 500,
      extraChargeTotal: 0,
      peopleCount: 2,
      promotion: { type: 'PERCENT', value: 20 },
    })
    expect(result.discountTotal).toBe(100)
    expect(result.grandTotal).toBe(400)
  })

  it('promotion FIXED ลด 150 บาท', () => {
    const result = calculateBilling({
      subtotal: 500,
      extraChargeTotal: 0,
      peopleCount: 2,
      promotion: { type: 'FIXED', value: 150 },
    })
    expect(result.discountTotal).toBe(150)
    expect(result.grandTotal).toBe(350)
  })

  it('promotion PER_PERSON: มา 4 จ่าย 3 (package 199 บาท/คน)', () => {
    const result = calculateBilling({
      subtotal: 796, // 199 * 4
      extraChargeTotal: 0,
      peopleCount: 4,
      promotion: {
        type: 'PER_PERSON',
        value: 199,
        condition: { buy: 4, pay: 3 },
        packagePricePerPerson: 199,
      },
    })
    expect(result.discountTotal).toBe(199) // ลด 1 คน
    expect(result.grandTotal).toBe(597)
  })

  it('promotion MIN_PEOPLE: มี 5 คน ขั้นต่ำ 4 คน ลด 10%', () => {
    const result = calculateBilling({
      subtotal: 1000,
      extraChargeTotal: 0,
      peopleCount: 5,
      promotion: { type: 'MIN_PEOPLE', value: 10, condition: { minPeople: 4 } },
    })
    expect(result.discountTotal).toBe(100)
    expect(result.grandTotal).toBe(900)
  })

  it('promotion MIN_PEOPLE: คนไม่ถึงขั้นต่ำ ไม่ลด', () => {
    const result = calculateBilling({
      subtotal: 1000,
      extraChargeTotal: 0,
      peopleCount: 3,
      promotion: { type: 'MIN_PEOPLE', value: 10, condition: { minPeople: 4 } },
    })
    expect(result.discountTotal).toBe(0)
    expect(result.grandTotal).toBe(1000)
  })

  it('promotion MIN_AMOUNT: ยอดถึงขั้นต่ำ ลด 50 บาท (FIXED > 100)', () => {
    const result = calculateBilling({
      subtotal: 500,
      extraChargeTotal: 0,
      peopleCount: 2,
      promotion: { type: 'MIN_AMOUNT', value: 200, condition: { minAmount: 300 } },
    })
    expect(result.discountTotal).toBe(200)
    expect(result.grandTotal).toBe(300)
  })

  it('promotion MIN_AMOUNT: ยอดไม่ถึงขั้นต่ำ ไม่ลด', () => {
    const result = calculateBilling({
      subtotal: 200,
      extraChargeTotal: 0,
      peopleCount: 2,
      promotion: { type: 'MIN_AMOUNT', value: 50, condition: { minAmount: 300 } },
    })
    expect(result.discountTotal).toBe(0)
    expect(result.grandTotal).toBe(200)
  })

  it('คำนวณรวม: subtotal + extra + VAT + discount', () => {
    const result = calculateBilling({
      subtotal: 1000,
      extraChargeTotal: 200,
      peopleCount: 2,
      vatRate: 7,
      discountType: 'FIXED',
      discountValue: 100,
    })
    // amountBeforeVat = 1000 + 200 - 100 = 1100
    // vat = 1100 * 7% = 77
    // grandTotal = 1177
    expect(result.discountTotal).toBe(100)
    expect(result.vatAmount).toBe(77)
    expect(result.grandTotal).toBe(1177)
  })
})
