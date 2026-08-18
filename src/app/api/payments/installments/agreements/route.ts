import { NextRequest, NextResponse } from 'next/server'
import { getUserDPAs } from '@/lib/payments/installments/manager'

// GET /api/payments/installments/agreements
// List user's DPA agreements (buyer or seller view)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get required params
    const userId = searchParams.get('userId')
    const role = searchParams.get('role') as 'buyer' | 'seller' | null
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    if (!role || !['buyer', 'seller'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be either "buyer" or "seller"' },
        { status: 400 }
      )
    }

    // Optional filters
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Validate pagination
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'offset must be a non-negative number' },
        { status: 400 }
      )
    }

    // Fetch agreements
    const result = await getUserDPAs(userId, role, {
      status,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: {
        agreements: result.agreements,
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.agreements.length < result.total,
      }
    })
  } catch (error) {
    console.error('Error fetching DPA agreements:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
