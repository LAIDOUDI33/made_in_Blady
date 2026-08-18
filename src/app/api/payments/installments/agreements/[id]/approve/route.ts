import { NextRequest, NextResponse } from 'next/server'
import { approveDPARequest } from '@/lib/payments/installments/manager'

// POST /api/payments/installments/agreements/[id]/approve
// Approve a DPA request (seller or admin action)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { approverId, creditScore, riskLevel, modifiedTerms } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Agreement ID is required' },
        { status: 400 }
      )
    }

    if (!approverId) {
      return NextResponse.json(
        { error: 'approverId is required - ID of the user approving this agreement' },
        { status: 400 }
      )
    }

    // Approve the DPA request
    const updatedAgreement = await approveDPARequest(id, approverId, {
      creditScore,
      riskLevel,
      modifiedTerms: modifiedTerms ? {
        interestRate: modifiedTerms.interestRate,
        adminFee: modifiedTerms.adminFee,
      } : undefined,
    })

    return NextResponse.json({
      success: true,
      data: {
        agreement: updatedAgreement,
        message: 'DPA agreement approved successfully'
      }
    })
  } catch (error) {
    console.error('Error approving DPA agreement:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    
    // Handle specific errors
    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Agreement not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (message.includes('Cannot approve')) {
      return NextResponse.json(
        { error: message, code: 'INVALID_STATUS' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
