import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { crypto } from 'crypto'

// POST /api/erp/configs/[id]/webhook - Handle incoming webhook from ERP
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const config = await db.eRPConfig.findUnique({ where: { id } })
    if (!config) {
      return NextResponse.json(
        { error: 'ERP configuration not found' },
        { status: 404 }
      )
    }
    
    if (!config.webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook not configured for this ERP integration' },
        { status: 400 }
      )
    }
    
    // Get signature from headers
    const signature = request.headers.get('x-webhook-signature') || 
                      request.headers.get('x-hub-signature-256') ||
                      request.headers.get('x-odoo-signature')
    
    // Read body
    const body = await request.text()
    
    // Verify signature (simplified - use proper HMAC in production)
    if (signature && config.webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', config.webhookSecret)
        .update(body, 'utf8')
        .digest('hex')
      
      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        )
      }
    }
    
    // Parse payload
    let payload: any
    try {
      payload = JSON.parse(body || '{}')
    } catch {
      payload = { raw: body }
    }
    
    // Extract event info
    const eventType = (payload.event_type || payload.eventType || payload.action)?.toUpperCase()
    const entityType = (payload.entity_type || payload.entityType || payload.model)?.toUpperCase()
    
    if (!eventType) {
      return NextResponse.json(
        { error: 'Missing required field: event_type or action' },
        { status: 400 }
      )
    }
    
    // Create sync log entry for this webhook event
    await db.eRPSyncLog.create({
      data: {
        id: `webhook_${Date.now()}_${id}`,
        erpConfigId: id,
        entityType: entityType || 'WEBHOOK',
        direction: 'PUSH', // Webhooks are always push from ERP
        status: 'SUCCESS',
        recordsProcessed: 1,
        recordsSuccess: 1,
        recordsFailed: 0,
        errors: JSON.stringify([]),
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 0,
      },
    })
    
    // Handle different event types
    switch (eventType?.toUpperCase()) {
      case 'CREATE':
      case 'CREATED':
      case 'INSERT':
        await handleCreateEvent(config.id, entityType, payload)
        break
        
      case 'UPDATE':
      case 'UPDATED':
      case 'MODIFY':
        await handleUpdateEvent(config.id, entityType, payload)
        break
        
      case 'DELETE':
      case 'DELETED':
      case 'REMOVE':
        await handleDeleteEvent(config.id, entityType, payload)
        break
        
      case 'STOCK_UPDATE':
      case 'INVENTORY_CHANGE':
        await handleStockUpdate(config.id, payload)
        break
        
      case 'ORDER_STATUS':
      case 'ORDER_STATE_CHANGED':
        await handleOrderStatusChange(config.id, payload)
        break
        
      default:
        console.log(`Unhandled webhook event type: ${eventType}`, payload)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      eventType,
      entityType,
      receivedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error processing ERP webhook:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Webhook processing failed',
      },
      { status: 500 }
    )
  }
}

// Event handlers
async function handleCreateEvent(erpConfigId: string, entityType: string, payload: any): Promise<void> {
  console.log(`[ERP Webhook] Create event for ${entityType}:`, payload)
  
  switch (entityType) {
    case 'PRODUCT':
    case 'PRODUCT.TEMPLATE':
    case 'PRODUCT.PRODUCT':
      // Create or update product from ERP data
      break
      
    case 'CUSTOMER':
    case 'RES.PARTNER':
      // Create or update customer/partner from ERP data
      break
      
    case 'ORDER':
    case 'SALE.ORDER':
      // Create or update order from ERP data
      break
      
    default:
      console.log(`No handler for create event on entity type: ${entityType}`)
  }
}

async function handleUpdateEvent(erpConfigId: string, entityType: string, payload: any): Promise<void> {
  console.log(`[ERP Webhook] Update event for ${entityType}:`, payload)
  
  // Similar to create but update existing records
}

async function handleDeleteEvent(erpConfigId: string, entityType: string, payload: any): Promise<void> {
  console.log(`[ERP Webhook] Delete event for ${entityType}:`, payload)
  
  // Mark local record as deleted or archive it
}

async function handleStockUpdate(erpConfigId: string, payload: any): Promise<void> {
  console.log(`[ERP Webhook] Stock update:`, payload)
  
  // Update inventory levels based on ERP stock data
  const productId = payload.product_id || payload.productID || payload.material_id
  const quantity = payload.quantity || payload.qty_available || payload.LABST
  
  if (productId && quantity !== undefined) {
    // Update product availability based on stock level
    const availability = quantity <= 0 ? 'out_of_stock' :
                       quantity <= 10 ? 'low_stock' : 'in_stock'
    
    try {
      await db.product.updateMany({
        where: {
          OR: [
            { sku: String(productId) },
            { id: String(productId).startsWith('odoo_') },
            { id: String(productId).startsWith('sap_') },
          ]
        },
        data: { 
          availability,
          updatedAt: new Date(),
        },
      })
      
      console.log(`Updated stock for product ${productId}: ${quantity} units (${availability})`)
    } catch (error) {
      console.error(`Failed to update stock for product ${productId}:`, error)
    }
  }
}

async function handleOrderStatusChange(erpConfigId: string, payload: any): Promise<void> {
  console.log(`[ERP Webhook] Order status change:`, payload)
  
  const orderId = payload.order_id || payload.orderID || payload.VBELN || payload.name
  const newState = payload.state || payload.status || payload.order_status
  
  if (orderId && newState) {
    // Map ERP status to platform status
    const statusMap: Record<string, string> = {
      'draft': 'DRAFT',
      'sent': 'CONFIRMED',
      'sale': 'PROCESSING',
      'done': 'COMPLETED',
      'cancel': 'CANCELLED',
    }
    
    const platformStatus = statusMap[newState.toLowerCase()] || newState.toUpperCase()
    
    try {
      await db.order.updateMany({
        where: {
          OR: [
            { orderNumber: String(orderId) },
            { id: String(orderId).startsWith('odoo_order_') },
          ]
        },
        data: { 
          status: platformStatus,
          updatedAt: new Date(),
        },
      })
      
      console.log(`Updated order ${orderId} status to ${platformStatus}`)
    } catch (error) {
      console.error(`Failed to update order ${orderId}:`, error)
    }
  }
}
