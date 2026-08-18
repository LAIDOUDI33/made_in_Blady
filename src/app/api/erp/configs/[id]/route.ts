import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/erp/configs/[id] - Get a single ERP configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const config = await db.eRPConfig.findUnique({
      where: { id },
      include: {
        syncLogs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        inventoryRules: true,
      },
    })
    
    if (!config) {
      return NextResponse.json(
        { error: 'ERP configuration not found' },
        { status: 404 }
      )
    }
    
    // Parse JSON fields and mask sensitive data
    const formattedConfig = {
      id: config.id,
      name: config.name,
      type: config.type,
      enabled: config.enabled,
      endpoint: config.endpoint.replace(/\/\/[^:]+:[^@]+@/, '***:***@'),
      authType: config.authType,
      defaultSyncFreq: config.defaultSyncFreq,
      syncDirections: JSON.parse(config.syncDirections || '{}'),
      fieldMappings: JSON.parse(config.fieldMappings || '[]'),
      webhookEndpoint: config.webhookEndpoint,
      lastSyncAt: config.lastSyncAt,
      connectionStatus: config.connectionStatus,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      syncLogs: (config.syncLogs || []).map((log: any) => ({
        id: log.id,
        entityType: log.entityType,
        direction: log.direction,
        status: log.status,
        recordsProcessed: log.recordsProcessed,
        recordsSuccess: log.recordsSuccess,
        recordsFailed: log.recordsFailed,
        errors: JSON.parse(log.errors || '[]'),
        startedAt: log.startedAt,
        completedAt: log.completedAt,
        durationMs: log.durationMs,
      })),
      inventoryRules: (config.inventoryRules || []).map((rule: any) => ({
        id: rule.id,
        productCategory: rule.productCategory,
        syncFrequency: rule.syncFrequency,
        conflictResolution: rule.conflictResolution,
        lowStockThreshold: rule.lowStockThreshold,
        enableBackorders: rule.enableBackorders,
        reserveStockOnOrder: rule.reserveStockOnOrder,
      })),
    }
    
    return NextResponse.json({ data: formattedConfig })
  } catch (error) {
    console.error('Error fetching ERP config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ERP configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/erp/configs/[id] - Update an ERP configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const existing = await db.eRPConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'ERP configuration not found' },
        { status: 404 }
      )
    }
    
    // Build update data
    const updateData: any = {}
    
    const allowedFields = [
      'name', 'type', 'enabled', 'endpoint', 'apiKey', 'username', 
      'password', 'clientId', 'clientSecret', 'authType', 'defaultSyncFreq',
      'syncDirections', 'fieldMappings', 'webhookSecret', 'webhookEndpoint'
    ]
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (['syncDirections', 'fieldMappings'].includes(field)) {
          updateData[field] = JSON.stringify(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }
    
    const updated = await db.eRPConfig.update({
      where: { id },
      data: updateData,
    })
    
    return NextResponse.json({
      success: true,
      message: 'ERP configuration updated successfully',
      data: {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        enabled: updated.enabled,
        connectionStatus: updated.connectionStatus,
        updatedAt: updated.updatedAt,
      }
    })
  } catch (error: any) {
    console.error('Error updating ERP config:', error)
    return NextResponse.json(
      { error: 'Failed to update ERP configuration' },
      { status: 500 }
    )
  }
}

// DELETE /api/erp/configs/[id] - Delete an ERP configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const existing = await db.eRPConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'ERP configuration not found' },
        { status: 404 }
      )
    }
    
    await db.eRPConfig.delete({ where: { id } })
    
    return NextResponse.json({
      success: true,
      message: 'ERP configuration deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting ERP config:', error)
    return NextResponse.json(
      { error: 'Failed to delete ERP configuration' },
      { status: 500 }
    )
  }
}
