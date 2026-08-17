// Blockchain Monitoring Service
// Polls blockchain APIs to track crypto transactions

import { db } from '@/lib/db'
import { CryptoCurrency, confirmCryptoPayment } from './crypto'

export interface BlockChainTx {
  txHash: string
  fromAddress: string
  toAddress: string
  amount: number
  confirmations: number
  timestamp: Date
  status: 'pending' | 'confirmed' | 'failed'
}

export interface MonitoringConfig {
  pollIntervalMs: number // How often to check (default: 30 seconds)
  maxRetries: number // Max retries before giving up
  alertThresholdDZD: number // Alert on large transactions (in DZD)
}

// Default configuration
const DEFAULT_CONFIG: MonitoringConfig = {
  pollIntervalMs: 30000, // 30 seconds
  maxRetries: 60, // 30 minutes max (60 * 30s)
  alertThresholdDZD: 1000000, // 1 million DZD
}

// Active monitors map
const activeMonitors = new Map<string, NodeJS.Timeout>()

// Blockchain API endpoints
const BLOCKCHAIN_APIS = {
  BTC: {
    // Blockchain.info API for Bitcoin
    getAddress: (address: string) =>
      `https://blockchain.info/rawaddr/${address}?limit=10`,
    getTx: (txHash: string) =>
      `https://blockchain.info/rawtx/${txHash}`,
  },
  ETH: {
    // Etherscan API for Ethereum (and ERC-20 tokens like USDT/USDC)
    getAddress: (address: string, apiKey?: string) =>
      `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc${apiKey ? `&apikey=${apiKey}` : ''}`,
    getErc20Transfers: (address: string, contractAddress?: string, apiKey?: string) =>
      `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${contractAddress || ''}&address=${address}&page=1&offset=100&sort=desc${apiKey ? `&apikey=${apiKey}` : ''}`,
  },
}

/**
 * Start monitoring a payment for incoming transactions
 */
export function startMonitoring(
  paymentId: string,
  depositAddress: string,
  currency: CryptoCurrency,
  expectedAmount: number,
  config: Partial<MonitoringConfig> = {}
): void {
  // Stop existing monitor if any
  stopMonitoring(paymentId)

  const { pollIntervalMs, maxRetries, alertThresholdDZD } = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  let retryCount = 0

  const poll = async () => {
    try {
      retryCount++

      if (retryCount > maxRetries) {
        console.log(`Max retries reached for payment ${paymentId}`)
        stopMonitoring(paymentId)
        return
      }

      // Check payment status first
      const payment = await db.cryptoPayment.findUnique({
        where: { id: paymentId },
      })

      if (!payment || payment.status !== 'PENDING') {
        stopMonitoring(paymentId)
        return
      }

      // Check expiry
      if (new Date() > payment.expiresAt) {
        await db.cryptoPayment.update({
          where: { id: paymentId },
          data: { status: 'EXPIRED' },
        })
        stopMonitoring(paymentId)
        return
      }

      // Poll blockchain based on currency
      let transactions: BlockChainTx[] = []

      switch (currency) {
        case 'BTC':
          transactions = await pollBitcoinAddress(depositAddress)
          break
        case 'ETH':
          transactions = await pollEthereumAddress(depositAddress)
          break
        case 'USDT':
          transactions = await pollERC20Token(depositAddress, '0xdAC17F958D2ee523a2206206994597C13D831ec7')
          break
        case 'USDC':
          transactions = await pollERC20Token(depositAddress, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
          break
      }

      // Check for matching transaction
      for (const tx of transactions) {
        if (isMatchingTransaction(tx, expectedAmount, currency)) {
          // Found matching transaction!
          console.log(`Matching transaction found for payment ${paymentId}: ${tx.txHash}`)

          // Alert on large transactions
          const amountInDZD = convertCryptoToDZD(tx.amount, currency)
          if (amountInDZD >= alertThresholdDZD) {
            await alertLargeTransaction(paymentId, tx, amountInDZD)
          }

          // Update confirmations in DB
          await db.cryptoPayment.update({
            where: { id: paymentId },
            data: {
              confirmations: tx.confirmations,
              actualAmount: tx.amount,
              txHash: tx.txHash,
            },
          })

          // Auto-confirm if enough confirmations
          const requiredConfirms = getRequiredConfirmationsFor(currency)
          if (tx.confirmations >= requiredConfirms) {
            await confirmCryptoPayment(tx.txHash, paymentId, tx.amount)
            stopMonitoring(paymentId)
            return
          }
        }
      }

      // Reset retry count on successful poll
      retryCount = 0
    } catch (error) {
      console.error(`Error monitoring payment ${paymentId}:`, error)
    }
  }

  // Start polling
  const intervalId = setInterval(poll, pollIntervalMs)
  activeMonitors.set(paymentId, intervalId)

  // Initial poll
  poll()
}

/**
 * Stop monitoring a payment
 */
export function stopMonitoring(paymentId: string): void {
  const intervalId = activeMonitors.get(paymentId)
  if (intervalId) {
    clearInterval(intervalId)
    activeMonitors.delete(paymentId)
    console.log(`Stopped monitoring payment ${paymentId}`)
  }
}

/**
 * Get all currently monitored payments
 */
export function getActiveMonitors(): string[] {
  return Array.from(activeMonitors.keys())
}

/**
 * Poll Bitcoin address for recent transactions
 */
async function pollBitcoinAddress(address: string): Promise<BlockChainTx[]> {
  try {
    const response = await fetch(BLOCKCHAIN_APIS.BTC.getAddress(address))
    
    if (!response.ok) {
      throw new Error(`Blockchain.info error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.txs) {
      return []
    }
    
    return data.txs.map((tx: Record<string, unknown>) => {
      // Type assertions for Bitcoin transaction structure
      const inputs = tx.inputs as Array<Record<string, unknown>> | undefined
      const outs = tx.out as Array<Record<string, unknown>> | undefined
      const firstInput = inputs?.[0]
      const prevOut = firstInput?.prev_out as Record<string, unknown> | undefined
      const firstOut = outs?.[0]
      
      return {
        txHash: tx.hash as string,
        fromAddress: (prevOut?.addr as string) || '',
        toAddress: (firstOut?.addr as string) || '',
        amount: firstOut?.value 
          ? Number(firstOut.value) / 1e8 // Convert satoshis to BTC
          : 0,
        confirmations: tx.block_height ? Math.max(0, data.height - tx.block_height + 1) : 0,
        timestamp: new Date((tx.time as number) * 1000),
        status: tx.block_height ? 'confirmed' as const : 'pending' as const,
      }
    })
  } catch (error) {
    console.error('Error polling Bitcoin address:', error)
    return []
  }
}

/**
 * Poll Ethereum address for recent transactions
 */
async function pollEthereumAddress(address: string): Promise<BlockChainTx[]> {
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY
    const response = await fetch(BLOCKCHAIN_APIS.ETH.getAddress(address, apiKey))
    
    if (!response.ok) {
      throw new Error(`Etherscan error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status !== '1' || !data.result) {
      return []
    }
    
    return data.result
      .filter((tx: Record<string, unknown>) => {
        // Only look for incoming transactions (to our address)
        return tx.to?.toLowerCase() === address.toLowerCase() && 
               tx.value !== '0' && // Not a contract interaction
               tx.isError === '0' // Successful transaction
      })
      .map((tx: Record<string, unknown>) => ({
        txHash: tx.hash as string,
        fromAddress: tx.from as string,
        toAddress: tx.to as string,
        amount: parseInt(tx.value as string, 16) / 1e18, // Convert Wei to ETH
        confirmations: parseInt(tx.confirmations as string, 10),
        timestamp: new Date(parseInt(tx.timeStamp as string, 10) * 1000),
        status: 'confirmed' as const,
      }))
  } catch (error) {
    console.error('Error polling Ethereum address:', error)
    return []
  }
}

/**
 * Poll ERC-20 token transfers (USDT, USDC)
 */
async function pollERC20Token(
  address: string,
  contractAddress: string
): Promise<BlockChainTx[]> {
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY
    const response = await fetch(
      BLOCKCHAIN_APIS.ETH.getErc20Transfers(address, contractAddress, apiKey)
    )
    
    if (!response.ok) {
      throw new Error(`Etherscan ERC-20 error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status !== '1' || !data.result) {
      return []
    }
    
    // Determine token decimals (USDT and USDC are both 6 decimals)
    const tokenDecimals = 6
    
    return data.result
      .filter((tx: Record<string, unknown>) => {
        // Only look for incoming transfers (to our address)
        return tx.to?.toLowerCase() === address.toLowerCase()
      })
      .map((tx: Record<string, unknown>) => ({
        txHash: tx.hash as string,
        fromAddress: tx.from as string,
        toAddress: tx.to as string,
        amount: parseInt(tx.value as string, 10) / Math.pow(10, tokenDecimals),
        confirmations: parseInt(tx.confirmations as string, 10),
        timestamp: new Date(parseInt(tx.timeStamp as string, 10) * 1000),
        status: 'confirmed' as const,
      }))
  } catch (error) {
    console.error('Error polling ERC-20 transfers:', error)
    return []
  }
}

/**
 * Check if a transaction matches our expected payment
 * Allows for small variance (±2%)
 */
function isMatchingTransaction(
  tx: BlockChainTx,
  expectedAmount: number,
  currency: CryptoCurrency
): boolean {
  const tolerance = 0.02 // 2% tolerance
  
  const lowerBound = expectedAmount * (1 - tolerance)
  const upperBound = expectedAmount * (1 + tolerance)
  
  return tx.amount >= lowerBound && tx.amount <= upperBound
}

/**
 * Get required confirmations for a cryptocurrency
 */
function getRequiredConfirmationsFor(currency: CryptoCurrency): number {
  switch (currency) {
    case 'BTC': return 3
    case 'ETH': return 12
    case 'USDT': return 6
    case 'USDC': return 6
    default: return 3
  }
}

/**
 * Convert crypto amount to DZD (approximate)
 */
function convertCryptoToDZD(amount: number, currency: CryptoCurrency): number {
  // Approximate conversion rates (should use real-time rates in production)
  const rates: Record<CryptoCurrency, number> = {
    BTC: 7700000,   // ~1 BTC ≈ 7.7M DZD
    ETH: 357000,    // ~1 ETH ≈ 357K DZD
    USDT: 135,      // ~1 USDT ≈ 135 DZD
    USDC: 135,      // ~1 USDC ≈ 135 DZD
  }
  
  return amount * rates[currency]
}

/**
 * Alert on suspicious/large transactions
 */
async function alertLargeTransaction(
  paymentId: string,
  tx: BlockChainTx,
  amountInDZD: number
): Promise<void> {
  console.warn(`🚨 LARGE TRANSACTION ALERT`, {
    paymentId,
    txHash: tx.txHash,
    amountInDZD: `${amountInDZD.toLocaleString()} DZD`,
    fromAddress: tx.fromAddress,
    timestamp: new Date().toISOString(),
  })

  // In production, this would:
  // 1. Send notification to admin team
  // 2. Log to security monitoring system
  // 3. Potentially hold the payment for manual review

  // For now, just log it
  // TODO: Integrate with notification service
}

/**
 * Get transaction details by hash
 */
export async function getTransactionDetails(
  txHash: string,
  currency: CryptoCurrency
): Promise<BlockChainTx | null> {
  try {
    switch (currency) {
      case 'BTC': {
        const response = await fetch(BLOCKCHAIN_APIS.BTC.getTx(txHash))
        if (!response.ok) return null
        const data = await response.json()
        return {
          txHash: data.hash,
          fromAddress: data.inputs[0]?.prev_out?.addr || '',
          toAddress: data.out[0]?.addr || '',
          amount: data.out[0]?.value ? data.out[0].value / 1e8 : 0,
          confirmations: data.block_height ? 999 : 0,
          timestamp: new Date(data.time * 1000),
          status: data.block_height ? 'confirmed' : 'pending',
        }
      }
      
      case 'ETH':
      case 'USDT':
      case 'USDC': {
        const apiKey = process.env.ETHERSCAN_API_KEY
        const response = await fetch(
          `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}${apiKey ? `&apikey=${apiKey}` : ''}`
        )
        if (!response.ok) return null
        const data = await response.json()
        if (!data.result) return null
        
        const tx = data.result
        return {
          txHash: tx.hash,
          fromAddress: tx.from,
          toAddress: tx.to,
          amount: parseInt(tx.value, 16) / 1e18,
          confirmations: 0, // Would need separate call
          timestamp: new Date(),
          status: 'pending',
        }
      }
      
      default:
        return null
    }
  } catch (error) {
    console.error('Error fetching transaction details:', error)
    return null
  }
}

/**
 * Cleanup all active monitors (for shutdown)
 */
export function cleanupAllMonitors(): void {
  for (const paymentId of activeMonitors.keys()) {
    stopMonitoring(paymentId)
  }
}
