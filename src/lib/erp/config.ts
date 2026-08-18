// ERP Configuration - Supported systems, connection settings, sync schedules
// AlgeriaTrade.dz B2B Platform - Inventory/ERP Sync System

export type ERPSystemType = 'SAP' | 'Odoo' | 'MicrosoftDynamics' | 'Custom' | 'REST'
export type AuthType = 'API_KEY' | 'BASIC' | 'OAUTH2' | 'CERTIFICATE' | 'XMLRPC'
export type SyncDirection = 'PUSH' | 'PULL' | 'BIDIRECTIONAL'
export type ConflictResolution = 'LAST_WRITE_WINS' | 'MANUAL' | 'MERGE' | 'PLATFORM_WINS' | 'ERP_WINS'
export type SyncFrequency = 'REALTIME' | 'EVERY_5_MIN' | 'EVERY_15_MIN' | 'EVERY_30_MIN' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MANUAL'

// ============================================
// SUPPORTED ERP SYSTEMS CONFIGURATION
// ============================================

export interface ERPSystemConfig {
  id: ERPSystemType
  name: string
  description: string
  logoUrl?: string
  documentationUrl?: string
  
  // Connection defaults
  defaultPort: number
  defaultProtocol: 'https' | 'http'
  supportedAuthTypes: AuthType[]
  
  // Capabilities
  capabilities: ERPCapability[]
  
  // Default endpoints
  defaultEndpoints: {
    products: string
    inventory: string
    orders: string
    customers: string
  }
  
  // Rate limiting
  rateLimit: {
    requestsPerMinute: number
    burstLimit: number
  }
}

export interface ERPCapability {
  id: string
  name: string
  description: string
  supported: boolean
}

export const SUPPORTED_ERP_SYSTEMS: Record<ERPSystemType, ERPSystemConfig> = {
  SAP: {
    id: 'SAP',
    name: 'SAP S/4HANA / Business One',
    description: 'Enterprise resource planning for large organizations with OData/REST APIs',
    documentationUrl: 'https://help.sap.com/docs/sap-s-4hana',
    defaultPort: 44300,
    defaultProtocol: 'https',
    supportedAuthTypes: ['BASIC', 'OAUTH2', 'CERTIFICATE'],
    capabilities: [
      { id: 'products', name: 'Product Master Data', description: 'Sync product catalog', supported: true },
      { id: 'inventory', name: 'Inventory Management', description: 'Real-time stock levels', supported: true },
      { id: 'orders', name: 'Sales Orders', description: 'Push/pull orders', supported: true },
      { id: 'customers', name: 'Business Partners', description: 'Customer data sync', supported: true },
      { id: 'prices', name: 'Condition Pricing', description: 'Price synchronization', supported: true },
      { id: 'bapi', name: 'BAPI Calls', description: 'Direct BAPI execution', supported: true },
    ],
    defaultEndpoints: {
      products: '/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product',
      inventory: '/sap/opu/odata/sap/API_INVENTORY_SRV/A_MaterialStock',
      orders: '/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder',
      customers: '/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner',
    },
    rateLimit: {
      requestsPerMinute: 100,
      burstLimit: 20,
    },
  },
  
  Odoo: {
    id: 'Odoo',
    name: 'Odoo (Community/Enterprise)',
    description: 'Open-source ERP solution for SMBs with XML-RPC and REST APIs',
    documentationUrl: 'https://www.odoo.com/documentation/',
    defaultPort: 8069,
    defaultProtocol: 'http',
    supportedAuthTypes: ['API_KEY', 'XMLRPC', 'BASIC'],
    capabilities: [
      { id: 'products', name: 'Product Templates', description: 'Sync product templates', supported: true },
      { id: 'inventory', name: 'Stock Quantities', description: 'Real-time inventory', supported: true },
      { id: 'orders', name: 'Sale Orders', description: 'Order management', supported: true },
      { id: 'customers', name: 'Contacts/Partners', description: 'Customer/partner sync', supported: true },
      { id: 'webhooks', name: 'Webhook Support', description: 'Receive Odoo webhooks', supported: true },
      { id: 'accounting', name: 'Accounting', description: 'Invoice integration', supported: true },
    ],
    defaultEndpoints: {
      products: '/api/product.template',
      inventory: '/api.stock.quant',
      orders: '/api/sale.order',
      customers: '/api/res.partner',
    },
    rateLimit: {
      requestsPerMinute: 60,
      burstLimit: 10,
    },
  },
  
  MicrosoftDynamics: {
    id: 'MicrosoftDynamics',
    name: 'Microsoft Dynamics 365',
    description: 'Microsoft cloud-based business applications with Dataverse/OData API',
    documentationUrl: 'https://learn.microsoft.com/dynamics365/',
    defaultPort: 443,
    defaultProtocol: 'https',
    supportedAuthTypes: ['OAUTH2'],
    capabilities: [
      { id: 'products', name: 'Products', description: 'Product catalog sync', supported: true },
      { id: 'inventory', name: 'Inventory', description: 'Stock level sync', supported: true },
      { id: 'orders', name: 'Sales Orders', description: 'Order integration', supported: true },
      { id: 'customers', name: 'Accounts/Contacts', description: 'Customer data', supported: true },
      { id: 'invoices', name: 'Invoices', description: 'Invoice generation', supported: true },
    ],
    defaultEndpoints: {
      products: '/api/data/v9.0/products',
      inventory: '/api/data/v9.0/inventories',
      orders: '/api/data/v9.0/salesorders',
      customers: '/api/data/v9.0/accounts',
    },
    rateLimit: {
      requestsPerMinute: 120,
      burstLimit: 30,
    },
  },
  
  Custom: {
    id: 'Custom',
    name: 'Custom ERP Integration',
    description: 'Generic REST API connector for custom ERP systems',
    defaultPort: 443,
    defaultProtocol: 'https',
    supportedAuthTypes: ['API_KEY', 'BASIC', 'OAUTH2'],
    capabilities: [
      { id: 'products', name: 'Products', description: 'Product sync via REST', supported: true },
      { id: 'inventory', name: 'Inventory', description: 'Stock level sync', supported: true },
      { id: 'orders', name: 'Orders', description: 'Order integration', supported: true },
      { id: 'customers', name: 'Customers', description: 'Customer data', supported: true },
      { id: 'custom', name: 'Custom Endpoints', description: 'User-defined endpoints', supported: true },
    ],
    defaultEndpoints: {
      products: '/api/products',
      inventory: '/api/inventory',
      orders: '/api/orders',
      customers: '/api/customers',
    },
    rateLimit: {
      requestsPerMinute: 60,
      burstLimit: 15,
    },
  },
  
  REST: {
    id: 'REST',
    name: 'Generic REST API',
    description: 'Connect to any REST API with custom configuration',
    defaultPort: 443,
    defaultProtocol: 'https',
    supportedAuthTypes: ['API_KEY', 'BASIC', 'OAUTH2'],
    capabilities: [
      { id: 'products', name: 'Products', description: 'GET/POST products', supported: true },
      { id: 'inventory', name: 'Inventory', description: 'GET/PUT inventory', supported: true },
      { id: 'orders', name: 'Orders', description: 'Order CRUD operations', supported: true },
      { id: 'webhooks', name: 'Webhooks', description: 'Receive webhook events', supported: true },
    ],
    defaultEndpoints: {
      products: '/products',
      inventory: '/inventory',
      orders: '/orders',
      customers: '/customers',
    },
    rateLimit: {
      requestsPerMinute: 30,
      burstLimit: 5,
    },
  },
}

// ============================================
// SYNC SCHEDULE CONFIGURATION
// ============================================

export interface SyncScheduleConfig {
  frequency: SyncFrequency
  direction: SyncDirection
  entityTypes: string[]
  
  // Timing options
  specificTime?: string // HH:mm format for daily/weekly
  daysOfWeek?: number[] // 0-6 for weekly
  
  // Delta sync settings
  deltaSyncEnabled: boolean
  deltaSyncField?: string // Field to track changes (e.g., updatedAt)
  
  // Full sync schedule
  fullSyncFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  fullSyncTime?: string
}

export const SYNC_FREQUENCY_CONFIG: Record<SyncFrequency, { label: string; intervalMs: number; description: string }> = {
  REALTIME: {
    label: 'Real-time (5 min)',
    intervalMs: 5 * 60 * 1000,
    description: 'Synchronize every 5 minutes for near real-time updates',
  },
  EVERY_5_MIN: {
    label: 'Every 5 minutes',
    intervalMs: 5 * 60 * 1000,
    description: 'Standard frequent sync interval',
  },
  EVERY_15_MIN: {
    label: 'Every 15 minutes',
    intervalMs: 15 * 60 * 1000,
    description: 'Balanced sync frequency',
  },
  EVERY_30_MIN: {
    label: 'Every 30 minutes',
    intervalMs: 30 * 60 * 1000,
    description: 'Moderate sync frequency',
  },
  HOURLY: {
    label: 'Hourly',
    intervalMs: 60 * 60 * 1000,
    description: 'Once per hour sync',
  },
  DAILY: {
    label: 'Daily',
    intervalMs: 24 * 60 * 60 * 1000,
    description: 'Once per day (configurable time)',
  },
  WEEKLY: {
    label: 'Weekly',
    intervalMs: 7 * 24 * 60 * 60 * 1000,
    description: 'Once per week',
  },
  MANUAL: {
    label: 'Manual only',
    intervalMs: 0,
    description: 'Only sync when manually triggered',
  },
}

// ============================================
// FIELD MAPPING DEFAULTS
// ============================================

export interface FieldMappingDefinition {
  localField: string
  erpField: string
  transform?: TransformRule
  required: boolean
  defaultValue?: any
  validation?: ValidationRule
}

export interface TransformRule {
  type: 'uppercase' | 'lowercase' | 'trim' | 'toString' | 'toNumber' | 'toFloat' | 'toInt' | 
        'toBoolean' | 'toDate' | 'formatPrice' | 'formatDate' | 'mapCurrency' | 'mapLanguage' |
        'concat' | 'split' | 'lookup' | 'custom'
  params?: Record<string, any>
}

export interface ValidationRule {
  type: 'required' | 'pattern' | 'minLength' | 'maxLength' | 'min' | 'max' | 'enum'
  value?: any
  message?: string
}

// Default field mappings for each ERP system and entity type
export const DEFAULT_FIELD_MAPPINGS: Record<ERPSystemType, Record<string, FieldMappingDefinition[]>> = {
  SAP: {
    PRODUCTS: [
      { localField: 'name', erpField: 'MAKTX', required: true },
      { localField: 'sku', erpField: 'MATNR', transform: { type: 'uppercase' }, required: true },
      { localField: 'description', erpField: 'MAKTG' },
      { localField: 'price', erpField: 'NETPR', transform: { type: 'toFloat' } },
      { localField: 'currency', erpField: 'WAERK', defaultValue: 'DZD' },
      { localField: 'unit', erpField: 'MEINS', defaultValue: 'EA' },
      { localField: 'category.id', erpField: 'MATKL' },
      { localField: 'weight', erpField: 'BRGEW', transform: { type: 'toFloat' } },
      { localField: 'isActive', erpField: 'LVORM', transform: { type: 'toBoolean' }, defaultValue: false },
    ],
    INVENTORY: [
      { localField: 'productId', erpField: 'MATNR', required: true },
      { localField: 'quantity', erpField: 'LABST', transform: { type: 'toInt' } },
      { localField: 'warehouse', erpField: 'WERKS', defaultValue: '1000' },
      { localField: 'location', erpField: 'LGORT' },
    ],
    CUSTOMERS: [
      { localField: 'externalId', erpField: 'PARTNER', required: true },
      { localField: 'companyName', erpField: 'ORG_NAME1', required: true },
      { localField: 'email', erpField: 'SMTP_ADDR' },
      { localField: 'phone', erpField: 'TELEPHONE1' },
      { localField: 'address.city', erpField: 'CITY' },
      { localField: 'address.country', erpField: 'COUNTRY', defaultValue: 'DZ' },
      { localField: 'nif', erpField: 'TAXNUMXL' },
    ],
    ORDERS: [
      { localField: 'orderNumber', erpField: 'VBELN', required: true },
      { localField: 'customer.externalId', erpField: 'KUNNR', required: true },
      { localField: 'totalAmount', erpField: 'NETWR', transform: { type: 'toFloat' } },
      { localField: 'currency', erpField: 'WAERK', defaultValue: 'DZD' },
      { localField: 'status', erpField: 'AUART' },
    ],
  },
  
  Odoo: {
    PRODUCTS: [
      { localField: 'name', erpField: 'name', required: true },
      { localField: 'sku', erpField: 'default_code' },
      { localField: 'description', erpField: 'description_sale' },
      { localField: 'price', erpField: 'list_price', transform: { type: 'toFloat' } },
      { localField: 'category.externalId', erpField: 'categ_id' },
      { localField: 'isActive', erpField: 'sale_ok', transform: { type: 'toBoolean' }, defaultValue: true },
      { localField: 'barcode', erpField: 'barcode' },
      { localField: 'weight', erpField: 'weight', transform: { type: 'toFloat' } },
    ],
    INVENTORY: [
      { localField: 'productId', erpField: 'product_id', required: true },
      { localField: 'quantity', erpField: 'qty_available', transform: { type: 'toFloat' } },
      { localField: 'warehouse', erpField: 'warehouse_id' },
    ],
    CUSTOMERS: [
      { localField: 'externalId', erpField: 'id', required: true },
      { localField: 'companyName', erpField: 'name', required: true },
      { localField: 'email', erpField: 'email' },
      { localField: 'phone', erpField: 'phone' },
      { localField: 'nif', erpField: 'vat' },
      { localField: 'address.city', erpField: 'city' },
    ],
    ORDERS: [
      { localField: 'externalId', erpField: 'id', required: true },
      { localField: 'orderNumber', erpField: 'name' },
      { localField: 'customer.externalId', erpField: 'partner_id', required: true },
      { localField: 'status', erpField: 'state' },
      { localField: 'totalAmount', erpField: 'amount_total', transform: { type: 'toFloat' } },
    ],
  },
  
  MicrosoftDynamics: {
    PRODUCTS: [
      { localField: 'name', erpField: 'name', required: true },
      { localField: 'sku', erpField: 'productnumber' },
      { localField: 'description', erpField: 'description' },
      { localField: 'price', erpField: 'price', transform: { type: 'toFloat' } },
      { localField: 'currency', erpField: 'transactioncurrencyid', defaultValue: 'DZD' },
    ],
    INVENTORY: [
      { localField: 'productId', erpField: 'productid', required: true },
      { localField: 'quantity', erpField: 'quantityonhand', transform: { type: 'toFloat' } },
    ],
    CUSTOMERS: [
      { localField: 'externalId', erpField: 'accountid', required: true },
      { localField: 'companyName', erpField: 'name', required: true },
      { localField: 'email', erpField: 'emailaddress1' },
      { localField: 'phone', erpField: 'telephone1' },
    ],
    ORDERS: [
      { localField: 'externalId', erpField: 'salesorderid', required: true },
      { localField: 'orderNumber', erpField: 'ordernumber' },
      { localField: 'totalAmount', erpField: 'totalamount', transform: { type: 'toFloat' } },
    ],
  },
  
  Custom: {},
  REST: {},
}

// ============================================
// RATE LIMITING & RETRY POLICIES
// ============================================

export interface RetryPolicy {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableErrors: string[]
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    '502',
    '503',
    '504',
    '429', // Too Many Requests
    'TIMEOUT',
    'NETWORK_ERROR',
  ],
}

export function calculateRetryDelay(attempt: number, policy: RetryPolicy): number {
  const delay = policy.baseDelayMs * Math.pow(policy.backoffMultiplier, attempt)
  return Math.min(delay, policy.maxDelayMs)
}

export function isRetryableError(error: Error | string, policy: RetryPolicy): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message
  return policy.retryableErrors.some(err => errorMessage.includes(err))
}

// ============================================
// CONNECTION SETTINGS PER ERP TYPE
// ============================================

export interface ConnectionSettings {
  timeout: number
  keepAlive: boolean
  tlsVersion: 'TLS1.2' | 'TLS1.3'
  rejectUnauthorized: boolean
  proxy?: {
    host: string
    port: number
    auth?: {
      username: string
      password: string
    }
  }
}

export const DEFAULT_CONNECTION_SETTINGS: Record<ERPSystemType, ConnectionSettings> = {
  SAP: {
    timeout: 30000,
    keepAlive: true,
    tlsVersion: 'TLS1.2',
    rejectUnauthorized: true,
  },
  Odoo: {
    timeout: 60000,
    keepAlive: true,
    tlsVersion: 'TLS1.2',
    rejectUnauthorized: true,
  },
  MicrosoftDynamics: {
    timeout: 30000,
    keepAlive: true,
    tlsVersion: 'TLS1.3',
    rejectUnauthorized: true,
  },
  Custom: {
    timeout: 30000,
    keepAlive: true,
    tlsVersion: 'TLS1.3',
    rejectUnauthorized: true,
  },
  REST: {
    timeout: 30000,
    keepAlive: true,
    tlsVersion: 'TLS1.3',
    rejectUnauthorized: true,
  },
}

// Helper functions
export function getERPSystemConfig(type: ERPSystemType): ERPSystemConfig {
  return SUPPORTED_ERP_SYSTEMS[type]
}

export function getDefaultFieldMappings(type: ERPSystemType, entityType: string): FieldMappingDefinition[] {
  return DEFAULT_FIELD_MAPPINGS[type]?.[entityType] || []
}

export function getConnectionSettings(type: ERPSystemType): ConnectionSettings {
  return DEFAULT_CONNECTION_SETTINGS[type]
}
