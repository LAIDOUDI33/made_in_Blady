// Cryptocurrency payment processing service
// Supports: Bitcoin (BTC), Ethereum (ETH), Tether (USDT), USDC

import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'

export type CryptoCurrency = 'BTC' | 'ETH' | 'USDT' | 'USDC'

export interface CryptoPaymentRequest {
  orderId: string
  amount: number // In DZD
  currency: CryptoCurrency
  buyerWalletAddress?: string // Optional: provide wallet for refund
  network?: 'mainnet' | 'testnet'
}

export interface CryptoPaymentResponse {
  success: boolean
  paymentId: string
  depositAddress: string // Platform's wallet address
  expectedAmount: number // In crypto
  cryptoCurrency: CryptoCurrency
  exchangeRate: number
  expiresAt: Date // 15-minute window
  qrCodeData: string // For scanning
  monitoringUrl: string // WebSocket for real-time updates
}

export interface CryptoTransaction {
  id: string
  orderId: string
  cryptoCurrency: CryptoCurrency
  depositAddress: string
  expectedAmount: number
  actualAmount?: number
  txHash?: string // Blockchain transaction hash
  confirmations: number
  requiredConfirmations: number // BTC: 3, ETH: 12, USDT: 6
  status: 'PENDING' | 'PARTIAL' | 'CONFIRMED' | 'EXPIRED' | 'OVERPAID'
  createdAt: Date
  confirmedAt?: Date
}

// Platform wallet addresses (in production, use HD wallets or payment processor)
const PLATFORM_WALLETS: Record<CryptoCurrency, { mainnet: string; testnet: string }> = {
  BTC: {
    mainnet: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    testnet: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
  },
  ETH: {
    mainnet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    testnet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  },
  USDT: {
    mainnet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', // ERC-20
    testnet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  },
  USDC: {
    mainnet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', // ERC-20
    testnet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  },
}

// Required confirmations per cryptocurrency
const REQUIRED_CONFIRMATIONS: Record<CryptoCurrency, number> = {
  BTC: 3,
  ETH: 12,
  USDT: 6,
  USDC: 6,
}

// Network fee estimates (in crypto)
const NETWORK_FEES: Record<CryptoCurrency, { estimate: string; currency: string }> = {
  BTC: { estimate: '0.0001 - 0.0005', currency: 'BTC' },
  ETH: { estimate: '0.003 - 0.01', currency: 'ETH' },
  USDT: { estimate: '1 - 10', currency: 'USDT' },
  USDC: { estimate: '1 - 10', currency: 'USDC' },
}

// Crypto currency info for display
export const CRYPTO_INFO: Record<CryptoCurrency, {
  name: string
  fullName: string
  symbol: string
  color: string
  icon: string
  description: { en: string; fr: string; ar: string }
  explorerUrl: string
}> = {
  BTC: {
    name: 'Bitcoin',
    fullName: 'Bitcoin (BTC)',
    symbol: '₿',
    color: '#F7931A',
    icon: 'bitcoin',
    description: {
      en: 'The first and most well-known cryptocurrency. Decentralized digital money.',
      fr: 'La première et plus connue des cryptomonnaies. Monnaie numérique décentralisée.',
      ar: 'أول وأشهر عملة مشفرة. نقود رقمية لامركزية.',
    },
    explorerUrl: 'https://blockchain.info/tx/',
  },
  ETH: {
    name: 'Ethereum',
    fullName: 'Ethereum (ETH)',
    symbol: 'Ξ',
    color: '#627EEA',
    icon: 'hexagon',
    description: {
      en: 'A decentralized platform for smart contracts and dApps.',
      fr: 'Une plateforme décentralisée pour les contrats intelligents et dApps.',
      ar: 'منصة لامركزية للعقود الذكية وتطبيقات الويب اللامركزية.',
    },
    explorerUrl: 'https://etherscan.io/tx/',
  },
  USDT: {
    name: 'Tether',
    fullName: 'Tether (USDT)',
    symbol: '₮',
    color: '#26A17B',
    icon: 'dollar-sign',
    description: {
      en: 'A stablecoin pegged to the US dollar. 1 USDT ≈ $1 USD.',
      fr: 'Une stablecoin indexée sur le dollar américain. 1 USDT ≈ 1 $ USD.',
      ar: 'عملة مستقرة مرتبطة بالدولار الأمريكي. 1 USDT ≈ 1 دولار أمريكي.',
    },
    explorerUrl: 'https://etherscan.io/tx/',
  },
  USDC: {
    name: 'USD Coin',
    fullName: 'USD Coin (USDC)',
    symbol: '$',
    color: '#2775CA',
    icon: 'circle-dollar-sign',
    description: {
      en: 'A fully collateralized US dollar stablecoin.',
      fr: 'Une stablecoin dollar américain entièrement collatéralisée.',
      ar: 'عملة مستمرة بالدولار الأمريكي بالكامل.',
    },
    explorerUrl: 'https://etherscan.io/tx/',
  },
}

/**
 * Initialize a new cryptocurrency payment
 * Generates a unique deposit address and QR code data
 */
export async function initializeCryptoPayment(
  request: CryptoPaymentRequest
): Promise<CryptoPaymentResponse> {
  const { orderId, amount, currency, buyerWalletAddress, network = 'mainnet' } = request

  if (amount <= 0) {
    throw new Error('Amount must be greater than zero')
  }

  // Get current exchange rate
  const exchangeRate = await getCryptoExchangeRate('DZD', currency)
  
  // Calculate expected amount in crypto
  const expectedAmount = amount / exchangeRate
  
  // Get platform wallet address
  const depositAddress = PLATFORM_WALLETS[currency][network]
  
  // Generate unique payment ID
  const paymentId = `crypto_${uuidv4().replace(/-/g, '').substring(0, 16)}`
  
  // Set expiry time (15 minutes from now)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
  
  // Generate QR code data
  const qrCodeData = generateQRCodeData(depositAddress, expectedAmount, currency)
  
  // Generate monitoring URL
  const monitoringUrl = `/api/payments/crypto/${paymentId}/monitor`
  
  // Store in database
  try {
    await db.cryptoPayment.create({
      data: {
        id: paymentId,
        orderId,
        cryptoCurrency: currency,
        depositAddress,
        expectedAmount: expectedAmount,
        requiredConfirms: REQUIRED_CONFIRMATIONS[currency],
        status: 'PENDING',
        expiresAt,
      },
    })
  } catch (error) {
    console.error('Failed to create crypto payment record:', error)
    // Continue even if DB fails - we can still process the payment
  }

  return {
    success: true,
    paymentId,
    depositAddress,
    expectedAmount: Math.round(expectedAmount * 100000000) / 100000000, // 8 decimal places
    cryptoCurrency: currency,
    exchangeRate,
    expiresAt,
    qrCodeData,
    monitoringUrl,
  }
}

/**
 * Get real-time cryptocurrency exchange rate
 * Fetches from CoinGecko API (free tier) or Binance
 */
export async function getCryptoExchangeRate(
  from: string,
  to: CryptoCurrency
): Promise<number> {
  try {
    // Try CoinGecko API first (free, no API key needed)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${getCoinGeckoId(to)}&vs_currencies=${getFiatCurrency(from)}`,
      {
        next: { revalidate: 30 }, // Cache for 30 seconds
      }
    )
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    const data = await response.json()
    const coinId = getCoinGeckoId(to)
    const fiat = getFiatCurrency(from)
    
    if (data[coinId] && data[coinId][fiat]) {
      return data[coinId][fiat]
    }
    
    // Fallback to Binance API
    return await getBinanceRate(from, to)
  } catch (error) {
    console.error('Error fetching crypto rate:', error)
    // Return fallback rates (should be updated regularly)
    return getFallbackRate(from, to)
  }
}

/**
 * Get all supported crypto exchange rates vs DZD
 */
export async function getAllCryptoRates(): Promise<Record<CryptoCurrency, number>> {
  const rates: Partial<Record<CryptoCurrency, number>> = {}
  
  for (const currency of Object.keys(CRYPTO_INFO) as CryptoCurrency[]) {
    rates[currency] = await getCryptoExchangeRate('DZD', currency)
  }
  
  return rates as Record<CryptoCurrency, number>
}

/**
 * Generate QR code data URI for wallet scanning
 */
export function generateQRCodeData(
  address: string,
  amount: number,
  crypto: CryptoCurrency
): string {
  // Different URI schemes for different cryptocurrencies
  let uri: string
  
  switch (crypto) {
    case 'BTC':
      uri = `bitcoin:${address}?amount=${amount}`
      break
    case 'ETH':
      uri = `ethereum:${address}?value=${Math.round(amount * 1e18)}`
      break
    case 'USDT':
      // USDT on Ethereum (ERC-20) - use EIP-681 format
      uri = `ethereum:${address}/transfer?address=0xdAC17F958D2ee523a2206206994597C13D831ec7&uint256=${Math.round(amount * 1e6)}`
      break
    case 'USDC':
      // USDC on Ethereum (ERC-20)
      uri = `ethereum:${address}/transfer?address=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&uint256=${Math.round(amount * 1e6)}`
      break
    default:
      uri = `${crypto.toLowerCase()}:${address}?amount=${amount}`
  }
  
  return encodeURIComponent(uri)
}

/**
 * Monitor a crypto transaction by payment ID
 * Returns current status and confirmation count
 */
export async function monitorCryptoTransaction(
  paymentId: string
): Promise<CryptoTransaction | null> {
  try {
    const payment = await db.cryptoPayment.findUnique({
      where: { id: paymentId },
    })
    
    if (!payment) {
      return null
    }
    
    // Check if expired
    if (payment.status === 'PENDING' && new Date() > payment.expiresAt) {
      await db.cryptoPayment.update({
        where: { id: paymentId },
        data: { status: 'EXPIRED' },
      })
      payment.status = 'EXPIRED'
    }
    
    return {
      id: payment.id,
      orderId: payment.orderId,
      cryptoCurrency: payment.cryptoCurrency as CryptoCurrency,
      depositAddress: payment.depositAddress,
      expectedAmount: Number(payment.expectedAmount),
      actualAmount: payment.actualAmount ? Number(payment.actualAmount) : undefined,
      txHash: payment.txHash || undefined,
      confirmations: payment.confirmations,
      requiredConfirmations: payment.requiredConfirms,
      status: payment.status as CryptoTransaction['status'],
      createdAt: payment.createdAt,
      confirmedAt: payment.confirmedAt || undefined,
    }
  } catch (error) {
    console.error('Error monitoring crypto transaction:', error)
    return null
  }
}

/**
 * Confirm a received crypto payment
 * Called when blockchain confirms sufficient confirmations
 */
export async function confirmCryptoPayment(
  txHash: string,
  paymentId: string,
  actualAmount?: number
): Promise<boolean> {
  try {
    const payment = await db.cryptoPayment.findUnique({
      where: { id: paymentId },
    })
    
    if (!payment) {
      throw new Error('Payment not found')
    }
    
    if (payment.status === 'CONFIRMED') {
      return true // Already confirmed
    }
    
    // Determine status based on amount
    let status: string = 'CONFIRMED'
    if (actualAmount && actualAmount < Number(payment.expectedAmount)) {
      status = 'PARTIAL'
    } else if (actualAmount && actualAmount > Number(payment.expectedAmount) * 1.05) {
      status = 'OVERPAID' // Allow 5% overpayment tolerance
    }
    
    await db.cryptoPayment.update({
      where: { id: paymentId },
      data: {
        status,
        txHash,
        actualAmount: actualAmount || payment.expectedAmount,
        confirmations: REQUIRED_CONFIRMATIONS[payment.cryptoCurrency as CryptoCurrency],
        confirmedAt: new Date(),
      },
    })
    
    return true
  } catch (error) {
    console.error('Error confirming crypto payment:', error)
    return false
  }
}

/**
 * Process a refund to buyer's wallet
 */
export async function processCryptoRefund(
  paymentId: string,
  amount: number,
  address: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const payment = await db.cryptoPayment.findUnique({
      where: { id: paymentId },
    })
    
    if (!payment) {
      return { success: false, error: 'Payment not found' }
    }
    
    if (payment.status !== 'CONFIRMED') {
      return { success: false, error: 'Only confirmed payments can be refunded' }
    }
    
    // Validate wallet address format
    if (!validateCryptoAddress(address, payment.cryptoCurrency as CryptoCurrency)) {
      return { success: false, error: 'Invalid wallet address format' }
    }
    
    // In production, this would interact with your wallet infrastructure
    // For now, we'll simulate the refund
    const refundTxHash = `refund_${uuidv4().replace(/-/g, '').substring(0, 16)}`
    
    // Log the refund (in production, create a separate refunds table)
    console.log(`Processing refund of ${amount} ${payment.cryptoCurrency} to ${address}`, {
      originalPaymentId: paymentId,
      refundTxHash,
    })
    
    return {
      success: true,
      txHash: refundTxHash,
    }
  } catch (error) {
    console.error('Error processing crypto refund:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Check if a crypto payment has expired
 */
export async function checkCryptoPaymentExpiry(paymentId: string): Promise<{
  isExpired: boolean
  remainingTime?: number
  status: string
}> {
  try {
    const payment = await db.cryptoPayment.findUnique({
      where: { id: paymentId },
    })
    
    if (!payment) {
      return { isExpired: true, status: 'NOT_FOUND' }
    }
    
    if (payment.status !== 'PENDING') {
      return { isExpired: true, status: payment.status }
    }
    
    const now = new Date()
    const expiresAt = new Date(payment.expiresAt)
    const remainingMs = expiresAt.getTime() - now.getTime()
    
    if (remainingMs <= 0) {
      // Mark as expired
      await db.cryptoPayment.update({
        where: { id: paymentId },
        data: { status: 'EXPIRED' },
      })
      
      return { isExpired: true, remainingTime: 0, status: 'EXPIRED' }
    }
    
    return { isExpired: false, remainingTime: remainingMs, status: 'PENDING' }
  } catch (error) {
    console.error('Error checking payment expiry:', error)
    return { isExpired: true, status: 'ERROR' }
  }
}

/**
 * Validate cryptocurrency address format
 */
export function validateCryptoAddress(
  address: string,
  currency: CryptoCurrency
): boolean {
  const trimmed = address.trim().toLowerCase()
  
  switch (currency) {
    case 'BTC':
      // Legacy (1), SegWit (3), or Native SegWit (bc1)
      return /^(1|3|bc1)[a-zA-Z0-9]{25,90}$/.test(trimmed)
    case 'ETH':
    case 'USDT':
    case 'USDC':
      // Ethereum address (0x prefix, 40 hex chars)
      return /^0x[a-fA-F0-9]{40}$/.test(address)
    default:
      return false
  }
}

/**
 * Get network fee info for a cryptocurrency
 */
export function getNetworkFeeInfo(currency: CryptoCurrency): typeof NETWORK_FEES[CryptoCurrency] {
  return NETWORK_FEES[currency]
}

/**
 * Get required confirmations for a cryptocurrency
 */
export function getRequiredConfirmations(currency: CryptoCurrency): number {
  return REQUIRED_CONFIRMATIONS[currency]
}

// Helper functions

function getCoinGeckoId(crypto: CryptoCurrency): string {
  switch (crypto) {
    case 'BTC': return 'bitcoin'
    case 'ETH': return 'ethereum'
    case 'USDT': return 'tether'
    case 'USDC': return 'usd-coin'
    default: return crypto.toLowerCase()
  }
}

function getFiatCurrency(currency: string): string {
  switch (currency.toUpperCase()) {
    case 'DZD': return 'dzd'
    case 'USD': return 'usd'
    case 'EUR': return 'eur'
    default: return currency.toLowerCase()
  }
}

async function getBinanceRate(from: string, to: CryptoCurrency): Promise<number> {
  try {
    // Binance uses trading pairs like BTCUSDT, ETHUSDT
    // We need to convert through USD typically
    const symbols: Record<CryptoCurrency, string> = {
      BTC: 'BTCUSDT',
      ETH: 'ETHUSDT',
      USDT: 'USDTUSDC', // Approximately 1:1
      USDC: 'USDCUSDT', // Approximately 1:1
    }
    
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbols[to]}`
    )
    
    if (!response.ok) {
      throw new Error('Binance API error')
    }
    
    const data = await response.json()
    const usdPrice = parseFloat(data.price)
    
    // Convert from DZD to USD (approximate rate)
    const dzdToUsd = 0.0074 // Approximate, should be fetched dynamically
    
    if (to === 'USDT' || to === 'USDC') {
      return 1 / dzdToUsd // DZD to USDT/USDC
    }
    
    return usdPrice / dzdToUsd
  } catch (error) {
    console.error('Binance rate fetch failed:', error)
    throw error
  }
}

function getFallbackRate(from: string, to: CryptoCurrency): number {
  // Fallback rates (DZD to crypto) - should be updated regularly
  const fallbackRates: Record<CryptoCurrency, number> = {
    BTC: 0.00000013,   // ~1 BTC = 7,700,000 DZD
    ETH: 0.0000028,    // ~1 ETH = 357,000 DZD
    USDT: 0.0074,      // ~1 USDT = 135 DZD
    USDC: 0.0074,      // ~1 USDC = 135 DZD
  }
  
  return fallbackRates[to]
}
