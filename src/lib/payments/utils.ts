// Payment utility functions for AlgeriaTrade payment system

import { v4 as uuidv4 } from 'uuid'

export type PaymentMethodType = 'CIB' | 'CCP' | 'BARIDIMOB' | 'BANK_TRANSFER' | 'COD'
export type PaymentStatusType = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PENDING_VERIFICATION' | 'CANCELLED'

// Algerian Banks Configuration
export const ALGERIAN_BANKS = [
  { code: 'BNA', name: 'Banque Nationale d\'Algérie', ribPrefix: '001' },
  { code: 'BEA', name: 'Banque Extérieure d\'Algérie', ribPrefix: '003' },
  { code: 'CPA', name: 'Crédit Populaire d\'Algérie', ribPrefix: '007' },
  { code: 'BDL', name: 'Banque de Développement Local', ribPrefix: '010' },
  { code: 'BADR', name: 'Banque de l\'Agriculture et du Développement Rural', ribPrefix: '012' },
  { code: 'SGA', name: 'Société Générale Algérie', ribPrefix: '020' },
] as const

// Platform Bank Details (for receiving payments)
export const PLATFORM_BANK_DETAILS = {
  bankName: 'Banque Nationale d\'Algérie (BNA)',
  accountName: 'AlgeriaTrade.dz - SARL',
  rib: '00100000000000000001',
  ccpAccount: '0000000000-00',
  ccpKey: '00',
}

// Generate unique reference number
export function generateReferenceNumber(method: PaymentMethodType): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  
  switch (method) {
    case 'CIB':
      return `CIB-${dateStr}-${random}`
    case 'CCP':
      return `CCP-${dateStr}-${random}`
    case 'BARIDIMOB':
      return `BM-${dateStr}-${random}`
    case 'BANK_TRANSFER':
      return `VB-${dateStr}-${random}`
    case 'COD':
      return `COD-${dateStr}-${random}`
    default:
      return `PAY-${dateStr}-${random}`
  }
}

// Generate CCP Reference
export function generateCCPReference(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const sequence = Math.floor(Math.random() * 90000) + 10000
  return `CCP-${dateStr}-${sequence}`
}

// Generate mock transaction ID
export function generateTransactionId(): string {
  return `txn_${uuidv4().replace(/-/g, '').substring(0, 16)}`
}

// Generate OTP for BaridiMob
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Format currency in DZD (French format)
export function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DZD'
}

// Validate CIB card number (basic Luhn check)
export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '')
  
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false
  }

  let sum = 0
  let isEven = false
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10)
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

// Detect card type from number
export function detectCardType(cardNumber: string): 'visa' | 'mastercard' | 'unknown' {
  const cleaned = cardNumber.replace(/\s/g, '')
  
  if (/^4/.test(cleaned)) {
    return 'visa'
  }
  
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
    return 'mastercard'
  }
  
  return 'unknown'
}

// Validate expiry date
export function validateExpiryDate(expiry: string): boolean {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/)
  if (!match) return false
  
  const month = parseInt(match[1], 10)
  const year = parseInt('20' + match[2], 10)
  
  if (month < 1 || month > 12) return false
  
  const now = new Date()
  const expDate = new Date(year, month)
  
  return expDate > now
}

// Validate CVV
export function validateCVV(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv)
}

// Validate Algerian phone number (+213 format)
export function validateAlgerianPhone(phone: string): boolean {
  // Accept formats: +213XXXXXXXXX, 00213XXXXXXXXX, 0XXXXXXXXX
  const cleaned = phone.replace(/[\s\-()]/g, '')
  
  return (
    /^\+213[567]\d{8}$/.test(cleaned) ||
    /^00213[567]\d{8}$/.test(cleaned) ||
    /^0[567]\d{8}$/.test(cleaned)
  )
}

// Normalize phone to +213 format
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '')
  
  if (cleaned.startsWith('00213')) {
    cleaned = '+213' + cleaned.substring(5)
  } else if (cleaned.startsWith('0')) {
    cleaned = '+213' + cleaned.substring(1)
  }
  
  return cleaned
}

// Validate RIB (20 digits)
export function validateRIB(rib: string): boolean {
  const cleaned = rib.replace(/\s/g, '')
  return /^\d{20}$/.test(cleaned)
}

// Validate CCP account
export function validateCCPAccount(account: string): boolean {
  const cleaned = account.replace(/\s/g, '')
  return /^\d{10}-\d{2}$/.test(cleaned)
}

// Calculate COD fee based on wilaya and amount
export function calculateCODFee(amount: number, wilayaCode?: string): number {
  // Base fee structure for COD
  const baseFee = 250 // 250 DZD base fee
  
  // Additional fees for remote wilayas (codes 38-58 are southern)
  const remoteWilayas = ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58']
  
  if (wilayaCode && remoteWilayas.includes(wilayaCode)) {
    return baseFee + 500 // Extra 500 DZD for remote areas
  }
  
  // Percentage-based fee for large amounts
  if (amount > 100000) {
    return baseFee + Math.floor(amount * 0.005) // 0.5% for amounts over 100k
  }
  
  return baseFee
}

// Get payment method display info
export function getPaymentMethodInfo(method: PaymentMethodType) {
  const methods: Record<PaymentMethodType, {
    name: string
    description: string
    icon: string
    processingTime: string
    fee: number
    feeDescription: string
  }> = {
    CIB: {
      name: 'Carte Bancaire (CIB)',
      description: 'Paiement par Visa ou Mastercard via le réseau interbancaire algérien',
      icon: 'credit-card',
      processingTime: 'Immédiat',
      fee: 0,
      feeDescription: 'Gratit',
    },
    CCP: {
      name: 'Chèque Postale (CCP)',
      description: 'Virement depuis votre compte postal algérien',
      icon: 'building-2',
      processingTime: '1-2 jours ouvrables',
      fee: 0,
      feeDescription: 'Gratit',
    },
    BARIDIMOB: {
      name: 'BaridiMob',
      description: 'Paiement mobile instantané via Algérie Poste',
      icon: 'smartphone',
      processingTime: 'Immédiat',
      fee: 0,
      feeDescription: 'Gratit',
    },
    BANK_TRANSFER: {
      name: 'Virement Bancaire',
      description: 'Virement bancaire direct vers notre compte',
      icon: 'landmark',
      processingTime: '1-3 jours ouvrables',
      fee: 0,
      feeDescription: 'Frais bancaires possibles',
    },
    COD: {
      name: 'Paiement à la Livraison',
      description: 'Payez en espèces à la réception de votre commande',
      icon: 'banknote',
      processingTime: 'À la livraison',
      fee: 250,
      feeDescription: 'À partir de 250 DZD',
    },
  }
  
  return methods[method]
}

// Log transaction action
export interface TransactionLogInput {
  paymentId?: string
  action: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  userId?: string
}

// Simulate 3D Secure verification delay
export async function simulateProcessingDelay(ms: number = 2000): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}
