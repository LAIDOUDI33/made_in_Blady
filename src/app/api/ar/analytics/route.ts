import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ar/analytics - Get AR usage analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const groupBy = searchParams.get('groupBy') || 'day' // day, week, month

    // Build date filter
    let dateFilter: any = {}
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {}
      if (dateFrom) dateFilter.createdAt.gte = new Date(dateFrom)
      if (dateTo) dateFilter.createdAt.lte = new Date(dateTo)
    }

    if (productId) {
      // Get analytics for specific product
      const model = await db.aRProductModel.findUnique({
        where: { productId },
        include: {
          viewEvents: {
            where: dateFilter,
            orderBy: { createdAt: 'desc' },
            take: 1000,
          },
        },
      })

      if (!model) {
        return NextResponse.json(
          { error: 'AR model not found for this product' },
          { status: 404 }
        )
      }

      // Calculate analytics
      const totalViews = model.viewsCount
      const uniqueUsers = new Set(model.viewEvents.map(e => e.userId).filter(Boolean)).size
      const avgDuration = model.avgViewDuration
      const interactionsCount = model.viewEvents.filter(
        e => e.eventType !== 'VIEW'
      ).length
      const screenshotsTaken = model.viewEvents.filter(
        e => e.eventType === 'SCREENSHOT'
      ).length
      const sharesCount = model.viewEvents.filter(
        e => e.eventType === 'SHARE'
      ).length

      // Device breakdown
      const deviceBreakdown = {
        mobile: model.viewEvents.filter(e => e.deviceType === 'mobile').length,
        desktop: model.viewEvents.filter(e => e.deviceType === 'desktop').length,
        tablet: model.viewEvents.filter(e => e.deviceType === 'tablet').length,
      }

      // Browser support breakdown
      const browserSupportBreakdown = {
        webxr: model.viewEvents.filter(e => e.browserSupport === 'WEBXR').length,
        threejsFallback: model.viewEvents.filter(e => e.browserSupport === 'THREEJS_FALLBACK').length,
      }

      return NextResponse.json({
        success: true,
        data: {
          modelId: model.id,
          productId: model.productId,
          totalViews,
          uniqueViews: uniqueUsers,
          avgDurationSeconds: avgDuration,
          interactionsCount,
          hotspotClicks: {}, // Would be calculated from hotspot-specific events
          screenshotsTaken,
          sharesCount,
          deviceBreakdown,
          browserSupportBreakdown,
          recentEvents: model.viewEvents.slice(0, 50),
        },
      })
    } else {
      // Get overall AR platform analytics
      const [totalModels, totalViews, recentEvents] = await Promise.all([
        db.aRProductModel.count({ where: { isEnabled: true } }),
        db.aRProductModel.aggregate({
          where: { isEnabled: true },
          _sum: { viewsCount: true },
          _avg: { avgViewDuration: true },
        }),
        db.aRViewEvent.findMany({
          where: dateFilter,
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
      ])

      // Get top viewed models
      const topModels = await db.aRProductModel.findMany({
        where: { isEnabled: true },
        orderBy: { viewsCount: 'desc' },
        take: 10,
        select: {
          id: true,
          productId: true,
          name: true,
          viewsCount: true,
          avgViewDuration: true,
        },
      })

      // Daily views for chart (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const dailyViews = await db.aRViewEvent.groupBy({
        by: ['createdAt'],
        where: {
          eventType: 'VIEW',
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: { id: true },
      })

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalModels,
            totalViews: totalViews._sum.viewsCount || 0,
            avgDurationSeconds: Math.round(totalViews._avg.avgViewDuration || 0),
          },
          topModels,
          dailyViews: dailyViews.map(d => ({
            date: d.createdAt.toISOString().split('T')[0],
            views: d._count.id,
          })),
          recentEvents,
        },
      })
    }
  } catch (error) {
    console.error('[AR Analytics API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// POST /api/ar/analytics - Record a view event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      modelId,
      userId,
      eventType = 'VIEW',
      duration,
      deviceType,
      browserSupport,
      userAgent,
    } = body

    if (!modelId) {
      return NextResponse.json(
        { error: 'Missing required field: modelId' },
        { status: 400 }
      )
    }

    // Create view event
    const event = await db.aRViewEvent.create({
      data: {
        modelId,
        userId: userId || null,
        eventType,
        duration: duration || null,
        deviceType: deviceType || (typeof window !== 'undefined' ? getDeviceType() : 'unknown'),
        browserSupport: browserSupport || 'THREEJS_FALLBACK',
        userAgent: userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
      },
    })

    // Update model's average duration and view count if it's a VIEW event with duration
    if (eventType === 'VIEW' && duration) {
      const model = await db.aRProductModel.findUnique({
        where: { id: modelId },
      })

      if (model) {
        const newAvgDuration = Math.round(
          ((model.avgViewDuration * model.viewsCount) + duration) / (model.viewsCount + 1)
        )

        await db.aRProductModel.update({
          where: { id: modelId },
          data: {
            avgViewDuration: newAvgDuration,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: event,
      message: 'Event recorded successfully',
    })
  } catch (error) {
    console.error('[AR Analytics API] Error recording event:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record event' },
      { status: 500 }
    )
  }
}

// Helper function to detect device type
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const ua = navigator.userAgent
  
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile'
  
  return 'desktop'
}
