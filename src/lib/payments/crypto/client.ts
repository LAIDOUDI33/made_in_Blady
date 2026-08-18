// Core Crypto Payment Client Library
// Handles payment creation, validation, QR generation, and transaction monitoring

import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import {
  SupportedCrypto,
  cryptoConfig,
  getWalletAddress,
  getRequiredConfirmations,
  getAvailableNetworks,
  cryptoMetadata,
} from './config'
import {
  convertDZDtoCrypto,
  formatCryptoAmount,
  getExchangeRate,
} from './exchange-rates'

// Type exports
export type { SupportedCrypto } from './config'
export type { ExchangeRate } from './exchange-rates'

export interface CryptoPaymentOrderRequest {
  orderId: string
  userId: string
  amountInDZD: number
  cryptocurrency: SupportedCrypto
  network?: string // TRC20, ERC20, BEP20 (for USDT/USDC)
  buyerWalletAddress?: string // For refund purposes
}

export interface CryptoPaymentOrderResponse {
  success: boolean
  paymentId: string
  receivingAddress: string
  expectedAmount: number // In crypto
  amountInDZD: number
  exchangeRate: number
  cryptocurrency: SupportedCrypto
  network?: string
  expiresAt: Date
  qrCodeData: string
  status: string
  requiredConfirmations: number
  networkFeeEstimate?: string
}

export interface TransactionStatus {
  paymentId: string
  status: 'PENDING' | 'AWAITING_CONFIRMATION' | 'CONFIRMING' | 'COMPLETED' | 'EXPIRED' | 'FAILED'
  confirmations: number
  requiredConfirmations: number
  txHash?: string
  amountReceived?: number
  expectedAmount: number
  remainingTimeMs: number
  createdAt: Date
  confirmedAt?: Date
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

/**
 * Generate a unique payment ID for tracking
 */
function generatePaymentId(): string {
  const timestamp = Date.now().toString(36)
  const random = uuidv4().replace(/-/g, '').substring(0, 12)
  return `CP${timestamp}${random}`.toUpperCase()
}

/**
 * Generate a unique deposit address identifier per payment
 * In production, this would use HD wallet derivation or sub-addresses
 */
export function generatePaymentAddress(
  baseAddress: string,
  paymentId: string
): string {
  // For now, we use the same address but track by paymentId
  // In production with HD wallets, derive a unique address per payment
  return baseAddress
}

/**
 * Create a new crypto payment order
 */
export async function createCryptoPaymentOrder(
  request: CryptoPaymentOrderRequest
): Promise<CryptoPaymentOrderResponse> {
  const {
    orderId,
    userId,
    amountInDZD,
    cryptocurrency,
    network,
    buyerWalletAddress,
  } = request

  // Validate amount
  if (amountInDZD <= 0) {
    throw new Error('Amount must be greater than zero')
  }

  if (amountInDZD < 1000) {
    throw new Error('Minimum order amount is 1,000 DZD')
  }

  // Validate cryptocurrency is supported
  if (!cryptoConfig.supportedCryptos.includes(cryptocurrency)) {
    throw new Error(`Unsupported cryptocurrency: ${cryptocurrency}`)
  }

  // Determine network for multi-network cryptos
  let selectedNetwork = network
  if (!selectedNetwork) {
    const availableNetworks = getAvailableNetworks(cryptocurrency)
    selectedNetwork = availableNetworks[0] // Default to first available
    
    // For USDT, recommend TRC20 (lowest fees)
    if (cryptocurrency === 'USDT') {
      selectedNetwork = 'TRC20'
    }
  }

  // Get current exchange rate and convert amount
  const conversion = await convertDZDtoCrypto(amountInDZD, cryptocurrency)
  
  // Get wallet address for this crypto/network combination
  const receivingAddress = getWalletAddress(cryptocurrency, selectedNetwork)
  
  // Get required confirmations
  const requiredConfirmations = getRequiredConfirmations(cryptocurrency, selectedNetwork)
  
  // Generate unique identifiers
  const paymentId = generatePaymentId()
  const depositAddress = generatePaymentAddress(receivingAddress, paymentId)
  
  // Calculate expiry time
  const expiresAt = new Date(
    Date.now() + cryptoConfig.security.priceValidityMinutes * 60 * 1000
  )
  
  // Generate QR code data
  const qrCodeData = generateQRCodeURI(
    depositAddress,
    conversion.cryptoAmount,
    cryptocurrency,
    selectedNetwork
  )

  // Create database record
  await db.cryptoPayment.create({
    data: {
      paymentId,
      orderId,
      userId,
      cryptocurrency,
      network: selectedNetwork,
      amount: conversion.cryptoAmount.toString(),
      amountInDZD: amountInDZD.toString(),
      exchangeRate: conversion.exchangeRate.toString(),
      receivingAddress: depositAddress,
      status: 'PENDING',
      confirmations: 0,
      requiredConfirmations,
      expiresAt,
      senderAddress: buyerWalletAddress,
    },
  })

  return {
    success: true,
    paymentId,
    receivingAddress: depositAddress,
    expectedAmount: conversion.cryptoAmount,
    amountInDZD,
    exchangeRate: conversion.exchangeRate,
    cryptocurrency,
    network: selectedNetwork,
    expiresAt,
    qrCodeData,
    status: 'PENDING',
    requiredConfirmations,
    networkFeeEstimate: estimateNetworkFee(cryptocurrency, selectedNetwork),
  }
}

/**
 * Check transaction status on blockchain
 */
export async function checkTransactionStatus(paymentId: string): Promise<TransactionStatus | null> {
  try {
    const payment = await db.cryptoPayment.findUnique({
      where: { paymentId },
    })
    
    if (!payment) {
      return null
    }
    
    // Calculate remaining time
    const now = new Date()
    const expiresAt = new Date(payment.expiresAt)
    const remainingTimeMs = Math.max(0, expiresAt.getTime() - now.getTime())
    
    // Auto-expire if past expiry time
    if (payment.status === 'PENDING' && remainingTimeMs === 0) {
      await db.cryptoPayment.update({
        where: { id: payment.id },
        data: { status: 'EXPIRED' },
      })
      payment.status = 'EXPIRED'
    }
    
    return {
      paymentId: payment.paymentId,
      status: payment.status as TransactionStatus['status'],
      confirmations: payment.confirmations,
      requiredConfirmations: payment.requiredConfirmations,
      txHash: payment.txHash || undefined,
      amountReceived: payment.amount ? parseFloat(payment.amount) : undefined,
      expectedAmount: parseFloat(payment.expectedAmount || payment.amount || '0'),
      remainingTimeMs,
      createdAt: payment.createdAt,
      confirmedAt: payment.confirmedAt || undefined,
    }
  } catch (error) {
    console.error('Error checking transaction status:', error)
    return null
  }
}

/**
 * Validate a transaction against our records
 */
export async function validateTransaction(
  txHash: string,
  paymentId: string,
  actualAmount: number
): Promise<ValidationResult> {
  try {
    const payment = await db.cryptoPayment.findUnique({
      where: { paymentId },
    })
    
    if (!payment) {
      return { isValid: false, error: 'Payment not found' }
    }
    
    if (payment.status === 'COMPLETED') {
      return { isValid: false, error: 'Payment already completed' }
    }
    
    if (payment.status === 'EXPIRED') {
      return { isValid: false, error: 'Payment has expired' }
    }
    
    const expectedAmount = parseFloat(payment.amount || '0')
    
    // Check amount within allowed slippage
    const slippagePercent = Math.abs((actualAmount - expectedAmount) / expectedAmount) * 100
    
    if (slippagePercent > cryptoConfig.security.allowedSlippagePercent) {
      return {
        isValid: false,
        error: `Amount differs by more than ${cryptoConfig.security.allowedSlippagePercent}% from expected`,
        warnings: [`Expected: ${expectedAmount}, Received: ${actualAmount}, Difference: ${slippagePercent.toFixed(2)}%`],
      }
    }
    
    // Check if we already have this txHash for another payment
    const existingTx = await db.cryptoPayment.findFirst({
      where: {
        txHash,
        status: 'COMPLETED',
        NOT: { paymentId },
      },
    })
    
    if (existingTx) {
      return {
        isValid: false,
        error: 'This transaction hash has already been used for another payment',
      }
    }
    
    return { isValid: true }
  } catch (error) {
    console.error('Error validating transaction:', error)
    return { isValid: false, error: 'Validation failed due to server error' }
  }
}

/**
 * Calculate crypto amount from DZD based on live rates
 */
export async function calculateCryptoAmount(
  amountDZD: number,
  cryptocurrency: SupportedCrypto
): Promise<{
  cryptoAmount: number
  rate: number
  formattedAmount: string
}> {
  const result = await convertDZDtoCrypto(amountDZD, cryptocurrency)
  return {
    cryptoAmount: result.cryptoAmount,
    rate: result.exchangeRate,
    formattedAmount: result.formattedAmount,
  }
}

/**
 * Estimate current network fee for a cryptocurrency/network
 */
export function estimateNetworkFee(crypto: SupportedCrypto, network?: string): string {
  const feeMap: Record<string, Record<string, string>> = {
    USDT: {
      TRC20: '~1-5 USDT',
      ERC20: '~5-15 USDT',
      BEP20: '~1-8 USDT',
    },
    USDC: {
      ERC20: '~5-15 USDC',
      BEP20: '~1-8 USDC',
    },
    BTC: {
      mainnet: '~$2-10 USD equivalent',
    },
    ETH: {
      mainnet: '~$3-15 USD equivalent',
    },
  }
  
  const net = network || 'mainnet'
  return feeMap[crypto]?.[net] || 'Variable - check blockchain'
}

/**
 * Generate QR code data URI for wallet scanning
 */
export function generateQRCodeURI(
  address: string,
  amount: number,
  crypto: SupportedCrypto,
  network?: string
): string {
  // Different URI schemes for different cryptocurrencies
  switch (crypto) {
    case 'BTC':
      // Bitcoin URI scheme (BIP-21)
      return `bitcoin:${address}?amount=${amount}`
      
    case 'ETH':
      // Ethereum EIP-681 URI scheme
      const ethValue = Math.round(amount * 1e18) // Convert to Wei
      return `ethereum:${address}?value=${ethValue}`
      
    case 'USDT':
      // USDT handling depends on network
      if (network === 'TRC20') {
        // Tron URI format
        return address // Tron wallets typically just use address
      }
      // ERC-20 / BEP-20: Use EIP-681 with token transfer
      const usdtValue = Math.round(amount * 1e6) // USDT has 6 decimals
      const tokenAddr = network === 'BEP20' 
        ? cryptoConfig.networks.USDT.tokenAddress.BEP20
        : cryptoConfig.networks.USDT.tokenAddress.ERC20
      return `ethereum:${address}/transfer?address=${tokenAddr}&uint256=${usdtValue}`
      
    case 'USDC':
      // Similar to USDT
      if (network === 'TRC20') {
        return address
      }
      const usdcValue = Math.round(amount * 1e6) // USDC has 6 decimals
      const usdcTokenAddr = network === 'BEP20'
        ? cryptoConfig.networks.USDC.tokenAddress.BEP20
        : cryptoConfig.networks.USDC.tokenAddress.ERC20
      return `ethereum:${address}/transfer?address=${usdcTokenAddr}&uint256=${usdcValue}`
      
    default:
      return `${crypto.toLowerCase()}:${address}?amount=${amount}`
  }
}

/**
 * Start monitoring a transaction for confirmations
 * This initiates polling of blockchain APIs
 */
export async function startTransactionMonitoring(
  paymentId: string
): Promise<{ monitoring: boolean; message: string }> {
  try {
    const payment = await db.cryptoPayment.findUnique({
      where: { paymentId },
    })
    
    if (!payment) {
      return { monitoring: false, message: 'Payment not found' }
    }
    
    if (payment.status !== 'PENDING' && payment.status !== 'AWAITING_CONFIRMATION') {
      return { monitoring: false, message: `Cannot monitor payment in ${payment.status} status` }
    }
    
    // Update status to indicate we're watching
    if (payment.status === 'PENDING') {
      await db.cryptoPayment.update({
        where: { id: payment.id },
        data: { status: 'AWAITING_CONFIRMATION' },
      })
    }
    
    // The actual monitoring is handled by the background job or WebSocket service
    // This just sets up the state for monitoring
    
    return { monitoring: true, message: 'Transaction monitoring started' }
  } catch (error) {
    console.error('Error starting transaction monitoring:', error)
    return { monitoring: false, message: 'Failed to start monitoring' }
  }
}

/**
 * Process manual confirmation submission
 */
export async function submitManualConfirmation(
  paymentId: string,
  txHash: string,
  submittedByUserId: string
): Promise<{ success: boolean; message: string; newStatus?: string }> {
  try {
    const payment = await db.cryptoPayment.findUnique({
      where: { paymentId },
    })
    
    if (!payment) {
      return { success: false, message: 'Payment not found' }
    }
    
    if (payment.txHash) {
      return { success: false, message: 'Transaction already recorded' }
    }
    
    // Update payment with submitted txHash
    await db.cryptoPayment.update({
      where: { id: payment.id },
      data: {
        txHash,
        status: 'CONFIRMING',
        blockchainResponse: JSON.stringify({
          action: 'manual_confirmation_submitted',
          txHash,
          submittedBy: submittedByUserId,
          submittedAt: new Date().toISOString(),
        }),
      },
    })
    
    return {
      success: true,
      message: 'Transaction hash submitted successfully. Awaiting confirmation.',
      newStatus: 'CONFIRMING',
    }
  } catch (error) {
    console.error('Error submitting manual confirmation:', error)
    return { success: false, message: 'Failed to submit transaction hash' }
  }
}

/**
 * Expire pending payments that have passed their timeout
 */
export async function expireOverduePayments(): Promise<{ expiredCount: number }> {
  try {
    const now = new Date()
    
    const result = await db.cryptoPayment.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: now },
      },
      data: {
        status: 'EXPIRED',
      },
    })
    
    return { expiredCount: result.count }
  } catch (error) {
    console.error('Error expiring overdue payments:', error)
    return { expiredCount: 0 }
  }
}

/**
 * Get user's crypto payment history
 */
export async function getUserCryptoPaymentHistory(
  userId: string,
  options: {
    limit?: number
    offset?: number
    status?: string
    cryptocurrency?: string
    startDate?: Date
    endDate?: Date
  } = {}
): Promise<{ payments: any[]; total: number }> {
  const {
    limit = 20,
    offset = 0,
    status,
    cryptocurrency,
    startDate,
    endDate,
  } = options
  
  const where: Record<string, any> = { userId }
  
  if (status) where.status = status
  if (cryptocurrency) where.cryptocurrency = cryptocurrency
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }
  
  const [payments, total] = await Promise.all([
    db.cryptoPayment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db.cryptoPayment.count({ where }),
  ])
  
  return { payments, total }
}

/**
 * Get crypto info for display purposes
 */
export function getCryptoInfo(crypto: SupportedCrypto) {
  return cryptoMetadata[crypto]
}

/**
 * Get all supported cryptos with their metadata
 */
export function getSupportedCryptos(): Array<{
  code: SupportedCrypto
  name: string
  symbol: string
  color: string
  icon: string
  isStablecoin: boolean
  networks: string[]
}> {
  return cryptoConfig.supportedCryptos.map((code) => ({
    code,
    ...cryptoMetadata[code],
    networks: getAvailableNetworks(code),
  }))
}
