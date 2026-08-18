import { NextRequest, NextResponse } from 'next/server'
import { getCRMStats } from '@/lib/crm'

// GET /api/crm/dashboard/stats - Get CRM dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const companyId = searchParams.get('companyId') || undefined
    const userId = searchParams.get('userId') || undefined
    
    const stats = await getCRMStats(companyId, userId)
    
    return NextResponse.json({
      success: true,
      data: stats,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching CRM stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CRM dashboard stats' },
      { status: 500 }
    )
  }
}
