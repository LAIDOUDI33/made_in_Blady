// Background Job for Crypto Payment Monitoring
// Runs periodically to check payment status and auto-confirm when ready

import { db } from '@/lib/db'
import { getTransactionDetails } from './blockchain-monitor'

export interface CryptoMonitorJobConfig {
  intervalMs: number // How often to run (default: 30 seconds)
  batchSize: number // How many payments to process per run
  enabled: boolean
}

const DEFAULT_CONFIG: CryptoMonitorJobConfig = {
  intervalMs: 30000, // 30 seconds
  batchSize: 20,
  enabled: true,
}

let monitorInterval: NodeJS.Timeout | null = null
let isRunning = false

/**
 * Start the crypto monitoring background job
 */
export function startCryptoMonitorJob(config?: Partial<CryptoMonitorJobConfig>): void {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  
  if (!fullConfig.enabled) {
    console.log('Crypto monitor job is disabled')
    return
  }
  
  if (monitorInterval) {
    console.log('Crypto monitor job is already running')
    return
  }
  
  console.log('Starting crypto payment monitor job...')
  
  // Run immediately on start
  processPendingPayments(fullConfig.batchSize)
  
  // Then set up interval
  monitorInterval = setInterval(() => {
    if (!isRunning) {
      processPendingPayments(fullConfig.batchSize)
    }
  }, fullConfig.intervalMs)
  
  console.log(`Crypto monitor job started (interval: ${fullConfig.intervalMs}ms)`)
}

/**
 * Stop the crypto monitoring background job
 */
export function stopCryptoMonitorJob(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval)
    monitorInterval = null
    console.log('Crypto monitor job stopped')
  }
}

/**
 * Process pending/confirming payments - check their status and update as needed
 */
async function processPendingPayments(batchSize: number): Promise<void> {
  if (isRunning) return
  
  isRunning = true
  
  try {
    const now = new Date()
    
    // Find payments that need attention:
    // 1. PENDING payments that haven't expired yet
    // 2. AWAITING_CONFIRMATION or CONFIRMING payments
    
    const activePayments = await db.cryptoPayment.findMany({
      where: {
        status: {
          in: ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMING'],
        },
      },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    })
    
    if (activePayments.length === 0) {
      isRunning = false
      return
    }
    
    console.log(`Processing ${activePayments.length} crypto payments...`)
    
    let expiredCount = 0
    let confirmedCount = 0
    let updatedCount = 0
    
    for (const payment of activePayments) {
      try {
        // Check if payment has expired
        if (now > payment.expiresAt && payment.status === 'PENDING') {
          await db.cryptoPayment.update({
            where: { id: payment.id },
            data: {
              status: 'EXPIRED',
              blockchainResponse: JSON.stringify({
                action: 'auto_expired',
                expiredAt: now.toISOString(),
              }),
            },
          })
          expiredCount++
          continue
        }
        
        // For payments with txHash, check confirmations
        if (payment.txHash && (payment.status === 'CONFIRMING' || payment.status === 'AWAITING_CONFIRMATION')) {
          const txDetails = await getTransactionDetails(
            payment.txHash,
            payment.cryptocurrency as any,
            payment.network || undefined
          )
          
          if (txDetails && txDetails.confirmations >= payment.requiredConfirmations) {
            // Payment is fully confirmed!
            await db.cryptoPayment.update({
              where: { id: payment.id },
              data: {
                status: 'COMPLETED',
                confirmations: txDetails.confirmations,
                confirmedAt: now,
                blockchainResponse: JSON.stringify({
                  action: 'auto_confirmed',
                  confirmedAt: now.toISOString(),
                  finalConfirmations: txDetails.confirmations,
                  transaction: txDetails,
                }),
              },
            })
            
            confirmedCount++
            
            // TODO: Trigger order fulfillment, notifications, etc.
            await triggerOrderFulfillment(payment)
            
          } else if (txDetails) {
            // Update confirmation count
            await db.cryptoPayment.update({
              where: { id: payment.id },
              data: {
                status: 'CONFIRMING',
                confirmations: txDetails.confirmations,
                blockchainResponse: JSON.stringify({
                  action: 'confirmation_update',
                  updatedAt: now.toISOString(),
                  currentConfirmations: txDetails.confirmations,
                  requiredConfirmations: payment.requiredConfirmations,
                }),
              },
            })
            updatedCount++
          }
        }
        
        // Small delay between API calls to avoid rate limiting
        await sleep(100)
        
      } catch (error) {
        console.error(`Error processing payment ${payment.paymentId}:`, error)
      }
    }
    
    if (expiredCount > 0 || confirmedCount > 0 || updatedCount > 0) {
      console.log(`Crypto monitor results: ${expiredCount} expired, ${confirmedCount} confirmed, ${updatedCount} updated`)
    }
    
  } catch (error) {
    console.error('Error in crypto monitor job:', error)
  } finally {
    isRunning = false
  }
}

/**
 * Trigger order fulfillment after crypto payment confirmation
 */
async function triggerOrderFulfillment(payment: any): Promise<void> {
  try {
    console.log(`Triggering fulfillment for order ${payment.orderId} (payment: ${payment.paymentId})`)
    
    // Update the main Order's payment status
    // This would typically:
    // 1. Mark the order as PAID
    // 2. Send notification to seller
    // 3. Send confirmation email to buyer
    // 4. Create invoice
    // 5. Trigger any automated workflows
    
    // For now, just log it
    console.log(`Order ${payment.orderId} should be marked as paid via crypto payment ${payment.paymentId}`)
    
    // In a real implementation:
    // await db.order.update({
    //   where: { id: payment.orderId },
    //   data: { status: 'PAID' }
    // })
    
  } catch (error) {
    console.error('Error triggering order fulfillment:', error)
  }
}

/**
 * Cleanup old completed/expired payments (run daily)
 */
export async function cleanupOldPayments(daysOld = 30): Promise<{ deleted: number }> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    const result = await db.cryptoPayment.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { in: ['COMPLETED', 'EXPIRED', 'FAILED'] },
      },
    })
    
    console.log(`Cleaned up ${result.count} old crypto payments`)
    return { deleted: result.count }
    
  } catch (error) {
    console.error('Error cleaning up old payments:', error)
    return { deleted: 0 }
  }
}

/**
 * Get monitoring statistics
 */
export async function getMonitorStats(): Promise<{
  activePayments: number
  byStatus: Record<string, number>
  oldestPending: Date | null
}> {
  try {
    const [activeCount, statusCounts, oldestPending] = await Promise.all([
      db.cryptoPayment.count({
        where: {
          status: { in: ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMING'] },
        },
      }),
      
      db.cryptoPayment.groupBy({
        by: ['status'],
        _count: true,
      }),
      
      db.cryptoPayment.findFirst({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
    ])
    
    const byStatus: Record<string, number> = {}
    statusCounts.forEach((item) => {
      byStatus[item.status] = item._count
    })
    
    return {
      activePayments: activeCount,
      byStatus,
      oldestPending: oldestPending?.createdAt || null,
    }
    
  } catch (error) {
    console.error('Error getting monitor stats:', error)
    return {
      activePayments: 0,
      byStatus: {},
      oldestPending: null,
    }
  }
}

/**
 * Utility: Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Auto-start in production (if enabled via env var)
if (process.env.CRYPTO_MONITOR_AUTO_START === 'true') {
  startCryptoMonitorJob()
}
