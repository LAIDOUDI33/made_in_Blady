// ERP Integration Framework
// Supports: SAP, Odoo, Microsoft Dynamics, custom ERPs
// AlgeriaTrade.dz B2B Platform - Phase 8J

import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// ============================================
// TYPES
// ============================================

export type ERPType = 'SAP' | 'ODOO' | 'DYNAMICS' | 'CUSTOM'
export type SyncDirection = 'PUSH' | 'PULL' | 'BIDIRECTIONAL'
export type SyncFrequency = 'REALTIME' | 'EVERY_5_MIN' | 'HOURLY' | 'DAILY' | 'MANUAL'
export type SyncStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'PENDING' | 'SKIPPED'

export type EntityType = 
  | 'PRODUCTS' 
  | 'INVENTORY' 
  | 'ORDERS' 
  | 'CUSTOMERS' 
  | 'PRICES' 
  | 'CATEGORIES'
  | 'SUPPLIERS'
  | 'INVOICES'
  | 'SHIPMENTS'

export interface ERPConfig {
  id: string
  name: string
  type: ERPType
  enabled: boolean
  
  // Connection
  endpoint: string
  apiKey?: string
  username?: string
  password?: string
  clientId?: string
  clientSecret?: string
  
  // Authentication type
  authType: 'API_KEY' | 'BASIC' | 'OAUTH2' | 'CERTIFICATE'
  
  // Sync settings
  defaultSyncFrequency: SyncFrequency
  syncDirections: Record<EntityType, SyncDirection>
  
  // Mappings
  fieldMappings: FieldMapping[]
  
  // Webhook (for push from ERP)
  webhookSecret?: string
  webhookEndpoint?: string
  
  // Status
  lastSyncAt?: Date
  connectionStatus: 'UNKNOWN' | 'CONNECTED' | 'ERROR'
  
  createdAt: Date
  updatedAt: Date
}

export interface FieldMapping {
  localField: string
  erpField: string
  transform?: string
  defaultValue?: any
}

export interface SyncLog {
  id: string
  erpConfigId: string
  entityType: EntityType
  direction: 'PUSH' | 'PULL'
  status: SyncStatus
  
  recordsProcessed: number
  recordsSuccess: number
  recordsFailed: number
  errors: SyncError[]
  
  startedAt: Date
  completedAt?: Date
  durationMs?: number
}

export interface SyncError {
  recordId?: string
  recordType?: string
  message: string
  code?: string
  details?: any
}

export interface SyncOptions {
  batchSize?: number
  dryRun?: boolean
  forceSync?: boolean
  entityIds?: string[]
  fromDate?: Date
  toDate?: Date
}

export interface ERPClient {
  config: ERPConfig
  testConnection(): Promise<boolean>
  pullEntities(entityType: EntityType, options?: SyncOptions): Promise<SyncResult>
  pushEntities(entityType: EntityType, data: any[], options?: SyncOptions): Promise<SyncResult>
  getEntity(entityType: EntityType, externalId: string): Promise<any>
  createEntity(entityType: EntityType, data: any): Promise<string>
  updateEntity(entityType: EntityType, externalId: string, data: any): Promise<boolean>
  deleteEntity(entityType: EntityType, externalId: string): Promise<boolean>
}

export interface SyncResult {
  success: boolean
  processed: number
  created: number
  updated: number
  failed: number
  skipped: number
  errors: SyncError[]
  details?: Record<string, any>
}

// ============================================
// BASE ERP CLIENT CLASS
// ============================================

export abstract class BaseERPClient implements ERPClient {
  abstract config: ERPConfig

  abstract testConnection(): Promise<boolean>
  abstract pullEntities(entityType: EntityType, options?: SyncOptions): Promise<SyncResult>
  abstract pushEntities(entityType: EntityType, data: any[], options?: SyncOptions): Promise<SyncResult>
  abstract getEntity(entityType: EntityType, externalId: string): Promise<any>
  abstract createEntity(entityType: EntityType, data: any): Promise<string>
  abstract updateEntity(entityType: EntityType, externalId: string, data: any): Promise<boolean>
  abstract deleteEntity(entityType: EntityType, externalId: string): Promise<boolean>

  // Common utility methods
  protected transformData(data: any, mappings: FieldMapping[], direction: 'toERP' | 'fromERP'): any {
    const result: any = {}
    
    for (const mapping of mappings) {
      const sourceField = direction === 'toERP' ? mapping.localField : mapping.erpField
      const targetField = direction === 'toERP' ? mapping.erpField : mapping.localField
      
      let value = this.getNestedValue(data, sourceField)
      
      if (value === undefined || value === null) {
        if (mapping.defaultValue !== undefined) {
          value = mapping.defaultValue
        } else {
          continue
        }
      }
      
      // Apply transformation if specified
      if (mapping.transform) {
        value = this.applyTransform(value, mapping.transform)
      }
      
      this.setNestedValue(result, targetField, value)
    }
    
    return result
  }

  protected getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj)
  }

  protected setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
  }

  protected applyTransform(value: any, transformName: string): any {
    const transforms: Record<string, (v: any) => any> = {
      'uppercase': (v) => String(v).toUpperCase(),
      'lowercase': (v) => String(v).toLowerCase(),
      'trim': (v) => String(v).trim(),
      'toString': (v) => String(v),
      'toNumber': (v) => Number(v),
      'toFloat': (v) => parseFloat(v),
      'toInt': (v) => parseInt(v, 10),
      'toBoolean': (v) => Boolean(v),
      'toDate': (v) => new Date(v),
      'toISODate': (v) => new Date(v).toISOString(),
      'encodeBase64': (v) => Buffer.from(String(v)).toString('base64'),
      'decodeBase64': (v) => Buffer.from(String(v), 'base64').toString(),
      'extractNumbers': (v) => String(v).replace(/[^0-9.-]/g, ''),
      'formatPrice': (v) => parseFloat(v).toFixed(2),
      'formatDate': (v) => new Date(v).toISOString().split('T')[0],
      'mapCurrency': (v) => {
        const currencyMap: Record<string, string> = { 'DZD': 'DZ', 'EUR': 'EUR', 'USD': 'USD' }
        return currencyMap[String(v)] || v
      },
      'mapLanguage': (v) => {
        const langMap: Record<string, string> = { 'FR': 'fr_FR', 'AR': 'ar_DZ', 'EN': 'en_US' }
        return langMap[String(v).toUpperCase()] || v
      },
    }
    
    const transform = transforms[transformName]
    if (!transform) {
      console.warn(`Unknown transform: ${transformName}`)
      return value
    }
    
    try {
      return transform(value)
    } catch (error) {
      console.error(`Error applying transform ${transformName}:`, error)
      return value
    }
  }

  protected async createSyncLog(
    erpConfigId: string,
    entityType: EntityType,
    direction: 'PUSH' | 'PULL',
    status: SyncStatus,
    stats: Partial<SyncLog>
  ): Promise<SyncLog> {
    const log = await db.eRPSyncLog.create({
      data: {
        id: uuidv4(),
        erpConfigId,
        entityType,
        direction,
        status,
        recordsProcessed: stats.processed || 0,
        recordsSuccess: stats.success ? stats.created + stats.updated : 0,
        recordsFailed: stats.failed || 0,
        errors: JSON.stringify(stats.errors || []),
        startedAt: stats.startedAt || new Date(),
        completedAt: status !== 'PENDING' ? new Date() : undefined,
        durationMs: stats.durationMs,
      },
    })
    
    return mapSyncLogFromDB(log)
  }

  protected buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    switch (this.config.authType) {
      case 'API_KEY':
        if (this.config.apiKey) {
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          headers['X-API-Key'] = this.config.apiKey
        }
        break
        
      case 'BASIC':
        if (this.config.username && this.config.password) {
          const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')
          headers['Authorization'] = `Basic ${credentials}`
        }
        break
        
      case 'OAUTH2':
        // OAuth2 token should be obtained and cached separately
        headers['Authorization'] = `Bearer ${this.config.apiKey || ''}`
        break
        
      case 'CERTIFICATE':
        // Certificate auth is handled at transport layer
        break
    }
    
    return headers
  }
}

// ============================================
// ERP FACTORY & MANAGEMENT FUNCTIONS
// ============================================

const clientCache = new Map<string, ERPClient>()

export async function getERPClient(config: ERPConfig): Promise<ERPClient> {
  const cacheKey = `${config.type}-${config.id}`
  
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!
  }
  
  let client: ERPClient
  
  switch (config.type) {
    case 'SAP':
      // Import dynamically to avoid circular dependencies
      const { SAPConnector } = await import('./sap-connector')
      client = new SAPConnector(config)
      break
      
    case 'ODOO':
      const { OdooConnector } = await import('./odoo-connector')
      client = new OdooConnector(config)
      break
      
    case 'DYNAMICS':
      // Dynamics connector would be implemented similarly
      throw new Error('Microsoft Dynamics connector not yet implemented')
      
    case 'CUSTOM':
      // Custom connector would use user-provided configuration
      throw new Error('Custom ERP connectors must be implemented per integration')
      
    default:
      throw new Error(`Unsupported ERP type: ${config.type}`)
  }
  
  clientCache.set(cacheKey, client)
  return client
}

export async function initializeERP(config: Omit<ERPConfig, 'id' | 'createdAt' | 'updatedAt' | 'connectionStatus'>): Promise<ERPConfig> {
  const created = await db.eRPConfig.create({
    data: {
      id: uuidv4(),
      name: config.name,
      type: config.type,
      enabled: config.enabled ?? false,
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      username: config.username,
      password: config.password,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      authType: config.authType,
      defaultSyncFreq: config.defaultSyncFrequency,
      syncDirections: JSON.stringify(config.syncDirections || {}),
      fieldMappings: JSON.stringify(config.fieldMappings || []),
      webhookSecret: config.webhookSecret,
      webhookEndpoint: config.webhookEndpoint,
      connectionStatus: 'UNKNOWN',
    },
  })
  
  return mapERPConfigFromDB(created)
}

export async function testConnection(erpConfigId: string): Promise<{success: boolean; message: string; latencyMs?: number}> {
  const config = await db.eRPConfig.findUnique({ where: { id: erpConfigId } })
  
  if (!config) {
    throw new Error('ERP configuration not found')
  }
  
  const mappedConfig = mapERPConfigFromDB(config)
  const client = getERPClient(mappedConfig)
  
  const startTime = Date.now()
  
  try {
    const success = await client.testConnection()
    const latencyMs = Date.now() - startTime
    
    // Update connection status
    await db.eRPConfig.update({
      where: { id: erpConfigId },
      data: {
        connectionStatus: success ? 'CONNECTED' : 'ERROR',
        lastSyncAt: success ? new Date() : undefined,
      },
    })
    
    return {
      success,
      message: success 
        ? 'Connexion établie avec succès' 
        : 'Échec de la connexion - vérifiez vos paramètres',
      latencyMs,
    }
  } catch (error: any) {
    await db.eRPConfig.update({
      where: { id: erpConfigId },
      data: { connectionStatus: 'ERROR' },
    })
    
    return {
      success: false,
      message: error.message || 'Erreur de connexion inattendue',
      latencyMs: Date.now() - startTime,
    }
  }
}

export async function syncEntity(
  erpConfigId: string,
  entityType: EntityType,
  options?: SyncOptions
): Promise<SyncLog> {
  const config = await db.eRPConfig.findUnique({ where: { id: erpConfigId } })
  
  if (!config) {
    throw new Error('ERP configuration not found')
  }
  
  if (!config.enabled) {
    throw new Error('ERP configuration is disabled')
  }
  
  const mappedConfig = mapERPConfigFromDB(config)
  const client = getERPClient(mappedConfig)
  
  const directions = JSON.parse(config.syncDirections || '{}')
  const direction = (directions[entityType] || 'PULL') as 'PUSH' | 'PULL'
  
  // Create pending sync log
  const syncLog = await client.createSyncLog(erpConfigId, entityType, direction, 'PENDING', {
    startedAt: new Date(),
  })
  
  const startTime = Date.now()
  
  try {
    let result: SyncResult
    
    if (direction === 'PULL') {
      result = await client.pullEntities(entityType, options)
    } else {
      // For PUSH, we need to get local data first
      const localData = await getLocalEntitiesForSync(entityType, options?.entityIds)
      result = await client.pushEntities(entityType, localData, options)
    }
    
    const durationMs = Date.now() - startTime
    
    // Update sync log with results
    const finalStatus = result.failed > 0 && result.success === 0 
      ? 'FAILED' 
      : result.failed > 0 
        ? 'PARTIAL' 
        : 'SUCCESS'
    
    await db.eRPSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: finalStatus,
        recordsProcessed: result.processed,
        recordsSuccess: result.created + result.updated,
        recordsFailed: result.failed,
        errors: JSON.stringify(result.errors || []),
        completedAt: new Date(),
        durationMs,
      },
    })
    
    // Update last sync timestamp on config
    await db.eRPConfig.update({
      where: { id: erpConfigId },
      data: { lastSyncAt: new Date() },
    })
    
    return {
      ...syncLog,
      status: finalStatus,
      recordsProcessed: result.processed,
      recordsSuccess: result.created + result.updated,
      recordsFailed: result.failed,
      errors: result.errors || [],
      completedAt: new Date(),
      durationMs,
    }
  } catch (error: any) {
    const durationMs = Date.now() - startTime
    
    await db.eRPSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'FAILED',
        errors: JSON.stringify([{
          message: error.message || 'Sync failed unexpectedly',
          code: 'SYNC_ERROR',
          details: error.stack,
        }]),
        completedAt: new Date(),
        durationMs,
      },
    })
    
    return {
      ...syncLog,
      status: 'FAILED',
      errors: [{
        message: error.message || 'Sync failed unexpectedly',
        code: 'SYNC_ERROR',
      }],
      completedAt: new Date(),
      durationMs,
    }
  }
}

export async function syncAll(erpConfigId: string): Promise<SyncLog[]> {
  const config = await db.eRPConfig.findUnique({ where: { id: erpConfigId } })
  
  if (!config) {
    throw new Error('ERP configuration not found')
  }
  
  const directions = JSON.parse(config.syncDirections || '{}')
  const entitiesToSync = Object.entries(directions)
    .filter(([, dir]) => dir !== 'NONE')
    .map(([entity]) => entity as EntityType)
  
  const logs: SyncLog[] = []
  
  for (const entityType of entitiesToSync) {
    try {
      const log = await syncEntity(erpConfigId, entityType)
      logs.push(log)
    } catch (error) {
      console.error(`Failed to sync ${entityType}:`, error)
    }
  }
  
  return logs
}

export async function getFieldMappingSuggestions(
  erpType: ERPType,
  entityType: EntityType
): Promise<FieldMapping[]> {
  // Return common field mappings based on ERP type and entity
  const suggestions: Record<ERPType, Record<EntityType, FieldMapping[]>> = {
    SAP: {
      PRODUCTS: [
        { localField: 'name', erpField: 'MATNR', transform: 'toUpperCase' },
        { localField: 'description', erpField: 'MAKTX' },
        { localField: 'sku', erpField: 'MATNR' },
        { localField: 'price', erpField: 'NETPR' },
        { localField: 'currency', erpField: 'WAERK' },
        { localField: 'unit', erpField: 'MEINS' },
        { localField: 'category.id', erpField: 'MATKL' },
      ],
      INVENTORY: [
        { localField: 'productId', erpField: 'MATNR' },
        { localField: 'quantity', erpField: 'LABST' },
        { localField: 'warehouse', erpField: 'WERKS' },
        { localField: 'location', erpField: 'LGORT' },
      ],
      ORDERS: [
        { localField: 'orderNumber', erpField: 'VBELN' },
        { localField: 'customer.externalId', erpField: 'KUNNR' },
        { localField: 'totalAmount', erpField: 'NETWR' },
        { localField: 'currency', erpField: 'WAERK' },
        { localField: 'status', erpField: 'AUART' },
      ],
      CUSTOMERS: [
        { localField: 'externalId', erpField: 'KUNNR' },
        { localField: 'companyName', erpField: 'NAME1' },
        { localField: 'email', erpField: 'SMTP_ADDR' },
        { localField: 'phone', erpField: 'TELF1' },
        { localField: 'address.city', erpField: 'ORT01' },
        { localField: 'address.country', erpField: 'LAND1' },
      ],
      PRICES: [
        { localField: 'productId', erpField: 'MATNR' },
        { localField: 'amount', erpField: 'KBETR' },
        { localField: 'currency', erpField: 'WAERK' },
      ],
      CATEGORIES: [
        { localField: 'id', erpField: 'MATKL' },
        { localField: 'name', erpField: 'WGBEZ' },
      ],
      SUPPLIERS: [
        { localField: 'externalId', erpField: 'LIFNR' },
        { localField: 'companyName', erpField: 'NAME1' },
      ],
      INVOICES: [
        { localField: 'invoiceNumber', erpField: 'RBELN' },
        { localField: 'orderNumber', erpField: 'VBELN' },
        { localField: 'totalAmount', erpField: 'WRBTR' },
      ],
      SHIPMENTS: [
        { localField: 'trackingNumber', erpField: 'VBELN_VL' },
        { localField: 'status', erpField: 'TRSTA' },
      ],
    },
    ODOO: {
      PRODUCTS: [
        { localField: 'name', erpField: 'name' },
        { localField: 'description', erpField: 'description_sale' },
        { localField: 'sku', erpField: 'default_code' },
        { localField: 'price', erpField: 'list_price' },
        { localField: 'category.externalId', erpField: 'categ_id' },
        { localField: 'isActive', erpField: 'sale_ok' },
      ],
      INVENTORY: [
        { localField: 'productId', erpField: 'product_id' },
        { localField: 'quantity', erpField: 'qty_available' },
        { localField: 'warehouse', erpField: 'warehouse_id' },
      ],
      ORDERS: [
        { localField: 'externalId', erpField: 'id' },
        { localField: 'orderNumber', erpField: 'name' },
        { localField: 'customer.externalId', erpField: 'partner_id' },
        { localField: 'status', erpField: 'state' },
        { localField: 'totalAmount', erpField: 'amount_total' },
      ],
      CUSTOMERS: [
        { localField: 'externalId', erpField: 'id' },
        { localField: 'companyName', erpField: 'name' },
        { localField: 'email', erpField: 'email' },
        { localField: 'phone', erpField: 'phone' },
        { localField: 'address.city', erpField: 'city' },
      ],
      PRICES: [
        { localField: 'productId', erpField: 'product_id' },
        { localField: 'pricelistId', erpField: 'pricelist_id' },
        { localField: 'amount', erpField: 'fixed_price' },
      ],
      CATEGORIES: [
        { localField: 'externalId', erpField: 'id' },
        { localField: 'name', erpField: 'name' },
        { localField: 'parentCategory', erpField: 'parent_id' },
      ],
      SUPPLIERS: [
        { localField: 'externalId', erpField: 'id' },
        { localField: 'companyName', erpField: 'name' },
        { localField: 'isSupplier', erpField: 'supplier' },
      ],
      INVOICES: [
        { localField: 'invoiceNumber', erpField: 'number' },
        { localField: 'orderExternalId', erpField: 'origin' },
        { localField: 'totalAmount', erpField: 'amount_total' },
      ],
      SHIPMENTS: [
        { localField: 'externalId', erpField: 'id' },
        { localField: 'status', erpField: 'state' },
      ],
    },
    DYNAMICS: {},
    CUSTOM: {},
  }
  
  return suggestions[erpType]?.[entityType] || []
}

export async function handleERPWebhook(
  erpConfigId: string,
  payload: unknown,
  signature: string
): Promise<void> {
  const config = await db.eRPConfig.findUnique({ where: { id: erpConfigId } })
  
  if (!config) {
    throw new Error('ERP configuration not found')
  }
  
  if (!config.webhookSecret) {
    throw new Error('Webhook secret not configured')
  }
  
  // Verify signature (simplified - implement proper HMAC verification in production)
  const expectedSignature = generateWebhookSignature(payload, config.webhookSecret)
  if (signature !== expectedSignature) {
    throw new Error('Invalid webhook signature')
  }
  
  // Process webhook payload
  const data = payload as Record<string, any>
  const entityType = (data.entity_type || data.entityType)?.toUpperCase() as EntityType
  const action = data.action || data.event // create, update, delete
  
  if (!entityType || !action) {
    throw new Error('Invalid webhook payload: missing entity_type or action')
  }
  
  // Handle based on action
  switch (action.toLowerCase()) {
    case 'create':
    case 'created':
      await handleWebhookCreate(erpConfigId, entityType, data)
      break
      
    case 'update':
    case 'updated':
      await handleWebhookUpdate(erpConfigId, entityType, data)
      break
      
    case 'delete':
    case 'deleted':
      await handleWebhookDelete(erpConfigId, entityType, data)
      break
      
    default:
      console.log(`Unhandled webhook action: ${action}`)
  }
}

async function handleWebhookCreate(
  erpConfigId: string,
  entityType: EntityType,
  data: Record<string, any>
): Promise<void> {
  // Map ERP data to local format and create/update local record
  console.log(`Creating local ${entityType} from ERP webhook:`, data)
  // Implementation depends on entity type
}

async function handleWebhookUpdate(
  erpConfigId: string,
  entityType: EntityType,
  data: Record<string, any>
): Promise<void> {
  console.log(`Updating local ${entityType} from ERP webhook:`, data)
  // Implementation depends on entity type
}

async function handleWebhookDelete(
  erpConfigId: string,
  entityType: EntityType,
  data: Record<string, any>
): Promise<void> {
  console.log(`Deleting local ${entityType} from ERP webhook:`, data)
  // Implementation depends on entity type
}

function generateWebhookSignature(payload: unknown, secret: string): string {
  // Simplified signature generation - use proper HMAC in production
  // Using Web Crypto API for edge/runtime compatibility
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const data = encoder.encode(JSON.stringify(payload))
  
  // Simple hash for now - in production, use proper HMAC via Web Crypto
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data[i]
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(16, '0')
}

export async function getSyncHistory(
  erpConfigId: string,
  filters?: {
    entityType?: EntityType
    status?: SyncStatus
    dateFrom?: Date
    dateTo?: Date
    limit?: number
    offset?: number
  }
): Promise<{data: SyncLog[], total: number}> {
  const where: any = { erpConfigId }
  
  if (filters?.entityType) where.entityType = filters.entityType
  if (filters?.status) where.status = filters.status
  if (filters?.dateFrom || filters?.dateTo) {
    where.startedAt = {}
    if (filters.dateFrom) where.startedAt.gte = filters.dateFrom
    if (filters.dateTo) where.startedAt.lte = filters.dateTo
  }
  
  const [logs, total] = await Promise.all([
    db.eRPSyncLog.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    }),
    db.eRPSyncLog.count({ where }),
  ])
  
  return {
    data: logs.map(mapSyncLogFromDB),
    total,
  }
}

export async function retryFailedSync(syncLogId: string): Promise<SyncLog> {
  const existingLog = await db.eRPSyncLog.findUnique({ where: { id: syncLogId } })
  
  if (!existingLog) {
    throw new Error('Sync log not found')
  }
  
  if (existingLog.status !== 'FAILED') {
    throw new Error('Can only retry failed sync operations')
  }
  
  return syncEntity(existingLog.erpConfigId, existingLog.entityType as EntityType)
}

async function getLocalEntitiesForSync(
  entityType: EntityType,
  entityIds?: string[]
): Promise<any[]> {
  // Get local entities that need to be synced to ERP
  switch (entityType) {
    case 'PRODUCTS':
      const productWhere: any = { status: 'published' }
      if (entityIds?.length) productWhere.id = { in: entityIds }
      return await db.product.findMany({ where: productWhere })
      
    case 'INVENTORY':
      // Would query inventory/stock table
      return []
      
    case 'ORDERS':
      const orderWhere: any = {}
      if (entityIds?.length) orderWhere.id = { in: entityIds }
      return await db.order.findMany({ where: orderWhere })
      
    case 'CUSTOMERS':
      // Would query companies/customers table
      return []
      
    default:
      return []
  }
}

// ============================================
// MAPPING HELPERS
// ============================================

function mapERPConfigFromDB(dbConfig: any): ERPConfig {
  return {
    id: dbConfig.id,
    name: dbConfig.name,
    type: dbConfig.type as ERPType,
    enabled: dbConfig.enabled,
    endpoint: dbConfig.endpoint,
    apiKey: dbConfig.apiKey || undefined,
    username: dbConfig.username || undefined,
    password: dbConfig.password || undefined,
    clientId: dbConfig.clientId || undefined,
    clientSecret: dbConfig.clientSecret || undefined,
    authType: dbConfig.authType,
    defaultSyncFrequency: dbConfig.defaultSyncFreq as SyncFrequency,
    syncDirections: JSON.parse(dbConfig.syncDirections || '{}'),
    fieldMappings: JSON.parse(dbConfig.fieldMappings || '[]'),
    webhookSecret: dbConfig.webhookSecret || undefined,
    webhookEndpoint: dbConfig.webhookEndpoint || undefined,
    lastSyncAt: dbConfig.lastSyncAt || undefined,
    connectionStatus: dbConfig.connectionStatus,
    createdAt: dbConfig.createdAt,
    updatedAt: dbConfig.updatedAt,
  }
}

function mapSyncLogFromDB(dbLog: any): SyncLog {
  return {
    id: dbLog.id,
    erpConfigId: dbLog.erpConfigId,
    entityType: dbLog.entityType as EntityType,
    direction: dbLog.direction as 'PUSH' | 'PULL',
    status: dbLog.status as SyncStatus,
    recordsProcessed: dbLog.recordsProcessed,
    recordsSuccess: dbLog.recordsSuccess,
    recordsFailed: dbLog.recordsFailed,
    errors: JSON.parse(dbLog.errors || '[]'),
    startedAt: dbLog.startedAt,
    completedAt: dbLog.completedAt || undefined,
    durationMs: dbLog.durationMs || undefined,
  }
}
