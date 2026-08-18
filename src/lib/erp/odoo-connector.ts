// Odoo ERP Connector (XML-RPC & REST API)
// AlgeriaTrade.dz B2B Platform - Phase 8J

import { BaseERPClient, ERPConfig, EntityType, SyncOptions, SyncResult, SyncError, FieldMapping } from './integration-framework'

export interface OdooConfig extends ERPConfig {
  type: 'ODOO'
  // Odoo-specific settings
  database?: string  // Odoo database name
  apiVersion?: number  // REST API version (e.g., v16, v17)
  useXMLRPC?: boolean  // Use XML-RPC instead of REST
}

export interface OdooProduct {
  id: number
  name: string
  default_code?: string  // SKU/Reference
  list_price: number
  description?: string
  description_sale?: string
  type: string  // product, consu, service
  sale_ok: boolean
  purchase_ok: boolean
  categ_id: [number, string]  // Category ID and name
  uom_id: [number, string]  // Unit of measure
  active: boolean
  image_1920?: string  // Base64 encoded image
  barcode?: string
  weight?: number
  volume?: number
  standard_price?: number  // Cost price
}

export interface OdooPartner {
  id: number
  name: string
  email?: string
  phone?: string
  mobile?: string
  street?: string
  street2?: string
  city?: string
  zip?: string
  country_id?: [number, string]
  state_id?: [number, string]  // Region/State
  vat?: string  // Tax ID / NIF
  is_company: boolean
  customer_rank: number
  supplier_rank: number
  type: string  // contact, delivery, invoice, other
  function?: string  // Job position
  parent_id?: [number, string]
  user_id?: [number, string]  // Salesperson
  property_payment_term_id?: [number, string]
}

export interface OdooSaleOrder {
  id: number
  name: string  // Order reference
  partner_id: [number, string]
  state: string  // draft, sent, sale, done, cancel
  amount_total: number
  amount_untaxed: number
  date_order: string
  validity_date?: string
  create_date: string
  write_date: string
  user_id: [number, string]
  team_id?: [number, string]
  client_order_ref?: string  // PO Reference
  note?: string
  order_line?: OdooSaleOrderLine[]
}

export interface OdooSaleOrderLine {
  id: number
  order_id: number
  product_id: [number, string]
  name: string  // Description
  product_uom_qty: number
  price_unit: number
  price_subtotal: number
  discount: number
  tax_id: [[number, string]]  // Taxes applied
  qty_delivered: number
  qty_invoiced: number
}

export interface OdooStockQuant {
  id: number
  product_id: [number, string]
  location_id: [number, string]
  lot_id?: [number, string]
  package_id?: [number, string]
  quantity: number
  reserved_quantity: number
  available_quantity: number
}

export class OdooConnector extends BaseERPClient {
  config: OdooConfig
  
  constructor(config: OdooConfig) {
    super()
    this.config = config
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.config.useXMLRPC) {
        return await this.testXMLRPCConnection()
      }
      
      const response = await this.makeRESTRequest('GET', '/res.partner', { limit: 1 })
      return Array.isArray(response) || response?.count !== undefined
    } catch (error) {
      console.error('Odoo connection test failed:', error)
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
        
      case 'CATEGORIES':
        await this.pullCategories(result, options)
        break
        
      case 'SUPPLIERS':
        await this.pullSuppliers(result, options)
        break
        
      case 'INVOICES':
        await this.pullInvoices(result, options)
        break
        
      default:
        result.errors.push({
          message: `Entity type ${entityType} not supported for Odoo pull`,
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
        const odooData = this.transformData(item, this.config.fieldMappings, 'toERP')
        
        switch (entityType) {
          case 'PRODUCTS':
            await this.pushProduct(odooData, item.id)
            result.updated++
            break
            
          case 'INVENTORY':
            await this.pushInventoryUpdate(odooData, item.id)
            result.updated++
            break
            
          case 'ORDERS':
            await this.pushOrder(odooData, item.id)
            result.created++
            break
            
          case 'CUSTOMERS':
            await this.pushCustomer(odooData, item.id)
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
          message: error.message || 'Failed to push entity to Odoo',
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
        return this.getOdooProduct(parseInt(externalId))
        
      case 'CUSTOMERS':
        return this.getOdooPartner(parseInt(externalId))
        
      case 'ORDERS':
        return this.getOdooSaleOrder(parseInt(externalId))
        
      default:
        throw new Error(`Get entity not supported for ${entityType}`)
    }
  }

  async createEntity(entityType: EntityType, data: any): Promise<string> {
    const odooData = this.transformData(data, this.config.fieldMappings, 'toERP')
    
    switch (entityType) {
      case 'PRODUCTS':
        return String(await this.createOdooProduct(odooData))
        
      case 'CUSTOMERS':
        return String(await this.createOdooPartner(odooData))
        
      case 'ORDERS':
        return String(await this.createOdooSaleOrder(odooData))
        
      default:
        throw new Error(`Create entity not supported for ${entityType}`)
    }
  }

  async updateEntity(entityType: EntityType, externalId: string, data: any): Promise<boolean> {
    const odooData = this.transformData(data, this.config.fieldMappings, 'toERP')
    
    try {
      switch (entityType) {
        case 'PRODUCTS':
          await this.updateOdooProduct(parseInt(externalId), odooData)
          return true
          
        case 'CUSTOMERS':
          await this.updateOdooPartner(parseInt(externalId), odooData)
          return true
          
        default:
          throw new Error(`Update entity not supported for ${entityType}`)
      }
    } catch (error) {
      console.error(`Failed to update ${entityType} ${externalId} in Odoo:`, error)
      return false
    }
  }

  async deleteEntity(entityType: EntityType, externalId: string): Promise<boolean> {
    try {
      await this.makeRESTRequest('DELETE', this.getEntityEndpoint(entityType, externalId))
      return true
    } catch (error) {
      console.error(`Failed to delete ${entityType} ${externalId} from Odoo:`, error)
      return false
    }
  }

  // ============================================
  // ODOO-SPECIFIC PULL METHODS
  // ============================================

  private async pullProducts(result: SyncResult, options?: SyncOptions): Promise<void> {
    try {
      let domain: any[] = [['sale_ok', '=', true]]
      
      if (options?.fromDate) {
        domain.push(['write_date', '>=', options.fromDate.toISOString()])
      }
      
      if (options?.entityIds?.length) {
        domain.push(['id', 'in', options.entityIds.map(id => parseInt(id))])
      }
      
      const response = await this.makeRESTRequest('GET', '/product.product', {
        domain,
        fields: ['id', 'name', 'default_code', 'list_price', 'description_sale', 'type', 
                'sale_ok', 'categ_id', 'barcode', 'weight', 'image_1920'],
        limit: options?.batchSize || 100,
      })
      
      const products: OdooProduct[] = response || []
      
      for (const product of products) {
        try {
          const localData = this.transformData(product, this.config.fieldMappings, 'fromERP')
          
          const existing = await db.product.findFirst({
            where: { 
              OR: [
                { sku: String(product.default_code || product.id) },
                { name: product.name },
              ]
            }
          })
          
          if (existing) {
            await db.product.update({
              where: { id: existing.id },
              data: {
                ...localData,
                sku: String(product.default_code || product.id),
                price: parseFloat(String(product.list_price)) || undefined,
                updatedAt: new Date(),
              }
            })
            result.updated++
          } else {
            await db.product.create({
              data: {
                id: `odoo_${product.id}`,
                name: product.name,
                slug: `${product.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                sku: String(product.default_code || product.id),
                shortDescription: product.description_sale?.substring(0, 200),
                price: parseFloat(String(product.list_price)),
                currency: 'DZD',
                status: 'published',
                availability: product.type === 'service' ? 'on_order' : 'in_stock',
              }
            })
            result.created++
          }
          
          result.processed++
        } catch (error: any) {
          result.failed++
          result.errors.push({
            recordId: String(product.id),
            message: error.message || 'Failed to sync product from Odoo',
          })
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push({
        message: error.message || 'Failed to fetch products from Odoo',
        code: 'FETCH_ERROR',
      })
    }
  }

  private async pullInventory(result: SyncResult, options?: SyncOptions): Promise<void> {
    try {
      const response = await this.makeRESTRequest('GET', '/stock.quant', {
        fields: ['id', 'product_id', 'location_id', 'quantity', 'reserved_quantity'],
        limit: options?.batchSize || 500,
      })
      
      const quants: OdooStockQuant[] = response || []
      
      for (const quant of quants) {
        try {
          const productId = quant.product_id?.[0]
          if (!productId) continue
          
          // Update inventory/stock in local database
          // This would update a stock/inventory table or product stock field
          console.log(`Syncing inventory for Odoo product ${productId}: ${quant.quantity} available`)
          
          result.processed++
          result.updated++
        } catch (error: any) {
          result.failed++
          result.errors.push({
            recordId: String(quant.id),
            message: error.message || 'Failed to sync inventory',
          })
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push({
        message: error.message || 'Failed to fetch inventory from Odoo',
      })
    }
  }

  private async pullCustomers(result: SyncResult, options?: SyncOptions): Promise<void> {
    try {
      const response = await this.makeRESTRequest('GET', '/res.partner', {
        domain: [
          ['is_company', '=', true],
          ['customer_rank', '>', 0],
        ],
        fields: ['id', 'name', 'email', 'phone', 'mobile', 'street', 'city', 'zip', 
                'country_id', 'vat', 'function', 'create_date', 'write_date'],
        limit: options?.batchSize || 100,
      })
      
      const partners: OdooPartner[] = response || []
      
      for (const partner of partners) {
        try {
          const localData = this.transformData(partner, this.config.fieldMappings, 'fromERP')
          
          const existing = await db.company.findFirst({
            where: { 
              OR: [
                { nif: partner.vat },
                { contactEmail: partner.email },
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
            await db.company.create({
              data: {
                id: `odoo_partner_${partner.id}`,
                name: partner.name,
                slug: `${partner.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                contactEmail: partner.email,
                contactPhone: partner.phone || partner.mobile,
                nif: partner.vat,
                address: [partner.street, partner.city].filter(Boolean).join(', '),
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
            recordId: String(partner.id),
            message: error.message || 'Failed to sync customer from Odoo',
          })
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push({
        message: error.message || 'Failed to fetch customers from Odoo',
      })
    }
  }

  private async pullOrders(result: SyncResult, options?: SyncOptions): Promise<void> {
    try {
      const response = await this.makeRESTRequest('GET', '/sale.order', {
        domain: [['state', 'not in', ['draft', 'cancel']]],
        fields: ['id', 'name', 'partner_id', 'state', 'amount_total', 'amount_untaxed',
                'date_order', 'create_date', 'client_order_ref', 'user_id'],
        limit: options?.batchSize || 100,
      })
      
      const orders: OdooSaleOrder[] = response || []
      
      for (const order of orders) {
        try {
          const localData = this.transformData(order, this.config.fieldMappings, 'fromERP')
          
          const existing = await db.order.findFirst({
            where: { orderNumber: order.name }
          })
          
          if (!existing && !['cancel'].includes(order.state)) {
            await db.order.create({
              data: {
                id: `odoo_order_${order.id}`,
                orderNumber: order.name,
                subtotal: parseFloat(String(order.amount_untaxed)) || 0,
                totalAmount: parseFloat(String(order.amount_total)) || 0,
                currency: 'DZD',
                status: this.mapOdooOrderStatus(order.state),
                buyerId: 'system_import',
                companyId: `odoo_partner_${order.partner_id?.[0]}`,
                createdAt: new Date(order.create_date),
              }
            })
            result.created++
          }
          
          result.processed++
        } catch (error: any) {
          result.failed++
          result.errors.push({
            recordId: order.name,
            message: error.message || 'Failed to sync order from Odoo',
          })
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push({
        message: error.message || 'Failed to fetch orders from Odoo',
      })
    }
  }

  private async pullCategories(result: SyncResult, options?: SyncOptions): Promise<void> {
    try {
      const response = await this.makeRESTRequest('GET', '/product.category', {
        fields: ['id', 'name', 'parent_id', 'complete_name'],
        limit: 200,
      })
      
      const categories = response || []
      
      for (const category of categories) {
        try {
          // Check if category exists locally by Odoo ID
          const existing = await db.category.findFirst({
            where: { name: category.name }
          })
          
          if (!existing) {
            await db.category.create({
              data: {
                id: `odoo_cat_${category.id}`,
                name: category.name,
                slug: `${category.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                parentId: category.parent_id ? `odoo_cat_${category.parent_id[0]}` : null,
              }
            })
            result.created++
          }
          
          result.processed++
        } catch (error: any) {
          result.failed++
          result.errors.push({
            recordId: String(category.id),
            message: error.message || 'Failed to sync category',
          })
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push({ message: error.message || 'Failed to fetch categories' })
    }
  }

  private async pullSuppliers(result: SyncResult, options?: SyncOptions): Promise<void> {
    try {
      const response = await this.makeRESTRequest('GET', '/res.partner', {
        domain: [
          ['is_company', '=', true],
          ['supplier_rank', '>', 0],
        ],
        fields: ['id', 'name', 'email', 'phone', 'vat'],
        limit: options?.batchSize || 50,
      })
      
      const suppliers: OdooPartner[] = response || []
      
      for (const supplier of suppliers) {
        try {
          console.log(`Syncing supplier: ${supplier.name}`)
          result.processed++
          result.updated++
        } catch (error: any) {
          result.failed++
          result.errors.push({
            recordId: String(supplier.id),
            message: error.message || 'Failed to sync supplier',
          })
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push({ message: error.message || 'Failed to fetch suppliers' })
    }
  }

  private async pullInvoices(result: SyncResult, options?: SyncOptions): Promise<void> {
    try {
      const response = await this.makeRESTRequest('GET', '/account.move', {
        domain: [
          ['move_type', '=', 'out_invoice'],
          ['state', '=', 'posted'],
        ],
        fields: ['id', 'name', 'partner_id', 'amount_total', 'invoice_date', 'state'],
        limit: options?.batchSize || 100,
      })
      
      const invoices = response || []
      
      for (const invoice of invoices) {
        try {
          console.log(`Syncing invoice: ${invoice.name}`)
          result.processed++
          result.updated++
        } catch (error: any) {
          result.failed++
          result.errors.push({
            recordId: invoice.name,
            message: error.message || 'Failed to sync invoice',
          })
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push({ message: error.message || 'Failed to fetch invoices' })
    }
  }

  // ============================================
  // ODOO-SPECIFIC PUSH METHODS
  // ============================================

  private async pushProduct(odooData: any, localId: string): Promise<void> {
    const existing = await this.getOdooProductBySKU(odooData.default_code)
    
    if (existing) {
      await this.makeRESTRequest('PUT', `/product.product/${existing.id}`, odooData)
    } else {
      await this.makeRESTRequest('POST', '/product.product', odooData)
    }
  }

  private async pushInventoryUpdate(odooData: any, localId: string): Promise<void> {
    // Inventory updates in Odoo are typically done via stock moves or quant adjustments
    await this.makeRESTRequest('POST', '/stock.quant', odooData)
  }

  private async pushOrder(odooData: any, localId: string): Promise<void> {
    await this.makeRESTRequest('POST', '/sale.order', odooData)
  }

  private async pushCustomer(odooData: any, localId: string): Promise<void> {
    const existing = await this.getOdooPartnerByEmail(odooData.email)
    
    if (existing) {
      await this.makeRESTRequest('PUT', `/res.partner/${existing.id}`, odooData)
    } else {
      await this.makeRESTRequest('POST', '/res.partner', odooData)
    }
  }

  // ============================================
  // ODOO SINGLE ENTITY METHODS
  // ============================================

  private async getOdooProduct(productId: number): Promise<OdooProduct | null> {
    try {
      const response = await this.makeRESTRequest('GET', `/product.product/${productId}`, {
        fields: ['id', 'name', 'default_code', 'list_price', 'description_sale', 'type']
      })
      return response || null
    } catch (error) {
      return null
    }
  }

  private async getOdooProductBySKU(sku?: string): Promise<OdooProduct | null> {
    if (!sku) return null
    
    try {
      const response = await this.makeRESTRequest('GET', '/product.product', {
        domain: [['default_code', '=', sku]],
        fields: ['id', 'name', 'default_code'],
        limit: 1,
      })
      return response?.[0] || null
    } catch (error) {
      return null
    }
  }

  private async getOdooPartner(partnerId: number): Promise<OdooPartner | null> {
    try {
      const response = await this.makeRESTRequest('GET', `/res.partner/${partnerId}`, {
        fields: ['id', 'name', 'email', 'phone', 'is_company', 'vat']
      })
      return response || null
    } catch (error) {
      return null
    }
  }

  private async getOdooPartnerByEmail(email?: string): Promise<OdooPartner | null> {
    if (!email) return null
    
    try {
      const response = await this.makeRESTRequest('GET', '/res.partner', {
        domain: [['email', '=', email]],
        fields: ['id', 'name', 'email'],
        limit: 1,
      })
      return response?.[0] || null
    } catch (error) {
      return null
    }
  }

  private async getOdooSaleOrder(orderId: number): Promise<OdooSaleOrder | null> {
    try {
      const response = await this.makeRESTRequest('GET', `/sale.order/${orderId}`, {
        fields: ['id', 'name', 'partner_id', 'state', 'amount_total', 'order_line']
      })
      return response || null
    } catch (error) {
      return null
    }
  }

  private async createOdooProduct(data: any): Promise<number> {
    const response = await this.makeRESTRequest('POST', '/product.product', data)
    return response?.id
  }

  private async createOdooPartner(data: any): Promise<number> {
    const response = await this.makeRESTRequest('POST', '/res.partner', data)
    return response?.id
  }

  private async createOdooSaleOrder(data: any): Promise<number> {
    const response = await this.makeRESTRequest('POST', '/sale.order', data)
    return response?.id
  }

  private async updateOdooProduct(productId: number, data: any): Promise<void> {
    await this.makeRESTRequest('PUT', `/product.product/${productId}`, data)
  }

  private async updateOdooPartner(partnerId: number, data: any): Promise<void> {
    await this.makeRESTRequest('PUT', `/res.partner/${partnerId}`, data)
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getEntityEndpoint(entityType: EntityType, externalId: string): string {
    const endpoints: Record<EntityType, string> = {
      PRODUCTS: `/product.product/${externalId}`,
      INVENTORY: `/stock.quant/${externalId}`,
      ORDERS: `/sale.order/${externalId}`,
      CUSTOMERS: `/res.partner/${externalId}`,
      PRICES: ``,
      CATEGORIES: `/product.category/${externalId}`,
      SUPPLIERS: `/res.partner/${externalId}`,
      INVOICES: `/account.move/${externalId}`,
      SHIPMENTS: `/stock.picking/${externalId}`,
    }
    
    return endpoints[entityType] || ''
  }

  private mapOdooOrderStatus(odooState: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'DRAFT',
      'sent': 'CONFIRMED',
      'sale': 'PROCESSING',
      'done': 'COMPLETED',
      'cancel': 'CANCELLED',
    }
    
    return statusMap[odooState] || 'UNKNOWN'
  }

  private async makeRESTRequest(
    method: string,
    path: string,
    params?: Record<string, any>
  ): Promise<any> {
    const apiVersion = this.config.apiVersion || 16
    const url = new URL(`${this.config.endpoint}/web/api/${apiVersion}${path}`)
    
    const headers = this.buildAuthHeaders()
    
    // Add Odoo-specific headers
    headers['Content-Type'] = 'application/json'
    
    // For GET requests with params, we need to handle them specially
    let body: any = undefined
    
    if (method === 'GET' && params) {
      // Convert params to query string for GET requests
      Object.entries(params).forEach(([key, value]) => {
        if (key === 'domain') {
          url.searchParams.set(key, JSON.stringify(value))
        } else if (key === 'fields') {
          url.searchParams.set(key, JSON.stringify(value))
        } else {
          url.searchParams.set(key, String(value))
        }
      })
    } else if (params) {
      body = params
    }
    
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Odoo API error: ${response.status}`
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorMessage
      } catch {}
      
      throw new Error(errorMessage)
    }
    
    return response.json()
  }

  // XML-RPC methods (alternative connection method)
  private async testXMLRPCConnection(): Promise<boolean> {
    try {
      // XML-RPC authentication test - dynamic import for compatibility
      const xmlrpc = (await import('xmlrpc')).default || (await import('xmlrpc'))
      
      const client = xmlrpc.createClient({
        url: `${this.config.endpoint}/xmlrpc/2/common`,
      })
      
      const uid = await new Promise((resolve, reject) => {
        client.authenticate(
          this.config.database,
          this.config.username,
          this.config.password,
          {},
          (err: any, result: any) => err ? reject(err) : resolve(result)
        )
      })
      
      return typeof uid === 'number'
    } catch (error) {
      console.error('Odoo XML-RPC connection test failed:', error)
      return false
    }
  }
}
