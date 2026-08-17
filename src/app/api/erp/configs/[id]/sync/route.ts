import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/erp/configs/[id]/sync - Trigger sync for an ERP configuration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const config = await db.eRPConfig.findUnique({ where: { id } })
    if (!config) {
      return NextResponse.json(
        { error: 'ERP configuration not found' },
        { status: 404 }
      )
    }
    
    if (!config.enabled) {
      return NextResponse.json(
        { error: 'ERP configuration is disabled' },
        { status: 400 }
      )
    }
    
    const entityType = body.entityType // Optional - if not provided, sync all entities
    const forceSync = body.forceSync || false
    
    const startTime = new Date()
    
    // Create initial sync log entry
    const syncLog = await db.eRPSyncLog.create({
      data: {
        id: `sync_${Date.now()}_${id}`,
        erpConfigId: id,
        entityType: entityType || 'ALL',
        direction: 'PULL',
        status: 'PENDING',
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsFailed: 0,
        errors: JSON.stringify([]),
        startedAt: startTime,
      },
    })
    
    // Simulate sync operation (in production, would use actual ERP connector)
    let status: 'SUCCESS' = 'SUCCESS'
    let processed = 0
    let successCount = 0
    let failedCount = 0
    const errors: any[] = []
    
    // Simulate processing based on entity type
    const entityCounts: Record<string, number> = {
      PRODUCTS: Math.floor(Math.random() * 200) + 50,
      INVENTORY: Math.floor(Math.random() * 100) + 20,
      ORDERS: Math.floor(Math.random() * 30) + 5,
      CUSTOMERS: Math.floor(Math.random() * 50) + 10,
      PRICES: Math.floor(Math.random() * 150) + 30,
      CATEGORIES: Math.floor(Math.random() * 15) + 3,
      SUPPLIERS: Math.floor(Math.random() * 10) + 2,
      INVOICES: Math.floor(Math.random() * 25) + 5,
      SHIPMENTS: Math.floor(Math.random() * 15) + 2,
    }
    
    if (entityType && entityType !== 'ALL') {
      processed = entityCounts[entityType] || 0
      successCount = Math.floor(processed * (0.9 + Math.random() * 0.1))
      failedCount = processed - successCount
      
      // Simulate occasional failures
      if (Math.random() < 0.1) {
        status = 'PARTIAL'
        failedCount += Math.floor(processed * 0.05)
        successCount -= failedCount
        errors.push({
          message: `Simulated sync error for ${entityType}`,
          code: 'SIMULATED_ERROR',
          recordId: `record_${Math.floor(Math.random() * 1000)}`,
        })
      }
    } else {
      // Sync all entities
      for (const [entity, count] of Object.entries(entityCounts)) {
        processed += count
        const entitySuccess = Math.floor(count * (0.85 + Math.random() * 0.14))
        const entityFailed = count - entitySuccess
        
        successCount += entitySuccess
        failedCount += entityFailed
        
        if (entityFailed > 0 && Math.random() < 0.15) {
          status = status === 'SUCCESS' ? 'PARTIAL' : status
          errors.push({
            message: `Partial failure during ${entity} sync`,
            code: 'PARTIAL_FAILURE',
          })
        }
      }
    }
    
    const completedAt = new Date()
    const durationMs = completedAt.getTime() - startTime.getTime()
    
    // Update sync log with results
    await db.eRPSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status,
        recordsProcessed: processed,
        recordsSuccess: successCount,
        recordsFailed: failedCount,
        errors: JSON.stringify(errors),
        completedAt,
        durationMs,
      },
    })
    
    // Update last sync timestamp on config
    await db.eRPConfig.update({
      where: { id },
      data: { lastSyncAt: completedAt },
    })
    
    return NextResponse.json({
      success: status === 'SUCCESS' || status === 'PARTIAL',
      message: status === 'SUCCESS' 
        ? 'Synchronisation terminée avec succès' 
        : status === 'PARTIAL'
          ? 'Synchronisation terminée avec des erreurs partielles'
          : 'Échec de la synchronisation',
      syncLogId: syncLog.id,
      summary: {
        entityType: entityType || 'ALL',
        direction: 'PULL',
        status,
        processed,
        success: successCount,
        failed: failedCount,
        durationMs,
        startedAt: startTime.toISOString(),
        completedAt: completedAt.toISOString(),
      },
      errors: errors.length > 0 ? errors : undefined,
    }, status === 'FAILED' ? 500 : status === 'PARTIAL' ? 207 : 200)
  } catch (error: any) {
    console.error('Error triggering ERP sync:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Sync trigger failed',
        error: error.toString(),
      },
      { status: 500 }
    )
  }
}
