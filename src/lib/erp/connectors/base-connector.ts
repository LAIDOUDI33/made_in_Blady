// Base ERP Connector - Abstract interface for all ERP connectors
// AlgeriaTrade.dz B2B Platform - Inventory/ERP Sync System

import {
  ERPSystemType,
  AuthType,
  FieldMappingDefinition,
  ConnectionSettings,
  RetryPolicy,
  DEFAULT_RETRY_POLICY,
} from '../config'

// ============================================
// TYPES
// ============================================

export type ConnectorStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'SYNCING'

export interface ConnectionResult {
  success: boolean
  message: string
  timestamp: Date
  latencyMs?: number
}

export interface TestResult {
  success: boolean
  message: string
  timestamp: Date
  latencyMs?: number
  details?: Record<string, any>
  errors?: Array<{ code: string; message: string }>
}

export interface Product {
  id: string
  sku?: string
  name: string
  description?: string
  price?: number
  currency?: string
  quantity?: number
  category?: string
  isActive?: boolean
  [key: string]: any
}

export interface InventoryUpdate {
  productId: string
  sku?: string
  previousQuantity?: number
  newQuantity: number
  updatedAt: Date
  source: 'ERP' | 'PLATFORM'
}

export interface SyncResult {
  success: boolean
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsFailed: number
  errors: SyncError[]
  durationMs: number
  startedAt: Date
  completedAt: Date
}

export interface SyncError {
  recordId?: string
  entityType?: string
  code: string
  message: string
  details?: any
  retryable: boolean
}

export interface FieldMapping {
  localField: string
  erpField: string
  transform?: string
  defaultValue?: any
}

export interface FetchOptions {
  limit?: number
  offset?: number
  fromDate?: Date
  toDate?: Date
  modifiedSince?: Date
  filters?: Record<string, any>
  fields?: string[]
}

export interface ConnectorCredentials {
  // Common
  endpoint: string
  authType: AuthType
  
  // API Key
  apiKey?: string
  
  // Basic Auth
  username?: string
  password?: string
  
  // OAuth2
  clientId?: string
  clientSecret?: string
  tokenUrl?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: Date
  
  // Certificate (for SAP)
  certificatePath?: string
  keyPath?: string
  
  // Odoo-specific
  database?: string
  
  // Custom headers
  customHeaders?: Record<string, string>
  
  // Additional config
  [key: string]: any
}

// ============================================
// ABSTRACT CONNECTOR INTERFACE
// ============================================

export interface IERPConnector {
  // Identity
  readonly name: string
  readonly type: ERPSystemType
  readonly version: string
  
  // State
  status: ConnectorStatus
  lastError?: Error
  credentials: ConnectorCredentials
  settings: ConnectionSettings
  fieldMappings: FieldMapping[]
  retryPolicy: RetryPolicy
  
  // Lifecycle methods
  connect(credentials: ConnectorCredentials): Promise<ConnectionResult>
  disconnect(): Promise<void>
  testConnection(): Promise<TestResult>
  
  // Data operations
  fetchProducts(options?: FetchOptions): Promise<Product[]>
  fetchInventoryUpdates(): Promise<InventoryUpdate[]>
  
  pushOrder(order: any): Promise<SyncResult>
  pullOrders(options?: FetchOptions): Promise<any[]>
  
  syncInventory(inventoryData: Partial<Product>[]): Promise<SyncResult>
  
  // Mapping & transformation
  getFieldMappings(entityType?: string): FieldMapping[]
  setFieldMappings(mappings: FieldMapping[], entityType?: string): void
  transformData(sourceData: any, direction: 'toERP' | 'fromERP'): Promise<any>
  
  // Health & monitoring
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    latencyMs: number
    details: Record<string, any>
  }>
  
  // Event hooks
  onSyncStart?(callback: (entityType: string) => void): void
  onSyncComplete?(callback: (result: SyncResult) => void): void
  onError?(callback: (error: Error) => void): void
}

// ============================================
// BASE CONNECTOR IMPLEMENTATION
// ============================================

export abstract class BaseERPConnector implements IERPConnector {
  abstract readonly name: string
  abstract readonly type: ERPSystemType
  readonly version: string = '1.0.0'
  
  protected _status: ConnectorStatus = 'DISCONNECTED'
  protected _lastError?: Error
  protected _credentials: ConnectorCredentials
  protected _settings: ConnectionSettings
  protected _fieldMappings: Map<string, FieldMapping[]> = new Map()
  protected _retryPolicy: RetryPolicy = { ...DEFAULT_RETRY_POLICY }
  
  // Event callbacks
  private _onSyncStartCallbacks: Array<(entityType: string) => void> = []
  private _onSyncCompleteCallbacks: Array<(result: SyncResult) => void> = []
  private _onErrorCallbacks: Array<(error: Error) => void> = []
  
  constructor(credentials?: Partial<ConnectorCredentials>, settings?: Partial<ConnectionSettings>) {
    this._credentials = {
      endpoint: '',
      authType: 'API_KEY',
      ...credentials,
    }
    
    this._settings = {
      timeout: 30000,
      keepAlive: true,
      tlsVersion: 'TLS1.2',
      rejectUnauthorized: true,
      ...settings,
    }
  }
  
  // Getters
  get status(): ConnectorStatus {
    return this._status
  }
  
  get lastError(): Error | undefined {
    return this._lastError
  }
  
  get credentials(): ConnectorCredentials {
    return this._credentials
  }

  set credentials(value: ConnectorCredentials) {
    this._credentials = value
  }
  
  get settings(): ConnectionSettings {
    return this._settings
  }
  
  set settings(value: ConnectionSettings) {
    this._settings = value
  }
  
  get fieldMappings(): FieldMapping[] {
    return Array.from(this._fieldMappings.values()).flat()
  }
  
  get retryPolicy(): RetryPolicy {
    return this._retryPolicy
  }
  
  set retryPolicy(value: RetryPolicy) {
    this._retryPolicy = value
  }
  
  // Status helpers
  protected setStatus(status: ConnectorStatus): void {
    this._status = status
  }
  
  protected setError(error: Error): void {
    this._lastError = error
    this._status = 'ERROR'
    this.triggerError(error)
  }
  
  // Abstract methods to implement
  abstract connect(credentials: ConnectorCredentials): Promise<ConnectionResult>
  abstract disconnect(): Promise<void>
  abstract testConnection(): Promise<TestResult>
  abstract fetchProducts(options?: FetchOptions): Promise<Product[]>
  abstract fetchInventoryUpdates(): Promise<InventoryUpdate[]>
  abstract pushOrder(order: any): Promise<SyncResult>
  abstract pullOrders(options?: FetchOptions): Promise<any[]>
  abstract syncInventory(inventoryData: Partial<Product>[]): Promise<SyncResult>
  
  // Default implementations
  getFieldMappings(entityType?: string): FieldMapping[] {
    if (entityType) {
      return this._fieldMappings.get(entityType) || []
    }
    return Array.from(this._fieldMappings.values()).flat()
  }
  
  setFieldMappings(mappings: FieldMapping[], entityType?: string): void {
    if (entityType) {
      this._fieldMappings.set(entityType, mappings)
    } else {
      this._fieldMappings.set('default', mappings)
    }
  }
  
  async transformData(sourceData: any, direction: 'toERP' | 'fromERP'): Promise<any> {
    const result: any = {}
    const mappings = this.getFieldMappings()
    
    for (const mapping of mappings) {
      try {
        let sourceField: string
        let targetField: string
        
        if (direction === 'toERP') {
          sourceField = mapping.localField
          targetField = mapping.erpField
        } else {
          sourceField = mapping.erpField
          targetField = mapping.localField
        }
        
        let value = this.getNestedValue(sourceData, sourceField)
        
        if (value === undefined || value === null) {
          value = mapping.defaultValue
        }
        
        if (value !== undefined && value !== null && mapping.transform) {
          value = this.applyTransform(value, mapping.transform)
        }
        
        if (value !== undefined) {
          this.setNestedValue(result, targetField, value)
        }
      } catch (error) {
        console.warn(`Failed to transform field ${mapping.localField} -> ${mapping.erpField}:`, error)
      }
    }
    
    return result
  }
  
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    latencyMs: number
    details: Record<string, any>
  }> {
    const startTime = Date.now()
    
    try {
      const testResult = await this.testConnection()
      const latencyMs = Date.now() - startTime
      
      return {
        status: testResult.success ? 'healthy' : 'unhealthy',
        latencyMs,
        details: {
          connectorName: this.name,
          connectorType: this.type,
          testResult,
          status: this.status,
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - startTime,
        details: {
          connectorName: this.name,
          connectorType: this.type,
          error: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }
  
  // Event hooks
  onSyncStart(callback: (entityType: string) => void): void {
    this._onSyncStartCallbacks.push(callback)
  }
  
  onSyncComplete(callback: (result: SyncResult) => void): void {
    this._onSyncCompleteCallbacks.push(callback)
  }
  onError(callback: (error: Error) => void): void {
    this._onErrorCallbacks.push(callback)
  }
  
  // Protected helper methods
  protected triggerSyncStart(entityType: string): void {
    this._onSyncStartCallbacks.forEach(cb => {
      try { cb(entityType) } catch (e) { console.error('SyncStart callback error:', e) }
    })
  }
  
  protected triggerSyncComplete(result: SyncResult): void {
    this._onSyncCompleteCallbacks.forEach(cb => {
      try { cb(result) } catch (e) { console.error('SyncComplete callback error:', e) }
    })
  }
  
  protected triggerError(error: Error): void {
    this._onErrorCallbacks.forEach(cb => {
      try { cb(error) } catch (e) { console.error('Error callback error:', e) }
    })
  }
  
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: Error | undefined
    
    for (let attempt = 0; attempt <= this._retryPolicy.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateRetryDelay(attempt)
          console.log(`Retrying ${operationName} (attempt ${attempt + 1}/${this._retryPolicy.maxRetries + 1}) after ${delay}ms`)
          await this.sleep(delay)
        }
        
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (!this.isRetryableError(lastError) || attempt === this._retryPolicy.maxRetries) {
          throw lastError
        }
        
        console.warn(`${operationName} failed (attempt ${attempt + 1}):`, lastError.message)
      }
    }
    
    throw lastError || new Error('Operation failed after retries')
  }
  
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this._retryPolicy.baseDelayMs
    const multiplier = this._retryPolicy.backoffMultiplier
    const maxDelay = this._retryPolicy.maxDelayMs
    
    return Math.min(baseDelay * Math.pow(multiplier, attempt), maxDelay)
  }
  
  protected isRetryableError(error: Error): boolean {
    return this._retryPolicy.retryableErrors.some(errCode =>
      error.message.includes(errCode)
    )
  }
  
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // Data transformation helpers
  protected getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  protected setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (current[key] === undefined) current[key] = {}
      return current
    }, obj)
    target[lastKey] = value
  }
  
  protected applyTransform(value: any, transform: string): any {
    switch (transform) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : String(value).toUpperCase()
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : String(value).toLowerCase()
      case 'trim':
        return typeof value === 'string' ? value.trim() : String(value).trim()
      case 'toString':
        return String(value)
      case 'toNumber':
        return Number(value)
      case 'toFloat':
        return parseFloat(String(value))
      case 'toInt':
        return parseInt(String(value), 10)
      case 'toBoolean':
        if (typeof value === 'boolean') return value
        if (typeof value === 'string') {
          return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
        }
        return Boolean(value)
      case 'toDate':
        return value instanceof Date ? value : new Date(value)
      case 'formatPrice':
        return typeof value === 'number' ? parseFloat(value.toFixed(2)) : parseFloat(Number(value)).toFixed(2)
      case 'formatDate': {
        const d = value instanceof Date ? value : new Date(value)
        return d.toISOString().split('T')[0]
      }
      default:
        return value
    }
  }
  
  protected buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    
    switch (this._credentials.authType) {
      case 'API_KEY':
        if (this._credentials.apiKey) {
          headers['Authorization'] = `Bearer ${this._credentials.apiKey}`
          headers['X-API-Key'] = this._credentials.apiKey
        }
        break
        
      case 'BASIC':
        if (this._credentials.username && this._credentials.password) {
          const encoded = Buffer.from(
            `${this._credentials.username}:${this._credentials.password}`
          ).toString('base64')
          headers['Authorization'] = `Basic ${encoded}`
        }
        break
        
      case 'OAUTH2':
        if (this._credentials.accessToken) {
          headers['Authorization'] = `Bearer ${this._credentials.accessToken}`
        }
        break
        
      default:
        break
    }
    
    if (this._credentials.customHeaders) {
      Object.assign(headers, this._credentials.customHeaders)
    }
    
    return headers
  }
  
  protected async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: any,
    options?: RequestInit
  ): Promise<any> {
    const url = path.startsWith('http') ? path : `${this._credentials.endpoint}${path}`
    
    const response = await fetch(url, {
      method,
      headers: this.buildAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(this._settings.timeout),
      ...options,
    })
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorMessage
      } catch {}
      
      throw new Error(errorMessage)
    }
    
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('json')) {
      return response.json()
    }
    
    return response.text()
  }
}

export default BaseERPConnector
