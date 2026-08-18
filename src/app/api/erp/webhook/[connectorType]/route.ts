import { NextRequest, NextResponse } from 'next/server'
import { webhookHandler } from '@/lib/erp/webhook-handler'
import { ERPSystemType } from '@/lib/erp/config'

// POST /api/erp/webhook/[connectorType] - Receive webhook from ERP
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connectorType: string }> }
) {
  try {
    const { connectorType } = await params
    
    // Validate connector type
    const validTypes: ERPSystemType[] = ['SAP', 'Odoo', 'MicrosoftDynamics', 'Custom', 'REST']
    if (!validTypes.includes(connectorType as ERPSystemType)) {
      return NextResponse.json(
        { error: `Invalid connector type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Process webhook
    const result = await webhookHandler.processWebhook(
      connectorType as ERPSystemType,
      request
    )
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully',
        actionTaken: result.result?.actionTaken,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: result.status }
      )
    }
    
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// GET /api/erp/webhook/[connectorType] - Webhook info (for configuration)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ connectorType: string }> }
) {
  try {
    const { connectorType } = await params
    
    // Return webhook configuration info for this connector type
    const webhookConfigs: Record<string, { url: string; events: string[]; headers: Record<string, string> }> = {
      SAP: {
        url: '/api/erp/webhook/SAP',
        events: ['product.created', 'product.updated', 'inventory.updated', 'order.created'],
        headers: { 'Content-Type': 'application/json', 'x-sap-signature': '<your-secret>' },
      },
      Odoo: {
        url: '/api/erp/webhook/Odoo',
        events: ['product.product.create', 'product.product.write', 'stock.quant.update', 'sale.order.create'],
        headers: { 'Content-Type': 'application/json', 'x-odoo-signature': '<your-secret>' },
      },
      MicrosoftDynamics: {
        url: '/api/erp/webhook/MicrosoftDynamics',
        events: ['product.created', 'product.updated', 'inventory.updated'],
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer <token>' },
      },
      Custom: {
        url: '/api/erp/webhook/Custom',
        events: ['*'],
        headers: { 'Content-Type': 'application/json', 'x-signature': '<your-secret>' },
      },
      REST: {
        url: '/api/erp/webhook/REST',
        events: ['*'],
        headers: { 'Content-Type': 'application/json', 'x-signature': '<your-secret>' },
      },
    }
    
    const config = webhookConfigs[connectorType]
    
    if (!config) {
      return NextResponse.json(
        { error: `No webhook configuration for type: ${connectorType}` },
        { status: 404 }
      )
    }
    
    // Return full URL (in production, get from request headers)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://algeriatrade.dz'
    
    return NextResponse.json({
      data: {
        ...config,
        fullUrl: `${baseUrl}${config.url}`,
        documentation: 'Configure this URL in your ERP system to receive real-time updates',
      },
    })
  } catch (error) {
    console.error('Error getting webhook config:', error)
    return NextResponse.json(
      { error: 'Failed to get webhook configuration' },
      { status: 500 }
    )
  }
}
