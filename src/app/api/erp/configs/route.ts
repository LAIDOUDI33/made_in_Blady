import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/erp/configs - List all ERP configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const enabled = searchParams.get('enabled')
    
    const where: any = {}
    if (type) where.type = type
    if (enabled !== null) where.enabled = enabled === 'true'
    
    const configs = await db.eRPConfig.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { syncLogs: true } },
      },
    })
    
    // Parse JSON fields
    const formattedConfigs = configs.map(config => ({
      id: config.id,
      name: config.name,
      type: config.type,
      enabled: config.enabled,
      endpoint: config.endpoint.replace(/\/\/[^:]+:[^@]+@/, '***:***@'), // Mask credentials in URL
      authType: config.authType,
      defaultSyncFreq: config.defaultSyncFreq,
      syncDirections: JSON.parse(config.syncDirections || '{}'),
      fieldMappings: JSON.parse(config.fieldMappings || '[]'),
      lastSyncAt: config.lastSyncAt,
      connectionStatus: config.connectionStatus,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      syncLogCount: config._count?.syncLogs || 0,
    }))
    
    return NextResponse.json({ data: formattedConfigs })
  } catch (error) {
    console.error('Error fetching ERP configs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ERP configurations' },
      { status: 500 }
    )
  }
}

// POST /api/erp/configs - Create a new ERP configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.type || !body.endpoint) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, endpoint' },
        { status: 400 }
      )
    }
    
    // Validate ERP type
    const validTypes = ['SAP', 'ODOO', 'DYNAMICS', 'CUSTOM']
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid ERP type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Validate auth type
    const validAuthTypes = ['API_KEY', 'BASIC', 'OAUTH2', 'CERTIFICATE']
    if (!validAuthTypes.includes(body.authType)) {
      return NextResponse.json(
        { error: `Invalid auth type. Must be one of: ${validAuthTypes.join(', ')}` },
        { status: 400 }
      )
    }
    
    const config = await db.eRPConfig.create({
      data: {
        name: body.name,
        type: body.type,
        enabled: body.enabled ?? false,
        endpoint: body.endpoint,
        apiKey: body.apiKey,
        username: body.username,
        password: body.password,
        clientId: body.clientId,
        clientSecret: body.clientSecret,
        authType: body.authType || 'API_KEY',
        defaultSyncFreq: body.defaultSyncFreq || 'DAILY',
        syncDirections: JSON.stringify(body.syncDirections || {}),
        fieldMappings: JSON.stringify(body.fieldMappings || []),
        webhookSecret: body.webhookSecret,
        webhookEndpoint: body.webhookEndpoint,
        connectionStatus: 'UNKNOWN',
      },
    })
    
    return NextResponse.json({
      data: {
        id: config.id,
        ...config,
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating ERP config:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An ERP configuration with this name and type already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create ERP configuration' },
      { status: 500 }
    )
  }
}
