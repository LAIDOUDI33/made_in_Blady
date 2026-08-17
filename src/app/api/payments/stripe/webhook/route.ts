import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  initializeStripe,
  constructStripeWebhookEvent,
  getStripeConfig,
} from '@/lib/payments/stripe'
import { handleStripeWebhookEvent } from '@/lib/payments/stripe-webhooks'

// Initialize Stripe on module load
function ensureStripeInitialized() {
  try {
    getStripeConfig()
  } catch {
    const config = {
      secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_dummy',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      environment: (process.env.STRIPE_ENVIRONMENT as 'test' | 'production') || 'test',
    }
    initializeStripe(config)
  }
}

// POST /api/payments/stripe/webhook - Stripe webhook handler
export async function POST(request: NextRequest) {
  ensureStripeInitialized()

  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('stripe-signature') || ''

    if (!signature) {
      console.error('[Stripe Webhook] Missing stripe-signature header')
      return new NextResponse(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400 }
      )
    }

    // Verify and construct event
    let event
    try {
      event = constructStripeWebhookEvent(body, signature)
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err)
      return new NextResponse(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401 }
      )
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`)

    // Handle the event using our handler module
    const result = await handleStripeWebhookEvent(event, request)

    if (result.success) {
      return new NextResponse(JSON.stringify({ received: true }), { status: 200 })
    } else {
      console.error('[Stripe Webhook] Event handling failed:', result.error)
      return new NextResponse(
        JSON.stringify({ error: result.error }),
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Stripe Webhook] Unexpected error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500 }
    )
  }
}

// GET /api/payments/stripe/webhook - Health check
export async function GET() {
  ensureStripeInitialized()
  
  return NextResponse.json({
    status: 'ok',
    service: 'Stripe Webhook',
    timestamp: new Date().toISOString(),
    configured: !!process.env.STRIPE_WEBHOOK_SECRET,
  })
}
