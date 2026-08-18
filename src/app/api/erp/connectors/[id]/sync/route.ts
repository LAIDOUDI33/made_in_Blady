import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/erp/connectors/[id]/sync - Trigger sync
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    
    // Get connector
    const connector = await db.erpConnector.findUnique({ where: { id } })
    if (!connector) {
      return NextResponse.json(
        { error: 'Connector not found' },
        { status: 404 }
      )
    }
    
    // Get sync options from body or connector config
    const syncConfig = JSON.parse(connector.syncConfig || '{}')
    const entityType = body.entityType || 'PRODUCTS'
    const direction = body.direction || syncConfig.direction || 'BIDIRECTIONAL'
    
    // Create sync log entry
    const syncLog = await db.erpSyncLogNew.create({
      data: {
        connectorId: id,
        direction,
        entityType,
        status: 'PENDING',
        startedAt: new Date(),
        details: JSON.stringify({
          triggeredBy: 'API',
          options: body,
        }),
      },
    })
    
    // Update connector status
    await db.erpConnector.update({
      where: { id },
      data: { status: 'SYNCING' },
    })
    
    // Simulate sync operation (in production, use actual sync engine)
    const startTime = Date.now()
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
      
      // Generate random results for demo
      const recordsProcessed = Math.floor(Math.random() * 100) + 10
      const recordsSuccess = Math.floor(recordsProcessed * (0.85 + Math.random() * 0.15))
      const recordsFailed = recordsProcessed - recordsSuccess
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000)
      
      // Determine status based on failure rate
      const status = recordsFailed === 0 ? 'SUCCESS' : 
                     recordsFailed < recordsProcessed * 0.2 ? 'PARTIAL' : 'FAILED'
      
      // Update sync log
      await db.erpSyncLogNew.update({
        where: { id: syncLog.id },
        data: {
          status,
          recordsProcessed,
          recordsSuccess,
          recordsFailed,
          completedAt: new Date(),
          durationSeconds,
          errorMessage: status !== 'SUCCESS' 
            ? `${recordsFailed} records failed to sync` 
            : null,
          details: JSON.stringify({
            entityType,
            direction,
            durationMs: Date.now() - startTime,
          }),
        },
      })
      
      // Update connector
      await db.erpConnector.update({
        where: { id },
        data: {
          status: status === 'SUCCESS' ? 'CONNECTED' : status === 'PARTIAL' ? 'CONNECTED' : 'ERROR',
          lastSyncAt: new Date(),
          errorCount: status === 'FAILED' ? { increment: 1 } : undefined,
          errorMessage: status === 'FAILED' ? 'Sync failed' : null,
        },
      })
      
      return NextResponse.json({
        success: status !== 'FAILED',
        message: `Sync ${status.toLowerCase()} for ${entityType}`,
        syncLogId: syncLog.id,
        result: {
          recordsProcessed,
          recordsCreated: Math.floor(recordsSuccess * 0.3),
          recordsUpdated: Math.floor(recordsSuccess * 0.7),
          recordsFailed,
          durationSeconds,
          status,
        },
      }, status === 'FAILED' ? 200 : 200)
      
    } catch (error: any) {
      // Update sync log with error
      await db.erpSyncLogNew.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          durationSeconds: Math.floor((Date.now() - startTime) / 1000),
          errorMessage: error.message || 'Sync failed unexpectedly',
          details: JSON.stringify({ error: error.message }),
        },
      })
      
      // Update connector with error
      await db.erpConnector.update({
        where: { id },
        data: {
          status: 'ERROR',
          errorCount: { increment: 1 },
          errorMessage: error.message || 'Sync failed',
        },
      })
      
      return NextResponse.json({
        success: false,
        message: error.message || 'Sync failed',
        syncLogId: syncLog.id,
        error: error.message,
      })
    }
    
  } catch (error) {
    console.error('Error triggering ERP sync:', error)
    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 }
    )
  }
}
