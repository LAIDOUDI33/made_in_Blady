import { NextRequest, NextResponse } from 'next/server'
import { getDPAById } from '@/lib/payments/installments/manager'

// GET /api/payments/installments/agreements/[id]
// Get full agreement details including schedule and payment history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Agreement ID is required' },
        { status: 400 }
      )
    }

    // Fetch full agreement details
    const agreement = await getDPAById(id)

    return NextResponse.json({
      success: true,
      data: agreement
    })
  } catch (error) {
    console.error('Error fetching DPA agreement:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    
    // Handle not found specifically
    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Agreement not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
