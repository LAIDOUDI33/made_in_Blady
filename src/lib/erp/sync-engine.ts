// Sync Engine - Bidirectional sync orchestration
// Conflict resolution, delta sync, retry logic, audit trail
// AlgeriaTrade.dz B2B Platform - Inventory/ERP Sync System

import { db } from '@/lib/db'
import {
  ERPSystemType,
  SyncDirection,
  SyncFrequency,
  ConflictResolution,
  DEFAULT_RETRY_POLICY,
} from './config'
import { BaseERPConnector, IERPConnector, SyncResult, Product } from './connectors/base-connector'

// ============================================
// TYPES
// ============================================

export type SyncOperationStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PARTIAL'

export interface SyncOperation {
  id: string
  connectorId: string
  entityType: string
  direction: SyncDirection
  
  status: SyncOperationStatus
  priority: number // Lower = higher priority
  
  options: SyncOptions
  
  result?: SyncResult
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

export interface SyncOptions {
  fullSync?: boolean
  dryRun?: boolean
  conflictResolution?: ConflictResolution
  batchSize?: number
  entityTypes?: string[]
  
  // Delta sync settings
  deltaSyncField?: string
  lastSyncTimestamp?: Date
  
  // Callbacks
  onProgress?: (progress: SyncProgress) => void
  onComplete?: (result: SyncResult) => void
  onError?: (error: Error) => void
}

export interface SyncProgress {
  operationId: string
  entityType: string
  totalRecords: number
  processedRecords: number
  percentage: number
  currentBatch: number
  totalBatches: number
  message?: string
}

export interface SyncQueueItem {
  id: string
  connectorId: string
  operation: SyncOperation
  scheduledAt: Date
  attempts: number
  maxAttempts: number
  nextAttemptAt?: Date
}

export interface SyncEngineConfig {
  maxConcurrentSyncs: number
  defaultConflictResolution: ConflictResolution
  defaultRetryPolicy: typeof DEFAULT_RETRY_POLICY
  queueRetentionDays: number
  enableDeltaSync: boolean
  autoRetryOnFailure: boolean
  healthCheckIntervalMs: number
}

// ============================================
// SYNC ENGINE CLASS
// ============================================

class SyncEngine {
  private static instance: SyncEngine
  
  private connectors: Map<string, IERPConnector> = new Map()
  private queue: SyncQueueItem[] = []
  private activeOperations: Map<string, SyncOperation> = new Map()
  private config: SyncEngineConfig
  private isProcessing: boolean = false
  private processingInterval?: NodeJS.Timeout
  
  // Event listeners
  private listeners: {
    onSyncStart: Array<(operation: SyncOperation) => void>
    onSyncComplete: Array<(operation: SyncOperation) => void>
    onSyncError: Array<(operation: SyncOperation, error: Error) => void>
    onQueueChange: Array<(queue: SyncQueueItem[]) => void>
  } = {
    onSyncStart: [],
    onSyncComplete: [],
    onSyncError: [],
    onQueueChange: [],
  }
  
  private constructor(config?: Partial<SyncEngineConfig>) {
    this.config = {
      maxConcurrentSyncs: 3,
      defaultConflictResolution: 'LAST_WRITE_WINS',
      defaultRetryPolicy: { ...DEFAULT_RETRY_POLICY },
      queueRetentionDays: 30,
      enableDeltaSync: true,
      autoRetryOnFailure: true,
      healthCheckIntervalMs: 5 * 60 * 1000,
      ...config,
    }
    
    this.startQueueProcessor()
    this.startHealthCheck()
  }
  
  static getInstance(config?: Partial<SyncEngineConfig>): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine(config)
    }
    return SyncEngine.instance
  }
  
  // ============================================
  // CONNECTOR MANAGEMENT
  // ============================================
  
  registerConnector(id: string, connector: IERPConnector): void {
    this.connectors.set(id, connector)
    
    // Set up event handlers
    connector.onError?.((error) => {
      console.error(`Connector ${id} error:`, error.message)
    })
  }
  
  unregisterConnector(id: string): void {
    this.connectors.delete(id)
    // Cancel any pending operations for this connector
    this.queue = this.queue.filter(item => item.connectorId !== id)
  }
  
  getConnector(id: string): IERPConnector | undefined {
    return this.connectors.get(id)
  }
  
  getConnectors(): Map<string, IERPConnector> {
    return new Map(this.connectors)
  }
  
  async testAllConnectors(): Promise<Map<string, { success: boolean; message: string }>> {
    const results = new Map<string, { success: boolean; message: string }>()
    
    for (const [id, connector] of this.connectors) {
      try {
        const result = await connector.testConnection()
        results.set(id, { success: result.success, message: result.message })
      } catch (error) {
        results.set(id, {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }
    
    return results
  }
  
  // ============================================
  // SYNC OPERATIONS
  // ============================================
  
  async triggerSync(
    connectorId: string,
    direction: SyncDirection,
    entityType: string,
    options?: Partial<SyncOptions>
  ): Promise<SyncOperation> {
    const connector = this.connectors.get(connectorId)
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`)
    }
    
    const operation: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      connectorId,
      entityType,
      direction,
      status: 'QUEUED',
      priority: 10,
      options: {
        conflictResolution: this.config.defaultConflictResolution,
        batchSize: 50,
        ...options,
      },
      createdAt: new Date(),
    }
    
    // Add to queue
    const queueItem: SyncQueueItem = {
      id: operation.id,
      connectorId,
      operation,
      scheduledAt: new Date(),
      attempts: 0,
      maxAttempts: this.config.defaultRetryPolicy.maxRetries + 1,
    }
    
    this.queue.push(queueItem)
    this.sortQueue()
    this.emit('onQueueChange', [...this.queue])
    
    // Log to database
    await this.createSyncLog(operation)
    
    return operation
  }
  
  async triggerFullSync(
    connectorId: string,
    options?: Partial<SyncOptions>
  ): Promise<SyncOperation[]> {
    const operations: SyncOperation[] = []
    const entityTypes = ['PRODUCTS', 'INVENTORY', 'ORDERS', 'CUSTOMERS', 'PRICES']
    
    for (const entityType of entityTypes) {
      const operation = await this.triggerSync(
        connectorId,
        'BIDIRECTIONAL',
        entityType,
        { ...options, fullSync: true }
      )
      operations.push(operation)
    }
    
    return operations
  }
  
  async cancelOperation(operationId: string): Promise<boolean> {
    const operation = this.activeOperations.get(operationId)
    if (operation && (operation.status === 'RUNNING' || operation.status === 'QUEUED')) {
      operation.status = 'CANCELLED'
      this.activeOperations.delete(operationId)
      
      // Remove from queue
      this.queue = this.queue.filter(item => item.id !== operationId)
      this.emit('onQueueChange', [...this.queue])
      
      return true
    }
    
    return false
  }
  
  getQueue(): SyncQueueItem[] {
    return [...this.queue]
  }
  
  getActiveOperations(): SyncOperation[] {
    return Array.from(this.activeOperations.values())
  }
  
  // ============================================
  // SYNC EXECUTION
  // ============================================
  
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return
    
    const activeCount = Array.from(this.activeOperations.values()).filter(
      op => op.status === 'RUNNING'
    ).length
    
    if (activeCount >= this.config.maxConcurrentSyncs) return
    if (this.queue.length === 0) return
    
    this.isProcessing = true
    
    try {
      const nextItem = this.queue.shift()
      if (!nextItem) return
      
      // Check if it's time to execute
      if (nextItem.nextAttemptAt && nextItem.nextAttemptAt > new Date()) {
        this.queue.unshift(nextItem)
        return
      }
      
      await this.executeOperation(nextItem)
    } finally {
      this.isProcessing = false
      this.emit('onQueueChange', [...this.queue])
    }
  }
  
  private async executeOperation(queueItem: SyncQueueItem): Promise<void> {
    const { operation, connectorId } = queueItem
    const connector = this.connectors.get(connectorId)
    
    if (!connector) {
      operation.status = 'FAILED'
      operation.result = {
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 1,
        errors: [{ code: 'CONNECTOR_NOT_FOUND', message: `Connector ${connectorId} not found`, retryable: false }],
        durationMs: 0,
        startedAt: new Date(),
        completedAt: new Date(),
      }
      return
    }
    
    operation.status = 'RUNNING'
    operation.startedAt = new Date()
    this.activeOperations.set(operation.id, operation)
    
    this.emit('onSyncStart', operation)
    
    try {
      let result: SyncResult
      
      switch (operation.direction) {
        case 'PUSH':
          result = await this.executePushSync(connector, operation)
          break
        case 'PULL':
          result = await this.executePullSync(connector, operation)
          break
        case 'BIDIRECTIONAL':
          result = await this.executeBidirectionalSync(connector, operation)
          break
        default:
          throw new Error(`Unknown sync direction: ${operation.direction}`)
      }
      
      operation.status = result.success ? 'COMPLETED' : (result.recordsFailed > 0 ? 'PARTIAL' : 'FAILED')
      operation.result = result
      operation.completedAt = new Date()
      
      // Update database log
      await this.updateSyncLog(operation, result)
      
      this.emit('onSyncComplete', operation)
      operation.options.onComplete?.(result)
      
    } catch (error) {
      operation.status = 'FAILED'
      operation.result = {
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 1,
        errors: [{
          code: 'SYNC_ERROR',
          message: error instanceof Error ? error.message : String(error),
          retryable: true,
        }],
        durationMs: operation.startedAt ? Date.now() - operation.startedAt.getTime() : 0,
        startedAt: operation.startedAt || new Date(),
        completedAt: new Date(),
      }
      operation.completedAt = new Date()
      
      queueItem.attempts++
      
      // Retry logic
      if (this.config.autoRetryOnFailure && queueItem.attempts < queueItem.maxAttempts) {
        const delay = this.calculateRetryDelay(queueItem.attempts)
        queueItem.nextAttemptAt = new Date(Date.now() + delay)
        this.queue.push(queueItem)
        console.log(`Scheduling retry ${queueItem.attempts}/${queueItem.maxAttempts} for operation ${operation.id}`)
      }
      
      this.emit('onSyncError', operation, error instanceof Error ? error : new Error(String(error)))
      operation.options.onError?.(error instanceof Error ? error : new Error(String(error)))
      
      await this.updateSyncLog(operation, operation.result!)
    } finally {
      this.activeOperations.delete(operation.id)
    }
  }
  
  private async executePushSync(connector: IERPConnector, operation: SyncOperation): Promise<SyncResult> {
    const startTime = Date.now()
    
    switch (operation.entityType) {
      case 'PRODUCTS': {
        // Get local products and push to ERP
        const products = await this.getLocalProducts(operation.options.lastSyncTimestamp)
        
        if (operation.options.dryRun) {
          return this.createDryRunResult(products.length, startTime)
        }
        
        const batches = this.chunkArray(products, operation.options.batchSize || 50)
        let created = 0
        let updated = 0
        let failed = 0
        const errors: any[] = []
        
        for (let i = 0; i < batches.length; i++) {
          operation.options.onProgress?.({
            operationId: operation.id,
            entityType: operation.entityType,
            totalRecords: products.length,
            processedRecords: Math.min((i + 1) * (operation.options.batchSize || 50), products.length),
            percentage: Math.round(((i + 1) / batches.length) * 100),
            currentBatch: i + 1,
            totalBatches: batches.length,
            message: `Pushing batch ${i + 1}/${batches.length}`,
          })
          
          try {
            const result = await connector.syncInventory(batches[i])
            created += result.recordsCreated
            updated += result.recordsUpdated
            failed += result.recordsFailed
            errors.push(...result.errors)
          } catch (error) {
            failed += batches[i].length
            errors.push({
              code: 'BATCH_ERROR',
              message: error instanceof Error ? error.message : String(error),
              retryable: true,
            })
          }
        }
        
        return this.createSyncResult(created + updated + failed, created, updated, failed, errors, startTime)
      }
      
      case 'INVENTORY': {
        const inventoryData = await this.getLocalInventory()
        const result = await connector.syncInventory(inventoryData)
        result.durationMs = Date.now() - startTime
        return result
      }
      
      case 'ORDERS': {
        const orders = await this.getLocalOrders(operation.options.lastSyncTimestamp)
        let created = 0
        let failed = 0
        const errors: any[] = []
        
        for (const order of orders) {
          try {
            await connector.pushOrder(order)
            created++
          } catch (error) {
            failed++
            errors.push({
              recordId: order.id,
              code: 'PUSH_ORDER_ERROR',
              message: error instanceof Error ? error.message : String(error),
              retryable: true,
            })
          }
        }
        
        return this.createSyncResult(orders.length, created, 0, failed, errors, startTime)
      }
      
      default:
        throw new Error(`Push sync not supported for entity type: ${operation.entityType}`)
    }
  }
  
  private async executePullSync(connector: IERPConnector, operation: SyncOperation): Promise<SyncResult> {
    const startTime = Date.now()
    
    switch (operation.entityType) {
      case 'PRODUCTS': {
        const fetchOptions = operation.options.fullSync 
          ? undefined 
          : { modifiedSince: operation.options.lastSyncTimestamp }
        
        const products = await connector.fetchProducts(fetchOptions)
        
        let created = 0
        let updated = 0
        let failed = 0
        const errors: any[] = []
        
        for (let i = 0; i < products.length; i++) {
          operation.options.onProgress?.({
            operationId: operation.id,
            entityType: operation.entityType,
            totalRecords: products.length,
            processedRecords: i + 1,
            percentage: Math.round(((i + 1) / products.length) * 100),
            currentBatch: Math.floor(i / (operation.options.batchSize || 50)) + 1,
            totalBatches: Math.ceil(products.length / (operation.options.batchSize || 50)),
            message: `Processing product ${i + 1}/${products.length}`,
          })
          
          try {
            const transformed = await connector.transformData(products[i], 'fromERP')
            await this.upsertLocalProduct(transformed, operation.options.conflictResolution)
            
            // Check if product exists to determine create vs update
            const existing = await this.findLocalProductBySKU(products[i].sku)
            if (existing) updated++
            else created++
          } catch (error) {
            failed++
            errors.push({
              recordId: products[i].id,
              code: 'PULL_PRODUCT_ERROR',
              message: error instanceof Error ? error.message : String(error),
              retryable: true,
            })
          }
        }
        
        return this.createSyncResult(products.length, created, updated, failed, errors, startTime)
      }
      
      case 'INVENTORY': {
        const updates = await connector.fetchInventoryUpdates()
        
        for (const update of updates) {
          await this.updateLocalInventory(update)
        }
        
        return this.createSyncResult(updates.length, 0, updates.length, 0, [], startTime)
      }
      
      case 'ORDERS': {
        const orders = await connector.pullOrders()
        
        for (const order of orders) {
          await this.upsertLocalOrder(order)
        }
        
        return this.createSyncResult(orders.length, orders.length, 0, 0, [], startTime)
      }
      
      default:
        throw new Error(`Pull sync not supported for entity type: ${operation.entityType}`)
    }
  }
  
  private async executeBidirectionalSync(connector: IERPConnector, operation: SyncOperation): Promise<SyncResult> {
    const startTime = Date.now()
    
    // Execute both push and pull, then merge results
    const pushResult = await this.executePushSync(connector, operation)
    const pullResult = await this.executePullSync(connector, operation)
    
    return {
      success: pushResult.success && pullResult.success,
      recordsProcessed: pushResult.recordsProcessed + pullResult.recordsProcessed,
      recordsCreated: pushResult.recordsCreated + pullResult.recordsCreated,
      recordsUpdated: pushResult.recordsUpdated + pullResult.recordsUpdated,
      recordsFailed: pushResult.recordsFailed + pullResult.recordsFailed,
      errors: [...pushResult.errors, ...pullResult.errors],
      durationMs: Date.now() - startTime,
      startedAt: pushResult.startedAt,
      completedAt: new Date(),
    }
  }
  
  // ============================================
  // CONFLICT RESOLUTION
  // ============================================
  
  async resolveConflict(
    localData: any,
    erpData: any,
    strategy: ConflictResolution = this.config.defaultConflictResolution
  ): Promise<any> {
    switch (strategy) {
      case 'LAST_WRITE_WINS':
        const localDate = new Date(localData.updatedAt || localData.updated_at || 0)
        const erpDate = new Date(erpData.updatedAt || erpData.updated_at || 0)
        return localDate > erpDate ? localData : erpData
        
      case 'PLATFORM_WINS':
        return localData
        
      case 'ERP_WINS':
        return erpData
        
      case 'MERGE':
        return this.mergeObjects(localData, erpData)
        
      case 'MANUAL':
        // Return both for manual review
        return {
          _conflict: true,
          _local: localData,
          _erp: erpData,
        }
        
      default:
        return erpData
    }
  }
  
  private mergeObjects(target: any, source: any): any {
    const result = { ...target }
    
    for (const key of Object.keys(source)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = this.mergeObjects(result[key] || {}, source[key])
      } else if (source[key] !== undefined && source[key] !== null) {
        result[key] = source[key]
      }
    }
    
    return result
  }
  
  // ============================================
  // DATABASE HELPERS
  // ============================================
  
  private async createSyncLog(operation: SyncOperation): Promise<void> {
    try {
      await db.erpSyncLogNew.create({
        data: {
          id: operation.id,
          connectorId: operation.connectorId,
          direction: operation.direction,
          entityType: operation.entityType,
          status: operation.status,
          startedAt: operation.createdAt,
        },
      })
    } catch (error) {
      console.error('Failed to create sync log:', error)
    }
  }
  
  private async updateSyncLog(operation: SyncOperation, result: SyncResult): Promise<void> {
    try {
      await db.erpSyncLogNew.update({
        where: { id: operation.id },
        data: {
          status: operation.status,
          recordsProcessed: result.recordsProcessed,
          recordsSuccess: result.recordsSuccess || result.recordsCreated + result.recordsUpdated,
          recordsFailed: result.recordsFailed,
          durationSeconds: Math.round(result.durationMs / 1000),
          completedAt: result.completedAt,
          errorMessage: result.errors.length > 0 
            ? JSON.stringify(result.errors.slice(0, 5)) 
            : undefined,
          details: JSON.stringify({
            direction: operation.direction,
            entityType: operation.entityType,
          }),
        },
      })
    } catch (error) {
      console.error('Failed to update sync log:', error)
    }
  }
  
  private async getLocalProducts(modifiedSince?: Date): Promise<any[]> {
    const where: any = { status: 'published' }
    if (modifiedSince) {
      where.updatedAt = { gte: modifiedSince }
    }
    
    return db.product.findMany({ where })
  }
  
  private async findLocalProductBySKU(sku?: string): Promise<any> {
    if (!sku) return null
    return db.product.findFirst({ where: { sku } })
  }
  
  private async upsertLocalProduct(data: any, conflictResolution?: ConflictResolution): Promise<any> {
    const existing = data.sku ? await this.findLocalProductBySKU(data.sku) : null
    
    if (existing) {
      const resolved = conflictResolution && conflictResolution !== 'PLATFORM_WINS'
        ? await this.resolveConflict(existing, data, conflictResolution)
        : data
        
      return db.product.update({
        where: { id: existing.id },
        data: resolved,
      })
    } else {
      return db.product.create({ data })
    }
  }
  
  private async getLocalInventory(): Promise<Partial<Product>[]> {
    const products = await db.product.findMany({
      where: { status: 'published' },
      select: { id: true, sku: true, name: true, availability: true },
    })
    
    return products.map(p => ({
      ...p,
      quantity: p.availability === 'in_stock' ? 50 : p.availability === 'low_stock' ? 5 : 0,
    }))
  }
  
  private async updateLocalInventory(update: { productId: string; newQuantity: number }): Promise<void> {
    const availability = update.newQuantity <= 0 ? 'out_of_stock' :
                          update.newQuantity <= 10 ? 'low_stock' : 'in_stock'
    
    await db.product.update({
      where: { id: update.productId },
      data: { availability, updatedAt: new Date() },
    })
  }
  
  private async getLocalOrders(modifiedSince?: Date): Promise<any[]> {
    const where: any = {}
    if (modifiedSince) {
      where.createdAt = { gte: modifiedSince }
    }
    
    return db.order.findMany({ where })
  }
  
  private async upsertLocalOrder(order: any): Promise<any> {
    const existing = order.orderNumber 
      ? await db.order.findFirst({ where: { orderNumber: order.orderNumber } })
      : null
      
    if (existing) {
      return db.order.update({ where: { id: existing.id }, data: order })
    } else {
      return db.order.create({ data: order })
    }
  }
  
  // ============================================
  // SCHEDULED SYNC
  // ============================================
  
  startScheduledSync(connectorId: string, frequency: SyncFrequency, entityTypes?: string[]): void {
    const intervalMs = this.getIntervalFromFrequency(frequency)
    
    if (intervalMs > 0) {
      setInterval(async () => {
        const types = entityTypes || ['PRODUCTS', 'INVENTORY']
        for (const entityType of types) {
          await this.triggerSync(connectorId, 'BIDIRECTIONAL', entityType)
        }
      }, intervalMs)
    }
  }
  
  private getIntervalFromFrequency(frequency: SyncFrequency): number {
    switch (frequency) {
      case 'REALTIME':
      case 'EVERY_5_MIN':
        return 5 * 60 * 1000
      case 'EVERY_15_MIN':
        return 15 * 60 * 1000
      case 'EVERY_30_MIN':
        return 30 * 60 * 1000
      case 'HOURLY':
        return 60 * 60 * 1000
      case 'DAILY':
        return 24 * 60 * 60 * 1000
      case 'WEEKLY':
        return 7 * 24 * 60 * 60 * 1000
      case 'MANUAL':
        return 0
      default:
        return 0
    }
  }
  
  // ============================================
  // HEALTH CHECK & CLEANUP
  // ============================================
  
  private startHealthCheck(): void {
    setInterval(async () => {
      await this.performHealthCheck()
    }, this.config.healthCheckIntervalMs)
  }
  
  async performHealthCheck(): Promise<{
    healthy: number
    degraded: number
    unhealthy: number
    details: Map<string, any>
  }> {
    const details = new Map<string, any>()
    let healthy = 0
    let degraded = 0
    let unhealthy = 0
    
    for (const [id, connector] of this.connectors) {
      try {
        const check = await connector.healthCheck()
        details.set(id, check)
        
        switch (check.status) {
          case 'healthy': healthy++; break
          case 'degraded': degraded++; break
          case 'unhealthy': unhealthy++; break
        }
      } catch (error) {
        unhealthy++
        details.set(id, { status: 'unhealthy', error: error instanceof Error ? error.message : String(error) })
      }
    }
    
    return { healthy, degraded, unhealthy, details }
  }
  
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    const result = await db.erpSyncLogNew.deleteMany({
      where: { startedAt: { lt: cutoffDate } },
    })
    
    return result.count
  }
  
  // ============================================
  // EVENT SYSTEM
  // ============================================
  
  on(event: 'onSyncStart' | 'onSyncComplete' | 'onSyncError' | 'onQueueChange', callback: (...args: any[]) => any): void {
    this.listeners[event].push(callback as any)
  }
  
  off(event: 'onSyncStart' | 'onSyncComplete' | 'onSyncError' | 'onQueueChange', callback: (...args: any[]) => any): void {
    const index = this.listeners[event].indexOf(callback as any)
    if (index > -1) {
      this.listeners[event].splice(index, 1)
    }
  }
  
  private emit(event: keyof SyncEngine['listeners'], data: any): void {
    this.listeners[event].forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Event listener error (${event}):`, error)
      }
    })
  }
  
  // ============================================
  // QUEUE PROCESSING
  // ============================================
  
  private startQueueProcessor(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue()
    }, 1000) // Check every second
  }
  
  stopQueueProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
    }
  }
  
  private sortQueue(): void {
    this.queue.sort((a, b) => a.operation.priority - b.operation.priority)
  }
  
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.defaultRetryPolicy.baseDelayMs
    const multiplier = this.config.defaultRetryPolicy.backoffMultiplier
    const maxDelay = this.config.defaultRetryPolicy.maxDelayMs
    
    return Math.min(baseDelay * Math.pow(multiplier, attempt), maxDelay)
  }
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
  
  private createDryRunResult(count: number, startTime: number): SyncResult {
    return {
      success: true,
      recordsProcessed: count,
      recordsCreated: count,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: [],
      durationMs: Date.now() - startTime,
      startedAt: new Date(startTime),
      completedAt: new Date(),
    }
  }
  
  private createSyncResult(
    processed: number,
    created: number,
    updated: number,
    failed: number,
    errors: any[],
    startTime: number
  ): SyncResult {
    return {
      success: failed === 0,
      recordsProcessed: processed,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsFailed: failed,
      errors,
      durationMs: Date.now() - startTime,
      startedAt: new Date(startTime),
      completedAt: new Date(),
    }
  }
  
  // Shutdown
  async shutdown(): Promise<void> {
    this.stopQueueProcessor()
    
    // Disconnect all connectors
    for (const [id, connector] of this.connectors) {
      try {
        await connector.disconnect()
      } catch (error) {
        console.error(`Error disconnecting connector ${id}:`, error)
      }
    }
    
    this.connectors.clear()
    this.queue = []
    this.activeOperations.clear()
  }
}

// Export singleton instance
export const syncEngine = SyncEngine.getInstance()

export default SyncEngine
