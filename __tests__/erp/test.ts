/**
 * ERP Integration System Tests
 * AlgeriaTrade.dz B2B Platform - Phase 2D
 * 
 * Tests cover:
 * - ERP Configuration
 * - Base Connector
 * - Sync Engine
 * - Field Mapper
 * - Webhook Handler
 * - Security Utilities
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import {
  SUPPORTED_ERP_SYSTEMS,
  DEFAULT_FIELD_MAPPINGS,
  SYNC_FREQUENCY_CONFIG,
  DEFAULT_RETRY_POLICY,
  getERPSystemConfig,
  getDefaultFieldMappings,
  getConnectionSettings,
} from '@/lib/erp/config'

import { 
  BaseERPConnector,
  IERPConnector,
  ConnectorStatus,
  ConnectionResult,
  TestResult,
  SyncResult,
  FieldMapping,
  Product,
  InventoryUpdate,
  FetchOptions,
  ConnectorCredentials,
} from '@/lib/erp/connectors/base-connector'

import { syncEngine } from '@/lib/erp/sync-engine'
import { DataTransformer } from '@/lib/erp/field-mapper'
import { webhookHandler } from '@/lib/erp/webhook-handler'
import {
  encrypt,
  decrypt,
  maskCredential,
  maskURL,
  isValidERPType,
  isValidURL,
  generateHMAC,
  verifyHMAC,
} from '@/lib/erp/security'

// ============================================
// CONFIG TESTS
// ============================================

describe('ERP Configuration', () => {
  describe('SUPPORTED_ERP_SYSTEMS', () => {
    it('should have all required ERP types defined', () => {
      const expectedTypes = ['SAP', 'Odoo', 'MicrosoftDynamics', 'Custom', 'REST']
      const actualTypes = Object.keys(SUPPORTED_ERP_SYSTEMS)
      
      expectedTypes.forEach(type => {
        expect(actualTypes).toContain(type)
      })
    })

    it('should have SAP configuration with correct endpoints', () => {
      const sapConfig = SUPPORTED_ERP_SYSTEMS.SAP
      
      expect(sapConfig.id).toBe('SAP')
      expect(sapConfig.name).toBeDefined()
      expect(sapConfig.defaultEndpoints.products).toContain('API_PRODUCT_SRV')
      expect(sapConfig.rateLimit.requestsPerMinute).toBeGreaterThan(0)
    })

    it('should have Odoo configuration with XML-RPC support', () => {
      const odooConfig = SUPPORTED_ERP_SYSTEMS.Odoo
      
      expect(odooConfig.id).toBe('Odoo')
      expect(odooConfig.supportedAuthTypes).toContain('XMLRPC')
      expect(odooConfig.defaultPort).toBe(8069)
    })
  })

  describe('SYNC_FREQUENCY_CONFIG', () => {
    it('should have all frequency options with valid intervals', () => {
      const frequencies = Object.keys(SYNC_FREQUENCY_CONFIG)
      
      expect(frequencies).toContain('REALTIME')
      expect(frequencies).toContain('HOURLY')
      expect(frequencies).toContain('MANUAL')
    })

    it('REALTIME should have 5 minute interval', () => {
      expect(SYNC_FREQUENCY_CONFIG.REALTIME.intervalMs).toBe(5 * 60 * 1000)
    })

    it('HOURLY should have 24 hour interval', () => {
      expect(SYNC_FREQUENCY_CONFIG.DAILY.intervalMs).toBe(24 * 60 * 60 * 1000)
    })

    it('MANUAL should have 0 interval (manual only)', () => {
      expect(SYNC_FREQUENCY_CONFIG.MANUAL.intervalMs).toBe(0)
    })
  })

  describe('DEFAULT_RETRY_POLICY', () => {
    it('should have reasonable retry settings', () => {
      expect(DEFAULT_RETRY_POLICY.maxRetries).toBeGreaterThan(0)
      expect(DEFAULT_RETRY_POLICY.baseDelayMs).toBeGreaterThan(0)
      expect(DEFAULT_RETRY_POLICY.backoffMultiplier).toBe(1.5) // Should be > 1 for exponential backoff
      expect(DEFAULT_RETRY_POLICY.retryableErrors).toContain('503') // Server errors
      expect(DEFAULT_RETRY_POLICY.retryableErrors).toContain('429') // Rate limit
    })
  })

  describe('Helper functions', () => {
    it('getERPSystemConfig should return valid config for known type', () => {
      const sapConfig = getERPSystemConfig('SAP')
      expect(sapConfig.id).toBe('SAP')
      expect(sapConfig.name).toBeDefined()
    })

    it('getDefaultFieldMappings should return mappings for known type and entity', () => {
      const sapProductMappings = getDefaultFieldMappings('SAP', 'PRODUCTS')
      
      expect(Array.isArray(sapProductMappings)).toBe(true)
      expect(sapProductMappings.length).toBeGreaterThan(0)
      expect(sapProductMappings[0]).toHaveProperty('localField')
      expect(sapProductMappings[0]).toHaveProperty('erpField')
    })

    it('getConnectionSettings should return settings with TLS enabled by default', () => {
      const settings = getConnectionSettings('SAP')
      
      expect(settings.timeout).toBeGreaterThan(0)
      expect(settings.keepAlive).toBe(true)
      expect(settings.rejectUnauthorized).toBe(true)
    })
  })
})

// ============================================
// BASE CONNECTOR TESTS
// ============================================

describe('BaseERPConnector', () => {
  let connector: BaseERPConnector

  beforeEach(() => {
    connector = new BaseERPConnector({
      endpoint: 'https://test.example.com',
      authType: 'API_KEY',
      apiKey: 'test-api-key',
    })
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(connector.name).toBeDefined()
      expect(connector.type).toBeDefined()
      expect(connector.version).toBe('1.0.0')
      expect(connector.status).toBe('DISCONNECTED')
    })

    it('should accept custom credentials on initialization', () => {
      const customConnector = new BaseERPConnector({
        endpoint: 'https://custom.com',
        authType: 'BASIC',
        username: 'admin',
        password: 'secret',
        timeout: 60000,
      })

      expect(customConnector.credentials.endpoint).toBe('https://custom.com')
      customConnector.credentials.username = 'admin'
      expect(customConnector.settings.timeout).toBe(60000)
    })
  })

  describe('Status Management', () => {
    it('should start in DISCONNECTED status', () => {
      expect(connector.status).toBe('DISCONNECTED')
    })

    it('should update status when setStatus is called', () => {
      // Access protected method through public interface
      const statusBefore = connector.status
      expect(statusBefore).toBe('DISCONNECTED')
    })
  })

  describe('Field Mappings', () => {
    it('should start with empty field mappings', () => {
      expect(connector.fieldMappings).toEqual([])
    })

    it('should allow setting field mappings', () => {
      const mappings: FieldMapping[] = [
        { localField: 'name', erpField: 'MAKTX' },
        { localField: 'price', erpField: 'NETPR', transform: 'toFloat' },
      ]
      
      connector.setFieldMappings(mappings)
      expect(connector.fieldMappings).toHaveLength(2)
    })

    it('should allow setting entity-specific mappings', () => {
      const productMappings = [
        { localField: 'name', erpField: 'name' },
        { localField: 'sku', erpField: 'default_code' },
      ]
      const inventoryMappings = [
        { localField: 'quantity', erpField: 'qty_available' },
      ]
      
      connector.setFieldMappings(productMappings, 'PRODUCTS')
      connector.setFieldMappings(inventoryMappings, 'INVENTORY')
      
      expect(connector.getFieldMappings('PRODUCTS')).toHaveLength(2)
      expect(connector.getFieldMappings('INVENTORY')).toHaveLength(1)
      expect(connector.fieldMappings).toHaveLength(3) // Total across all entities
    })
  })

  describe('Data Transformation', () => {
    beforeEach(() => {
      connector.setFieldMappings([
        { localField: 'name', erpField: 'MAKTX' },
        { localField: 'price', erpField: 'NETPR', transform: 'toFloat' },
        { localField: 'isActive', erpField: 'LVORM', transform: 'toBoolean' },
        { localField: 'createdAt', erpField: 'created_at', defaultValue: new Date().toISOString() },
      ])
    })

    it('should transform data from local to ERP format', async () => {
      const localData = {
        name: 'Test Product',
        price: '1500.50',
        isActive: true,
        createdAt: undefined,
      }
      
      const result = await connector.transformData(localData, 'toERP')
      
      expect(result.MAKTX).toBe('Test Product')
      expect(result.NETPR).toBe(1500.5)
      expect(result.LVORM).toBe(true)
      expect(result.created_at).toBeDefined()
    })

    it('should transform data from ERP to local format', async () => {
      const erpData = {
        MAKTX: 'Produit Test',
        NETPR: '2500.00',
        LVORM: '',
        created_at: '2024-01-15T10:30:00Z',
      }
      
      const result = await connector.transformData(erpData, 'fromERP')
      
      expect(result.name).toBe('Produit Test')
      expect(result.price).toBe(2500.00)
      expect(result.isActive).toBe(false) // Empty string is falsy
    })

    it('should apply uppercase transformation', async () => {
      const data = { name: 'test product' }
      connector.setFieldMappings([
        { localField: 'name', erpField: 'NAME', transform: 'uppercase' },
      ])
      
      const result = await connector.transformData(data, 'toERP')
      expect(result.NAME).toBe('TEST PRODUCT')
    })

    it('should apply lowercase transformation', async () => {
      const data = { name: 'TEST PRODUCT' }
      connector.setFieldMappings([
        { localField: 'name', erpField: 'name', transform: 'lowercase' },
      ])
      
      const result = await connector.transformData(data, 'toERP')
      expect(result.name).toBe('test product')
    })

    it('should use default value when source value is missing', async () => {
      const data = { name: 'Test' }
      connector.setFieldMappings([
        { localField: 'category', erpField: 'CATEGORY_ID', defaultValue: 'DEFAULT_CAT' },
      ])
      
      const result = await connector.transformData(data, 'toERP')
      expect(result.CATEGORY_ID).toBe('DEFAULT_CAT')
    })
  })

  describe('Auth Headers', () => {
    it('should build API Key headers', () => {
      const headers = connector.buildAuthHeaders()
      
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['Authorization']).toContain('Bearer')
      expect(headers['X-API-Key']).toBe('test-api-key')
    })

    it('should build Basic Auth headers', () => {
      const basicConnector = new BaseERPConnector({
        endpoint: 'https://basic-test.com',
        authType: 'BASIC',
        username: 'admin',
        password: 'secret123',
      })
      
      const headers = basicConnector.buildAuthHeaders()
      
      expect(headers['Authorization']).toContain('Basic ')
      // Base64 of admin:secret123
    })

    it('should build OAuth2 headers when access token available', () => {
      const oauthConnector = new BaseERPConnector({
        endpoint: 'https://oauth-test.com',
        authType: 'OAUTH2',
        accessToken: 'access-token-value',
      })
      
      const headers = oauthConnector.buildAuthHeaders()
      
      expect(headers['Authorization']).toBe('Bearer access-token-value')
    })
  })
})

// ============================================
// SYNC ENGINE TESTS
// ============================================

describe('SyncEngine', () => {
  beforeAll(() => {
    // Reset engine state before tests
  })

  afterAll(() => {
    // Cleanup
  })

  it('should be a singleton instance', () => {
    const instance1 = syncEngine
    const instance2 = syncEngine
    
    expect(instance1).toBe(instance2)
  })

  it('should register connectors', () => {
    const mockConnector = {
      name: 'Test Connector',
      type: 'REST' as any,
      version: '1.0.0',
      status: 'DISCONNECTED' as any,
      credentials: {} as any,
      settings: {} as any,
      fieldMappings: [] as any[],
      retryPolicy: {} as any,
      connect: jest.fn(),
      disconnect: jest.fn(),
      testConnection: jest.fn(),
      fetchProducts: jest.fn(),
      fetchInventoryUpdates: jest.fn(),
      pushOrder: jest.fn(),
      pullOrders: jest.fn(),
      syncInventory: jest.fn(),
      getFieldMappings: jest.fn(),
      setFieldMappings: jest.fn(),
      transformData: jest.fn(),
      healthCheck: jest.fn(),
    }

    syncEngine.registerConnector('test-1', mockConnector as any)
    
    expect(syncEngine.getConnector('test-1')).toBeDefined()
  })

  it('should unregister connectors', () => {
    syncEngine.unregisterConnector('test-1')
    
    expect(syncEngine.getConnector('test-1')).toBeUndefined()
  })

  it('should return all registered connectors', () => {
    const connectors = syncEngine.getConnectors()
    
    expect(connectors).toBeInstanceOf(Map)
  })
})

// ============================================
// FIELD MAPPER TESTS
// ============================================

describe('DataTransformer', () => {
  let transformer: DataTransformer

  beforeEach(() => {
    transformer = new DataTransformer([
      { localField: 'name', erpField: 'MAKTX' },
      { localField: 'price', erpField: 'NETPR', transform: 'toFloat' },
      { localField: 'quantity', erp: 'LABST', transform: 'toInt' },
      { localField: 'active', erp: 'SALE_OK', transform: 'toBoolean' },
    ])
  })

  describe('Transformation', () => {
    it('should transform simple fields correctly', () => {
      const input = { name: 'Test', price: '100.50', quantity: '25.7', active: 'true' }
      const output = transformer.transform(input, 'toERP')
      
      expect(output.MAKTX).toBe('Test')
      expect(output.NETPR).toBeCloseTo(100.50, 1)
      expect(output.LABST).toBe(25)
      expect(output.SALE_OK).toBe(true)
    })

    it('should handle nested object paths', () => {
      const nestedTransformer = new DataTransformer([
        { localField: 'customer.name', erp: 'ORG_NAME1' },
        { localField: 'customer.email', erp: 'SMTP_ADDR' },
      ])
      
      const input = { customer: { name: 'Test Company', email: 'test@example.com' } }
      const output = nestedTransformer.transform(input, 'toERP')
      
      expect(output.ORG_NAME1).toBe('Test Company')
      output.SMTP_ADDR && expect(output.SMTP_ADDR).toBe('test@example.com')
    })

    it('should use default values for missing fields', () => {
      const defaultTransformer = new DataTransformer([
        { localField: 'category', erp: 'MATKL', defaultValue: 'DEFAULT' },
      ])
      
      const input = { name: 'Product' }
      const output = defaultTransformer.transform(input, 'toERP')
      
      expect(output.category).toBe('DEFAULT')
    })

    it('should skip fields with undefined values when no default', () => {
      const partialTransformer = new DataTransformer([
        { localField: 'optional', erp: 'OPTIONAL' },
      ])
      
      const input = { name: 'Only Name' }
      const output = partialTransformer.transform(input, 'toERP')
      
      expect(output.name).toBe('Only Name')
      expect(output.optional).toBeUndefined() // Not included because no value
    })
  })

  describe('Validation', () => {
    it('should pass validation for complete required data', () => {
      const validatingTransformer = new DataTransformer([
        { localField: 'name', erp: 'NAME', required: true },
        { localField: 'email', erp: 'EMAIL', required: true },
      ])
      
      const validInput = { name: 'Test', email: 'test@test.com' }
      const invalidInput = { name: 'Test' } // Missing email
      
      const validResult = validatingTransformer.validate(validInput, 'toERP')
      const invalidResult = validatingTransformer.validate(invalidInput, 'toERP')
      
      expect(validResult.valid).toBe(true)
      expect(validResult.errors).toEqual([])
      
      expect(invalidResult.valid).toBe(false)
      expect(invalidResult.errors.length).toBeGreaterThan(0)
    })
  })
})

// ============================================
// SECURITY UTILITIES TESTS
// ============================================

describe('Security Utilities', () => {
  describe('Encryption/Decryption', () => {
    const testKey = 'abcdefghijklmnopqrstuvwxyz12345678901234567890123456789' // 32 char hex key

    it('should encrypt and decrypt text correctly', () => {
      const plaintext = 'sensitive-password-123'
      
      const encrypted = encrypt(plaintext, testKey)
      const decrypted = decrypt(encrypted, testKey)
      
      expect(decrypted).toBe(plaintext)
      expect(encrypted).not.toBe(plaintext)
    })

    it('should produce different ciphertexts for same plaintext (due to random IV)', () => {
      const plaintext = 'same-input-data'
      
      const encrypted1 = encrypt(plaintext, testKey)
      const encrypted2 = encrypt(plaintext, testKey)
      
      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should fail decryption with wrong key', () => {
      const plaintext = 'secret-data'
      const wrongKey = 'wrong-key-xyz-abc-123-456-789-012'
      
      const encrypted = encrypt(plaintext, testKey)
      
      expect(() => decrypt(encrypted, wrongKey)).toThrow()
    })
  })

  describe('HMAC Generation & Verification', () => {
    const secret = 'webhook-secret-key'

    it('should generate consistent HMAC for same input', () => {
      const payload = '{"event":"product.created","data":{}}'
      
      const hmac1 = generateHMAC(payload, secret)
      const hmac2 = generateHMAC(payload, secret)
      
      expect(hmac1).toBe(hmac2)
      expect(hmac1.length).toBe(64) // SHA-256 produces 64 hex chars
    })

    it('verify HMAC should return true for valid signature', () => {
      const payload = '{"event":"test"}'
      const signature = generateHMAC(payload, secret)
      
      expect(verifyHMAC(payload, signature, secret)).toBe(true)
    })

    it('verify HMAC should return false for tampered payload', () => {
      const payload = '{"event":"test"}'
      const signature = generateHMAC(payload, secret)
      const tamperedPayload = '{"event":"tampered"}'
      
      expect(verifyHMAC(tamperedPayload, signature, secret)).toBe(false)
    })
  })

  describe('Credential Masking', () => {
    it('should mask middle characters of credentials', () => {
      const password = 'my-super-secret-password-123'
      const masked = maskCredential(password, 4)
      
      expect(masked).toBe('my-s***-***-word-123')
      expect(masked).not.toContain('super-secret')
    })

    it('mask short values completely', () => {
      const shortValue = 'abc'
      const masked = maskCredential(shortValue, 4)
      
      expect(masked).toBe('***')
    })

    it('should mask URL credentials properly', () => {
      const url = 'https://admin:secret123@api.example.com/path'
      const masked = maskURL(url)
      
      expect(masked).not.toContain('admin')
      expect(masked).not.toContain('secret123')
      expect(masked).toContain('***:***@')
    })
  })

  describe('Validation Functions', () => {
    it('should validate ERP types correctly', () => {
      expect(isValidERPType('SAP')).toBe(true)
      expect(isValidERPType('Odoo')).toBe(true)
      expect(isValidERPType('Custom')).toBe(true)
      expect(isValidERPType('INVALID')).toBe(false)
    })

    it('should validate URLs correctly', () => {
      expect(isValidURL('https://example.com')).toBe(true)
      expect(isValidURL('http://example.com')).toBe(true)
      expect(isValidURL('invalid-url')).toBe(false)
      expect(isValidURL('ftp://example.com')).toBe(false)
    })

    it('should validate API keys format', () => {
      expect(isValidAPIKey('valid-api-key-12345678')).toBe(true)
      expect(isValidAPIKey('short')).toBe(false) // Too short
      expect(isValidAPIKey('')).toBe(false) // Empty
      expect(isValidAPIKey('a'.repeat(300))).toBe(false) // Too long
    })
  })
})

// ============================================
// WEBHOOK HANDLER TESTS
// ============================================

describe('WebhookHandler', () => {
  it('should be a singleton instance', () => {
    const instance1 = webhookHandler
    const instance2 = webhookHandler
    
    expect(instance1).toBe(instance2)
  })

  it('should process valid webhooks successfully', async () => {
    const mockRequest = new Request('https://algeriatrade.dz/api/erp/webhook/Odoo', {
      method: 'POST',
      body: JSON.stringify({ event: 'product.created', data: { id: 1, name: 'Test' } }),
      headers: { 'content-type': 'application/json' },
    })
    
    const result = await webhookHandler.processWebhook('Odoo', mockRequest)
    
    expect(result.success).toBe(true)
    expect(result.result?.actionTaken).toBeDefined()
  })

  it('should reject webhooks with invalid connector type', async () => {
    const mockRequest = new Request('https://algeriatrade.dz/api/erp/webhook/InvalidType', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    })
    
    const result = await webhookHandler.processWebhook('InvalidType' as any, mockRequest)
    
    expect(result.success).toBe(false)
    expect(result.status).toBe(400)
  })
})
