// ERP Background Jobs - Scheduled sync, health checks, cleanup
// AlgeriaTrade.dz B2B Platform - Inventory/ERP Sync System

import { db } from '@/lib/db'
import { syncEngine } from '@/lib/erp/sync-engine'

// ============================================
// JOB TYPES
// ============================================

export interface ERPJobConfig {
  enabled: boolean
  scheduleIntervalMs: number
  maxRetries: number
  retryDelayMs: number
}

export interface JobResult {
  success: boolean
  jobId: string
  jobName: string
  executedAt: Date
  durationMs: number
  message?: string
  details?: any
}

// ============================================
// SCHEDULED SYNC JOB
// ============================================

class ScheduledSyncJob {
  private intervalId: NodeJS.Timeout | null = null
  private config: ERPJobConfig
  
  constructor(config?: Partial<ERPJobConfig>) {
    this.config = {
      enabled: true,
      scheduleIntervalMs: 60 * 60 * 1000, // Default: every hour
      maxRetries: 3,
      retryDelayMs: 5 * 60 * 1000, // 5 minutes
      ...config,
    }
  }
  
  start(): void {
    if (this.intervalId) return // Already running
    
    console.log('[ERP Jobs] Starting scheduled sync job')
    
    // Run immediately on start
    this.executeAllScheduledSyncs()
    
    // Then run on interval
    this.intervalId = setInterval(() => {
      this.executeAllScheduledSyncs()
    }, this.config.scheduleIntervalMs)
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('[ERP Jobs] Stopped scheduled sync job')
    }
  }
  
  private async executeAllScheduledSyncs(): Promise<void> {
    try {
      if (!this.config.enabled) return
      
      const connectors = await db.erpConnector.findMany({
        where: {
          status: 'CONNECTED',
          // Only get connectors that are due for sync
          OR: [
            { nextSyncAt: { lte: new Date() } },
            { nextSyncAt: null },
          ],
        },
      })
      
      console.log(`[ERP Jobs] Found ${connectors.length} connectors due for sync`)
      
      for (const connector of connectors) {
        await this.executeConnectorSync(connector.id)
      }
      
    } catch (error) {
      console.error('[ERP Jobs] Error in scheduled sync:', error)
    }
  }
  
  private async executeConnectorSync(connectorId: string): Promise<JobResult> {
    const startTime = Date.now()
    
    try {
      const connector = await db.erpConnector.findUnique({ where: { id: connectorId } })
      if (!connector) {
        throw new Error(`Connector not found: ${connectorId}`)
      }
      
      // Parse sync config
      const syncConfig = JSON.parse(connector.syncConfig || '{}')
      const frequency = syncConfig.frequency || 'HOURLY'
      const entityTypes = syncConfig.entityTypes || ['PRODUCTS', 'INVENTORY']
      
      // Update status to syncing
      await db.erpConnector.update({
        where: { id: connectorId },
        data: { status: 'SYNCING' },
      })
      
      // Execute sync for each entity type
      let totalSuccess = true
      
      for (const entityType of entityTypes) {
        try {
          await syncEngine.triggerSync(
            connectorId,
            syncConfig.direction || 'BIDIRECTIONAL',
            entityType,
            { fullSync: false }
          )
        } catch (error) {
          console.error(`[ERP Jobs] Failed to sync ${entityType} for connector ${connectorId}:`, error)
          totalSuccess = false
        }
      }
      
      // Calculate next sync time
      const nextSyncAt = this.calculateNextSyncTime(frequency)
      
      // Update connector status
      await db.erpConnector.update({
        where: { id: connectorId },
        data: {
          status: totalSuccess ? 'CONNECTED' : 'ERROR',
          lastSyncAt: new Date(),
          nextSyncAt,
          errorCount: totalSuccess ? 0 : { increment: 1 },
          errorMessage: totalSuccess ? null : 'One or more entity types failed to sync',
        },
      })
      
      return {
        success: totalSuccess,
        jobId: `scheduled_sync_${connectorId}_${Date.now()}`,
        jobName: 'Scheduled Sync',
        executedAt: new Date(),
        durationMs: Date.now() - startTime,
        message: `Completed sync for ${entityTypes.join(', ')}`,
        details: { connectorId, entityTypes, frequency },
      }
      
    } catch (error: any) {
      // Update connector with error
      await db.erpConnector.update({
        where: { id: connectorId },
        data: {
          status: 'ERROR',
          errorCount: { increment: 1 },
          errorMessage: error.message || 'Scheduled sync failed',
        },
      })
      
      return {
        success: false,
        jobId: `scheduled_sync_${connectorId}_${Date.now()}`,
        jobName: 'Scheduled Sync',
        executedAt: new Date(),
        durationMs: Date.now() - startTime,
        error: error.message,
      }
    }
  }
  
  private calculateNextSyncTime(frequency: string): Date {
    const now = new Date()
    
    switch (frequency) {
      case 'REALTIME':
      case 'EVERY_5_MIN':
        return new Date(now.getTime() + 5 * 60 * 1000)
      case 'EVERY_15_MIN':
        return new Date(now.getTime() + 15 * 60 * 1000)
      case 'EVERY_30_MIN':
        return new Date(now.getTime() + 30 * 60 * 1000)
      case 'HOURLY':
        return new Date(now.getTime() + 60 * 60 * 1000)
      case 'DAILY': {
        // Default to 2 AM if not configured
        const syncTime = '02:00'
        const [hours, minutes] = syncTime.split(':').map(Number)
        const next = new Date(now)
        next.setHours(hours, minutes, 0, 0)
        if (next <= now) next.setDate(next.getDate() + 1)
        return next
      }
      case 'WEEKLY':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() + 60 * 60 * 1000)
    }
  }
}

// ============================================
// HEALTH CHECK JOB
// ============================================

class HealthCheckJob {
  private intervalId: NodeJS.Timeout | null = null
  private config: ERPJobConfig
  
  constructor(config?: Partial<ERPJobConfig>) {
    this.config = {
      enabled: true,
      scheduleIntervalMs: 5 * 60 * 1000, // Every 5 minutes
      maxRetries: 1,
      retryDelayMs: 60000,
      ...config,
    }
  }
  
  start(): void {
    if (this.intervalId) return
    
    console.log('[ERP Jobs] Starting health check job')
    
    // Initial health check after 30 seconds
    setTimeout(() => this.executeHealthCheck(), 30000)
    
    this.intervalId = setInterval(() => {
      this.executeHealthCheck()
    }, this.config.scheduleIntervalMs)
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
  
  private async executeHealthCheck(): Promise<JobResult> {
    const startTime = Date.now()
    
    try {
      const result = await syncEngine.performHealthCheck()
      
      // Log health status
      console.log(`[ERP Health] Healthy: ${result.healthy}, Degraded: ${result.degraded}, Unhealthy: ${result.unhealthy}`)
      
      // Alert on unhealthy connectors
      if (result.unhealthy > 0) {
        console.warn(`[ERP Health] WARNING: ${result.unhealthy} unhealthy connector(s) detected`)
        
        // In production, send alert notification here
        await this.alertUnhealthyConnectors(result.details)
      }
      
      return {
        success: result.unhealthy === 0,
        jobId: `health_check_${Date.now()}`,
        jobName: 'Health Check',
        executedAt: new Date(),
        durationMs: Date.now() - startTime,
        details: result,
      }
      
    } catch (error: any) {
      console.error('[ERP Jobs] Health check failed:', error)
      return {
        success: false,
        jobId: `health_check_${Date.now()}`,
        jobName: 'Health Check',
        executedAt: new Date(),
        durationMs: Date.now() - startTime,
        error: error.message,
      }
    }
  }
  
  private async alertUnhealthyConnectors(details: Map<string, any>): Promise<void> {
    for (const [id, info] of details.entries()) {
      if (info.status === 'unhealthy') {
        // Increment error count for unhealthy connectors
        await db.erpConnector.update({
          where: { id },
          data: {
            status: 'ERROR',
            errorCount: { increment: 1 },
            errorMessage: `Health check failed: ${info.error || 'Unknown error'}`,
          },
        })
        
        // Check if we should send an alert (after N consecutive failures)
        const connector = await db.erpConnector.findUnique({ where: { id } })
        if (connector && connector.errorCount >= 3) {
          console.error(`[ERP Jobs] ALERT: Connector ${id} has failed ${connector.errorCount} consecutive times`)
          
          // In production, send email/notification here
          await this.sendFailureAlert(connector)
        }
      }
    }
  }
  
  private async sendFailureAlert(connector: any): Promise<void> {
    // Placeholder for sending failure alerts
    // In production, integrate with notification service
    console.log(`[ERP Jobs] Would send failure alert for connector ${connector.name}`)
  }
}

// ============================================
// CLEANUP JOB
// ============================================

class CleanupJob {
  private intervalId: NodeJS.Timeout | null = null
  private retentionDays: number
  
  constructor(retentionDays: number = 90) {
    this.retentionDays = retentionDays
  }
  
  start(): void {
    if (this.intervalId) return
    
    console.log(`[ERP Jobs] Starting cleanup job (retention: ${this.retentionDays} days)`)
    
    // Run once daily at midnight
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime()
    
    setTimeout(() => {
      this.executeCleanup()
      // Then run daily
      this.intervalId = setInterval(() => this.executeCleanup(), 24 * 60 * 60 * 1000)
    }, msUntilMidnight)
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
  
  private async executeCleanup(): Promise<JobResult> {
    const startTime = Date.now()
    
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays)
      
      // Clean old sync logs
      const deletedLogs = await syncEngine.cleanupOldLogs(this.retentionDays)
      
      // Clean old inventory records that haven't been synced recently
      const deletedRecords = await db.inventorySyncRecord.deleteMany({
        where: {
          OR: [
            { lastSyncedAt: { lt: cutoffDate } },
            { AND: [{ lastSyncedAt: null }, { createdAt: { lt: cutoffDate } }] },
          ],
        },
      })
      
      console.log(`[ERP Cleanup] Deleted ${deletedLogs} old logs and ${deletedRecords.count} stale records`)
      
      return {
        success: true,
        jobId: `cleanup_${Date.now()}`,
        jobName: 'Cleanup',
        executedAt: new Date(),
        durationMs: Date.now() - startTime,
        message: `Cleaned up ${deletedLogs} logs and ${deletedRecords.count} records`,
        details: { deletedLogs, deletedRecords: deletedRecords.count, retentionDays: this.retentionDays },
      }
      
    } catch (error: any) {
      console.error('[ERP Jobs] Cleanup failed:', error)
      return {
        success: false,
        jobId: `cleanup_${Date.now()}`,
        jobName: 'Cleanup',
        executedAt: new Date(),
        durationMs: Date.now() - startTime,
        error: error.message,
      }
    }
  }
}

// ============================================
// INVENTORY RECONCILIATION JOB
// ============================================

class InventoryReconciliationJob {
  private intervalId: NodeJS.Timeout | null = null
  private config: ERPJobConfig
  
  constructor(config?: Partial<ERPJobConfig>) {
    this.config = {
      enabled: true,
      scheduleIntervalMs: 6 * 60 * 60 * 1000, // Every 6 hours
      maxRetries: 2,
      retryDelayMs: 10 * 60 * 1000,
      ...config,
    }
  }
  
  start(): void {
    if (this.intervalId) return
    
    console.log('[ERP Jobs] Starting inventory reconciliation job')
    
    // Run initial reconciliation after 1 minute
    setTimeout(() => this.executeReconciliation(), 60000)
    
    this.intervalId = setInterval(() => {
      this.executeReconciliation()
    }, this.config.scheduleIntervalMs)
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
  
  private async executeReconciliation(): Promise<JobResult> {
    const startTime = Date.now()
    
    try {
      // Get all active connectors with inventory records
      const connectors = await db.erpConnector.findMany({
        where: { status: 'CONNECTED' },
        include: {
          inventoryRecords: {
            take: 50,
          },
        },
      })
      
      let discrepanciesFound = 0
      let reconciledCount = 0
      
      for (const connector of connectors) {
        for (const record of connector.inventoryRecords) {
          try {
            // Compare local product stock with synced quantity
            const localProduct = await db.product.findUnique({
              where: { id: record.internalProductId },
              select: { id: true, availability: true, name: true },
            })
            
            if (localProduct && record.syncStatus === 'SYNCED') {
              // Determine expected local availability based on ERP quantity
              const expectedAvailability = record.quantity <= 0 ? 'out_of_stock' :
                                              record.quantity <= 10 ? 'low_stock' : 'in_stock'
              
              if (localProduct.availability !== expectedAvailability) {
                discrepanciesFound++
                
                // Auto-reconcile: update local to match ERP
                await db.product.update({
                  where: { id: localProduct.id },
                  data: { 
                    availability: expectedAvailability,
                    updatedAt: new Date(),
                  },
                })
                
                reconciledCount++
                
                console.log(`[ERP Reconcile] Reconciled ${localProduct.name}: ${localProduct.availability} -> ${expectedAvailability}`)
              }
            }
          } catch (error) {
            // Skip records where local product doesn't exist
          }
        }
      }
      
      console.log(`[ERP Reconciliation] Found ${discrepanciesFound} discrepancies, reconciled ${reconciledCount}`)
      
      return {
        success: true,
        jobId: `reconciliation_${Date.now()}`,
        jobName: 'Inventory Reconciliation',
        executedAt: new Date(),
        durationMs: Date.now() - startTime,
        message: `Checked inventory, found ${discrepanciesFound} discrepancies`,
        details: { discrepanciesFound, reconciledCount, connectorsChecked: connectors.length },
      }
      
    } catch (error: any) {
      console.error('[ERP Jobs] Inventory reconciliation failed:', error)
      return {
        success: false,
        jobId: `reconciliation_${Date.now()}`,
        jobName: 'Inventory Reconciliation',
        executedAt: new Date(),
        durationMs: Date.now() - startTime,
        error: error.message,
      }
    }
  }
}

// ============================================
// EXPORTED INSTANCES & MANAGER
// ============================================

export const scheduledSyncJob = new ScheduledSyncJob()
export const healthCheckJob = new HealthCheckJob()
export const cleanupJob = new CleanupJob()
export const reconciliationJob = new InventoryReconciliationJob()

export class ERPJobsManager {
  static startAll(): void {
    console.log('[ERP Jobs] Starting all background jobs...')
    scheduledSyncJob.start()
    healthCheckJob.start()
    cleanupJob.start()
    reconciliationJob.start()
  }
  
  static stopAll(): void {
    console.log('[ERP Jobs] Stopping all background jobs...')
    scheduledSyncJob.stop()
    healthCheckJob.stop()
    cleanupJob.stop()
    reconciliationJob.stop()
  }
  
  static getStatus(): {
    scheduledSync: boolean,
    healthCheck: boolean,
    cleanup: boolean,
    reconciliation: boolean
  } {
    return {
      scheduledSync: scheduledSyncJob['intervalId'] !== null,
      healthCheck: healthCheckJob['intervalId'] !== null,
      cleanup: cleanupJob['intervalId'] !== null,
      reconciliation: reconciliationJob['intervalId'] !== null,
    }
  }
}

// Auto-start jobs when module is imported (in development)
if (process.env.NODE_ENV !== 'test') {
  // Don't auto-start in tests
  // ERPJobsManager.startAll() will be called explicitly by the application
}
