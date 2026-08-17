import { NextRequest, NextResponse } from 'next/server'
import {
  createInstallmentPlan,
  getUserInstallmentPlans,
  calculateInstallmentPlan,
  isPlanTypeEligible,
  PLAN_TYPE_CONFIG,
  type InstallmentPlanType,
} from '@/lib/payments/installments'

// POST /api/installments - Create new installment plan request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      orderId,
      buyerId,
      sellerId,
      type,
      totalAmount,
      downPaymentPercent,
      interestRate,
      firstPaymentDate,
      frequency,
      bankGuaranteeRequired,
      bankGuaranteeDocument,
      notes,
    } = body

    // Validate required fields
    if (!orderId || !buyerId || !sellerId || !type || !totalAmount || !firstPaymentDate) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, buyerId, sellerId, type, totalAmount, firstPaymentDate' },
        { status: 400 }
      )
    }

    // Check if plan type is eligible for this amount
    const eligibility = isPlanTypeEligible(type as InstallmentPlanType, totalAmount)
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: `Plan type not eligible: ${eligibility.reason}` },
        { status: 400 }
      )
    }

    // Check if order already has an installment plan
    // (This would be a DB check in production)

    const plan = await createInstallmentPlan({
      orderId,
      buyerId,
      sellerId,
      type: type as InstallmentPlanType,
      totalAmount: Number(totalAmount),
      downPaymentPercent: downPaymentPercent ? Number(downPaymentPercent) : undefined,
      interestRate: interestRate ? Number(interestRate) : undefined,
      firstPaymentDate: new Date(firstPaymentDate),
      frequency,
      bankGuaranteeRequired,
      bankGuaranteeDocument,
      notes,
    })

    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Installment plan created successfully',
    })
  } catch (error) {
    console.error('Error creating installment plan:', error)
    return NextResponse.json(
      { error: 'Failed to create installment plan' },
      { status: 500 }
    )
  }
}

// GET /api/installments - List user's installment plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const userId = searchParams.get('userId')
    const role = searchParams.get('role') ?? 'buyer'
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const offset = parseInt(searchParams.get('offset') ?? '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    const plans = await getUserInstallmentPlans(userId, role as 'buyer' | 'seller', {
      status: status as any,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: plans,
      count: plans.length,
    })
  } catch (error) {
    console.error('Error fetching installment plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch installment plans' },
      { status: 500 }
    )
  }
}
