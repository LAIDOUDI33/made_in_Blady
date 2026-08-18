import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/erp/connectors/[id] - Get connector details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const connector = await db.erpConnector.findUnique({
      where: { id },
      include: {
        syncLogs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        inventoryRecords: {
          take: 20,
        },
      },
    })
    
    if (!connector) {
      return NextResponse.json(
        { error: 'Connector not found' },
        { status: 404 }
      )
    }
    
    // Parse JSON fields
    const formattedConnector = {
      ...connector,
      credentials: undefined, // Never expose full credentials in API response
      fieldMappings: JSON.parse(connector.fieldMappings || '[]'),
      syncConfig: JSON.parse(connector.syncConfig || '{}'),
      syncLogs: connector.syncLogs.map(log => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      })),
    }
    
    return NextResponse.json({ data: formattedConnector })
  } catch (error) {
    console.error('Error fetching ERP connector:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ERP connector' },
      { status: 500 }
    )
  }
}

// PUT /api/erp/connectors/[id] - Update connector
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Check if connector exists
    const existing = await db.erpConnector.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Connector not found' },
        { status: 404 }
      )
    }
    
    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    }
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.displayName !== undefined) updateData.displayName = body.displayName
    if (body.status !== undefined) updateData.status = body.status
    if (body.errorMessage !== undefined) updateData.errorMessage = body.errorMessage
    if (body.credentials) updateData.credentials = JSON.stringify(body.credentials)
    if (body.fieldMappings !== undefined) updateData.fieldMappings = JSON.stringify(body.fieldMappings)
    if (body.syncConfig !== undefined) updateData.syncConfig = JSON.stringify(body.syncConfig)
    
    const connector = await db.erpConnector.update({
      where: { id },
      data: updateData,
    })
    
    return NextResponse.json({ 
      data: {
        id: connector.id,
        name: connector.name,
        type: connector.type,
        status: connector.status,
        updatedAt: connector.updatedAt,
      }
    })
  } catch (error: any) {
    console.error('Error updating ERP connector:', error)
    return NextResponse.json(
      { error: 'Failed to update ERP connector' },
      { status: 500 }
    )
  }
}

// DELETE /api/erp/connectors/[id] - Delete connector
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if connector exists
    const existing = await db.erpConnector.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Connector not found' },
        { status: 404 }
      )
    }
    
    // Delete connector (cascade will delete related logs and records)
    await db.erpConnector.delete({ where: { id } })
    
    return NextResponse.json({ 
      success: true,
      message: 'Connector deleted successfully' 
    })
  } catch (error: any) {
    console.error('Error deleting ERP connector:', error)
    return NextResponse.json(
      { error: 'Failed to delete ERP connector' },
      { status: 500 }
    )
  }
}
