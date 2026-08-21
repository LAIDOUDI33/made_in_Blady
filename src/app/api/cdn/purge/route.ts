import { NextRequest, NextResponse } from 'next/server';
import { cdnManager, PurgeRequest } from '@/lib/cdn/manager';

/**
 * POST /api/cdn/purge
 * Purge CDN cache for specified URLs or tags
 * 
 * Body: {
 *   type: 'url' | 'tag' | 'prefix' | 'hostname' | 'all',
 *   target: string[],  // URLs or tags to purge
 *   requestedBy: string  // User or system identifier
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify request has proper authorization (in production)
    const authHeader = request.headers.get('authorization');
    // For demo purposes, we'll skip strict auth check
    // In production: if (!authHeader || !isValidAdminToken(authHeader)) { return 401; }

    const body = await request.json();
    
    // Validate required fields
    if (!body.type || !body.target || !Array.isArray(body.target)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: type and target (array)' 
        },
        { status: 400 }
      );
    }

    // Validate purge type
    const validTypes = ['url', 'tag', 'prefix', 'hostname', 'all'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Limit number of targets to prevent abuse
    if (body.type !== 'all' && body.target.length > 100) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many targets. Maximum 100 per request.' 
        },
        { status: 400 }
      );
    }

    // Execute purge
    const purgeRequest = await cdnManager.purgeCache({
      type: body.type,
      target: body.target,
      requestedBy: body.requestedBy || 'api-user',
    });

    return NextResponse.json({
      success: true,
      data: {
        id: purgeRequest.id,
        status: purgeRequest.status,
        type: body.type,
        targetCount: body.target.length,
        results: purgeRequest.results?.map(r => ({
          provider: r.provider,
          success: r.success,
          purgedUrls: r.purgedUrls,
          durationMs: r.durationMs,
          error: r.error,
        })),
        completedAt: purgeRequest.completedAt?.toISOString(),
        requestedAt: purgeRequest.requestedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('CDN purge error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process purge request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cdn/purge
 * Get recent purge history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const status = searchParams.get('status'); // Filter by status

    let history = cdnManager.getPurgeHistory(limit);

    // Filter by status if provided
    if (status) {
      history = history.filter(h => h.status === status);
    }

    return NextResponse.json({
      success: true,
      data: {
        history: history.map(h => ({
          id: h.id,
          type: h.type,
          targetCount: h.target.length,
          status: h.status,
          requestedBy: h.requestedBy,
          requestedAt: h.requestedAt.toISOString(),
          completedAt: h.completedAt?.toISOString(),
          providerResults: h.results?.map(r => ({
            provider: r.provider,
            success: r.success,
            purgedUrls: r.purgedUrls,
            durationMs: r.durationMs,
          })),
        })),
        total: history.length,
      },
    });

  } catch (error) {
    console.error('CDN purge history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purge history' },
      { status: 500 }
    );
  }
}
