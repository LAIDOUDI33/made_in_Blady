/**
 * Payment Test Helpers for AlgeriaTrade.dz Staging Test Suite
 * Comprehensive utility functions for payment flow testing
 * @module __tests__/utils/payment-test-helpers
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface TestOrder {
  id: string
  buyerId: string
  sellerId: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'refunded' | 'cancelled'
  items: TestOrderItem[]
  createdAt: Date
  paymentMethod?: string
}

export interface TestOrderItem {
  productId: string
  quantity: number
  unitPrice: number
  description: string
  tvaRate?: number
}

export interface TestPayment {
  id: string
  orderId: string
  amount: number
  currency: string
  method: 'SATIM' | 'STRIPE' | 'CRYPTO' | 'DPA' | 'BANK_TRANSFER' | 'COD'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  transactionId?: string
  metadata?: Record<string, unknown>
}

export interface TestUser {
  id: string
  email: string
  name: string
  role: 'buyer' | 'seller' | 'admin'
  companyId?: string
  verified: boolean
  createdAt: Date
}

export interface TestResult {
  success: boolean
  data?: unknown
  error?: string
  duration?: number
  timestamp: Date
}

export interface LoadTestMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  errorRate: number
  requestsPerSecond: number
}

// ============================================
// TEST CARD GENERATION (Luhn Algorithm)
// ============================================

/**
 * Generate a Luhn-valid test card number for specified card type
 * Uses the Luhn algorithm to ensure valid checksum
 */
export function generateTestCardNumber(cardType: 'visa' | 'mastercard' | 'cib' = 'visa'): string {
  const prefixes: Record<string, string> = {
    visa: '4',
    mastercard: '5',
    cib: '6', // CIB cards typically start with 6
  }

  const prefix = prefixes[cardType]
  
  // Generate 15 digits (prefix + 14 random)
  let cardNumber = prefix
  for (let i = 0; i < 15; i++) {
    cardNumber += Math.floor(Math.random() * 10).toString()
  }

  // Calculate and append Luhn check digit
  const checkDigit = calculateLuhnCheckDigit(cardNumber)
  return cardNumber + checkDigit
}

/**
 * Calculate Luhn algorithm check digit
 */
function calculateLuhnCheckDigit(number: string): number {
  let sum = 0
  let isEven = true

  // Process from right to left
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10)

    if (!isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return (10 - (sum % 10)) % 10
}

/**
 * Validate a card number using Luhn algorithm
 */
export function validateCardLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\s/g, '')
  
  if (!/^\d+$/.test(digits) || digits.length < 13 || digits.length > 19) {
    return false
  }

  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10)

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

/**
 * Format card number with spaces for display
 */
export function formatCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '')
  const groups = cleaned.match(/.{1,4}/g)
  return groups ? groups.join(' ') : cleaned
}

/**
 * Detect card type from number
 */
export function detectCardType(cardNumber: string): 'visa' | 'mastercard' | 'cib' | 'unknown' {
  const cleaned = cardNumber.replace(/\s/g, '')
  
  if (/^4/.test(cleaned)) return 'visa'
  if (/^5[1-5]/.test(cleaned)) return 'mastercard'
  if (/^6/.test(cleaned)) return 'cib'
  
  return 'unknown'
}

// ============================================
// CRYPTO ADDRESS GENERATION
// ============================================

/**
 * Generate a test cryptocurrency address for testing purposes
 * These are formatted correctly but not real addresses on mainnet
 */
export function generateTestCryptoAddress(crypto: 'BTC' | 'ETH' | 'USDT' | 'USDC', network?: string): string {
  switch (crypto) {
    case 'BTC':
      return generateBitcoinAddress()
    case 'ETH':
      return generateEthereumAddress()
    case 'USDT':
    case 'USDC':
      return generateTokenAddress(network || 'ERC20')
    default:
      throw new Error(`Unsupported cryptocurrency: ${crypto}`)
  }
}

function generateBitcoinAddress(): string {
  // Generate a valid-looking Bech32 or Legacy address
  const chars = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
  let address = 'bc1q'
  for (let i = 0; i < 39; i++) {
    address += chars[Math.floor(Math.random() * chars.length)]
  }
  return address
}

function generateEthereumAddress(): string {
  let address = '0x'
  for (let i = 0; i < 40; i++) {
    address += Math.floor(Math.random() * 16).toString(16)
  }
  return address
}

function generateTokenAddress(network: string): string {
  if (network === 'TRC20') {
    let address = 'T'
    for (let i = 0; i < 33; i++) {
      address += Math.floor(Math.random() * 16).toString(16).toUpperCase()
    }
    return address
  }
  return generateEthereumAddress() // ERC20/BEP20 use ETH-style addresses
}

// ============================================
// WEBHOOK MOCK GENERATORS
// ============================================

/**
 * Generate a mock Stripe webhook payload
 */
export function mockStripeWebhook(
  eventType: string,
  data: Record<string, unknown> = {}
): { id: string; object: string; type: string; data: Record<string, unknown>; created: number } {
  return {
    id: `evt_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    object: 'event',
    type: eventType,
    data: {
      object: {
        id: `pi_test_${Date.now()}`,
        object: 'payment_intent',
        created: Math.floor(Date.now() / 1000),
        ...data,
      },
    },
    created: Math.floor(Date.now() / 1000),
  }
}

/**
 * Generate Stripe signature header for webhook verification testing
 */
export function mockStripeSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  // In real implementation, this would use HMAC-SHA256
  const signature = `t=${timestamp},v1=${Buffer.from(`${timestamp}.${payload}`).toString('base64')}`
  return signature
}

/**
 * Generate a mock SATIM callback payload
 */
export function mockSatimCallback(
  status: 'APPROVED' | 'DECLINED' | 'CANCELLED' | 'ERROR',
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const basePayload: Record<string, unknown> = {
    transactionId: `SATIM_TEST_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
    orderId: `ORDER-${Date.now()}`,
    amount: 50000,
    currency: 'DZD',
    status,
    authCode: status === 'APPROVED' ? `AUTH${Math.floor(Math.random() * 999999)}` : undefined,
    rrn: status === 'APPROVED' ? `${Date.now()}${Math.floor(Math.random() * 100)}` : undefined,
    timestamp: new Date().toISOString(),
    signature: 'mock_signature_for_testing',
  }

  return { ...basePayload, ...overrides }
}

/**
 * Generate a mock crypto transaction confirmation webhook
 */
export function mockCryptoWebhook(
  crypto: 'BTC' | 'ETH' | 'USDT' | 'USDC',
  status: 'confirmed' | 'pending' | 'failed',
  txHash?: string
): Record<string, unknown> {
  return {
    eventType: status === 'confirmed' ? 'transaction_confirmed' : 
               status === 'pending' ? 'transaction_pending' : 'transaction_failed',
    crypto,
    txHash: txHash || `${crypto.toLowerCase()}_tx_${Date.now()}_${Math.random().toString(16).substr(2, 16)}`,
    confirmations: status === 'confirmed' ? 12 : status === 'pending' ? 3 : 0,
    amount: crypto === 'BTC' ? '0.001' : crypto === 'ETH' ? '0.01' : '100',
    network: crypto === 'USDT' ? 'TRC20' : crypto === 'USDC' ? 'BEP20' : 'mainnet',
    fromAddress: generateTestCryptoAddress(crypto),
    toAddress: generateTestCryptoAddress(crypto),
    timestamp: new Date().toISOString(),
    blockNumber: status === 'confirmed' ? Math.floor(Math.random() * 19000000) : undefined,
  }
}

// ============================================
// ORDER CREATION HELPERS
// ============================================

/**
 * Create a test order with realistic data
 */
export function createTestOrder(overrides: Partial<TestOrder> = {}): TestOrder {
  const baseOrder: TestOrder = {
    id: `TEST-ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    buyerId: `BUYER-${Math.floor(Math.random() * 10000)}`,
    sellerId: `SELLER-${Math.floor(Math.random() * 10000)}`,
    amount: Math.floor(Math.random() * 5000000) + 100000, // 100K - 5.1M DZD
    currency: 'DZD',
    status: 'pending',
    items: [
      {
        productId: `PROD-${Math.floor(Math.random() * 1000)}`,
        quantity: Math.floor(Math.random() * 10) + 1,
        unitPrice: Math.floor(Math.random() * 500000) + 10000,
        description: 'Test product for staging validation',
        tvaRate: 19,
      },
    ],
    createdAt: new Date(),
  }

  return { ...baseOrder, ...overrides }
}

/**
 * Create a batch of test orders for load testing
 */
export function createTestOrders(count: number, options: Partial<TestOrder> = {}): TestOrder[] {
  const orders: TestOrder[] = []
  
  for (let i = 0; i < count; i++) {
    orders.push(createTestOrder({
      ...options,
      id: `TEST-ORDER-BATCH-${i}-${Date.now()}`,
    }))
  }

  return orders
}

// ============================================
// PAYMENT STATUS HELPERS
// ============================================

interface WaitForOptions {
  timeout?: number
  interval?: number
  maxAttempts?: number
}

/**
 * Wait for payment status to reach expected state (simulated for tests)
 */
export async function waitForPaymentStatus(
  paymentId: string,
  expectedStatus: string,
  getStatusFn: (id: string) => Promise<string>,
  options: WaitForOptions = {}
): Promise<TestResult> {
  const {
    timeout = 30000,
    interval = 1000,
    maxAttempts = Math.ceil(timeout / interval),
  } = options

  const startTime = Date.now()

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const currentStatus = await getStatusFn(paymentId)

      if (currentStatus === expectedStatus) {
        return {
          success: true,
          data: { status: currentStatus, attempts: attempt + 1 },
          duration: Date.now() - startTime,
          timestamp: new Date(),
        }
      }

      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, interval))
      }
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime,
          timestamp: new Date(),
        }
      }
    }
  }

  return {
    success: false,
    error: `Timeout waiting for status '${expectedStatus}' after ${maxAttempts} attempts`,
    duration: Date.now() - startTime,
    timestamp: new Date(),
  }
}

// ============================================
// ASSERTION HELPERS
// ============================================

/**
 * Assert that a payment was successful
 */
export function assertPaymentSuccess(payment: TestPayment): asserts payment is TestPayment & { status: 'completed'; transactionId: string } {
  if (payment.status !== 'completed') {
    throw new Error(`Payment failed with status: ${payment.status}`)
  }
  if (!payment.transactionId) {
    throw new Error('Payment missing transaction ID')
  }
}

/**
 * Assert that a refund was processed successfully
 */
export function assertRefundProcessed(
  originalPayment: TestPayment,
  refund: Partial<TestPayment>
): void {
  if (refund.status !== 'refunded') {
    throw new Error(`Refund not processed. Status: ${refund.status}`)
  }
  if ((refund.amount ?? 0) > originalPayment.amount) {
    throw new Error(`Refund amount (${refund.amount}) exceeds original payment (${originalPayment.amount})`)
  }
}

/**
 * Assert TVA calculation correctness
 */
export function assertTVACalculation(
  subtotal: number,
  tvaRate: number,
  calculatedTotal: number,
  tolerance: number = 0.01
): void {
  const expectedTVA = (subtotal * tvaRate) / 100
  const expectedTotal = subtotal + expectedTVA
  
  const difference = Math.abs(calculatedTotal - expectedTotal)
  
  if (difference > tolerance) {
    throw new Error(
      `TVA calculation incorrect. Expected: ${expectedTotal}, Got: ${calculatedTotal}, Difference: ${difference}`
    )
  }
}

/**
 * Assert exchange rate conversion accuracy
 */
export function assertConversionAccuracy(
  sourceAmount: number,
  exchangeRate: number,
  convertedAmount: number,
  maxSpreadPercent: number = 1
): void {
  const expectedAmount = sourceAmount * exchangeRate
  const spreadPercent = Math.abs((convertedAmount - expectedAmount) / expectedAmount) * 100
  
  if (spreadPercent > maxSpreadPercent) {
    throw new Error(
      `Conversion spread too high: ${spreadPercent.toFixed(4)}% exceeds maximum ${maxSpreadPercent}%`
    )
  }
}

/**
 * Assert DPA installment schedule validity
 */
export function assertInstallmentScheduleValidity(
  principal: number,
  months: number,
  schedule: Array<{ dueDate: Date; amount: number }>
): void {
  if (schedule.length !== months) {
    throw new Error(`Schedule has ${schedule.length} installments, expected ${months}`)
  }

  const totalPaid = schedule.reduce((sum, installment) => sum + installment.amount, 0)
  
  if (totalPaid < principal) {
    throw new Error(`Total payments (${totalPaid}) less than principal (${principal})`)
  }

  // Check due dates are in ascending order
  for (let i = 1; i < schedule.length; i++) {
    if (schedule[i].dueDate.getTime() <= schedule[i - 1].dueDate.getTime()) {
      throw new Error('Due dates are not in ascending order')
    }
  }
}

// ============================================
// LOAD TESTING HELPERS
// ============================================

interface RequestResult {
  success: boolean
  responseTime: number
  statusCode?: number
  error?: string
}

/**
 * Execute concurrent requests and collect metrics
 */
export async function runConcurrentRequests<T>(
  requestFn: () => Promise<T>,
  concurrency: number,
  totalRequests: number
): Promise<{ results: RequestResult[]; metrics: LoadTestMetrics }> {
  const results: RequestResult[] = []
  const startTime = Date.now()

  // Process in batches based on concurrency limit
  const batches = Math.ceil(totalRequests / concurrency)
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, totalRequests - results.length)
    const batchPromises = Array.from({ length: batchSize }, async () => {
      const requestStart = Date.now()
      
      try {
        await requestFn()
        return {
          success: true,
          responseTime: Date.now() - requestStart,
        } as RequestResult
      } catch (error) {
        return {
          success: false,
          responseTime: Date.now() - requestStart,
          error: error instanceof Error ? error.message : 'Unknown error',
        } as RequestResult
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
  }

  return {
    results,
    metrics: calculateLoadMetrics(results, startTime),
  }
}

/**
 * Calculate load test metrics from results
 */
function calculateLoadMetrics(results: RequestResult[], startTime: number): LoadTestMetrics {
  const successfulResults = results.filter(r => r.success)
  const failedResults = results.filter(r => !r.success)
  const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b)

  const totalTimeMs = Date.now() - startTime
  const totalSeconds = totalTimeMs / 1000

  return {
    totalRequests: results.length,
    successfulRequests: successfulResults.length,
    failedRequests: failedResults.length,
    averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    minResponseTime: responseTimes[0] || 0,
    maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
    p50ResponseTime: percentile(responseTimes, 50),
    p95ResponseTime: percentile(responseTimes, 95),
    p99ResponseTime: percentile(responseTimes, 99),
    errorRate: (failedResults.length / results.length) * 100,
    requestsPerSecond: results.length / totalSeconds,
  }
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArray: number[], p: number): number {
  if (sortedArray.length === 0) return 0
  const index = Math.ceil((p / 100) * sortedArray.length) - 1
  return sortedArray[Math.max(0, index)]
}

// ============================================
// DATA GENERATION HELPERS
// ============================================

/**
 * Generate random Algerian phone number
 */
export function generateAlgerianPhone(): string {
  const prefixes = ['055', '066', '077', '061', '054']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  let suffix = ''
  for (let i = 0; i < 7; i++) {
    suffix += Math.floor(Math.random() * 10).toString()
  }
  return `+213${prefix}${suffix}`
}

/**
 * Generate random email for testing
 */
export function generateTestEmail(prefix?: string): string {
  const base = prefix || `test_${Date.now()}`
  return `${base}_${Math.random().toString(36).substr(2, 6)}@algeriatrade.test`
}

/**
 * Generate realistic DZD amount within business range
 */
export function generateDZDAmount(min: number = 1000, max: number = 50000000): number {
  return Math.floor(Math.random() * (max - min)) + min
}

/**
 * Generate wilaya code (Algerian province)
 */
export function generateWilayaCode(): string {
  const code = Math.floor(Math.random() * 58) + 1
  return code.toString().padStart(2, '0')
}

// ============================================
// EXPORTED TEST HELPERS OBJECT
// ============================================

export const testHelpers = {
  createTestOrder,
  createTestOrders,
  generateTestCardNumber,
  validateCardLuhn,
  formatCardNumber,
  detectCardType,
  generateTestCryptoAddress,
  mockStripeWebhook,
  mockStripeSignature,
  mockSatimCallback,
  mockCryptoWebhook,
  waitForPaymentStatus,
  assertPaymentSuccess,
  assertRefundProcessed,
  assertTVACalculation,
  assertConversionAccuracy,
  assertInstallmentScheduleValidity,
  runConcurrentRequests,
  generateAlgerianPhone,
  generateTestEmail,
  generateDZDAmount,
  generateWilayaCode,
}

// Default export
export default testHelpers
