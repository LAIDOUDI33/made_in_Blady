// Enhanced Blockchain Monitoring Service
// Supports multiple blockchain networks: Bitcoin, Ethereum (ERC-20), BSC (BEP-20), Tron (TRC-20)

import { db } from '@/lib/db'
import { cryptoConfig, SupportedCrypto } from './config'

export interface BlockchainTransaction {
  txHash: string
  fromAddress: string
  toAddress: string
  amount: number
  confirmations: number
  timestamp: Date
  status: 'pending' | 'confirmed' | 'failed'
  blockNumber?: number
}

export interface MonitorConfig {
  pollIntervalMs: number
  maxRetries: number
  alertThresholdDZD: number
}

// Default configuration
const DEFAULT_CONFIG: MonitorConfig = {
  pollIntervalMs: 30000, // 30 seconds
  maxRetries: 240, // 2 hours max (240 * 30s)
  alertThresholdDZD: 1000000, // 1 million DZD
}

// Active monitors storage
const activeMonitors = new Map<string, {
  intervalId: NodeJS.Timeout
  retryCount: number
  startTime: number
  config: MonitorConfig
}>()

// Blockchain API configurations
const BLOCKCHAIN_APIS = {
  // Bitcoin - blockchain.info
  BTC: {
    getAddressUrl: (address: string) =>
      `https://blockchain.info/rawaddr/${address}?limit=10`,
    getTxUrl: (txHash: string) =>
      `https://blockchain.info/rawtx/${txHash}`,
  },
  
  // Ethereum/Etherscan - for ETH and ERC-20 tokens
  ETHEREUM: {
    baseUrl: 'https://api.etherscan.io/api',
    getApiKey: () => process.env.ETHERSCAN_API_KEY,
    
    // Get normal ETH transactions
    getAddressTxs: (address: string) => {
      const apiKey = process.env.ETHERSCAN_API_KEY
      return `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc${apiKey ? `&apikey=${apiKey}` : ''}`
    },
    
    // Get ERC-20 token transfers
    getTokenTransfers: (address: string, contractAddress?: string) => {
      const apiKey = process.env.ETHERSCAN_API_KEY
      return `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${contractAddress || ''}&address=${address}&page=1&offset=100&sort=desc${apiKey ? `&apikey=${apiKey}` : ''}`
    },
  },
  
  // BSC/BscScan - for BEP-20 tokens
  BSC: {
    baseUrl: 'https://api.bscscan.com/api',
    getApiKey: () => process.env.BSCSCAN_API_KEY,
    
    getTokenTransfers: (address: string, contractAddress?: string) => {
      const apiKey = process.env.BSCSCAN_API_KEY
      return `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${contractAddress || ''}&address=${address}&page=1&offset=100&sort=desc${apiKey ? `&apikey=${apiKey}` : ''}`
    },
  },
  
  // TRON/Tronscan - for TRC-20 tokens (USDT on Tron)
  TRON: {
    baseUrl: 'https://apilist.tronscan.org/api',
    
    // Get TRC-20 token transfers
    getTokenTransfers: (address: string, token?: string) => {
      return `https://apilist.tronscan.org/api/token_trc20/transfers?address=${address}&limit=10&start=0&to_address=true${token ? `&token=${token}` : ''}`
    },
    
    // Get transaction info
    getTxInfo: (txHash: string) =>
      `https://apilist.tronscan.org/api/transaction-info?hash=${txHash}`,
  },
}

/**
 * Start monitoring a crypto payment for incoming transactions
 */
export function startMonitoring(
  paymentId: string,
  address: string,
  crypto: SupportedCrypto,
  expectedAmount: number,
  network?: string,
  config: Partial<MonitorConfig> = {}
): void {
  // Stop existing monitor if running
  stopMonitoring(paymentId)
  
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  
  const monitorData = {
    intervalId: null as unknown as NodeJS.Timeout,
    retryCount: 0,
    startTime: Date.now(),
    config: fullConfig,
  }
  
  const poll = async () => {
    try {
      monitorData.retryCount++
      
      // Check max retries
      if (monitorData.retryCount > fullConfig.maxRetries) {
        console.log(`Max retries reached for payment ${paymentId}`)
        await markPaymentFailed(paymentId, 'Monitoring timeout exceeded')
        stopMonitoring(paymentId)
        return
      }
      
      // Get payment from DB
      const payment = await db.cryptoPayment.findUnique({
        where: { paymentId },
      })
      
      if (!payment || !['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMING'].includes(payment.status)) {
        stopMonitoring(paymentId)
        return
      }
      
      // Check expiry
      if (new Date() > payment.expiresAt && payment.status === 'PENDING') {
        await db.cryptoPayment.update({
          where: { id: payment.id },
          data: { status: 'EXPIRED' },
        })
        stopMonitoring(paymentId)
        return
      }
      
      // Poll appropriate blockchain based on crypto and network
      let transactions: BlockchainTransaction[] = []
      
      switch (crypto) {
        case 'BTC':
          transactions = await pollBitcoin(address)
          break
        case 'ETH':
          transactions = await pollEthereum(address)
          break
        case 'USDT':
          transactions = await pollUSDT(address, network)
          break
        case 'USDC':
          transactions = await pollUSDC(address, network)
          break
      }
      
      // Look for matching transaction
      for (const tx of transactions) {
        if (isMatchingTransaction(tx, expectedAmount, crypto)) {
          console.log(`Matching transaction found for ${paymentId}: ${tx.txHash}`)
          
          // Alert on large transactions
          const amountInDZD = estimateDZDEquivalent(tx.amount, crypto)
          if (amountInDZD >= fullConfig.alertThresholdDZD) {
            await alertLargeTransaction(paymentId, tx, amountInDZD)
          }
          
          // Update payment record
          await updatePaymentWithTx(paymentId, tx)
          
          // Check if confirmations are sufficient
          const requiredConfirms = getRequiredConfirmationsFor(crypto, network)
          if (tx.confirmations >= requiredConfirms) {
            await completePayment(paymentId, tx.txHash)
            stopMonitoring(paymentId)
            return
          }
          
          // Update status to CONFIRMING if not already
          if (payment.status !== 'CONFIRMING') {
            await db.cryptoPayment.update({
              where: { id: payment.id },
              data: { status: 'CONFIRMING' },
            })
          }
        }
      }
      
      // Reset retry count on successful poll
      monitorData.retryCount = 0
      
    } catch (error) {
      console.error(`Error monitoring payment ${paymentId}:`, error)
    }
  }
  
  // Start polling interval
  monitorData.intervalId = setInterval(poll, fullConfig.pollIntervalMs)
  activeMonitors.set(paymentId, monitorData as typeof activeMonitors extends Map<string, infer T> ? T : never)
  
  // Initial poll immediately
  poll()
}

/**
 * Stop monitoring a specific payment
 */
export function stopMonitoring(paymentId: string): void {
  const monitor = activeMonitors.get(paymentId)
  if (monitor) {
    clearInterval(monitor.intervalId)
    activeMonitors.delete(paymentId)
    console.log(`Stopped monitoring payment ${paymentId}`)
  }
}

/**
 * Get list of actively monitored payment IDs
 */
export function getActiveMonitorIds(): string[] {
  return Array.from(activeMonitors.keys())
}

/**
 * Cleanup all monitors (for server shutdown)
 */
export function cleanupAllMonitors(): void {
  for (const paymentId of activeMonitors.keys()) {
    stopMonitoring(paymentId)
  }
}

// ============================================
// BLOCKCHAIN-SPECIFIC POLLING FUNCTIONS
// ============================================

/**
 * Poll Bitcoin blockchain via blockchain.info
 */
async function pollBitcoin(address: string): Promise<BlockchainTransaction[]> {
  try {
    const response = await fetch(BLOCKCHAIN_APIS.BTC.getAddressUrl(address))
    
    if (!response.ok) {
      throw new Error(`Blockchain.info error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.txs || !Array.isArray(data.txs)) {
      return []
    }
    
    return data.txs.map((tx: Record<string, any>) => {
      const inputs = tx.inputs || []
      const outs = tx.out || []
      const firstInput = inputs[0]
      const prevOut = firstInput?.prev_out || {}
      const firstOut = outs[0] || {}
      
      return {
        txHash: tx.hash,
        fromAddress: prevOut.addr || '',
        toAddress: firstOut.addr || '',
        amount: firstOut.value ? Number(firstOut.value) / 1e8 : 0, // Satoshis to BTC
        confirmations: tx.block_height ? Math.max(0, (data.height || 0) - tx.block_height + 1) : 0,
        timestamp: new Date((tx.time || 0) * 1000),
        status: tx.block_height ? 'confirmed' : 'pending',
        blockNumber: tx.block_height,
      }
    })
  } catch (error) {
    console.error('Error polling Bitcoin:', error)
    return []
  }
}

/**
 * Poll Ethereum blockchain via Etherscan
 */
async function pollEthereum(address: string): Promise<BlockchainTransaction[]> {
  try {
    const response = await fetch(BLOCKCHAIN_APIS.ETHEREUM.getAddressTxs(address))
    
    if (!response.ok) {
      throw new Error(`Etherscan error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status !== '1' || !data.result) {
      return []
    }
    
    return data.result
      .filter((tx: Record<string, any>) => {
        // Only incoming transactions to our address
        return (
          tx.to?.toLowerCase() === address.toLowerCase() &&
          tx.value !== '0' &&
          tx.isError === '0'
        )
      })
      .map((tx: Record<string, any>) => ({
        txHash: tx.hash,
        fromAddress: tx.from,
        toAddress: tx.to,
        amount: parseInt(tx.value || '0', 16) / 1e18, // Wei to ETH
        confirmations: parseInt(tx.confirmations || '0', 10),
        timestamp: new Date(parseInt(tx.timeStamp || '0', 10) * 1000),
        status: 'confirmed',
        blockNumber: parseInt(tx.blockNumber || '0', 10),
      }))
  } catch (error) {
    console.error('Error polling Ethereum:', error)
    return []
  }
}

/**
 * Poll USDT transfers across supported networks
 */
async function pollUSDT(address: string, network?: string): Promise<BlockchainTransaction[]> {
  switch (network) {
    case 'TRC20':
      return pollTronTRC20(address, cryptoConfig.networks.USDT.tokenAddress.TRC20)
    case 'BEP20':
      return pollBscBEP20(address, cryptoConfig.networks.USDT.tokenAddress.BEP20)
    case 'ERC20':
    default:
      return pollErc20Token(address, cryptoConfig.networks.USDT.tokenAddress.ERC20)
  }
}

/**
 * Poll USDC transfers across supported networks
 */
async function pollUSDC(address: string, network?: string): Promise<BlockchainTransaction[]> {
  switch (network) {
    case 'BEP20':
      return pollBscBEP20(address, cryptoConfig.networks.USDC.tokenAddress.BEP20)
    case 'ERC20':
    default:
      return pollErc20Token(address, cryptoConfig.networks.USDC.tokenAddress.ERC20)
  }
}

/**
 * Poll ERC-20 token transfers via Etherscan
 */
async function pollErc20Token(
  address: string,
  contractAddress: string
): Promise<BlockchainTransaction[]> {
  try {
    const response = await fetch(
      BLOCKCHAIN_APIS.ETHEREUM.getTokenTransfers(address, contractAddress)
    )
    
    if (!response.ok) {
      throw new Error(`Etherscan ERC-20 error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status !== '1' || !data.result) {
      return []
    }
    
    // USDT and USDC both use 6 decimals
    const tokenDecimals = 6
    
    return data.result
      .filter((tx: Record<string, any>) => {
        // Only incoming transfers
        return tx.to?.toLowerCase() === address.toLowerCase()
      })
      .map((tx: Record<string, any>) => ({
        txHash: tx.hash,
        fromAddress: tx.from,
        toAddress: tx.to,
        amount: parseInt(tx.value || '0', 10) / Math.pow(10, tokenDecimals),
        confirmations: parseInt(tx.confirmations || '0', 10),
        timestamp: new Date(parseInt(tx.timeStamp || '0', 10) * 1000),
        status: 'confirmed',
        blockNumber: parseInt(tx.blockNumber || '0', 10),
      }))
  } catch (error) {
    console.error('Error polling ERC-20:', error)
    return []
  }
}

/**
 * Poll BEP-20 token transfers via BscScan
 */
async function pollBscBEP20(
  address: string,
  contractAddress: string
): Promise<BlockchainTransaction[]> {
  try {
    const response = await fetch(
      BLOCKCHAIN_APIS.BSC.getTokenTransfers(address, contractAddress)
    )
    
    if (!response.ok) {
      throw new Error(`BscScan BEP-20 error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status !== '1' || !data.result) {
      return []
    }
    
    const tokenDecimals = 18 // Most BSC tokens use 18 decimals
    
    return data.result
      .filter((tx: Record<string, any>) => {
        return tx.to?.toLowerCase() === address.toLowerCase()
      })
      .map((tx: Record<string, any>) => ({
        txHash: tx.hash,
        fromAddress: tx.from,
        toAddress: tx.to,
        amount: parseInt(tx.value || '0', 10) / Math.pow(10, tokenDecimals),
        confirmations: parseInt(tx.confirmations || '0', 10),
        timestamp: new Date(parseInt(tx.timeStamp || '0', 10) * 1000),
        status: 'confirmed',
        blockNumber: parseInt(tx.blockNumber || '0', 10),
      }))
  } catch (error) {
    console.error('Error polling BEP-20:', error)
    return []
  }
}

/**
 * Poll TRC-20 token transfers via Tronscan API
 */
async function pollTronTRC20(
  address: string,
  tokenAddress?: string
): Promise<BlockchainTransaction[]> {
  try {
    const response = await fetch(
      BLOCKCHAIN_APIS.TRON.getTokenTransfers(address, tokenAddress)
    )
    
    if (!response.ok) {
      throw new Error(`Tronscan TRC-20 error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.data || !Array.isArray(data.data)) {
      return []
    }
    
    // USDT on TRON uses 6 decimals
    const tokenDecimals = 6
    
    return data.data
      .filter((tx: Record<string, any>) => {
        // Filter for incoming transfers
        return tx.to_address?.toLowerCase() === address.toLowerCase() &&
               tx.transaction_type === 'Transfer'
      })
      .map((tx: Record<string, any>) => ({
        txHash: tx.transaction_id || tx.txID || '',
        fromAddress: tx.from_address || '',
        toAddress: tx.to_address || '',
        amount: parseInt(tx.amount || '0', 10) / Math.pow(10, tokenDecimals),
        confirmations: tx.confirmations || (tx.block_ts ? 12 : 0), // TRON confirms quickly
        timestamp: new Date((tx.block_ts || Date.now())),
        status: tx.confirmed ? 'confirmed' : 'pending',
        blockNumber: tx.block,
      }))
  } catch (error) {
    console.error('Error polling TRC-20:', error)
    return []
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if transaction matches expected payment (with tolerance)
 */
function isMatchingTransaction(
  tx: BlockchainTransaction,
  expectedAmount: number,
  crypto: SupportedCrypto
): boolean {
  const tolerance = 0.02 // 2% tolerance for minor differences
  
  const lowerBound = expectedAmount * (1 - tolerance)
  const upperBound = expectedAmount * (1 + tolerance)
  
  return tx.amount >= lowerBound && tx.amount <= upperBound
}

/**
 * Get required confirmations for crypto/network combination
 */
function getRequiredConfirmationsFor(crypto: SupportedCrypto, network?: string): number {
  switch (crypto) {
    case 'USDT':
      if (network === 'TRC20') return cryptoConfig.networks.USDT.confirmationsRequired.TRC20
      if (network === 'BEP20') return cryptoConfig.networks.USDT.confirmationsRequired.BEP20
      return cryptoConfig.networks.USDT.confirmationsRequired.ERC20
    case 'USDC':
      if (network === 'BEP20') return cryptoConfig.networks.USDC.confirmationsRequired.BEP20
      return cryptoConfig.networks.USDC.confirmationsRequired.ERC20
    case 'BTC':
      return cryptoConfig.networks.BTC.confirmationsRequired
    case 'ETH':
      return cryptoConfig.networks.ETH.confirmationsRequired
    default:
      return 3
  }
}

/**
 * Estimate DZD equivalent of crypto amount (for alerts)
 */
function estimateDZDEquivalent(amount: number, crypto: SupportedCrypto): number {
  // Approximate rates for alerting purposes only
  const rates: Record<SupportedCrypto, number> = {
    USDT: 135,
    BTC: 7700000,
    ETH: 357000,
    USDC: 135,
  }
  
  return amount * rates[crypto]
}

/**
 * Update payment record with transaction data
 */
async function updatePaymentWithTx(
  paymentId: string,
  tx: BlockchainTransaction
): Promise<void> {
  await db.cryptoPayment.update({
    where: { paymentId },
    data: {
      txHash: tx.txHash,
      confirmations: tx.confirmations,
      senderAddress: tx.fromAddress,
      blockchainResponse: JSON.stringify({
        lastPolled: new Date().toISOString(),
        transaction: tx,
      }),
    },
  })
}

/**
 * Mark payment as completed
 */
async function completePayment(paymentId: string, txHash: string): Promise<void> {
  await db.cryptoPayment.update({
    where: { paymentId },
    data: {
      status: 'COMPLETED',
      confirmations: getRequiredConfirmationsFor('BTC'), // Will be updated properly
      confirmedAt: new Date(),
      blockchainResponse: JSON.stringify({
        completedAt: new Date().toISOString(),
        finalTxHash: txHash,
      }),
    },
  })
  
  console.log(`Payment ${paymentId} completed with tx ${txHash}`)
  
  // TODO: Trigger order fulfillment, notifications, etc.
}

/**
 * Mark payment as failed
 */
async function markPaymentFailed(paymentId: string, reason: string): Promise<void> {
  await db.cryptoPayment.update({
    where: { paymentId },
    data: {
      status: 'FAILED',
      blockchainResponse: JSON.stringify({
        failedAt: new Date().toISOString(),
        reason,
      }),
    },
  })
}

/**
 * Alert on large/suspicious transactions
 */
async function alertLargeTransaction(
  paymentId: string,
  tx: BlockchainTransaction,
  amountInDZD: number
): Promise<void> {
  console.warn(`🚨 LARGE TRANSACTION ALERT`, {
    paymentId,
    txHash: tx.txHash,
    amountInDZD: `${amountInDZD.toLocaleString()} DZD`,
    fromAddress: tx.fromAddress,
    timestamp: new Date().toISOString(),
  })
  
  // In production:
  // 1. Send admin notification
  // 2. Log to security system
  // 3. Consider holding for manual review
  
  // For now, just log the alert
}

/**
 * Get transaction details by hash from blockchain
 */
export async function getTransactionDetails(
  txHash: string,
  crypto: SupportedCrypto,
  network?: string
): Promise<BlockchainTransaction | null> {
  try {
    let url: string
    
    switch (crypto) {
      case 'BTC':
        url = BLOCKCHAIN_APIS.BTC.getTxUrl(txHash)
        break
      case 'ETH':
      case 'USDT':
      case 'USDC':
        if (network === 'BEP20') {
          url = `${BLOCKCHAIN_APIS.BSC.baseUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${process.env.BSCSCAN_API_KEY || ''}`
        } else {
          url = `${BLOCKCHAIN_APIS.ETHEREUM.baseUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${process.env.ETHERSCAN_API_KEY || ''}`
        }
        break
      default:
        return null
    }
    
    const response = await fetch(url)
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    
    // Parse based on source
    if (crypto === 'BTC' && data.hash) {
      return {
        txHash: data.hash,
        fromAddress: data.inputs?.[0]?.prev_out?.addr || '',
        toAddress: data.out?.[0]?.addr || '',
        amount: data.out?.[0]?.value ? data.out[0].value / 1e8 : 0,
        confirmations: data.block_height ? 999 : 0,
        timestamp: new Date((data.time || 0) * 1000),
        status: data.block_height ? 'confirmed' : 'pending',
      }
    }
    
    if (data.result) {
      const tx = data.result
      return {
        txHash: tx.hash,
        fromAddress: tx.from,
        toAddress: tx.to,
        amount: parseInt(tx.value || '0', 16) / 1e18,
        confirmations: 0,
        timestamp: new Date(),
        status: 'pending',
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching transaction details:', error)
    return null
  }
}
