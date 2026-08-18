import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/erp/connectors/[id]/logs - Get sync logs for a connector
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    
    // Filters
    const status = searchParams.get('status')
    const entityType = searchParams.get('entityType')
    const direction = searchParams.get('direction')
    
    // Check if connector exists
    const connector = await db.erpConnector.findUnique({ where: { id } })
    if (!connector) {
      return NextResponse.json(
        { error: 'Connector not found' },
        { status: 404 }
      )
    }
    
    // Build where clause
    const where: any = { connectorId: id }
    if (status) where.status = status
    if (entityType) where.entityType = entityType
    if (direction) where.direction = direction
    
    // Get logs with pagination
    const [logs, totalCount] = await Promise.all([
      db.erpSyncLogNew.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.erpSyncLogNew.count({ where }),
    ])
    
    // Format logs
    const formattedLogs = logs.map(log => ({
      id: log.id,
      connectorId: log.connectorId,
      entityType: log.entityType,
      direction: log.direction,
      status: log.status,
      recordsProcessed: log.recordsProcessed,
      recordsSuccess: log.recordsSuccess,
      recordsFailed: log.recordsFailed,
      startedAt: log.startedAt,
      completedAt: log.completedAt,
      durationSeconds: log.durationSeconds,
      errorMessage: log.errorMessage,
      details: log.details ? JSON.parse(log.details) : null,
    }))
    
    // Calculate stats
    const stats = await db.erpSyncLogNew.groupBy({
      by: ['status'],
      where: { connectorId: id },
      _count: true,
    })
    
    return NextResponse.json({
      data: formattedLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: stats.reduce((acc, s) => {
        acc[s.status] = s._count
        return acc
      }, {} as Record<string, number>),
    })
  } catch (error) {
    console.error('Error fetching sync logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync logs' },
      { status: 500 }
    )
  }
}
