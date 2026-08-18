// Currency Background Jobs
// Automated tasks for exchange rate maintenance

import {
  getExchangeRates,
  invalidateCache,
  cacheRates,
  healthCheck,
  getCurrentRateSource,
} from '@/lib/currency/rate-provider'
import { db } from '@/lib/db'
import { CurrencyCode, getCurrencyCodes, isSupportedCurrency } from '@/lib/currency/config'

// Job configuration
const JOB_CONFIG = {
  // Rate refresh interval (1 hour)
  RATE_REFRESH_INTERVAL_MS: 60 * 60 * 1000,
  
  // Rate fluctuation alert threshold (5%)
  FLUCTUATION_ALERT_THRESHOLD: 0.05,
  
  // Log retention period (90 days)
  LOG_RETENTION_DAYS: 90,
  
  // Report generation time (daily at midnight UTC)
  REPORT_HOUR_UTC: 0,
}

// Store previous rates for comparison
let previousRates: Map<string, number> | null = null

/**
 * Main job: Refresh exchange rates periodically
 * Should be called by a cron job or scheduler every hour
 */
export async function refreshExchangeRates(): Promise<{
  success: boolean
  ratesCount: number
  source: string
  fluctuations?: Array<{ currency: string; oldRate: number; newRate: number; changePercent: number }>
}> {
  console.log('[CurrencyJob] Starting exchange rate refresh...')
  
  try {
    // Get previous rates for comparison
    if (!previousRates) {
      const cached = await getExchangeRates()
      previousRates = new Map(Object.entries(cached))
    }

    // Force refresh rates
    invalidateCache()
    const newRates = await getExchangeRates()
    
    const sourceInfo = getCurrentRateSource()
    const fluctuations = checkForFluctuations(previousRates, newRates)

    // Alert on significant fluctuations
    if (fluctuations.length > 0) {
      await sendFluctuationAlert(fluctuations)
    }

    // Update previous rates for next comparison
    previousRates = new Map(Object.entries(newRates))

    // Save to database
    await saveRatesToDatabase(newRates, sourceInfo.source)

    console.log(`[CurrencyJob] Refresh complete. Source: ${sourceInfo.source}, Rates: ${newRates.size}`)

    return {
      success: true,
      ratesCount: newRates.size,
      source: sourceInfo.source,
      fluctuations: fluctuations.length > 0 ? fluctuations : undefined,
    }
  } catch (error) {
    console.error('[CurrencyJob] Rate refresh failed:', error)
    
    // Try to use fallback rates
    const fallbackResult = await handleRefreshFailure(error)
    return fallbackResult
  }
}

/**
 * Check for significant rate fluctuations (>5% change)
 */
function checkForFluctuations(
  oldRates: Map<string, number>,
  newRates: Map<string, number>
): Array<{ currency: string; oldRate: number; newRate: number; changePercent: number }> {
  const fluctuations: Array<{ currency: string; oldRate: number; newRate: number; changePercent: number }> = []

  for (const [currency, newRate] of newRates.entries()) {
    const oldRate = oldRates.get(currency)
    if (oldRate && oldRate !== 0) {
      const changePercent = Math.abs((newRate - oldRate) / oldRate)
      
      if (changePercent > JOB_CONFIG.FLUCTUATION_ALERT_THRESHOLD) {
        fluctuations.push({
          currency,
          oldRate,
          newRate,
          changePercent: changePercent * 100,
        })
      }
    }
  }

  return fluctuations
}

/**
 * Send alerts for significant rate fluctuations
 */
async function sendFluctuationAlert(
  fluctuations: Array<{ currency: string; oldRate: number; newRate: number; changePercent: number }>
): Promise<void> {
  console.warn(`[CurrencyJob] ⚠️ Significant rate fluctuations detected:`)
  
  for (const f of fluctuations) {
    console.warn(
      `  - ${f.currency}: ${f.oldRate.toFixed(4)} → ${f.newRate.toFixed(4)} (${f.changePercent.toFixed(2)}%)`
    )
  }

  // In production, this would:
  // 1. Send email/SMS to finance team
  // 2. Create an alert in monitoring system
  // 3. Potentially pause FX operations if changes are extreme
  
  // For now, just log the alert
  try {
    // Could integrate with notification service here
    // await notificationsService.alert('currency_fluctuation', { fluctuations })
  } catch (error) {
    console.error('[CurrencyJob] Failed to send fluctuation alert:', error)
  }
}

/**
 * Handle refresh failure with fallback strategy
 */
async function handleRefreshFailure(error: unknown): Promise<{
  success: boolean
  ratesCount: number
  source: string
  error: string
}> {
  console.error('[CurrencyJob] All providers failed, using cached/fallback rates')
  
  // Check if we have any cached rates to extend validity
  const sourceInfo = getCurrentRateSource()
  
  return {
    success: false,
    ratesCount: previousRates?.size || 0,
    source: sourceInfo.source || 'none',
    error: error instanceof Error ? error.message : 'Unknown error',
  }
}

/**
 * Save current rates to database for historical tracking
 */
async function saveRatesToDatabase(
  rates: Map<CurrencyCode, number>,
  source: string
): Promise<void> {
  try {
    const validUntil = new Date()
    validUntil.setHours(validUntil.getHours() + 2) // Valid for 2 hours

    const operations = []
    
    for (const [toCurrency, rate] of rates.entries()) {
      if (toCurrency === 'DZD') continue // Skip base currency
      
      operations.push(
        db.exchangeRate.upsert({
          where: {
            fromCurrency_toCurrency_source: {
              fromCurrency: 'DZD',
              toCurrency,
              source,
            },
          },
          update: {
            rate: rate.toString(),
            fetchedAt: new Date(),
            validUntil,
          },
          create: {
            fromCurrency: 'DZD',
            toCurrency,
            rate: rate.toString(),
            source,
            validUntil,
          },
        })
      )
    }

    await Promise.all(operations)
    console.log(`[CurrencyJob] Saved ${operations.length} rates to database`)
  } catch (error) {
    console.error('[CurrencyJob] Failed to save rates to database:', error)
  }
}

/**
 * Clean up old conversion logs (keep only last 90 days)
 */
export async function cleanupConversionLogs(): Promise<{
  deletedCount: number
  keptCount: number
}> {
  console.log('[CurrencyJob] Starting conversion log cleanup...')
  
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - JOB_CONFIG.LOG_RETENTION_DAYS)

    // Count what will be deleted
    const logsToDelete = await db.conversionLog.count({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    })

    // Delete old logs
    const deleted = await db.conversionLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    })

    // Count remaining
    const remaining = await db.conversionLog.count()

    console.log(`[CurrencyJob] Cleanup complete. Deleted: ${deleted.count}, Remaining: ${remaining}`)

    return {
      deletedCount: deleted.count,
      keptCount: remaining,
    }
  } catch (error) {
    console.error('[CurrencyJob] Log cleanup failed:', error)
    throw error
  }
}

/**
 * Generate daily rate report for finance team
 */
export async function generateDailyReport(): Promise<{
  date: string
  rates: Record<string, number>
  source: string
  previousDayRates?: Record<string, number>
  changes?: Record<string, number>
}> {
  console.log('[CurrencyJob] Generating daily rate report...')
  
  try {
    const rates = await getExchangeRates()
    const sourceInfo = getCurrentRateSource()
    const today = new Date().toISOString().split('T')[0]

    // Get yesterday's rates for comparison
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    let previousDayRates: Record<string, number> | undefined
    let changes: Record<string, number> | undefined

    try {
      // Query database for yesterday's rates at end of day
      const yesterdayEnd = new Date(yesterday)
      yesterdayEnd.setHours(23, 59, 59, 999)

      const yesterdayDbRates = await db.exchangeRate.findMany({
        where: {
          fetchedAt: {
            lte: yesterdayEnd,
          },
          fromCurrency: 'DZD',
        },
        orderBy: { fetchedAt: 'desc' },
        take: 20, // Get latest rates for each currency
      })

      if (yesterdayDbRates.length > 0) {
        previousDayRates = {}
        changes = {}

        for (const rate of yesterdayDbRates) {
          if (!(rate.toCurrency in previousDayRates)) {
            previousDayRates[rate.toCurrency] = Number(rate.rate)
            
            const currentRate = rates.get(rate.toCurrency as CurrencyCode)
            if (currentRate) {
              changes[rate.toCurrency] = ((currentRate - Number(rate.rate)) / Number(rate.rate)) * 100
            }
          }
        }
      }
    } catch (error) {
      console.warn('[CurrencyJob] Could not fetch previous day rates:', error)
    }

    const report = {
      date: today,
      rates: Object.fromEntries(rates),
      source: sourceInfo.source,
      previousDayRates,
      changes,
    }

    console.log(`[CurrencyJob] Daily report generated for ${today}`)
    
    // In production, this would be emailed or stored in a report table
    return report
  } catch (error) {
    console.error('[CurrencyJob] Report generation failed:', error)
    throw error
  }
}

/**
 * Health check for all rate providers
 */
export async function runProviderHealthCheck(): Promise<Record<string, {
  isAvailable: boolean
  lastChecked: Date
  error?: string
}>> {
  console.log('[CurrencyJob] Running provider health check...')
  
  const health = await healthCheck()
  
  for (const [name, status] of Object.entries(health)) {
    console.log(
      `[CurrencyJob] Provider "${name}": ${status.isAvailable ? '✓ Available' : '✗ Unavailable'}`
      + (status.lastError ? ` (${status.lastError})` : '')
    )
  }

  return health
}

/**
 * Log a conversion for analytics
 */
export async function logConversion(params: {
  userId?: string
  fromAmount: number
  fromCurrency: string
  toAmount: number
  toCurrency: string
  rateUsed: number
  context?: string
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  try {
    await db.conversionLog.create({
      data: {
        userId: params.userId,
        fromAmount: params.fromAmount.toString(),
        fromCurrency: params.fromCurrency,
        toAmount: params.toAmount.toString(),
        toCurrency: params.toCurrency,
        rateUsed: params.rateUsed.toString(),
        context: params.context || 'unknown',
        ipAddress: params.ipAddress,
        userAgent: params.userAgent?.slice(0, 500), // Limit length
      },
    })
  } catch (error) {
    console.error('[CurrencyJob] Failed to log conversion:', error)
    // Don't throw - logging shouldn't break the main flow
  }
}

/**
 * Get conversion statistics for a time period
 */
export async function getConversionStats(params: {
  startDate: Date
  endDate: Date
  userId?: string
}): Promise<{
  totalConversions: number
  totalVolumeByCurrency: Record<string, number>
  popularPairs: Array<{ pair: string; count: number }>
  conversionsByContext: Record<string, number>
}> {
  const whereClause: Record<string, unknown> = {
    createdAt: {
      gte: params.startDate,
      lte: params.endDate,
    },
  }

  if (params.userId) {
    whereClause.userId = params.userId
  }

  const [logs, volumeStats] = await Promise.all([
    db.conversionLog.findMany({ where: whereClause }),
    db.conversionLog.groupBy({
      by: ['fromCurrency', 'toCurrency'],
      _count: true,
      where: whereClause,
    }),
  ])

  // Calculate stats
  const totalVolumeByCurrency: Record<string, number> = {}
  const conversionsByContext: Record<string, number> = {}

  for (const log of logs) {
    // Volume by "to" currency
    const toVolume = totalVolumeByCurrency[log.toCurrency] || 0
    totalVolumeByCurrency[log.toCurrency] = toVolume + parseFloat(log.toAmount)

    // By context
    const ctx = log.context || 'unknown'
    conversionsByContext[ctx] = (conversionsByContext[ctx] || 0) + 1
  }

  // Popular pairs
  const popularPairs = volumeStats
    .sort((a, b) => b._count - a._count)
    .slice(0, 10)
    .map(s => ({
      pair: `${s.fromCurrency}/${s.toCurrency}`,
      count: s._count,
    }))

  return {
    totalConversions: logs.length,
    totalVolumeByCurrency,
    popularPairs,
    conversionsByContext,
  }
}
