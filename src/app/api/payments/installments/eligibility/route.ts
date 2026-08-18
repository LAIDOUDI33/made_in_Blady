import { NextRequest, NextResponse } from 'next/server'
import {
  assessEligibility,
  getEligiblePlans,
  type BuyerProfile,
} from '@/lib/payments/installments/calculator'

// POST /api/payments/installments/eligibility
// Check buyer eligibility for DPA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderAmount, buyerProfile } = body as {
      orderAmount: number
      buyerProfile: BuyerProfile
    }

    // Validate required fields
    if (!orderAmount || typeof orderAmount !== 'number') {
      return NextResponse.json(
        { error: 'orderAmount is required and must be a number' },
        { status: 400 }
      )
    }

    if (!buyerProfile) {
      return NextResponse.json(
        { error: 'buyerProfile is required' },
        { status: 400 }
      )
    }

    // Validate buyer profile structure
    const requiredFields = ['registrationDate', 'completedOrders', 'rating']
    for (const field of requiredFields) {
      if (!(field in buyerProfile)) {
        return NextResponse.json(
          { error: `buyerProfile.${field} is required` },
          { status: 400 }
        )
      }
    }

    // Convert registrationDate string to Date object
    const profile: BuyerProfile = {
      ...buyerProfile,
      registrationDate: new Date(buyerProfile.registrationDate),
    }

    // Assess eligibility
    const result = assessEligibility(orderAmount, profile)

    // Get eligible plans separately (in case we want different logic)
    const plansResult = getEligiblePlans(orderAmount)

    return NextResponse.json({
      success: true,
      data: {
        eligibility: result,
        availablePlans: plansResult.plans,
        hasAvailablePlans: plansResult.hasPlans,
        message: plansResult.message,
      }
    })
  } catch (error) {
    console.error('Error checking DPA eligibility:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/payments/installments/eligibility
// Quick check with query params
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderAmount = searchParams.get('orderAmount')
    
    if (!orderAmount) {
      return NextResponse.json(
        { error: 'orderAmount query parameter is required' },
        { status: 400 }
      )
    }

    const amount = parseFloat(orderAmount)
    
    if (isNaN(amount)) {
      return NextResponse.json(
        { error: 'orderAmount must be a valid number' },
        { status: 400 }
      )
    }

    const result = getEligiblePlans(amount)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error getting DPA plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
