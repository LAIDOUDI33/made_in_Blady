import { NextRequest, NextResponse } from 'next/server'
import { 
  getDashboardMetrics,
  getConversionMetrics,
  getRevenueForecast,
  getCLVAnalytics,
  generateSalesReport
} from '@/lib/crm/analytics'

// GET /api/crm/analytics - Get CRM analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const ownerId = searchParams.get('ownerId')
    const type = searchParams.get('type') || 'dashboard'
    const period = (searchParams.get('period') || '30d') as '7d' | '30d' | '90d' | '6m' | '12m'
    
    if (!ownerId) {
      return NextResponse.json(
        { success: false, error: 'ownerId is required' },
        { status: 400 }
      )
    }
    
    switch (type) {
      case 'dashboard':
        const metrics = await getDashboardMetrics(ownerId, period)
        return NextResponse.json({ 
          success: true, 
          type: 'dashboard',
          data: metrics,
          period,
        })
        
      case 'conversion':
        const conversion = await getConversionMetrics(ownerId)
        return NextResponse.json({ 
          success: true, 
          type: 'conversion',
          data: conversion,
        })
        
      case 'forecast':
        const forecast = await getRevenueForecast(ownerId)
        return NextResponse.json({ 
          success: true, 
          type: 'forecast',
          data: forecast,
        })
        
      case 'clv':
        const clv = await getCLVAnalytics(ownerId)
        return NextResponse.json({ 
          success: true, 
          type: 'clv',
          data: clv,
        })
        
      case 'report':
        let dateRange
        if (searchParams.get('from') && searchParams.get('to')) {
          dateRange = {
            from: new Date(searchParams.get('from')!),
            to: new Date(searchParams.get('to')!),
          }
        }
        
        const report = await generateSalesReport(
          ownerId, 
          period as any,
          dateRange
        )
        return NextResponse.json({ 
          success: true, 
          type: 'report',
          data: report,
        })
        
      default:
        return NextResponse.json(
          { success: false, error: `Invalid analytics type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
