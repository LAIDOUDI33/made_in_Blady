// Generic REST API Connector
// Supports OAuth2, custom endpoints, webhook registration, pagination
// AlgeriaTrade.dz B2B Platform - Inventory/ERP Sync System

import {
  BaseERPConnector,
  ConnectorCredentials,
  ConnectionResult,
  TestResult,
  Product,
  InventoryUpdate,
  SyncResult,
  FetchOptions,
  FieldMapping,
  ConnectorStatus,
} from './base-connector'
import { ERPSystemType, ConnectionSettings } from '../config'

// ============================================
// TYPES
// ============================================

export interface RESTEndpointConfig {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  description?: string
  requestTransform?: (data: any) => any
  responseTransform?: (data: any) => any
}

export interface RESTPaginationConfig {
  type: 'offset' | 'cursor' | 'page'
  pageParam?: string    // e.g., 'page', 'offset'
  limitParam?: string   // e.g., 'limit', 'pageSize'
  cursorPath?: string   // JSON path to cursor in response
  totalPath?: string    // JSON path to total count
  maxLimit?: number     // Maximum items per request
}

export interface WebhookConfig {
  endpoint: string
  secret: string
  events: string[]
  headers?: Record<string, string>
}

export interface OAuth2Config {
  tokenUrl: string
  clientId: string
  clientSecret: string
  scope?: string[]
  grantType?: 'client_credentials' | 'password' | 'authorization_code'
  username?: string
  password?: string
}

export class RESTConnector extends BaseERPConnector {
  readonly name = 'Generic REST API'
  readonly type: ERPSystemType = 'REST'
  
  // Custom configuration
  private _endpoints: Record<string, RESTEndpointConfig> = {}
  private _pagination: RESTPaginationConfig = {
    type: 'offset',
    pageParam: 'offset',
    limitParam: 'limit',
    maxLimit: 100,
  }
  private _webhookConfig?: WebhookConfig
  private _oauth2Config?: OAuth2Config
  
  constructor(
    credentials?: Partial<ConnectorCredentials>,
    settings?: Partial<ConnectionSettings>
  ) {
    super(credentials, settings)
    
    // Set default REST endpoints
    this._endpoints = {
      products: { path: '/products', method: 'GET' },
      inventory: { path: '/inventory', method: 'GET' },
      orders: { path: '/orders', method: 'GET' },
      customers: { path: '/customers', method: 'GET' },
      createOrder: { path: '/orders', method: 'POST' },
      updateInventory: { path: '/inventory', method: 'PUT' },
    }
  }
  
  // ============================================
  // CONFIGURATION METHODS
  // ============================================
  
  setEndpoint(name: string, config: RESTEndpointConfig): void {
    this._endpoints[name] = config
  }
  
  getEndpoint(name: string): RESTEndpointConfig | undefined {
    return this._endpoints[name]
  }
  
  setPagination(config: Partial<RESTPaginationConfig>): void {
    this._pagination = { ...this._pagination, ...config }
  }
  
  setWebhookConfig(config: WebhookConfig): void {
    this._webhookConfig = config
  }
  
  setOAuth2Config(config: OAuth2Config): void {
    this._oauth2Config = config
  }
  
  // ============================================
  // LIFECYCLE METHODS
  // ============================================
  
  async connect(credentials: ConnectorCredentials): Promise<ConnectionResult> {
    const startTime = Date.now()
    
    try {
      this.setStatus('CONNECTING')
      this._credentials = credentials
      
      // Handle OAuth2 authentication if configured
      if (this._oauth2Config && credentials.authType === 'OAUTH2') {
        await this.authenticateOAuth2()
      }
      
      // Test connection with a simple request
      await this.testConnection()
      
      this.setStatus('CONNECTED')
      
      return {
        success: true,
        message: `Connected to ${credentials.endpoint}`,
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
      }
    } catch (error) {
      this.setError(error instanceof Error ? error : new Error(String(error)))
      
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
      }
    }
  }
  
  async disconnect(): Promise<void> {
    this._credentials.accessToken = undefined
    this._credentials.refreshToken = undefined
    this.setStatus('DISCONNECTED')
  }
  
  async testConnection(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      // Try to fetch a simple health check or root endpoint
      const response = await this.makeRequest('GET', '/', undefined, {
        headers: { 'Accept': 'application/json' },
      })
      
      return {
        success: true,
        message: 'Connection successful',
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
        details: response,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
        errors: [{
          code: 'CONNECTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
        }],
      }
    }
  }
  
  // ============================================
  // DATA OPERATIONS
  // ============================================
  
  async fetchProducts(options?: FetchOptions): Promise<Product[]> {
    const endpoint = this._endpoints['products']
    if (!endpoint) {
      throw new Error('Products endpoint not configured')
    }
    
    return this.executeWithRetry(async () => {
      const data = await this.fetchPaginatedData(endpoint, options)
      
      let products: any[] = Array.isArray(data) ? data : data.items || data.data || [data]
      
      if (endpoint.responseTransform) {
        products = products.map(endpoint.responseTransform!)
      }
      
      return products.map(item => this.transformToProduct(item))
    }, 'fetchProducts')
  }
  
  async fetchInventoryUpdates(): Promise<InventoryUpdate[]> {
    const endpoint = this._endpoints['inventory']
    if (!endpoint) {
      throw new Error('Inventory endpoint not configured')
    }
    
    return this.executeWithRetry(async () => {
      const data = await this.makeRequest(endpoint.method, endpoint.path)
      
      let inventory: any[] = Array.isArray(data) ? data : data.items || data.data || [data]
      
      return inventory.map(item => ({
        productId: item.id || item.product_id || item.productId,
        sku: item.sku || item.product_sku,
        previousQuantity: item.previous_quantity,
        newQuantity: item.quantity || item.qty || item.available_quantity || 0,
        updatedAt: new Date(item.updated_at || item.lastUpdated || Date.now()),
        source: 'ERP' as const,
      }))
    }, 'fetchInventoryUpdates')
  }
  
  async pushOrder(order: any): Promise<SyncResult> {
    const startTime = Date.now()
    const endpoint = this._endpoints['createOrder']
    
    if (!endpoint) {
      throw new Error('Create order endpoint not configured')
    }
    
    const result: SyncResult = {
      success: false,
      recordsProcessed: 1,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: [],
      durationMs: 0,
      startedAt: new Date(startTime),
      completedAt: new Date(),
    }
    
    try {
      this.triggerSyncStart('ORDERS')
      
      const transformedOrder = await this.transformData(order, 'toERP')
      const orderToSend = endpoint.requestTransform 
        ? endpoint.requestTransform(transformedOrder)
        : transformedOrder
      
      const response = await this.executeWithRetry(() =>
        this.makeRequest(endpoint.method, endpoint.path, orderToSend),
        'pushOrder'
      )
      
      result.success = true
      result.recordsCreated = 1
      result.durationMs = Date.now() - startTime
      result.completedAt = new Date()
      
      this.triggerSyncComplete(result)
      return result
    } catch (error) {
      result.recordsFailed = 1
      result.errors.push({
        code: 'PUSH_ERROR',
        message: error instanceof Error ? error.message : String(error),
        retryable: true,
      })
      result.durationMs = Date.now() - startTime
      result.completedAt = new Date()
      
      this.triggerSyncComplete(result)
      return result
    }
  }
  
  async pullOrders(options?: FetchOptions): Promise<any[]> {
    const endpoint = this._endpoints['orders']
    if (!endpoint) {
      throw new Error('Orders endpoint not configured')
    }
    
    return this.executeWithRetry(async () => {
      const data = await this.fetchPaginatedData(endpoint, options)
      
      let orders: any[] = Array.isArray(data) ? data : data.items || data.data || [data]
      
      if (endpoint.responseTransform) {
        orders = orders.map(endpoint.responseTransform!)
      }
      
      return orders
    }, 'pullOrders')
  }
  
  async syncInventory(inventoryData: Partial<Product>[]): Promise<SyncResult> {
    const startTime = Date.now()
    const endpoint = this._endpoints['updateInventory']
    
    const result: SyncResult = {
      success: true,
      recordsProcessed: inventoryData.length,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: [],
      durationMs: 0,
      startedAt: new Date(startTime),
      completedAt: new Date(),
    }
    
    this.triggerSyncStart('INVENTORY')
    
    for (const item of inventoryData) {
      try {
        const transformedItem = await this.transformData(item, 'toERP')
        
        if (endpoint) {
          await this.makeRequest(endpoint.method, endpoint.path, transformedItem)
        }
        
        result.recordsUpdated++
      } catch (error) {
        result.recordsFailed++
        result.success = false
        result.errors.push({
          recordId: item.id,
          entityType: 'INVENTORY',
          code: 'SYNC_ERROR',
          message: error instanceof Error ? error.message : String(error),
          retryable: true,
        })
      }
    }
    
    result.durationMs = Date.now() - startTime
    result.completedAt = new Date()
    
    this.triggerSyncComplete(result)
    return result
  }
  
  // ============================================
  // OAUTH2 AUTHENTICATION
  // ============================================
  
  private async authenticateOAuth2(): Promise<void> {
    if (!this._oauth2Config) {
      throw new Error('OAuth2 configuration not set')
    }
    
    const { tokenUrl, clientId, clientSecret, scope, grantType } = this._oauth2Config
    
    const body: Record<string, string> = {
      grant_type: grantType || 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }
    
    if (scope?.length) {
      body.scope = scope.join(' ')
    }
    
    if (grantType === 'password' && this._oauth2Config.username) {
      body.username = this._oauth2Config.username
      body.password = this._oauth2Config.password || ''
    }
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    })
    
    if (!response.ok) {
      throw new Error(`OAuth2 authentication failed: ${response.statusText}`)
    }
    
    const tokenData = await response.json()
    
    this._credentials.accessToken = tokenData.access_token
    this._credentials.refreshToken = tokenData.refresh_token
    this._credentials.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
  }
  
  async refreshAccessToken(): Promise<void> {
    if (!this._oauth2Config?.tokenUrl || !this._credentials.refreshToken) {
      // Re-authenticate instead of refresh
      await this.authenticateOAuth2()
      return
    }
    
    const response = await fetch(this._oauth2Config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this._credentials.refreshToken!,
        client_id: this._oauth2Config.clientId,
        client_secret: this._oauth2Config.clientSecret,
      }).toString(),
    })
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`)
    }
    
    const tokenData = await response.json()
    this._credentials.accessToken = tokenData.access_token
    this._credentials.refreshToken = tokenData.refresh_token
    this._credentials.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
  }
  
  // ============================================
  // WEBHOOK REGISTRATION
  // ============================================
  
  async registerWebhook(events?: string[]): Promise<boolean> {
    if (!this._webhookConfig) {
      console.warn('Webhook configuration not set')
      return false
    }
    
    try {
      const webhookPayload = {
        url: this._webhookConfig.endpoint,
        secret: this._webhookConfig.secret,
        events: events || this._webhookConfig.events,
        headers: this._webhookConfig.headers,
      }
      
      await this.makeRequest('POST', '/webhooks', webhookPayload)
      return true
    } catch (error) {
      console.error('Failed to register webhook:', error)
      return false
    }
  }
  
  async unregisterWebhook(webhookId: string): Promise<boolean> {
    try {
      await this.makeRequest('DELETE', `/webhooks/${webhookId}`)
      return true
    } catch (error) {
      console.error('Failed to unregister webhook:', error)
      return false
    }
  }
  
  // ============================================
  // PAGINATION HELPERS
  // ============================================
  
  private async fetchPaginatedData(
    endpoint: { path: string; method: string },
    options?: FetchOptions
  ): Promise<any> {
    const allItems: any[] = []
    let currentOffset = options?.offset || 0
    const limit = Math.min(options?.limit || this._pagination.maxLimit, this._pagination.maxLimit || 100)
    let hasMore = true
    
    while (hasMore) {
      const params = new URLSearchParams()
      params.set(this._pagination.limitParam || 'limit', String(limit))
      
      if (this._pagination.type === 'offset') {
        params.set(this._pagination.pageParam || 'offset', String(currentOffset))
      } else if (this._pagination.type === 'page') {
        params.set(this._pagination.pageParam || 'page', String(Math.floor(currentOffset / limit) + 1))
      }
      
      // Add filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          params.set(key, String(value))
        })
      }
      
      // Add date filters
      if (options?.modifiedSince) {
        params.set('modified_since', options.modifiedSince.toISOString())
      }
      if (options?.fromDate) {
        params.set('from_date', options.fromDate.toISOString())
      }
      if (options?.toDate) {
        params.set('to_date', options.toDate.toISOString())
      }
      
      const queryString = params.toString()
      const url = `${endpoint.path}${queryString ? `?${queryString}` : ''}`
      
      const response = await this.makeRequest(endpoint.method as any, url)
      
      let items: any[] = Array.isArray(response) ? response : response.items || response.data || []
      allItems.push(...items)
      
      // Check for more pages
      const total = this.getNestedValue(response, this._pagination.totalPath || 'total')
      hasMore = total ? allItems.length < total : items.length === limit
      
      if (options?.limit && allItems.length >= options.limit) {
        break
      }
      
      currentOffset += limit
    }
    
    return options?.limit ? allItems.slice(0, options.limit) : allItems
  }
  
  // ============================================
  // HELPERS
  // ============================================
  
  private transformToProduct(data: any): Product {
    return {
      id: data.id || data.product_id || data.sku || String(Math.random()),
      sku: data.sku || data.product_code || data.default_code,
      name: data.name || data.product_name || data.title || 'Unknown Product',
      description: data.description || data.description_sale || data.details,
      price: parseFloat(data.price || data.list_price || data.unit_price) || undefined,
      currency: data.currency || 'DZD',
      quantity: parseInt(data.quantity || data.stock || data.qty_available) || undefined,
      category: data.category || data.category_name || data.categ_id?.[1],
      isActive: data.is_active !== undefined ? data.is_active : data.active !== undefined ? data.active : true,
      ...data,
    }
  }
}

export default RESTConnector
