import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================
// POST /api/analytics/event
// Track custom event (from frontend)
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Check if database logging is enabled
    if (process.env.NEXT_PUBLIC_ANALYTICS_DB_LOGGING !== 'true') {
      return NextResponse.json({ success: true, logged: false });
    }

    const body = await request.json();
    
    const {
      eventType,
      eventName,
      eventData,
      userId,
      url,
      referrer,
      sessionId,
    } = body;

    // Validate required fields
    if (!eventType || !eventName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: eventType, eventName' },
        { status: 400 }
      );
    }

    // Get or generate session ID
    let finalSessionId = sessionId;
    if (!finalSessionId) {
      // Try to get from cookies or headers
      finalSessionId = request.headers.get('x-session-id') || 
                       `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get client info
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = getClientIP(request);

    // Store event in database
    await db.analyticsEvent.create({
      data: {
        eventType,
        eventName,
        eventData: eventData ? JSON.stringify(eventData) : null,
        userId: userId || null,
        sessionId: finalSessionId,
        userAgent,
        ipAddress: ipAddress ? hashIP(ipAddress) : null,
        url: url || undefined,
        referrer: referrer || undefined,
      },
    });

    // Update daily stats (async, don't wait)
    updateDailyStats(eventType, eventName).catch(console.error);

    // Update search terms if it's a search event
    if (eventName === 'search' && eventData?.query) {
      updateSearchTerm(eventData.query, eventData.resultsCount || 0).catch(console.error);
    }

    // Update page views if it's a page view
    if (eventType === 'page_view' && url) {
      updatePageView(url, body.pageTitle || '').catch(console.error);
    }

    return NextResponse.json({
      success: true,
      logged: true,
      eventId: `event_${Date.now()}`,
    });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    // Don't fail the request - analytics shouldn't break the app
    return NextResponse.json({
      success: true,
      logged: false,
      error: 'Event not logged',
    });
  }
}

// ============================================
// Helper Functions
// ============================================

function getClientIP(request: NextRequest): string | null {
  // Check various headers for IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return null;
}

function hashIP(ip: string): string {
  // Simple hash function for privacy compliance
  // In production, use a proper cryptographic hash
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `hashed_${Math.abs(hash).toString(16)}`;
}

async function updateDailyStats(
  eventType: string,
  eventName: string
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Get or create today's stats
    let stats = await db.dailyStats.findUnique({
      where: { date: today },
    });

    if (!stats) {
      stats = await db.dailyStats.create({
        data: { date: today },
      });
    }

    // Update relevant counters based on event type
    const updates: Record<string, unknown> = {};

    switch (eventType) {
      case 'page_view':
        updates.pageViews = { increment: 1 };
        break;
      
      case 'engagement':
        if (eventName === 'search') {
          updates.searches = { increment: 1 };
        }
        break;

      case 'rfq':
        if (eventName === 'post_rfq') {
          updates.rfqsPosted = { increment: 1 };
        } else if (eventName === 'submit_quotation') {
          updates.quotationsSent = { increment: 1 };
        }
        break;

      case 'transaction':
        if (eventName === 'purchase' || eventName === 'signup') {
          if (eventName === 'purchase') {
            updates.ordersCreated = { increment: 1 };
          } else {
            updates.newUsers = { increment: 1 };
          }
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      await db.dailyStats.update({
        where: { id: stats.id },
        data: updates,
      });
    }
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
}

async function updateSearchTerm(term: string, resultsCount: number): Promise<void> {
  try {
    const existingTerm = await db.searchTerm.findFirst({
      where: { term: term.toLowerCase() },
    });

    if (existingTerm) {
      await db.searchTerm.update({
        where: { id: existingTerm.id },
        data: {
          searchCount: { increment: 1 },
          resultCount: resultsCount,
          lastSearchedAt: new Date(),
        },
      });
    } else {
      await db.searchTerm.create({
        data: {
          term: term.toLowerCase(),
          searchCount: 1,
          resultCount: resultsCount,
        },
      });
    }
  } catch (error) {
    console.error('Error updating search term:', error);
  }
}

async function updatePageView(url: string, title: string): Promise<void> {
  try {
    // Extract path from URL
    const path = new URL(url).pathname;

    const existingPage = await db.pageView.findFirst({
      where: { path },
    });

    if (existingPage) {
      await db.pageView.update({
        where: { id: existingPage.id },
        data: {
          viewCount: { increment: 1 },
        },
      });
    } else {
      await db.pageView.create({
        data: {
          path,
          title: title || path,
          viewCount: 1,
          uniqueViews: 1,
        },
      });
    }
  } catch (error) {
    console.error('Error updating page view:', error);
  }
}
