import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============ Types ============
interface OfflineDataResponse {
  isOnline: boolean;
  pendingActions: PendingAction[];
  lastSyncTime: string | null;
  serverVersion: number;
}

interface PendingAction {
  id: string;
  type: string;
  action: string;
  createdAt: string;
  retryCount: number;
  data?: Record<string, unknown>;
}

interface SyncQueueItem {
  id: string;
  type: 'order' | 'rfq' | 'message' | 'profile' | 'negotiation';
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
}

// ============ GET Handler - Get Pending Offline Data ============
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // Filter by type
    const since = searchParams.get('since'); // Get items since timestamp

    // In production, query database for pending sync items
    // For now, return mock data structure
    
    let mockPendingActions: PendingAction[] = [
      {
        id: 'pending-1',
        type: 'order',
        action: 'create',
        createdAt: new Date(Date.now() - 300000).toISOString(),
        retryCount: 0,
        data: {
          orderNumber: 'AT-2024-1260',
          supplierId: 'supplier-1',
          items: [{ productId: 'prod-1', quantity: 50 }],
          total: 250000,
        },
      },
      {
        id: 'pending-2',
        type: 'message',
        action: 'create',
        createdAt: new Date(Date.now() - 600000).toISOString(),
        retryCount: 1,
        data: {
          conversationId: 'conv-1',
          content: 'Thank you for your quick response!',
        },
      },
    ];

    // Filter by type if specified
    if (type) {
      mockPendingActions = mockPendingActions.filter(a => a.type === type);
    }

    // Filter by timestamp if specified
    if (since) {
      const sinceDate = new Date(since);
      mockPendingActions = mockPendingActions.filter(
        a => new Date(a.createdAt) > sinceDate
      );
    }

    const response: OfflineDataResponse = {
      isOnline: true,
      pendingActions: mockPendingActions,
      lastSyncTime: new Date(Date.now() - 120000).toISOString(),
      serverVersion: 2,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[PWA Offline Data] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get offline data',
        isOnline: true,
        pendingActions: [],
        lastSyncTime: null,
        serverVersion: 2,
      },
      { status: 500 }
    );
  }
}

// ============ POST Handler - Queue Offline Action ============
export async function POST(request: NextRequest) {
  try {
    const body: SyncQueueItem & { userId?: string } = await request.json();

    // Validate required fields
    if (!body.type || !body.action || !body.payload) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: type, action, payload' 
        },
        { status: 400 }
      );
    }

    // Generate queue ID if not provided
    const queueId = body.id || `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // In production, save to database
    try {
      // await db.syncQueue.create({
      //   data: {
      //     id: queueId,
      //     userId: body.userId || 'anonymous',
      //     type: body.type,
      //     action: body.action,
      //     payload: JSON.stringify(body.payload),
      //     priority: body.priority || 'medium',
      //     retryCount: body.retryCount || 0,
      //   }
      // });

      console.log(`[PWA Offline] Action queued: ${queueId} - ${body.type}/${body.action}`);
    } catch (dbError) {
      // Table might not exist in dev mode - that's okay for now
      console.log('[PWA Offline] Database not available, using memory queue');
    }

    return NextResponse.json({
      success: true,
      queueId,
      queuedAt: new Date().toISOString(),
      position: Math.floor(Math.random() * 10) + 1, // Mock position
      estimatedSyncTime: new Date(Date.now() + 30000).toISOString(), // ~30 seconds when online
    });

  } catch (error) {
    console.error('[PWA Offline Queue] Error:', error);
    return NextResponse.json(
      { 
        success: failed, 
        error: 'Failed to queue offline action' 
      },
      { status: 500 }
    );
  }
}

// ============ DELETE Handler - Clear Completed/Failed Actions ============
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actionIds = searchParams.get('ids');
    const status = searchParams.get('status'); // 'completed', 'failed', or 'all'

    let deletedCount = 0;

    if (actionIds) {
      // Delete specific actions
      const idsToDelete = actionIds.split(',');
      
      try {
        // await db.syncQueue.deleteMany({
        //   where: { id: { in: idsToDelete } }
        // });
        deletedCount = idsToDelete.length;
      } catch {
        deletedCount = idsToDelete.length; // Mock delete
      }
    } else if (status === 'all') {
      // Clear all completed actions
      try {
        // deletedCount = await db.syncQueue.deleteMany({
        //   where: { status: 'completed' }
        // });
        deletedCount = Math.floor(Math.random() * 20) + 5; // Mock count
      } catch {
        deletedCount = 10; // Mock count
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Specify ids or status parameter' },
        { status: 400 }
      );
    }

    console.log(`[PWA Offline] Cleared ${deletedCount} actions`);

    return NextResponse.json({
      success: true,
      deletedCount,
      clearedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[PWA Offline Clear] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear actions' },
      { status: 500 }
    );
  }
}

// ============ PATCH Handler - Retry Failed Actions =============
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actionIds = searchParams.get('ids');
    const retryAll = searchParams.get('all') === 'true';

    let retriedCount = 0;

    if (retryAll) {
      // Retry all failed actions
      try {
        // const result = await db.syncQueue.updateMany({
        //   where: { 
        //     status: 'failed',
        //     retryCount: { lt: 3 }
        //   },
        //   data: { status: 'pending' }
        // });
        // retriedCount = result.count;
        retriedCount = Math.floor(Math.random() * 10); // Mock count
      } catch {
        retriedCount = 5; // Mock count
      }
    } else if (actionIds) {
      // Retry specific actions
      const idsToRetry = actionIds.split(',');
      
      try {
        // await db.syncQueue.updateMany({
        //   where: { id: { in: idsToRetry } },
        //   data: { status: 'pending' }
        // });
        retriedCount = idsToRetry.length;
      } catch {
        retriedCount = idsToRetry.length; // Mock count
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Specify ids or set all=true' },
        { status: 400 }
      );
    }

    console.log(`[PWA Offline] Retried ${retriedCount} actions`);

    return NextResponse.json({
      success: true,
      retriedCount,
      retriedAt: new Date().toISOString(),
      message: `${retriedCount} action(s) queued for retry`,
    });

  } catch (error) {
    console.error('[PWA Offline Retry] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retry actions' },
      { status: 500 }
    );
  }
}
