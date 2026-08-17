import { NextResponse } from 'next/server'
import { getInstallmentSchedule } from '@/lib/payments/installments'

// GET /api/installments/[planId]/schedule - Get payment schedule
export async function GET(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    
    const schedule = await getInstallmentSchedule(planId)
    
    // Calculate summary statistics
    const totalAmount = schedule.reduce((sum, inst) => sum + inst.amount, 0)
    const paidAmount = schedule
      .filter((inst) => inst.status === 'PAID')
      .reduce((sum, inst) => sum + inst.amount, 0)
    const overdueAmount = schedule
      .filter((inst) => inst.status === 'OVERDUE')
      .reduce((sum, inst) => sum + inst.amount + inst.lateFeeApplied, 0)
    const pendingCount = schedule.filter((inst) => inst.status === 'PENDING').length

    return NextResponse.json({
      success: true,
      data: {
        schedule,
        summary: {
          totalInstallments: schedule.length,
          totalAmount,
          paidAmount,
          paidCount: schedule.filter((inst) => inst.status === 'PAID').length,
          overdueAmount,
          overdueCount: schedule.filter((inst) => inst.status === 'OVERDUE').length,
          pendingCount,
          remainingBalance: totalAmount - paidAmount,
          nextDueDate: schedule.find((inst) => inst.status === 'PENDING')?.dueDate ?? null,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching installment schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}
