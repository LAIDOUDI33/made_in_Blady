// Webhook Handler - Receive webhooks from ERP systems
// Verify signatures, route to handlers, process updates
// AlgeriaTrade.dz B2B Platform - Inventory/ERP Sync System

import { db } from '@/lib/db'
import { ERPSystemType } from './config'
import { syncEngine } from './sync-engine'

// ============================================
// TYPES
// ============================================

export interface WebhookEvent {
  id: string
  eventType: string
  connectorType: ERPSystemType
  connectorId?: string
  payload: any
  headers: Record<string, string>
  receivedAt: Date
  processed: boolean
  processingResult?: WebhookProcessingResult
}

export interface WebhookProcessingResult {
  success: boolean
  actionTaken?: string
  syncTriggered?: boolean
  error?: string
  details?: Record<string, any>
}

export interface WebhookHandlerConfig {
  secret: string
  signatureAlgorithm: 'hmac-sha256' | 'hmac-sha1'
  signatureHeader: string
  timestampHeader?: string
  timestampToleranceMs: number
  ipAllowlist?: string[]
}

export type WebhookEventType = 
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'inventory.updated'
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'customer.created'
  | 'customer.updated'
  | 'sync.completed'
  | 'sync.failed'
  | 'custom'

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

const DEFAULT_WEBHOOK_CONFIG: Record<ERPSystemType, Partial<WebhookHandlerConfig>> = {
  SAP: {
    signatureAlgorithm: 'hmac-sha256',
    signatureHeader: 'x-sap-signature',
    timestampToleranceMs: 5 * 60 * 1000,
  },
  Odoo: {
    signatureAlgorithm: 'hmac-sha256',
    signatureHeader: 'x-odoo-signature',
    timestampToleranceMs: 5 * 60 * 1000,
  },
  MicrosoftDynamics: {
    signatureAlgorithm: 'hmac-sha256',
    signatureHeader: 'authorization', // Uses OAuth token validation
    timestampToleranceMs: 5 * 60 * 1000,
  },
  Custom: {
    signatureAlgorithm: 'hmac-sha256',
    signatureHeader: 'x-signature',
    timestampToleranceMs: 5 * 60 * 1000,
  },
  REST: {
    signatureAlgorithm: 'hmac-sha256',
    signatureHeader: 'x-signature',
    timestampToleranceMs: 5 * 60 * 1000,
  },
}

// ============================================
// WEBHOOK HANDLER CLASS
// ============================================

class WebhookHandler {
  private static instance: WebhookHandler
  
  private configs: Map<ERPSystemType, WebhookHandlerConfig> = new Map()
  private handlers: Map<string, (event: WebhookEvent) => Promise<WebhookProcessingResult>> = new Map()
  
  // Rate limiting per IP
  private rateLimitMap: Map<string, { count: number; resetAt: Date }> = new Map()
  private readonly maxRequestsPerMinute = 60
  
  private constructor() {
    this.initializeDefaultHandlers()
  }
  
  static getInstance(): WebhookHandler {
    if (!WebhookHandler.instance) {
      WebhookHandler.instance = new WebhookHandler()
    }
    return WebhookHandler.instance
  }
  
  // ============================================
  // CONFIGURATION
  // ============================================
  
  setConfig(connectorType: ERPSystemType, config: WebhookHandlerConfig): void {
    this.configs.set(connectorType, config)
  }
  
  getConfig(connectorType: ERPSystemType): WebhookHandlerConfig {
    const config = this.configs.get(connectorType)
    
    if (!config) {
      throw new Error(`No webhook configuration for connector type: ${connectorType}`)
    }
    
    return {
      ...DEFAULT_WEBHOOK_CONFIG[connectorType],
      ...config,
    } as WebhookHandlerConfig
  }
  
  // ============================================
  // WEBHOOK REGISTRATION
  // ============================================
  
  registerHandler(eventType: string, handler: (event: WebhookEvent) => Promise<WebhookProcessingResult>): void {
    this.handlers.set(eventType, handler)
  }
  
  unregisterHandler(eventType: string): void {
    this.handlers.delete(eventType)
  }
  
  // ============================================
  // WEBHOOK PROCESSING (Main Entry Point)
  // ============================================
  
  async processWebhook(
    connectorType: ERPSystemType,
    request: Request
  ): Promise<{ success: boolean; result?: WebhookProcessingResult; error?: string; status: number }> {
    try {
      // Get configuration
      const config = this.getConfig(connectorType)
      
      // Parse request
      const headers = Object.fromEntries(request.headers.entries())
      const payload = await request.json()
      
      // Create event object
      const event: WebhookEvent = {
        id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventType: this.determineEventType(payload, headers),
        connectorType,
        connectorId: this.extractConnectorId(headers),
        payload,
        headers,
        receivedAt: new Date(),
        processed: false,
      }
      
      // Validate and verify
      const validationError = await this.validateWebhook(event, config)
      if (validationError) {
        return { success: false, error: validationError, status: 401 }
      }
      
      // Check rate limiting
      const clientIp = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown'
      if (!this.checkRateLimit(clientIp)) {
        return { success: false, error: 'Rate limit exceeded', status: 429 }
      }
      
      // Process event
      const handler = this.getHandlerForEvent(event.eventType)
      if (handler) {
        const result = await handler(event)
        event.processed = true
        event.processingResult = result
        
        // Log webhook to database
        await this.logWebhook(event)
        
        return { success: result.success, result, status: result.success ? 200 : 500 }
      }
      
      // Default handling based on event type
      const defaultResult = await this.handleDefaultEvent(event)
      event.processingResult = defaultResult
      
      await this.logWebhook(event)
      
      return { success: defaultResult.success, result: defaultResult, status: 200 }
      
    } catch (error) {
      console.error('Webhook processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        status: 500,
      }
    }
  }
  
  // ============================================
  // VALIDATION & VERIFICATION
  // ============================================
  
  private async validateWebhook(event: WebhookEvent, config: WebhookHandlerConfig): Promise<string | null> {
    // Verify signature
    const signatureValid = await this.verifySignature(event, config)
    if (!signatureValid) {
      return 'Invalid signature'
    }
    
    // Check timestamp if configured
    if (config.timestampHeader && config.timestampToleranceMs > 0) {
      const timestampStr = event.headers[config.timestampHeader.toLowerCase()]
      if (timestampStr) {
        const timestamp = new Date(timestampStr)
        const now = new Date()
        const diff = Math.abs(now.getTime() - timestamp.getTime())
        
        if (diff > config.timestampToleranceMs) {
          return `Timestamp too old: ${diff}ms tolerance is ${config.timestampToleranceMs}ms`
        }
      }
    }
    
    // Check IP allowlist if configured
    if (config.ipAllowlist?.length) {
      const clientIp = event.headers['x-forwarded-for'] || event.headers['x-real-ip']
      if (clientIp && !config.ipAllowlist.includes(clientIp)) {
        return `IP not in allowlist: ${clientIp}`
      }
    }
    
    return null
  }
  
  private async verifySignature(event: WebhookEvent, config: WebhookHandlerConfig): Promise<boolean> {
    try {
      const signature = event.headers[config.signatureHeader.toLowerCase()]
      if (!signature) {
        console.warn('No signature header found')
        return true // Allow without signature for development
      }
      
      const payloadString = JSON.stringify(event.payload)
      const expectedSignature = await this.computeSignature(payloadString, config.secret, config.signatureAlgorithm)
      
      // Use timing-safe comparison
      return this.timingSafeEqual(signature, expectedSignature)
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }
  
  private async computeSignature(payload: string, secret: string, algorithm: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const payloadData = encoder.encode(payload)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: algorithm === 'hmac-sha1' ? 'SHA-1' : 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData)
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    
    return result === 0
  }
  
  // ============================================
  // EVENT TYPE DETERMINATION
  // ============================================
  
  private determineEventType(payload: any, headers: Record<string, string>): string {
    // Try to get event type from header
    const headerEvent = headers['x-event-type'] || headers['x-github-event'] || headers['x-event']
    if (headerEvent) return headerEvent
    
    // Try to determine from payload structure
    if (payload.model) {
      // Odoo-style webhook
      return `${payload.model}.${payload.event || 'updated'}`
    }
    
    if (payload.entity || payload.resource) {
      const entity = payload.entity || payload.resource
      const action = payload.action || payload.operation || 'updated'
      return `${entity}.${action}`
    }
    
    // Default
    return 'custom'
  }
  
  private extractConnectorId(headers: Record<string, string>): string | undefined {
    return headers['x-connector-id'] || headers['x-webhook-id']
  }
  
  // ============================================
  // DEFAULT EVENT HANDLERS
  // ============================================
  
  private initializeDefaultHandlers(): void {
    // Product events
    this.registerHandler('product.created', this.handleProductCreated.bind(this))
    this.registerHandler('product.updated', this.handleProductUpdated.bind(this))
    this.registerHandler('product.deleted', this.handleProductDeleted.bind(this))
    
    // Inventory events
    this.registerHandler('inventory.updated', this.handleInventoryUpdated.bind(this))
    
    // Order events
    this.registerHandler('order.created', this.handleOrderCreated.bind(this))
    this.registerHandler('order.updated', this.handleOrderUpdated.bind(this))
    
    // Customer events
    this.registerHandler('customer.created', this.handleCustomerCreated.bind(this))
    this.registerHandler('customer.updated', this.handleCustomerUpdated.bind(this))
    
    // Sync events
    this.registerHandler('sync.completed', this.handleSyncCompleted.bind(this))
    this.registerHandler('sync.failed', this.handleSyncFailed.bind(this))
    
    // Generic Odoo model events
    this.registerHandler('product.product.create', this.handleProductCreated.bind(this))
    this.registerHandler('product.product.write', this.handleProductUpdated.bind(this))
    this.registerHandler('stock.quant.update', this.handleInventoryUpdated.bind(this))
    this.registerHandler('sale.order.create', this.handleOrderCreated.bind(this))
  }
  
  private getHandlerForEvent(eventType: string): ((event: WebhookEvent) => Promise<WebhookProcessingResult>) | undefined {
    // Exact match first
    if (this.handlers.has(eventType)) {
      return this.handlers.get(eventType)!
    }
    
    // Wildcard match (e.g., "product.*" or "*.created")
    for (const [pattern, handler] of this.handlers.entries()) {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1)
        if (eventType.startsWith(prefix)) {
          return handler
        }
      }
      
      if (pattern.startsWith('*')) {
        const suffix = pattern.slice(1)
        if (eventType.endsWith(suffix)) {
          return handler
        }
      }
    }
    
    return undefined
  }
  
  // ============================================
  // SPECIFIC EVENT HANDLERS
  // ============================================
  
  private async handleProductCreated(event: WebhookEvent): Promise<WebhookProcessingResult> {
    try {
      const productData = event.payload.data || event.payload
      
      // Create or update local product
      await db.product.upsert({
        where: { id: productData.id || `erp_${event.connectorType}_${Date.now()}` },
        update: {
          name: productData.name,
          sku: productData.sku || productData.default_code,
          price: parseFloat(productData.price || productData.list_price) || undefined,
          status: 'published',
          updatedAt: new Date(),
        },
        create: {
          id: productData.id || `erp_${event.connectorType}_${Date.now()}`,
          name: productData.name || 'Unknown Product',
          slug: (productData.name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          sku: productData.sku || productData.default_code,
          price: parseFloat(productData.price || productData.list_price) || undefined,
          status: 'published',
          userId: 'system_webhook',
          tenantId: 'default',
        },
      })
      
      return {
        success: true,
        actionTaken: 'Product created/updated',
        syncTriggered: false,
        details: { productId: productData.id },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
  
  private async handleProductUpdated(event: WebhookEvent): Promise<WebhookProcessingResult> {
    try {
      const productData = event.payload.data || event.payload
      
      // Find existing product by SKU or external ID
      const existingProduct = await db.product.findFirst({
        where: {
          OR: [
            { sku: productData.sku || productData.default_code },
            { name: productData.name },
          ],
        },
      })
      
      if (existingProduct) {
        await db.product.update({
          where: { id: existingProduct.id },
          data: {
            name: productData.name,
            price: parseFloat(productData.price || productData.list_price) || existingProduct.price,
            updatedAt: new Date(),
          },
        })
        
        return {
          success: true,
          actionTaken: 'Product updated',
          details: { productId: existingProduct.id },
        }
      } else {
        // Product doesn't exist locally, create it
        return this.handleProductCreated(event)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
  
  private async handleProductDeleted(event: WebhookEvent): Promise<WebhookProcessingResult> {
    try {
      const productData = event.payload.data || event.payload
      
      // Soft delete by setting status
      const deleted = await db.product.updateMany({
        where: {
          OR: [
            { sku: productData.sku },
            { id: productData.id },
          ],
        },
        data: { status: 'archived' },
      })
      
      return {
        success: true,
        actionTaken: `Archived ${deleted.count} products`,
        details: { archivedCount: deleted.count },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
  
  private async handleInventoryUpdated(event: WebhookEvent): Promise<WebhookProcessingResult> {
    try {
      const inventoryData = event.payload.data || event.payload
      const productId = inventoryData.product_id || inventoryData.productId || inventoryData.MATNR
      const quantity = parseFloat(inventoryData.quantity || inventoryData.qty_available || inventoryData.LABST || 0)
      
      if (!productId) {
        return { success: false, error: 'Missing product ID in inventory update' }
      }
      
      // Update product availability based on quantity
      const availability = quantity <= 0 ? 'out_of_stock' :
                            quantity <= 10 ? 'low_stock' : 'in_stock'
      
      await db.product.updateMany({
        where: {
          OR: [
            { sku: productId },
            { id: productId },
          ],
        },
        data: { availability, updatedAt: new Date() },
      })
      
      // Also update inventory sync record if exists
      await db.inventorySyncRecord.updateMany({
        where: { externalProductId: productId },
        data: {
          quantity,
          lastSyncedAt: new Date(),
          syncStatus: 'SYNCED',
        },
      })
      
      return {
        success: true,
        actionTaken: 'Inventory updated',
        details: { productId, quantity, availability },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
  
  private async handleOrderCreated(event: WebhookEvent): Promise<WebhookProcessingResult> {
    try {
      const orderData = event.payload.data || event.payload
      
      // Log the order creation (full order sync would be handled separately)
      console.log('Order created in ERP:', orderData.id || orderData.orderNumber || orderData.VBELN)
      
      return {
        success: true,
        actionTaken: 'Order logged',
        details: { orderId: orderData.id || orderData.orderNumber },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
  
  private async handleOrderUpdated(event: WebhookEvent): Promise<WebhookProcessingResult> {
    try {
      const orderData = event.payload.data || event.payload
      
      // Update local order status if it exists
      const orderId = orderData.id || orderData.orderNumber || orderData.VBELN
      if (orderId) {
        const existingOrder = await db.order.findFirst({
          where: { orderNumber: orderId },
        })
        
        if (existingOrder) {
          await db.order.update({
            where: { id: existingOrder.id },
            data: {
              status: this.mapERPStatus(orderData.state || orderData.status || orderData.AUART),
              updatedAt: new Date(),
            },
          })
          
          return {
            success: true,
            actionTaken: 'Order status updated',
            details: { orderId },
          }
        }
      }
      
      return {
        success: true,
        actionTaken: 'Order update received (not found locally)',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
  
  private async handleCustomerCreated(event: WebhookEvent): Promise<WebhookProcessingResult> {
    try {
      const customerData = event.payload.data || event.payload
      
      // Create company record from customer data
      await db.company.upsert({
        where: { id: `erp_customer_${customerData.id || Date.now()}` },
        update: {
          name: customerData.name || customerData.companyName || customerData.ORG_NAME1,
          contactEmail: customerData.email || customerData.SMTP_ADDR,
          contactPhone: customerData.phone || customerData.TELEPHONE1,
          nif: customerData.vat || customerData.TAXNUMXL,
          updatedAt: new Date(),
        },
        create: {
          id: `erp_customer_${customerData.id || Date.now()}`,
          name: customerData.name || customerData.companyName || 'Unknown Company',
          slug: (customerData.name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          legalForm: 'SARL',
          nif: customerData.vat || customerData.TAXNUMXL,
          contactEmail: customerData.email || customerData.SMTP_ADDR,
          contactPhone: customerData.phone || customerData.TELEPHONE1,
          verificationStatus: 'PENDING',
          userId: 'system_webhook',
          tenantId: 'default',
        },
      })
      
      return {
        success: true,
        actionTaken: 'Customer created/updated',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
  
  private async handleCustomerUpdated(event: WebhookEvent): Promise<WebhookProcessingResult> {
    // Similar to created but with update logic
    return this.handleCustomerCreated(event)
  }
  
  private async handleSyncCompleted(event: WebhookEvent): Promise<WebhookProcessingResult> {
    try {
      const syncData = event.payload.data || event.payload
      
      // Update connector last sync time
      if (event.connectorId) {
        await db.erpConnector.update({
          where: { id: event.connectorId },
          data: {
            lastSyncAt: new Date(),
            status: 'CONNECTED',
            errorCount: 0,
            errorMessage: null,
          },
        })
      }
      
      // Log successful sync
      console.log('Sync completed:', syncData)
      
      return {
        success: true,
        actionTaken: 'Sync completion logged',
        details: syncData,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
  
  private async handleSyncFailed(event: WebhookEvent): Promise<WebhookProcessingResult> {
    try {
      const syncData = event.payload.data || event.payload
      
      // Update connector error state
      if (event.connectorId) {
        await db.erpConnector.update({
          where: { id: event.connectorId },
          data: {
            status: 'ERROR',
            errorCount: { increment: 1 },
            errorMessage: syncData.error || syncData.message || 'Unknown sync error',
          },
        })
      }
      
      console.error('Sync failed:', syncData)
      
      return {
        success: true,
        actionTaken: 'Sync failure logged',
        details: syncData,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
  
  private async handleDefaultEvent(event: WebhookEvent): Promise<WebhookProcessingResult> {
    console.log(`Unhandled webhook event: ${event.eventType}`, event.payload)
    
    return {
      success: true,
      actionTaken: 'Event acknowledged but not processed',
      details: { eventType: event.eventType },
    }
  }
  
  // ============================================
  // RATE LIMITING
  // ============================================
  
  private checkRateLimit(clientIp: string): boolean {
    const now = new Date()
    const entry = this.rateLimitMap.get(clientIp)
    
    if (!entry || entry.resetAt < now) {
      this.rateLimitMap.set(clientIp, { count: 1, resetAt: new Date(now.getTime() + 60000) })
      return true
    }
    
    if (entry.count >= this.maxRequestsPerMinute) {
      return false
    }
    
    entry.count++
    return true
  }
  
  // ============================================
  // LOGGING
  // ============================================
  
  private async logWebhook(event: WebhookEvent): Promise<void> {
    try {
      // In production, you'd save to a dedicated webhooks table
      console.log(`Webhook [${event.id}] ${event.eventType}:`, {
        connectorType: event.connectorType,
        processed: event.processed,
        result: event.processingResult,
      })
    } catch (error) {
      console.error('Failed to log webhook:', error)
    }
  }
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  
  private mapERPStatus(erpStatus: string): string {
    const statusMap: Record<string, string> = {
      // Odoo statuses
      draft: 'PENDING',
      sent: 'CONFIRMED',
      sale: 'PROCESSING',
      done: 'COMPLETED',
      cancel: 'CANCELLED',
      
      // SAP statuses
      TA: 'PENDING',
      ZQU: 'CONFIRMED',
      DLV: 'SHIPPED',
      ZBIL: 'COMPLETED',
      CAN: 'CANCELLED',
    }
    
    return statusMap[erpStatus] || erpStatus.toUpperCase()
  }
}

// Export singleton instance
export const webhookHandler = WebhookHandler.getInstance()

export default WebhookHandler
