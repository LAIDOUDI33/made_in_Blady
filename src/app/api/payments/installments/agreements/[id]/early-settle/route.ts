import { NextRequest, NextResponse } from 'next/server'
import { processEarlySettlement, getDPAById } from '@/lib/payments/installments/manager'

// POST /api/payments/installments/agreements/[id]/early-settle
// Process early settlement of a DPA agreement with discount
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { settlementAmount, paymentMethod, paymentReference } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Agreement ID is required' },
        { status: 400 }
      )
    }

    if (!settlementAmount || typeof settlementAmount !== 'number' || settlementAmount <= 0) {
      return NextResponse.json(
        { error: 'settlementAmount is required and must be a positive number' },
        { status: 400 }
      )
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'paymentMethod is required' },
        { status: 400 }
      )
    }

    // First get the current state to calculate expected settlement amount
    const currentAgreement = await getDPAById(id)
    
    // Process the early settlement
    const result = await processEarlySettlement(
      id,
      settlementAmount,
      paymentMethod,
      paymentReference
    )

    return NextResponse.json({
      success: true,
      data: {
        settlement: result.settlement,
        agreement: result.agreement,
        message: `Early settlement completed. You saved ${result.settlement.discountAmount} DZD!`
      }
    })
  } catch (error) {
    console.error('Error processing early settlement:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    
    // Handle specific errors
    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Agreement not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (message.includes('Cannot settle') || message.includes('status')) {
      return NextResponse.json(
        { error: message, code: 'INVALID_STATUS' },
        { status: 400 }
      )
    }

    if (message.includes('insuffisant') || message.includes('insufficient')) {
      return NextResponse.json(
        { 
          error: message, 
          code: 'INSUFFICIENT_AMOUNT',
          details: 'The settlement amount is less than the calculated minimum'
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// GET /api/payments/installments/agreements/[id]/early-settle
// Calculate early settlement amount without processing
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

    // Get full agreement details for calculation
    const agreement = await getDPAById(id)

    // Calculate how many installments have been paid
    const paidCount = agreement.installments.filter(i => i.status === 'PAID').length
    
    // Import calculator for estimation
    const { calculateEarlySettlementDiscount, calculateInstallmentSchedule, getPlanById } = 
      await import('@/lib/payments/installments/calculator')

    const plan = getPlanById(agreement.planId)
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan configuration not found' },
        { status: 404 }
      )
    }

    // Build schedule for calculation
    const schedule = agreement.installments.map(i => ({
      installmentNumber: i.installmentNumber,
      dueDate: new Date(i.dueDate),
      amount: i.amount,
      principalPortion: i.principalPortion,
      interestPortion: i.interestPortion,
      remainingBalance: 0,
      status: i.status as any,
    }))

    // Recalculate remaining balance
    let balance = agreement.principalAmount
    for (const inst of agreement.installments) {
      if (inst.status === 'PAID') {
        balance -= inst.principalPortion
      }
    }

    let runningBalance = balance
    for (let i = schedule.length - 1; i >= 0; i--) {
      schedule[i].remainingBalance = runningBalance
      if (agreement.installments[i].status !== 'PAID') {
        runningBalance += agreement.installments[i].principalPortion
      }
    }

    const calculationResult = {
      plan,
      principalAmount: agreement.principalAmount,
      totalInterest: (agreement.principalAmount * agreement.interestRate) / 100,
      adminFee: agreement.adminFee,
      insurancePremium: agreement.insurancePremium ?? 0,
      totalAmount: agreement.totalAmount,
      monthlyPayment: agreement.installmentAmount,
      effectiveAPR: 0,
      schedule,
      amortizationTable: [],
      firstDueDate: new Date(agreement.firstDueDate),
      lastDueDate: new Date(),
    }

    // Calculate early settlement discount
    const settlementCalculation = calculateEarlySettlementDiscount(
      calculationResult,
      paidCount,
      new Date()
    )

    return NextResponse.json({
      success: true,
      data: {
        agreementId: id,
        currentStatus: agreement.status,
        installmentsPaid: paidCount,
        totalInstallments: agreement.totalInstallments,
        originalRemaining: settlementCalculation.originalTotalRemaining,
        settlementAmount: settlementCalculation.settlementAmount,
        discountAmount: settlementCalculation.discountAmount,
        discountPercent: settlementCalculation.discountPercent,
        savingsBreakdown: settlementCalculation.savingsBreakdown,
        effectiveDate: settlementCalculation.effectiveDate,
        message: 'This is a quote. Call POST to process the actual settlement.'
      }
    })
  } catch (error) {
    console.error('Error calculating early settlement:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    
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
