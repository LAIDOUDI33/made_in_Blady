import { NextRequest, NextResponse } from 'next/server'
import {
  createDPAgreement,
  submitDPAApplication,
  type CreateDPAInput,
} from '@/lib/payments/installments/manager'

// POST /api/payments/installments/apply
// Submit a new DPA application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderId,
      buyerId,
      sellerId,
      planId,
      principalAmount,
      insuranceEnabled,
      bankPartnerId,
      notes,
    } = body as CreateDPAInput

    // Validate required fields
    if (!orderId || !buyerId || !sellerId || !planId || !principalAmount) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: orderId, buyerId, sellerId, planId, principalAmount' 
        },
        { status: 400 }
      )
    }

    // Validate amounts
    if (typeof principalAmount !== 'number' || principalAmount <= 0) {
      return NextResponse.json(
        { error: 'principalAmount must be a positive number' },
        { status: 400 }
      )
    }

    // Check minimum amount for DPA
    if (principalAmount < 500000) {
      return NextResponse.json(
        { 
          error: 'Order amount must be at least 500,000 DZD for DPA eligibility',
          code: 'AMOUNT_BELOW_MINIMUM'
        },
        { status: 400 }
      )
    }

    // Create the DPA agreement
    const agreement = await createDPAgreement({
      orderId,
      buyerId,
      sellerId,
      planId,
      principalAmount,
      insuranceEnabled: insuranceEnabled ?? false,
      bankPartnerId,
      notes,
    })

    // Try to submit for approval if all required documents are present
    try {
      const submittedAgreement = await submitDPAApplication(agreement.id)
      
      return NextResponse.json({
        success: true,
        data: {
          agreement: submittedAgreement,
          status: 'PENDING_APPROVAL',
          message: 'Application submitted successfully and is pending review'
        }
      })
    } catch (submitError: any) {
      // If submission fails due to missing documents, return draft status
      if (submitError.message?.includes('Documents requis')) {
        return NextResponse.json({
          success: true,
          data: {
            agreement,
            status: 'PENDING_DOCUMENTS',
            message: submitError.message,
            missingDocuments: extractMissingDocs(submitError.message)
          }
        })
      }
      
      // Return the created agreement even if submission failed
      return NextResponse.json({
        success: true,
        data: {
          agreement,
          status: 'DRAFT',
          message: 'Agreement created. Please upload required documents to submit.'
        }
      })
    }
  } catch (error) {
    console.error('Error creating DPA application:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

function extractMissingDocs(errorMessage: string): string[] {
  const match = errorMessage.match(/Documents requis manquants: (.+)/)
  if (match) {
    return match[1].split(', ').map(d => d.trim())
  }
  return []
}
