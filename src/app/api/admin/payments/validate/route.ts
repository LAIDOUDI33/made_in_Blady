import { NextResponse } from 'next/server'
import { 
  validatePaymentConfigs, 
  validateSatimConfig, 
  validateStripeConfig, 
  validateCryptoConfig,
  validateExchangeRateConfig,
  getWebhookConfigs,
  getEnvironmentSummary
} from '@/lib/payments/config-validator'

// GET: Run full validation and return detailed report
export async function GET() {
  try {
    const startTime = Date.now()
    
    // Run all validations
    const fullValidation = validatePaymentConfigs()
    const satimValidation = validateSatimConfig()
    const stripeValidation = validateStripeConfig()
    const cryptoValidation = validateCryptoConfig()
    const exchangeValidation = validateExchangeRateConfig()
    const webhooks = getWebhookConfigs()
    const environment = getEnvironmentSummary()

    // Generate recommendations
    const recommendations: string[] = []

    if (satimValidation.status !== 'configured') {
      if (environment.isProduction) {
        recommendations.push('CRITICAL: SATIM/CIB is not properly configured for production. Local card payments will fail.')
      } else {
        recommendations.push('SATIM/CIB configuration incomplete. Test payments may not work correctly.')
      }
      if (satimValidation.missingFields.length > 0) {
        recommendations.push(`Missing SATIM fields: ${satimValidation.missingFields.join(', ')}`)
      }
    }

    if (stripeValidation.status !== 'configured') {
      if (environment.isProduction) {
        recommendations.push('CRITICAL: Stripe is not properly configured for production. International payments will fail.')
      }
      if (stripeValidation.warnings.some(w => w.includes('test'))) {
        recommendations.push('WARNING: Stripe is using test keys in what appears to be a production environment.')
      }
    }

    if (cryptoValidation.status === 'missing' && process.env.ENABLE_CRYPTO_PAYMENTS === 'true') {
      recommendations.push('Crypto payments are enabled but no wallet addresses are configured.')
    }

    if (exchangeValidation.status === 'missing') {
      recommendations.push('No exchange rate API configured. Currency conversion may use fallback rates.')
    }

    // Check webhook configurations
    const inactiveWebhooks = webhooks.filter(w => w.status !== 'active')
    if (inactiveWebhooks.length > 0) {
      recommendations.push(`Inactive webhooks: ${inactiveWebhooks.map(w => w.provider).join(', ')}. Payment notifications may not be received.`)
    }

    // Security checks
    const securityChecks = {
      hasJwtSecret: !!process.env.JWT_SECRET && !process.env.JWT_SECRET.includes('test_'),
      hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
      debugModeDisabled: process.env.DEBUG_MODE !== 'true',
      logLevelAppropriate: ['error', 'warn'].includes(process.env.LOG_LEVEL || ''),
    }

    if (!securityChecks.hasJwtSecret) {
      recommendations.push('SECURITY: JWT_SECRET not configured or using test value.')
    }
    if (!securityChecks.debugModeDisabled) {
      recommendations.push('SECURITY: DEBUG_MODE is enabled. Disable this in production.')
    }

    const validationTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      validationTimeMs: validationTime,
      
      // Overall status
      overall: {
        isValid: fullValidation.isValid,
        issueCount: fullValidation.issueCount,
        environment: fullValidation.environment,
        criticalErrors: fullValidation.criticalErrors,
      },
      
      // Individual provider statuses
      providers: {
        satim: satimValidation,
        stripe: stripeValidation,
        crypto: cryptoValidation,
        exchangeRates: exchangeValidation,
      },
      
      // Webhook status
      webhooks,
      
      // Environment info
      environment,
      
      // Security checks
      security: securityChecks,
      
      // Actionable recommendations
      recommendations,
      
      // Summary
      summary: {
        totalProviders: 4,
        configuredProviders: [satimValidation, stripeValidation, cryptoValidation, exchangeValidation]
          .filter(p => p.status === 'configured').length,
        partialProviders: [satimValidation, stripeValidation, cryptoValidation, exchangeValidation]
          .filter(p => p.status === 'partial').length,
        missingProviders: [satimValidation, stripeValidation, cryptoValidation, exchangeValidation]
          .filter(p => p.status === 'missing').length,
        activeWebhooks: webhooks.filter(w => w.status === 'active').length,
        totalRecommendations: recommendations.length,
      },
    })
  } catch (error) {
    console.error('Error running validation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to run validation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
