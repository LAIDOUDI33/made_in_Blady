// Inventory Synchronization Service
// Real-time stock level sync, low stock alerts, price synchronization
// AlgeriaTrade.dz B2B Platform - Phase 8J

import { db } from '@/lib/db'
import { ERPConfig, EntityType, SyncDirection, SyncFrequency, SyncStatus } from './integration-framework'
import { v4 as uuidv4 } from 'uuid'

// ============================================
// TYPES
// ============================================

export interface InventorySyncRule {
  id: string
  erpConfigId: string
  productCategory?: string
  syncFrequency: SyncFrequency
  conflictResolution: 'PLATFORM_WINS' | 'ERP_WINS' | 'MANUAL' | 'LATEST_WINS'
  lowStockThreshold: number
  enableBackorders: boolean
  reserveStockOnOrder: boolean
  
  // Additional settings
  autoReorder?: boolean
  reorderPoint?: number
  reorderQuantity?: number
  
  createdAt: Date
  updatedAt: Date
}

export interface StockLevel {
  productId: string
  sku?: string
  productName: string
  availableQuantity: number
  reservedQuantity: number
  incomingQuantity: number
  warehouseLocation?: string
  lastUpdated: Date
  source: 'PLATFORM' | 'ERP' | 'MANUAL'
}

export interface InventoryAlert {
  id: string
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'SYNC_ERROR' | 'RESERVATION_FAILED'
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  productId: string
  message: string
  currentStock: number
  threshold: number
  resolved: boolean
  resolvedAt?: Date
  actionTaken?: string
  createdAt: Date
}

export interface PriceSyncRecord {
  id: string
  productId: string
  oldPrice: number
  newPrice: number
  currency: string
  reason: string
  syncedAt: Date
  erpConfigId: string
}

export interface StockReservation {
  id: string
  orderId: string
  productId: string
  quantity: number
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED'
  reservedAt: Date
  expiresAt?: Date
  confirmedAt?: Date
  erpConfigId?: string
}

// ============================================
// INVENTORY SYNC SERVICE
// ============================================

class InventorySyncService {
  private static instance: InventorySyncService
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map()
  
  static getInstance(): InventorySyncService {
    if (!InventorySyncService.instance) {
      InventorySyncService.instance = new InventorySyncService()
    }
    return InventorySyncService.instance
  }

  // ============================================
  // SYNC RULES MANAGEMENT
  // ============================================

  async createSyncRule(data: Omit<InventorySyncRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventorySyncRule> {
    const rule = await db.inventorySyncRule.create({
      data: {
        id: uuidv4(),
        erpConfigId: data.erpConfigId,
        productCategory: data.productCategory,
        syncFrequency: data.syncFrequency,
        conflictResolution: data.conflictResolution,
        lowStockThreshold: data.lowStockThreshold,
        enableBackorders: data.enableBackorders,
        reserveStockOnOrder: data.reserveStockOnOrder,
      },
    })
    
    return this.mapRuleFromDB(rule)
  }

  async getSyncRules(erpConfigId?: string): Promise<InventorySyncRule[]> {
    const where: any = {}
    if (erpConfigId) where.erpConfigId = erpConfigId
    
    const rules = await db.inventorySyncRule.findMany({ where })
    return rules.map(r => this.mapRuleFromDB(r))
  }

  async updateSyncRule(id: string, data: Partial<Omit<InventorySyncRule, 'id' | 'createdAt' | 'updatedAt'>>): Promise<InventorySyncRule> {
    const rule = await db.inventorySyncRule.update({
      where: { id },
      data,
    })
    
    return this.mapRuleFromDB(rule)
  }

  async deleteSyncRule(id: string): Promise<void> {
    await db.inventorySyncRule.delete({ where: { id } })
  }

  // ============================================
  // STOCK SYNCHRONIZATION
  // ============================================

  async syncInventoryForProduct(
    erpConfigId: string,
    productId: string,
    options?: { force?: boolean; dryRun?: boolean }
  ): Promise<{
    success: boolean
    previousStock?: number
    newStock?: number
    conflict?: boolean
    resolution?: string
  }> {
    const config = await db.eRPConfig.findUnique({ where: { id: erpConfigId } })
    if (!config) throw new Error('ERP config not found')
    
    const rule = await this.getEffectiveRule(erpConfigId)
    
    try {
      // Get local stock (would query inventory table)
      const localStock = await this.getLocalStock(productId)
      
      // Get ERP stock via connector
      const erpStock = await this.getERPStock(erpConfigId, productId)
      
      if (options?.dryRun) {
        return {
          success: true,
          previousStock: localStock?.availableQuantity,
          newStock: erpStock?.availableQuantity,
          conflict: Math.abs((localStock?.availableQuantity || 0) - (erpStock?.availableQuantity || 0)) > 1,
        }
      }
      
      // Check for conflicts and resolve based on rule
      if (localStock && erpStock && 
          Math.abs(localStock.availableQuantity - erpStock.availableQuantity) > 1) {
        
        let resolvedStock: number
        
        switch (rule.conflictResolution) {
          case 'PLATFORM_WINS':
            resolvedStock = localStock.availableQuantity
            await this.pushStockToERP(erpConfigId, productId, resolvedStock)
            break
            
          case 'ERP_WINS':
            resolvedStock = erpStock.availableQuantity
            await this.updateLocalStock(productId, resolvedStock)
            break
            
          case 'LATEST_WINS':
            resolvedStock = erpStock.lastUpdated > localStock.lastUpdated 
              ? erpStock.availableQuantity 
              : localStock.availableQuantity
            break
            
          case 'MANUAL':
            // Create alert for manual review
            await this.createInventoryAlert({
              type: 'SYNC_ERROR',
              severity: 'WARNING',
              productId,
              message: `Stock mismatch detected. Local: ${localStock.availableQuantity}, ERP: ${erpStock.availableQuantity}`,
              currentStock: localStock.availableQuantity,
              threshold: erpStock.availableQuantity,
            })
            
            return {
              success: false,
              previousStock: localStock.availableQuantity,
              newStock: erpStock.availableQuantity,
              conflict: true,
              resolution: 'MANUAL_REVIEW_REQUIRED',
            }
          
          default:
            resolvedStock = erpStock.availableQuantity
        }
        
        return {
          success: true,
          previousStock: localStock.availableQuantity,
          newStock: resolvedStock,
          conflict: true,
          resolution: rule.conflictResolution,
        }
      }
      
      // No conflict, update if needed
      if (erpStock && (!localStock || erpStock.lastUpdated > localStock.lastUpdated || options?.force)) {
        await this.updateLocalStock(productId, erpStock.availableQuantity)
        
        return {
          success: true,
          previousStock: localStock?.availableQuantity,
          newStock: erpStock.availableQuantity,
        }
      }
      
      return { success: true }
      
    } catch (error: any) {
      console.error(`Failed to sync inventory for product ${productId}:`, error)
      
      await this.createInventoryAlert({
        type: 'SYNC_ERROR',
        severity: 'CRITICAL',
        productId,
        message: `Inventory sync failed: ${error.message}`,
        currentStock: 0,
        threshold: 0,
      })
      
      return { success: false }
    }
  }

  async syncAllInventory(erpConfigId: string): Promise<{
    totalProducts: number
    synced: number
    failed: number
    alertsCreated: number
  }> {
    const products = await db.product.findMany({
      where: { status: 'published' },
      select: { id: true },
    })
    
    let synced = 0
    let failed = 0
    
    for (const product of products) {
      try {
        const result = await this.syncInventoryForProduct(erpConfigId, product.id)
        if (result.success) synced++
        else failed++
      } catch (error) {
        failed++
      }
    }
    
    return {
      totalProducts: products.length,
      synced,
      failed,
      alertsCreated: 0, // Would count actual alerts created
    }
  }

  // ============================================
  // LOW STOCK ALERTS
  // ============================================

  async checkLowStock(erpConfigId: string): Promise<InventoryAlert[]> {
    const rule = await this.getEffectiveRule(erpConfigId)
    const alerts: InventoryAlert[] = []
    
    // Get all products with their stock levels
    const products = await db.product.findMany({
      where: { status: 'published' },
      include: { _count: { select: { orderItems: true } } },
    })
    
    for (const product of products) {
      const stock = await this.getLocalStock(product.id)
      const quantity = stock?.availableQuantity ?? 0
      
      // Check against threshold
      if (quantity <= rule.lowStockThreshold) {
        const alertType = quantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
        const severity = quantity === 0 ? 'CRITICAL' : 'WARNING'
        
        // Check if unresolved alert already exists
        const existingAlert = await this.getUnresolvedAlert(product.id, alertType)
        
        if (!existingAlert) {
          const alert = await this.createInventoryAlert({
            type: alertType,
            severity,
            productId: product.id,
            message: `${product.name} is ${quantity === 0 ? 'out of stock' : `running low (${quantity} units remaining)`}. Threshold: ${rule.lowStockThreshold} units.`,
            currentStock: quantity,
            threshold: rule.lowStockThreshold,
          })
          
          alerts.push(alert)
        }
      }
      
      // Check for overstock (optional)
      if (quantity > rule.lowStockThreshold * 10) {
        const existingAlert = await this.getUnresolvedAlert(product.id, 'OVERSTOCK')
        
        if (!existingAlert) {
          const alert = await this.createInventoryAlert({
            type: 'OVERSTOCK',
            severity: 'INFO',
            productId: product.id,
            message: `${product.name} has high stock level (${quantity} units). Consider reducing orders.`,
            currentStock: quantity,
            threshold: rule.lowStockThreshold * 10,
          })
          
          alerts.push(alert)
        }
      }
    }
    
    return alerts
  }

  async getUnresolvedAlerts(severity?: 'INFO' | 'WARNING' | 'CRITICAL'): Promise<InventoryAlert[]> {
    // In production, would query an inventory_alerts table
    return []
  }

  async resolveAlert(alertId: string, actionTaken: string): Promise<void> {
    // Mark alert as resolved
    console.log(`Resolving alert ${alertId}: ${actionTaken}`)
  }

  // ============================================
  // STOCK RESERVATION
  // ============================================

  async reserveStock(
    orderId: string,
    items: Array<{ productId: string; quantity: number }>,
    erpConfigId?: string
  ): Promise<{
    success: boolean
    reservations: StockReservation[]
    errors: Array<{ productId: string; error: string }>
  }> {
    const rule = erpConfigId ? await this.getEffectiveRule(erpConfigId) : null
    
    if (rule && !rule.reserveStockOnOrder) {
      // Don't reserve in ERP, just track locally
      return this.reserveLocally(orderId, items)
    }
    
    const reservations: StockReservation[] = []
    const errors: Array<{ productId: string; error: string }> = []
    
    for (const item of items) {
      try {
        const stock = await this.getLocalStock(item.productId)
        const available = (stock?.availableQuantity ?? 0) - (stock?.reservedQuantity ?? 0)
        
        if (available < item.quantity) {
          if (rule?.enableBackorders) {
            // Allow backorder
            const reservation = await this.createReservation({
              orderId,
              productId: item.productId,
              quantity: item.quantity,
              status: 'PENDING',
              erpConfigId,
            })
            reservations.push(reservation)
          } else {
            errors.push({
              productId: item.productId,
              error: `Insufficient stock. Available: ${available}, Requested: ${item.quantity}`,
            })
          }
        } else {
          // Reserve the stock
          const reservation = await this.createReservation({
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            status: 'CONFIRMED',
            confirmedAt: new Date(),
            erpConfigId,
          })
          reservations.push(reservation)
          
          // Update reserved quantity locally
          await this.updateReservedQuantity(item.productId, item.quantity)
          
          // If ERP integration, also reserve in ERP
          if (erpConfigId) {
            await this.reserveInERP(erpConfigId, item.productId, item.quantity, reservation.id)
          }
        }
      } catch (error: any) {
        errors.push({
          productId: item.productId,
          error: error.message || 'Failed to reserve stock',
        })
      }
    }
    
    return {
      success: errors.length === 0,
      reservations,
      errors,
    }
  }

  async releaseReservation(reservationId: string): Promise<boolean> {
    // Find and update reservation
    const reservation = await this.getReservation(reservationId)
    
    if (!reservation || reservation.status === 'RELEASED') {
      return false
    }
    
    // Release in ERP if applicable
    if (reservation.erpConfigId) {
      await this.releaseFromERP(reservation.erpConfigId, reservation.productId, reservation.quantity)
    }
    
    // Update local reserved quantity
    await this.updateReservedQuantity(reservation.productId, -reservation.quantity)
    
    // Mark as released
    await this.updateReservationStatus(reservationId, 'RELEASED')
    
    return true
  }

  // ============================================
  // PRICE SYNCHRONIZATION
  // ============================================

  async syncPrices(erpConfigId: string, options?: { productIds?: string[]; force?: boolean }): Promise<PriceSyncRecord[]> {
    const config = await db.eRPConfig.findUnique({ where: { id: erpConfigId } })
    if (!config) throw new Error('ERP config not found')
    
    const records: PriceSyncRecord[] = []
    
    const where: any = { status: 'published' }
    if (options?.productIds?.length) where.id = { in: options.productIds }
    
    const products = await db.product.findMany({ where })
    
    for (const product of products) {
      try {
        // Get ERP price
        const erpPrice = await this.getERPPrice(erpConfigId, product.id)
        
        if (erpPrice !== null && erpPrice !== undefined) {
          const currentPrice = product.price || 0
          
          if (Math.abs(currentPrice - erpPrice) > 0.01 || options?.force) {
            // Record the price change
            const record = await this.createPriceSyncRecord({
              productId: product.id,
              oldPrice: currentPrice,
              newPrice: erpPrice,
              currency: 'DZD',
              reason: options?.force ? 'Force sync' : 'Price difference detected',
              erpConfigId,
            })
            
            records.push(record)
            
            // Update local price
            await db.product.update({
              where: { id: product.id },
              data: { price: erpPrice },
            })
          }
        }
      } catch (error: any) {
        console.error(`Failed to sync price for product ${product.id}:`, error)
      }
    }
    
    return records
  }

  // ============================================
  // SCHEDULED SYNC
  // ============================================

  startScheduledSync(erpConfigId: string): void {
    // Stop existing interval if any
    this.stopScheduledSync(erpConfigId)
    
    // Set up interval based on frequency
    const getIntervalMs = (frequency: SyncFrequency): number => {
      switch (frequency) {
        case 'REALTIME': return 5 * 60 * 1000 // 5 minutes (realistic minimum)
        case 'EVERY_5_MIN': return 5 * 60 * 1000
        case 'HOURLY': return 60 * 60 * 1000
        case 'DAILY': return 24 * 60 * 60 * 1000
        default: return 24 * 60 * 60 * 1000
      }
    }
    
    const interval = setInterval(async () => {
      try {
        await this.syncAllInventory(erpConfigId)
        await this.checkLowStock(erpConfigId)
      } catch (error) {
        console.error(`Scheduled sync failed for ERP ${erpConfigId}:`, error)
      }
    }, getIntervalMs('HOURLY')) // Default to hourly
    
    this.syncIntervals.set(erpConfigId, interval)
  }

  stopScheduledSync(erpConfigId: string): void {
    const interval = this.syncIntervals.get(erpConfigId)
    if (interval) {
      clearInterval(interval)
      this.syncIntervals.delete(erpConfigId)
    }
  }

  stopAllScheduledSyncs(): void {
    for (const [erpConfigId] of this.syncIntervals) {
      this.stopScheduledSync(erpConfigId)
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async getEffectiveRule(erpConfigId: string): Promise<InventorySyncRule> {
    // Try to find specific rule for this ERP config
    let rule = await db.inventorySyncRule.findFirst({
      where: { erpConfigId },
    })
    
    // Return default rule if none exists
    if (!rule) {
      rule = await db.inventorySyncRule.create({
        data: {
          id: uuidv4(),
          erpConfigId,
          syncFrequency: 'HOURLY',
          conflictResolution: 'ERP_WINS',
          lowStockThreshold: 10,
          enableBackorders: false,
          reserveStockOnOrder: true,
        },
      })
    }
    
    return this.mapRuleFromDB(rule)
  }

  private async getLocalStock(productId: string): Promise<StockLevel | null> {
    // In production, would query a dedicated stock/inventory table
    // For now, returning mock data or querying product availability
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, availability: true, moq: true },
    })
    
    if (!product) return null
    
    // Mock implementation - in real scenario, this would come from inventory table
    return {
      productId: product.id,
      productName: product.name,
      availableQuantity: product.availability === 'in_stock' ? 50 : 
                         product.availability === 'low_stock' ? 5 : 0,
      reservedQuantity: 0,
      incomingQuantity: 0,
      lastUpdated: new Date(),
      source: 'PLATFORM',
    }
  }

  private async getERPStock(erpConfigId: string, productId: string): Promise<StockLevel | null> {
    // This would use the appropriate ERP connector to fetch stock
    // For now, returning null to indicate no ERP stock data
    return null
  }

  private async getERPPrice(erpConfigId: string, productId: string): Promise<number | null> {
    // This would use the appropriate ERP connector to fetch price
    return null
  }

  private async updateLocalStock(productId: string, quantity: number): Promise<void> {
    // Update availability status based on quantity
    const availability = quantity <= 0 ? 'out_of_stock' :
                          quantity <= 10 ? 'low_stock' : 'in_stock'
    
    await db.product.update({
      where: { id: productId },
      data: { availability, updatedAt: new Date() },
    })
  }

  private async updateReservedQuantity(productId: string, delta: number): Promise<void> {
    // Would update reserved quantity in inventory table
    console.log(`Updating reserved quantity for ${productId}: ${delta > 0 ? '+' : ''}${delta}`)
  }

  private async pushStockToERP(erpConfigId: string, productId: string, quantity: number): Promise<void> {
    // Push updated stock to ERP
    console.log(`Pushing stock to ERP ${erpConfigId}: Product ${productId} = ${quantity}`)
  }

  private async createInventoryAlert(data: Omit<InventoryAlert, 'id' | 'resolved' | 'createdAt'>): Promise<InventoryAlert> {
    // Would insert into inventory_alerts table
    const alert: InventoryAlert = {
      ...data,
      id: uuidv4(),
      resolved: false,
      createdAt: new Date(),
    }
    
    console.log(`Creating inventory alert: ${data.message}`)
    return alert
  }

  private async getUnresolvedAlert(productId: string, type: string): Promise<InventoryAlert | null> {
    // Would query inventory_alerts table
    return null
  }

  private async createReservation(data: {
    orderId: string
    productId: string
    quantity: number
    status: StockReservation['status']
    confirmedAt?: Date
    erpConfigId?: string
  }): Promise<StockReservation> {
    const reservation: StockReservation = {
      ...data,
      id: uuidv4(),
      reservedAt: new Date(),
    }
    
    console.log(`Creating stock reservation: Order ${data.orderId}, Product ${data.productId}`)
    return reservation
  }

  private async getReservation(reservationId: string): Promise<StockReservation | null> {
    // Would query stock_reservations table
    return null
  }

  private async updateReservationStatus(reservationId: string, status: StockReservation['status']): Promise<void> {
    console.log(`Updating reservation ${reservationId} status to ${status}`)
  }

  private async reserveInERP(erpConfigId: string, productId: string, quantity: number, reservationId: string): Promise<void> {
    console.log(`Reserving in ERP ${erpConfigId}: Product ${productId}, Qty: ${quantity}`)
  }

  private async releaseFromERP(erpConfigId: string, productId: string, quantity: number): Promise<void> {
    console.log(`Releasing from ERP ${erpConfigId}: Product ${productId}, Qty: ${quantity}`)
  }

  private async reserveLocally(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<{
    success: boolean
    reservations: StockReservation[]
    errors: Array<{ productId: string; error: string }>
  }> {
    const reservations: StockReservation[] = []
    
    for (const item of items) {
      const reservation = await this.createReservation({
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      })
      reservations.push(reservation)
    }
    
    return { success: true, reservations, errors: [] }
  }

  private async createPriceSyncRecord(data: {
    productId: string
    oldPrice: number
    newPrice: number
    currency: string
    reason: string
    erpConfigId: string
  }): Promise<PriceSyncRecord> {
    const record: PriceSyncRecord = {
      ...data,
      id: uuidv4(),
      syncedAt: new Date(),
    }
    
    console.log(`Creating price sync record: Product ${data.productId}`)
    return record
  }

  private mapRuleFromDB(dbRule: any): InventorySyncRule {
    return {
      id: dbRule.id,
      erpConfigId: dbRule.erpConfigId,
      productCategory: dbRule.productCategory || undefined,
      syncFrequency: dbRule.syncFrequency as SyncFrequency,
      conflictResolution: dbRule.conflictResolution as InventorySyncRule['conflictResolution'],
      lowStockThreshold: dbRule.lowStockThreshold,
      enableBackorders: dbRule.enableBackorders,
      reserveStockOnOrder: dbRule.reserveStockOnOrder,
      createdAt: dbRule.createdAt,
      updatedAt: dbRule.updatedAt,
    }
  }
}

// Export singleton instance
export const inventorySyncService = InventorySyncService.getInstance()
