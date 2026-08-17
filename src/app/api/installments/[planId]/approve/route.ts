import { NextRequest, NextResponse } from 'next/server'
import {
  approveInstallmentPlan,
  activateInstallmentPlan,
} from '@/lib/payments/installments'

// POST /api/installments/[planId]/approve - Approve a plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    const body = await request.json()
    const { approverId, action } = body

    if (!approverId) {
      return NextResponse.json(
        { error: 'approverId is required' },
        { status: 400 }
      )
    }

    let result
    
    switch (action) {
      case 'approve':
        // Approve the plan (seller/admin approval)
        result = await approveInstallmentPlan(planId, approverId)
        return NextResponse.json({
          success: true,
          data: result,
          message: 'Installment plan approved successfully',
        })
        
      case 'activate':
        // Activate after down payment received
        result = await activateInstallmentPlan(planId)
        return NextResponse.json({
          success: true,
          data: result,
          message: 'Installment plan activated',
        })
        
      default:
        // Default to approve if no action specified
        result = await approveInstallmentPlan(planId, approverId)
        return NextResponse.json({
          success: true,
          data: result,
          message: 'Installment plan approved successfully',
        })
    }
  } catch (error) {
    console.error('Error approving installment plan:', error)
    if (error instanceof Error && error.message === 'Plan not found') {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to approve plan' },
      { status: 500 }
    )
  }
}
