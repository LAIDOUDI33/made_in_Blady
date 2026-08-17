import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/erp/sync-history - Get sync history with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const erpConfigId = searchParams.get('erpConfigId')
    const entityType = searchParams.get('entityType')
    const status = searchParams.get('status')
    const direction = searchParams.get('direction')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    // Build where clause
    const where: any = {}
    
    if (erpConfigId) where.erpConfigId = erpConfigId
    if (entityType) where.entityType = entityType
    if (status) where.status = status.toUpperCase()
    if (direction) where.direction = direction.toUpperCase()
    
    // Date filters
    if (dateFrom || dateTo) {
      where.startedAt = {}
      if (dateFrom) where.startedAt.gte = new Date(dateFrom)
      if (dateTo) where.startedAt.lte = new Date(dateTo)
    }
    
    const [logs, total] = await Promise.all([
      db.eRPSyncLog.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.eRPSyncLog.count({ where }),
    ])
    
    // Format response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      erpConfigId: log.erpConfigId,
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
    }))
    
    return NextResponse.json({
      data: formattedLogs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching sync history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync history' },
      { status: 500 }
    )
  }
}
