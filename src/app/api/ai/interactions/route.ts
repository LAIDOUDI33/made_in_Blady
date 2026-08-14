// API Route: Track user interaction (called from frontend)
import { NextRequest, NextResponse } from 'next/server';
import { interactionTracker } from '@/lib/ai/recommendations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      type,
      productId,
      categoryId,
      companyId,
      searchTerm,
      referrer,
      deviceType,
      position,
      duration,
      sessionId,
      userId, // Optional - can be sent from client for logged-in users
      metadata,
    } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { error: 'Interaction type is required' },
        { status: 400 }
      );
    }

    // Validate interaction type
    const validTypes = ['view', 'search', 'contact', 'favorite', 'rfq', 'order', 'click', 'add_to_cart'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Route to appropriate tracking method
    switch (type) {
      case 'view':
        if (!productId) {
          return NextResponse.json({ error: 'productId is required for view interactions' }, { status: 400 });
        }
        await interactionTracker.trackView(userId || undefined, productId, {
          sessionId,
          duration,
          referrer,
          deviceType,
          position,
        });
        break;

      case 'search':
        if (!searchTerm) {
          return NextResponse.json({ error: 'searchTerm is required for search interactions' }, { status: 400 });
        }
        await interactionTracker.trackSearch(userId || undefined, searchTerm, metadata?.resultsCount || 0, {
          sessionId,
          referrer,
          deviceType,
        });
        break;

      case 'contact':
        if (!companyId) {
          return NextResponse.json({ error: 'companyId is required for contact interactions' }, { status: 400 });
        }
        await interactionTracker.trackContact(userId || undefined, companyId, {
          sessionId,
          productId,
        });
        break;

      case 'favorite':
        if (!productId && !companyId) {
          return NextResponse.json({ error: 'productId or companyId is required for favorite interactions' }, { status: 400 });
        }
        const favType = productId ? 'product' : 'supplier';
        await interactionTracker.trackFavorite(userId || undefined, favType, productId || companyId!, {
          sessionId,
        });
        break;

      case 'rfq':
        if (!categoryId) {
          return NextResponse.json({ error: 'categoryId is required for rfq interactions' }, { status: 400 });
        }
        await interactionTracker.trackRFQ(userId || undefined, categoryId, { sessionId });
        break;

      case 'order':
        if (metadata?.orderId && metadata?.items) {
          await interactionTracker.trackPurchase(userId || undefined, metadata.orderId, metadata.items, {
            sessionId,
          });
        } else {
          // Just record as generic order interaction
          await interactionTracker.trackView(userId || undefined, productId!, { sessionId }); // Fallback
        }
        break;

      case 'click':
        if (!productId && !categoryId && !companyId) {
          return NextResponse.json({ error: 'Target ID (productId/categoryId/companyId) is required for click interactions' }, { status: 400 });
        }
        const targetType = productId ? 'product' : categoryId ? 'category' : 'supplier';
        const targetId = productId || categoryId || companyId!;
        await interactionTracker.trackClick(userId || undefined, targetId, targetType as any, metadata?.source || 'unknown', {
          sessionId,
          position,
        });
        break;

      case 'add_to_cart':
        if (!productId) {
          return NextResponse.json({ error: 'productId is required for add_to_cart interactions' }, { status: 400 });
        }
        await interactionTracker.trackAddToCart(userId || undefined, productId, {
          sessionId,
          quantity: metadata?.quantity,
        });
        break;
    }

    return NextResponse.json({
      success: true,
      message: 'Interaction tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user's interaction history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const types = searchParams.get('types')?.split(',');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const interactions = await interactionTracker.getUserInteractions(userId, limit, types);

    return NextResponse.json({
      success: true,
      data: {
        interactions,
        count: interactions.length,
      },
    });
  } catch (error) {
    console.error('Error getting interactions:', error);
    return NextResponse.json(
      { error: 'Failed to get interactions' },
      { status: 500 }
    );
  }
}
