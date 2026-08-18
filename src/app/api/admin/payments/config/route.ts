import { NextResponse } from 'next/server'
import { 
  validatePaymentConfigs, 
  getWebhookConfigs, 
  getPaymentMethodStatuses,
  getEnvironmentSummary 
} from '@/lib/payments/config-validator'

// GET: Get payment configuration status
export async function GET() {
  try {
    const validation = validatePaymentConfigs()
    const webhooks = getWebhookConfigs()
    const paymentMethods = getPaymentMethodStatuses()
    const environment = getEnvironmentSummary()

    return NextResponse.json({
      success: true,
      validation,
      webhooks,
      paymentMethods,
      environment,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching payment config:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch payment configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
