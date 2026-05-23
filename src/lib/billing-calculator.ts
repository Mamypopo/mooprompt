export type PromoType = 'PERCENT' | 'FIXED' | 'PER_PERSON' | 'MIN_PEOPLE' | 'MIN_AMOUNT'
export type DiscountType = 'PERCENT' | 'FIXED' | 'PROMOTION'

export interface BillingInput {
  subtotal: number
  extraChargeTotal: number
  peopleCount: number
  vatRate?: number | null
  // Manual discount
  discountType?: DiscountType | null
  discountValue?: number | null
  // Promotion
  promotion?: {
    type: PromoType
    value: number
    condition?: Record<string, any>
    packagePricePerPerson?: number
  } | null
}

export interface BillingResult {
  subtotal: number
  extraChargeTotal: number
  discountTotal: number
  vatAmount: number
  grandTotal: number
  vatRate: number
}

export function calculateBilling(input: BillingInput): BillingResult {
  const { subtotal, extraChargeTotal, peopleCount, vatRate, discountType, discountValue, promotion } = input

  let discountTotal = 0

  if (promotion) {
    const { type, value, condition = {}, packagePricePerPerson = 0 } = promotion

    if (type === 'PERCENT') {
      discountTotal = (subtotal * value) / 100
    } else if (type === 'FIXED') {
      discountTotal = value
    } else if (type === 'PER_PERSON') {
      if (condition.buy && condition.pay) {
        const freePeople = condition.buy - condition.pay
        discountTotal = packagePricePerPerson * freePeople
      }
    } else if (type === 'MIN_PEOPLE') {
      if (condition.minPeople && peopleCount >= condition.minPeople) {
        discountTotal = value <= 100 ? (subtotal * value) / 100 : value
      }
    } else if (type === 'MIN_AMOUNT') {
      if (condition.minAmount && subtotal >= condition.minAmount) {
        discountTotal = value <= 100 ? (subtotal * value) / 100 : value
      }
    }
  } else if (discountType && discountValue != null) {
    if (discountType === 'PERCENT') {
      discountTotal = (subtotal * discountValue) / 100
    } else if (discountType === 'FIXED') {
      discountTotal = discountValue
    }
  }

  const finalVatRate = vatRate || 0
  const amountBeforeVat = subtotal + extraChargeTotal - discountTotal
  const vatAmount = (amountBeforeVat * finalVatRate) / 100
  const grandTotal = amountBeforeVat + vatAmount

  return { subtotal, extraChargeTotal, discountTotal, vatAmount, grandTotal, vatRate: finalVatRate }
}
