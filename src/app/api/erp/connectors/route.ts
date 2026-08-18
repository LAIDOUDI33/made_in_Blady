import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/erp/connectors - List all ERP connectors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    
    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status
    if (userId) where.userId = userId
    
    const connectors = await db.erpConnector.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { syncLogs: true, inventoryRecords: true } },
      },
    })
    
    // Parse JSON fields and mask sensitive data
    const formattedConnectors = connectors.map(connector => ({
      id: connector.id,
      userId: connector.userId,
      name: connector.name,
      type: connector.type,
      displayName: connector.displayName,
      status: connector.status,
      lastSyncAt: connector.lastSyncAt,
      nextSyncAt: connector.nextSyncAt,
      errorCount: connector.errorCount,
      errorMessage: connector.errorMessage,
      fieldMappings: JSON.parse(connector.fieldMappings || '[]'),
      syncConfig: JSON.parse(connector.syncConfig || '{}'),
      createdAt: connector.createdAt,
      updatedAt: connector.updatedAt,
      syncLogCount: connector._count?.syncLogs || 0,
      inventoryRecordCount: connector._count?.inventoryRecords || 0,
      // Don't expose credentials in list view
    }))
    
    return NextResponse.json({ 
      data: formattedConnectors,
      count: formattedConnectors.length 
    })
  } catch (error) {
    console.error('Error fetching ERP connectors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ERP connectors' },
      { status: 500 }
    )
  }
}

// POST /api/erp/connectors - Create a new ERP connector
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.type || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, userId' },
        { status: 400 }
      )
    }
    
    // Validate ERP type
    const validTypes = ['SAP', 'Odoo', 'MicrosoftDynamics', 'Custom', 'REST']
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid ERP type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Encrypt credentials before storing (in production, use proper encryption)
    const credentials = body.credentials ? JSON.stringify(body.credentials) : '{}'
    
    const connector = await db.erpConnector.create({
      data: {
        id: `erp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: body.userId,
        name: body.name,
        type: body.type,
        displayName: body.displayName || body.name,
        credentials,
        status: 'DISCONNECTED',
        fieldMappings: JSON.stringify(body.fieldMappings || []),
        syncConfig: JSON.stringify(body.syncConfig || {}),
      },
    })
    
    return NextResponse.json({
      data: {
        id: connector.id,
        ...connector,
        credentials: undefined, // Never return full credentials
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating ERP connector:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A connector with this configuration already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create ERP connector' },
      { status: 500 }
    )
  }
}
