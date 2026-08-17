import { NextRequest, NextResponse } from 'next/server'
import {
  getInstallmentPlanById,
  getInstallmentSchedule,
  cancelInstallmentPlan,
} from '@/lib/payments/installments'

// GET /api/installments/[planId] - Get plan details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    
    const includeSchedule = request.nextUrl.searchParams.get('schedule') === 'true'
    
    if (includeSchedule) {
      // Return plan with full schedule
      const plan = await getInstallmentPlanById(planId)
      return NextResponse.json({
        success: true,
        data: plan,
      })
    }
    
    const plan = await getInstallmentPlanById(planId)
    return NextResponse.json({
      success: true,
      data: plan,
    })
  } catch (error) {
    console.error('Error fetching installment plan:', error)
    if (error instanceof Error && error.message === 'Plan not found') {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch installment plan' },
      { status: 500 }
    )
  }
}

// DELETE /api/installments/[planId] - Cancel a plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    const body = await request.json()
    const { reason, cancelledBy } = body

    if (!reason || !cancelledBy) {
      return NextResponse.json(
        { error: 'reason and cancelledBy are required' },
        { status: 400 }
      )
    }

    const plan = await cancelInstallmentPlan(planId, reason, cancelledBy)
    
    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Plan cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling installment plan:', error)
    return NextResponse.json(
      { error: 'Failed to cancel plan' },
      { status: 500 }
    )
  }
}
