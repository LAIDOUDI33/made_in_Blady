// SAP S/4HANA & Business One Connector
// AlgeriaTrade.dz B2B Platform - Phase 8J

import { BaseERPClient, ERPConfig, EntityType, SyncOptions, SyncResult, SyncError, FieldMapping } from './integration-framework'

export interface SAPConfig extends ERPConfig {
  type: 'SAP'
  // SAP-specific settings
  systemId?: string
  client?: string  // SAP client (e.g., '100')
  language?: string  // SAP logon language (e.g., 'FR', 'EN')
  useIDoc?: boolean  // Use IDoc for async operations
}

export interface SAPMaterial {
  MATNR: string  // Material number
  MAKTX: string  // Material description
  MATKL: string  // Material group
  MEINS: string  // Base unit of measure
  NETPR: number  // Net price
  WAERK: string  // Currency key
  MBRSH: string  // Industry sector
  MTART: string  // Material type
  EXTWG: string  // External material group
  PRDHA: string  // Product hierarchy
  BRGEW: number  // Gross weight
  GEWEI: string  // Weight unit
  NTGEW: number  // Net weight
  VOLUM: number  // Volume
  VOLEH: string  // Volume unit
  SPART: string  // Division
}

export interface SAPBusinessPartner {
  PARTNER: string  // Business partner number
  BP_KIND: string  // Business partner type
  ORG_NAME1: string  // Name 1
  STREET: string  // Street address
  CITY: string  // City
  POST_CODE1: string  // Postal code
  COUNTRY: string  // Country key
  REGION: string  // Region
  TELEPHONE1: string  // Telephone
  FAX_NUMBER: string  // Fax
  SMTP_ADDR: string  // Email address
  TAXNUMXL: string  // Tax number (e.g., NIF in Algeria)
  ROLE_CATEGORY: string  // Partner role category
}

export interface SAPSalesOrder {
  VBELN: string  // Sales document number
  AUART: string  // Sales document type
  NETWR: number  // Net value
  WAERK: string  // SD document currency
  KUNNR: string  // Sold-to party
  VKORG: string  // Sales organization
  VTWEG: string  // Distribution channel
  SPART: string  // Division
  ERDAT: string  // Date on which record was created
  ANGU: string  // Purchase order number
}

export interface SAPStock {
  MATNR: string  // Material number
  WERKS: string  // Plant
  LGORT: string  // Storage location
  LABST: number  // Valuated unrestricted-use stock
  INSME: number  // Stock in quality inspection
  UMLME: number  // Stock transfer
  WESBS: string  // Total goods movement receipt
  SPEME: number  // Fixed retained stock
}

export class SAPConnector extends BaseERPClient {
  config: SAPConfig
  
  constructor(config: SAPConfig) {
    super()
    this.config = config
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner?$top=1')
      return response.ok || response.d?.length >= 0
    } catch (error) {
      console.error('SAP connection test failed:', error)
      return false
    }
  }

  async pullEntities(entityType: EntityType, options?: SyncOptions): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      processed: 0,
      created: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    }

    switch (entityType) {
      case 'PRODUCTS':
        await this.pullProducts(result, options)
        break
        
      case 'INVENTORY':
        await this.pullInventory(result, options)
        break
        
      case 'CUSTOMERS':
        await this.pullCustomers(result, options)
        break
        
      case 'ORDERS':
        await this.pullOrders(result, options)
        break
        
      case 'PRICES':
        await this.pullPrices(result, options)
        break
        
      default:
        result.errors.push({
          message: `Entity type ${entityType} not supported for SAP pull`,
          code: 'UNSUPPORTED_ENTITY',
        })
        result.success = false
    }

    return result
  }

  async pushEntities(entityType: EntityType, data: any[], options?: SyncOptions): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      processed: data.length,
      created: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    }

    if (options?.dryRun) {
      result.created = data.length
      return result
    }

    for (const item of data) {
      try {
        const sapData = this.transformData(item, this.config.fieldMappings, 'toERP')
        
        switch (entityType) {
          case 'PRODUCTS':
            await this.pushProduct(sapData, item.id)
            result.updated++
            break
            
          case 'INVENTORY':
            await this.pushInventory(sapData, item.id)
            result.updated++
            break
            
          case 'ORDERS':
            await this.pushOrder(sapData, item.id)
            result.created++
            break
            
          case 'CUSTOMERS':
            await this.pushCustomer(sapData, item.id)
            result.created++
            break
            
          default:
            result.skipped++
        }
        
        result.processed++
      } catch (error: any) {
        result.failed++
        result.errors.push({
          recordId: item.id,
          message: error.message || 'Failed to push entity to SAP',
          code: 'PUSH_ERROR',
          details: error,
        })
      }
    }

    result.success = result.failed === 0
    return result
  }

  async getEntity(entityType: EntityType, externalId: string): Promise<any> {
    switch (entityType) {
      case 'PRODUCTS':
        return this.getSAPMaterial(externalId)
        
      case 'CUSTOMERS':
        return this.getSAPBusinessPartner(externalId)
        
      case 'ORDERS':
        return this.getSAPSalesOrder(externalId)
        
      default:
        throw new Error(`Get entity not supported for ${entityType}`)
    }
  }

  async createEntity(entityType: EntityType, data: any): Promise<string> {
    const sapData = this.transformData(data, this.config.fieldMappings, 'toERP')
    
    switch (entityType) {
      case 'PRODUCTS':
        return this.createSAPMaterial(sapData)
        
      case 'CUSTOMERS':
        return this.createSAPBusinessPartner(sapData)
        
      case 'ORDERS':
        return this.createSAPSalesOrder(sapData)
        
      default:
        throw new Error(`Create entity not supported for ${entityType}`)
    }
  }

  async updateEntity(entityType: EntityType, externalId: string, data: any): Promise<boolean> {
    const sapData = this.transformData(data, this.config.fieldMappings, 'toERP')
    
    switch (entityType) {
      case 'PRODUCTS':
        return this.updateSAPMaterial(externalId, sapData)
        
      case 'CUSTOMERS':
        return this.updateSAPBusinessPartner(externalId, sapData)
        
      default:
        throw new Error(`Update entity not supported for ${entityType}`)
    }
  }

  async deleteEntity(entityType: EntityType, externalId: string): Promise<boolean> {
    try {
      await this.makeRequest('DELETE', this.getEntityEndpoint(entityType, externalId))
      return true
    } catch (error) {
      console.error(`Failed to delete ${entityType} ${externalId} from SAP:`, error)
      return false
    }
  }

  // ============================================
  // SAP-SPECIFIC METHODS
  // ============================================

  private async pullProducts(result: SyncResult, options?: SyncOptions): Promise<void> {
    try {
      // Fetch materials from SAP using OData API
      let url = '/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product'
      
      if (options?.fromDate) {
        url += `?$filter=LastChangeDateTime ge '${options.fromDate.toISOString()}'`
      }
      
      url += '&$top=100' // Pagination would be handled in production
      
      const response = await this.makeRequest('GET', url)
      const materials: SAPMaterial[] = response.d?.results || []
      
      for (const material of materials) {
        try {
          const localData = this.transformData(material, this.config.fieldMappings, 'fromERP')
          
          // Check if product exists locally
          const existing = await db.product.findFirst({
            where: { 
              OR: [
                { sku: material.MATNR },
                { name: material.MAKTX },
              ]
            }
          })
          
          if (existing) {
            await db.product.update({
              where: { id: existing.id },
              data: {
                ...localData,
                sku: material.MATNR,
                updatedAt: new Date(),
              }
            })
            result.updated++
          } else {
            await db.product.create({
              data: {
                id: `sap_${material.MATNR}`,
                name: material.MAKTX,
                slug: `${material.MAKTX}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                sku: material.MATNR,
                price: parseFloat(String(material.NETPR)) || undefined,
                currency: material.WAERK || 'DZD',
                status: 'published',
              }
            })
            result.created++
          }
          
          result.processed++
        } catch (error: any) {
          result.failed++
          result.errors.push({
            recordId: material.MATNR,
            message: error.message || 'Failed to sync product',
            code: 'SYNC_ERROR',
          })
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push({
        message: error.message || 'Failed to fetch products from SAP',
        code: 'FETCH_ERROR',
      })
    }
  }

  private async pullInventory(result: SyncResult, options?: SyncOptions): Promise<void> {
    try {
      const url = '/sap/opu/odata/sap/API_INVENTORY_SRV/A_MaterialStock'
      const response = await this.makeRequest('GET', url)
      const stocks: SAPStock[] = response.d?.results || []
      
      for (const stock of stocks) {
        try {
          // Update inventory in local database
          // This would typically update a stock/inventory table
          console.log(`Syncing stock for material ${stock.MATNR}: ${stock.LABST} units`)
          result.processed++
          result.updated++
        } catch (error: any) {
          result.failed++
          result.errors.push({
            recordId: stock.MATNR,
            message: error.message || 'Failed to sync inventory',
          })
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push({
        message: error.message || 'Failed to fetch inventory from SAP',
      })
    }
  }

  private async pullCustomers(result: SyncResult, options?: SyncOptions): Promise<void> {
    try {
      const url = '/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner?$filter=BP_ROLE_CATEGORY eq \'CUSTOMER\''
      const response = await this.makeRequest('GET', url)
      const partners: SAPBusinessPartner[] = response.d?.results || []
      
      for (const partner of partners) {
        try {
          const localData = this.transformData(partner, this.config.fieldMappings, 'fromERP')
          
          // Check if company exists locally by SAP partner ID
          const existing = await db.company.findFirst({
            where: { 
              OR: [
                { nif: partner.TAXNUMXL },
                { contactEmail: partner.SMTP_ADDR },
              ]
            }
          })
          
          if (existing) {
            await db.company.update({
              where: { id: existing.id },
              data: {
                ...localData,
                updatedAt: new Date(),
              }
            })
            result.updated++
          } else {
            // Create new company from SAP business partner
            await db.company.create({
              data: {
                id: `sap_bp_${partner.PARTNER}`,
                name: partner.ORG_NAME1 || '',
                slug: `${partner.ORG_NAME1 || ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                contactEmail: partner.SMTP_ADDR,
                contactPhone: partner.TELEPHONE1,
                nif: partner.TAXNUMXL,
                verificationStatus: 'PENDING',
                userId: 'system_import',
                tenantId: 'default',
              }
            })
            result.created++
          }
          
          result.processed++
        } catch (error: any) {
          result.failed++
          result.errors.push({
            recordId: partner.PARTNER,
            message: error.message || 'Failed to sync customer',
          })
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push({
        message: error.message || 'Failed to fetch customers from SAP',
      })
    }
  }

  private async pullOrders(result: SyncResult, options?: SyncOptions): Promise<void> {
    try {
      const url = '/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder'
      const response = await this.makeRequest('GET', url)
      const orders: SAPSalesOrder[] = response.d?.results || []
      
      for (const order of orders) {
        try {
          const localData = this.transformData(order, this.config.fieldMappings, 'fromERP')
          
          // Check if order exists locally
          const existing = await db.order.findFirst({
            where: { orderNumber: order.VBELN }
          })
          
          if (!existing && !['REJECTED', 'CANCELLED'].includes(order.AUART)) {
            await db.order.create({
              data: {
                id: `sap_order_${order.VBELN}`,
                orderNumber: order.VBELN,
                subtotal: parseFloat(String(order.NETWR)) || 0,
                totalAmount: parseFloat(String(order.NETWR)) || 0,
                currency: order.WAERK || 'DZD',
                status: this.mapSAPOrderStatus(order.AUART),
                buyerId: 'system_import',
                companyId: `sap_bp_${order.KUNNR}`,
              }
            })
            result.created++
          }
          
          result.processed++
        } catch (error: any) {
          result.failed++
          result.errors.push({
            recordId: order.VBELN,
            message: error.message || 'Failed to sync order',
          })
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push({
        message: error.message || 'Failed to fetch orders from SAP',
      })
    }
  }

  private async pullPrices(result: SyncResult, options?: SyncOptions): Promise<void> {
    // Implementation for pulling prices from SAP condition tables
    console.log('Pulling prices from SAP...')
  }

  // Push methods
  private async pushProduct(sapData: any, localId: string): Promise<void> {
    const endpoint = '/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product'
    
    // Check if material exists in SAP
    const existing = await this.getSAPMaterial(sapData.MATNR || sapData.sku)
    
    if (existing) {
      await this.makeRequest('PATCH', `${endpoint}('${sapData.MATNR}')`, sapData)
    } else {
      await this.makeRequest('POST', endpoint, sapData)
    }
  }

  private async pushInventory(sapData: any, localId: string): Promise<void> {
    const endpoint = '/sap/opu/odata/sap/API_INVENTORY_SRV/A_MaterialStock'
    await this.makeRequest('POST', endpoint, sapData)
  }

  private async pushOrder(sapData: any, localId: string): Promise<void> {
    const endpoint = '/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder'
    await this.makeRequest('POST', endpoint, sapData)
  }

  private async pushCustomer(sapData: any, localId: string): Promise<void> {
    const endpoint = '/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner'
    await this.makeRequest('POST', endpoint, sapData)
  }

  // Get single entity methods
  private async getSAPMaterial(materialId: string): Promise<SAPMaterial | null> {
    try {
      const response = await this.makeRequest(
        'GET', 
        `/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product('${materialId}')`
      )
      return response.d || null
    } catch (error) {
      return null
    }
  }

  private async getSAPBusinessPartner(partnerId: string): Promise<SAPBusinessPartner | null> {
    try {
      const response = await this.makeRequest(
        'GET',
        `/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner('${partnerId}')`
      )
      return response.d || null
    } catch (error) {
      return null
    }
  }

  private async getSAPSalesOrder(orderId: string): Promise<SAPSalesOrder | null> {
    try {
      const response = await this.makeRequest(
        'GET',
        `/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder('${orderId}')`
      )
      return response.d || null
    } catch (error) {
      return null
    }
  }

  // Create entity methods
  private async createSAPMaterial(data: any): Promise<string> {
    const response = await this.makeRequest(
      'POST',
      '/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product',
      data
    )
    return response.d?.MATNR || response.d?.id
  }

  private async createSAPBusinessPartner(data: any): Promise<string> {
    const response = await this.makeRequest(
      'POST',
      '/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner',
      data
    )
    return response.d?.PARTNER || response.d?.id
  }

  private async createSAPSalesOrder(data: any): Promise<string> {
    const response = await this.makeRequest(
      'POST',
      '/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder',
      data
    )
    return response.d?.VBELN || response.d?.id
  }

  // Update entity methods
  private async updateSAPMaterial(materialId: string, data: any): Promise<boolean> {
    try {
      await this.makeRequest(
        'PATCH',
        `/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product('${materialId}')`,
        data
      )
      return true
    } catch (error) {
      return false
    }
  }

  private async updateSAPBusinessPartner(partnerId: string, data: any): Promise<boolean> {
    try {
      await this.makeRequest(
        'PATCH',
        `/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner('${partnerId}')`,
        data
      )
      return true
    } catch (error) {
      return false
    }
  }

  // Helper methods
  private getEntityEndpoint(entityType: EntityType, externalId: string): string {
    const endpoints: Record<EntityType, string> = {
      PRODUCTS: `/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product('${externalId}')`,
      INVENTORY: `/sap/opu/odata/sap/API_INVENTORY_SRV/A_MaterialStock(Material='${externalId}',Plant='1000')`,
      ORDERS: `/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder('${externalId}')`,
      CUSTOMERS: `/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner('${externalId}')`,
      PRICES: ``,
      CATEGORIES: ``,
      SUPPLIERS: `/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner('${externalId}')`,
      INVOICES: ``,
      SHIPMENTS: ``,
    }
    
    return endpoints[entityType] || ''
  }

  private mapSAPOrderStatus(sapStatus: string): string {
    const statusMap: Record<string, string> = {
      'TA': 'PENDING',       // Order
      'ZQU': 'CONFIRMED',   // Quotation
      'ZFQ': 'PROCESSING',  // In process
      'DLV': 'SHIPPED',     // Delivery
      'ZBIL': 'COMPLETED',  // Billed
      'CAN': 'CANCELLED',   // Cancelled
      'REJ': 'CANCELLED',   // Rejected
    }
    
    return statusMap[sapStatus] || 'PENDING'
  }

  private async makeRequest(method: string, path: string, body?: any): Promise<any> {
    const url = new URL(path, this.config.endpoint)
    
    // Add SAP-specific query parameters
    url.searchParams.set('sap-client', this.config.client || '100')
    url.searchParams.set('sap-language', this.config.language || 'FR')
    
    const headers = this.buildAuthHeaders()
    
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `SAP API error: ${response.status}`
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message?.value || errorJson.error?.message || errorMessage
      } catch {}
      
      throw new Error(errorMessage)
    }
    
    return response.json()
  }
}
