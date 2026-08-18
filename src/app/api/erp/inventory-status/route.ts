import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/erp/inventory-status - Get current inventory sync status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filters
    const connectorId = searchParams.get('connectorId')
    const status = searchParams.get('status')
    const lowStock = searchParams.get('lowStock') // 'true' to filter only low stock items
    const outOfStock = searchParams.get('outOfStock') // 'true' to filter only out of stock
    
    // Build where clause
    const where: any = {}
    if (connectorId) where.connectorId = connectorId
    if (status) where.syncStatus = status
    if (lowStock === 'true') {
      where.quantity = { gt: 0, lte: 10 }
    }
    if (outOfStock === 'true') {
      where.quantity = 0
    }
    
    // Get inventory records with connector info
    const records = await db.inventorySyncRecord.findMany({
      where,
      include: {
        connector: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { lastSyncedAt: 'desc' },
      take: 100,
    })
    
    // Calculate stats
    const totalCount = await db.inventorySyncRecord.count({ where })
    const syncedCount = await db.inventorySyncRecord.count({ where: { syncStatus: 'SYNCED' }})
    const pendingCount = await db.inventorySyncRecord.count({ where: { syncStatus: 'PENDING' }})
    const errorCount = await db.inventorySyncRecord.count({ where: { syncStatus: 'ERROR' }})
    
    let lowStockCount = 0
    let outOfStockCount = 0
    let totalQuantity = 0
    
    for (const record of records) {
      if (record.quantity <= 10 && record.quantity > 0) lowStockCount++
      if (record.quantity === 0) outOfStockCount++
      totalQuantity += record.quantity
    }
    
    // Format records
    const formattedRecords = records.map(record => ({
      id: record.id,
      connectorId: record.connectorId,
      connectorName: record.connector.name,
      connectorType: record.connector.type,
      externalProductId: record.externalProductId,
      internalProductId: record.internalProductId,
      externalSku: record.externalSku,
      internalSku: record.internalSku,
      quantity: record.quantity,
      lastSyncedAt: record.lastSyncedAt,
      syncStatus: record.syncStatus,
      
      // Derived fields
      stockStatus: record.quantity === 0 ? 'OUT_OF_STOCK' :
                  record.quantity <= 10 ? 'LOW_STOCK' : 'IN_STOCK',
    }))
    
    return NextResponse.json({
      data: formattedRecords,
      count: formattedRecords.length,
      stats: {
        totalRecords: totalCount,
        synced: syncedCount,
        pending: pendingCount,
        errors: errorCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        totalQuantity,
        averageQuantity: totalCount > 0 ? Math.round(totalQuantity / totalCount * 100) / 100 : 0,
      },
    })
  } catch (error) {
    console.error('Error fetching inventory status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory status' },
      { status: 500 }
    )
  }
}
