/**
 * Payment Configuration Validator
 * 
 * Validates all payment provider configurations for AlgeriaTrade.dz
 * Checks SATIM/CIB, Stripe, and Crypto payment settings
 * 
 * @module payments/config-validator
 */

import { satimConfig, isSatimConfigured } from './satim/config'
import { stripeConfig } from './stripe/config'
import { cryptoConfig } from './crypto/config'

// ============================================
// Types
// ============================================

export interface ConfigValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean
  
  /** Name of the configuration section */
  name: string
  
  /** Provider type */
  provider: 'satim' | 'stripe' | 'crypto' | 'exchange'
  
  /** List of missing required fields */
  missingFields: string[]
  
  /** List of warnings (optional but recommended) */
  warnings: string[]
  
  /** Configuration status */
  status: 'configured' | 'partial' | 'missing' | 'error'
  
  /** Additional details */
  details?: Record<string, unknown>
}

export interface ValidationResult {
  /** Overall validation status */
  isValid: boolean
  
  /** Individual provider results */
  providers: ConfigValidationResult[]
  
  /** Total number of issues found */
  issueCount: number
  
  /** Critical errors that must be fixed */
  criticalErrors: string[]
  
  /** Timestamp of validation */
  validatedAt: Date
  
  /** Environment being validated */
  environment: 'production' | 'staging' | 'development'
}

export interface TestResult {
  /** Whether the test was successful */
  success: boolean
  
  /** Provider being tested */
  provider: string
  
  /** Test message */
  message: string
  
  /** Response time in milliseconds (if applicable) */
  responseTime?: number
  
  /** Additional data from test */
  data?: Record<string, unknown>
  
  /** Error details if failed */
  error?: string
  
  /** Timestamp of test */
  testedAt: Date
}

export interface WebhookConfig {
  /** Provider name */
  provider: string
  
  /** Webhook endpoint URL */
  url: string
  
  /** Expected events list */
  events: string[]
  
  /** Setup instructions URL */
  setupUrl: string
  
  /** Whether webhook secret is configured */
  hasSecret: boolean
  
  /** Current status */
  status: 'active' | 'inactive' | 'misconfigured' | 'unknown'
}

// ============================================
// SATIM Validation
// ============================================

/**
 * Validate SATIM/CIB payment gateway configuration
 */
export function validateSatimConfig(): ConfigValidationResult {
  const missingFields: string[] = []
  const warnings: string[] = []

  // Check required fields
  if (!satimConfig.merchantId || satimConfig.merchantId === '001000000000001') {
    missingFields.push('SATIM_MERCHANT_ID')
  }

  if (!satimConfig.apiKey || satimConfig.apiKey.includes('test_') || satimConfig.apiKey === '') {
    // In test mode, test keys are acceptable but we warn about it
    if (process.env.SATIM_ENVIRONMENT === 'production') {
      missingFields.push('SATIM_API_KEY')
    } else {
      warnings.push('Using test API key - not suitable for production')
    }
  }

  if (!satimConfig.apiSecret || satimConfig.apiSecret.includes('test_') || satimConfig.apiSecret === '') {
    if (process.env.SATIM_ENVIRONMENT === 'production') {
      missingFields.push('SATIM_API_SECRET')
    } else {
      warnings.push('Using test API secret - not suitable for production')
    }
  }

  // Check optional but important fields
  if (!process.env.SATIM_WEBHOOK_SECRET || process.env.SATIM_WEBHOOK_SECRET.includes('test_')) {
    warnings.push('SATIM_WEBHOOK_SECRET not configured or using test value')
  }

  // Check environment consistency
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'test'
  if (satimConfig.environment !== env && process.env.SATIM_ENVIRONMENT) {
    warnings.push(`SATIM environment (${satimConfig.environment}) differs from NODE_ENV (${env})`)
  }

  let status: ConfigValidationResult['status'] = 'configured'
  if (missingFields.length > 0) {
    status = missingFields.length >= 2 ? 'missing' : 'partial'
  } else if (warnings.length > 0) {
    status = 'partial'
  }

  return {
    isValid: missingFields.length === 0,
    name: 'SATIM / CIB Payment Gateway',
    provider: 'satim',
    missingFields,
    warnings,
    status,
    details: {
      environment: satimConfig.environment,
      merchantId: satimConfig.merchantId ? `${satimConfig.merchantId.substring(0, 4)}...` : undefined,
      baseUrl: satimConfig.baseUrl,
      threeDSecureEnabled: true,
      supportedCards: ['VISA', 'MASTERCARD', 'CIB'],
    },
  }
}

/**
 * Test connection to SATIM payment gateway
 */
export async function testSatimConnection(): Promise<TestResult> {
  const startTime = Date.now()

  try {
    // Check basic configuration first
    if (!isSatimConfigured()) {
      return {
        success: false,
        provider: 'SATIM',
        message: 'SATIM is not properly configured. Please check your credentials.',
        error: 'Missing or invalid credentials',
        testedAt: new Date(),
      }
    }

    // In mock mode, simulate connection
    if (process.env.SATIM_MOCK_MODE === 'true') {
      await new Promise(resolve => setTimeout(resolve, parseInt(process.env.SATIM_MOCK_DELAY_MS || '1000')))
      
      return {
        success: true,
        provider: 'SATIM',
        message: 'Mock connection successful (SATIM_MOCK_MODE enabled)',
        responseTime: Date.now() - startTime,
        data: {
          mode: 'mock',
          environment: satimConfig.environment,
          note: 'This is a simulated response. Real API calls are disabled.',
        },
        testedAt: new Date(),
      }
    }

    // Try actual connection to CIB endpoint
    const response = await fetch(`${satimConfig.baseUrl}/checkStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId: satimConfig.merchantId,
        orderId: 'TEST_CONNECTION_' + Date.now(),
        language: 'fr',
      }),
      signal: AbortSignal.timeout(15000),
    })

    const responseTime = Date.now() - startTime

    // CIB typically returns specific error codes for invalid requests
    // A response (even an error) means the connection works
    if (response.ok || response.status === 400 || response.status === 401) {
      return {
        success: true,
        provider: 'SATIM',
        message: `Connection successful (HTTP ${response.status})`,
        responseTime,
        data: {
          statusCode: response.status,
          environment: satimConfig.environment,
          endpoint: satimConfig.baseUrl,
        },
        testedAt: new Date(),
      }
    }

    return {
      success: false,
      provider: 'SATIM',
      message: `Connection failed with HTTP ${response.status}`,
      responseTime,
      error: `HTTP ${response.status}: ${response.statusText}`,
      testedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      provider: 'SATIM',
      message: 'Unable to connect to SATIM server',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      testedAt: new Date(),
    }
  }
}

// ============================================
// Stripe Validation
// ============================================

/**
 * Validate Stripe payment configuration
 */
export function validateStripeConfig(): ConfigValidationResult {
  const missingFields: string[] = []
  const warnings: string[] = []

  // Check required fields
  if (!stripeConfig.secretKey || stripeConfig.secretKey.startsWith('sk_test_') || stripeConfig.secretKey.startsWith('sk_dummy')) {
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
      // Key exists and is live
    } else if (!process.env.STRIPE_SECRET_KEY) {
      missingFields.push('STRIPE_SECRET_KEY')
    } else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      warnings.push('Using test Secret Key (sk_test_) - not suitable for production')
    } else {
      missingFields.push('STRIPE_SECRET_KEY')
    }
  }

  if (!stripeConfig.publishableKey || stripeConfig.publishableKey.startsWith('pk_test_') || stripeConfig.publishableKey.startsWith('pk_dummy')) {
    if (!process.env.STRIPE_PUBLISHABLE_KEY) {
      missingFields.push('STRIPE_PUBLISHABLE_KEY')
    } else if (process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_')) {
      warnings.push('Using test Publishable Key (pk_test_) - not suitable for production')
    }
  }

  if (!stripeConfig.webhookSecret || stripeConfig.webhookSecret.startsWith('whsec_test_') || stripeConfig.webhookSecret.startsWith('whsec_dummy')) {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      missingFields.push('STRIPE_WEBHOOK_SECRET')
    } else if (process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_test_')) {
      warnings.push('Using test Webhook Secret - not suitable for production')
    }
  }

  // Check key consistency (both should be same mode)
  const secretIsLive = stripeConfig.secretKey.startsWith('sk_live_')
  const publishableIsLive = stripeConfig.publishableKey.startsWith('pk_live_')
  
  if (secretIsLive !== publishableIsLive && stripeConfig.publishableKey && stripeConfig.secretKey) {
    warnings.push('Secret key and publishable key modes do not match (live vs test)')
  }

  let status: ConfigValidationResult['status'] = 'configured'
  if (missingFields.length > 0) {
    status = missingFields.length >= 2 ? 'missing' : 'partial'
  } else if (warnings.length > 0) {
    status = 'partial'
  }

  return {
    isValid: missingFields.length === 0,
    name: 'Stripe International Payments',
    provider: 'stripe',
    missingFields,
    warnings,
    status,
    details: {
      secretKeyPrefix: stripeConfig.secretKey ? `${stripeConfig.secretKey.substring(0, 7)}...` : undefined,
      publishableKeyPrefix: stripeConfig.publishableKey ? `${stripeConfig.publishableKey.substring(0, 7)}...` : undefined,
      supportedCurrencies: [...stripeConfig.supportedCurrencies],
      apiVersion: stripeConfig.apiVersion,
      enabledFeatures: Object.entries(stripeConfig.features)
        .filter(([, enabled]) => enabled)
        .map(([name]) => name),
    },
  }
}

/**
 * Test connection to Stripe API
 */
export async function testStripeConnection(): Promise<TestResult> {
  const startTime = Date.now()

  try {
    // Import Stripe dynamically to avoid initialization issues
    const { stripe } = await import('./stripe/config')

    // Check if we have a valid key
    if (!stripeConfig.secretKey || stripeConfig.secretKey.startsWith('sk_dummy')) {
      return {
        success: false,
        provider: 'Stripe',
        message: 'Stripe is not properly configured. Please add your API keys.',
        error: 'Missing or invalid Stripe Secret Key',
        testedAt: new Date(),
      }
    }

    // Make a simple API call to verify connectivity
    const balance = await stripe.balance.retrieve()
    const responseTime = Date.now() - startTime

    return {
      success: true,
      provider: 'Stripe',
      message: 'Connection successful - API authentication verified',
      responseTime,
      data: {
        available: balance.available,
        pending: balance.pending,
        environment: stripeConfig.secretKey.startsWith('sk_live_') ? 'production' : 'test',
        apiVersion: stripeConfig.apiVersion,
      },
      testedAt: new Date(),
    }
  } catch (error) {
    const stripeError = error as { type?: string; message?: string; code?: string }
    
    return {
      success: false,
      provider: 'Stripe',
      message: 'Failed to connect to Stripe API',
      responseTime: Date.now() - startTime,
      error: stripeError.message || (error as Error).message || 'Unknown error',
      data: {
        errorCode: stripeError.code,
        errorType: stripeError.type,
      },
      testedAt: new Date(),
    }
  }
}

// ============================================
// Crypto Payment Validation
// ============================================

/**
 * Validate cryptocurrency payment configuration
 */
export function validateCryptoConfig(): ConfigValidationResult {
  const missingFields: string[] = []
  const warnings: string[] = []

  // Check wallet addresses
  const wallets = [
    { key: 'USDT_TRC20_WALLET_ADDRESS', value: cryptoConfig.wallets.USDT_TRC20, name: 'USDT TRC20' },
    { key: 'USDT_ERC20_WALLET_ADDRESS', value: cryptoConfig.wallets.USDT_ERC20, name: 'USDT ERC20' },
    { key: 'BTC_WALLET_ADDRESS', value: cryptoConfig.wallets.BTC, name: 'Bitcoin' },
    { key: 'ETH_WALLET_ADDRESS', value: cryptoConfig.wallets.ETH, name: 'Ethereum' },
  ]

  // At least one wallet should be configured
  const configuredWallets = wallets.filter(w => 
    w.value && !w.value.includes('x')?.toString().repeat(10) && !w.value.startsWith('TTest')
  )

  if (configuredWallets.length === 0) {
    missingFields.push('CRYPTO_WALLET_ADDRESSES (at least one required)')
    warnings.push('No cryptocurrency wallet addresses configured')
  } else {
    // Warn about default/placeholder addresses
    wallets.forEach(wallet => {
      if (wallet.value && (
        wallet.value.includes('xxxx') ||
        wallet.value.startsWith('0x00000') ||
        wallet.value.startsWith('TXxxx') ||
        wallet.value.startsWith('bc1qxy2') ||
        wallet.value.startsWith('TTest')
      )) {
        warnings.push(`${wallet.name} wallet appears to be a placeholder`)
      }
    })
  }

  // Check webhook secret
  if (!process.env.CRYPTO_WEBHOOK_SECRET || process.env.CRYPTO_WEBHOOK_SECRET.includes('default_')) {
    warnings.push('CRYPTO_WEBHOOK_SECRET not configured or using default value')
  }

  // Check blockchain explorer APIs (optional)
  if (!process.env.TRONSCAN_API_KEY) {
    warnings.push('TRONSCAN_API_KEY not configured - TRC20 transaction monitoring limited')
  }
  if (!process.env.ETHERSCAN_API_KEY) {
    warnings.push('ETHERSCAN_API_KEY not configured - ERC20 transaction monitoring limited')
  }

  let status: ConfigValidationResult['status'] = 'configured'
  if (missingFields.length > 0) {
    status = 'missing'
  } else if (warnings.length > 1) {
    status = 'partial'
  }

  return {
    isValid: missingFields.length === 0,
    name: 'Cryptocurrency Payments',
    provider: 'crypto',
    missingFields,
    warnings,
    status,
    details: {
      supportedCryptos: [...cryptoConfig.supportedCryptos],
      configuredWallets: configuredWallets.map(w => w.name),
      exchangeRateProvider: cryptoConfig.exchangeRateProvider,
      maxPaymentWindowHours: cryptoConfig.security.maxPaymentWindowHours,
      priceValidityMinutes: cryptoConfig.security.priceValidityMinutes,
    },
  }
}

/**
 * Test cryptocurrency configuration validity
 */
export async function testCryptoConnection(): Promise<TestResult> {
  const startTime = Date.now()

  try {
    // Check if at least one wallet is configured
    const hasValidWallet = Object.values(cryptoConfig.wallets).some(addr => 
      addr && !addr.includes('xxxx') && !addr.startsWith('0x00000') && !addr.startsWith('TTest')
    )

    if (!hasValidWallet) {
      return {
        success: false,
        provider: 'Crypto',
        message: 'No valid wallet addresses configured',
        error: 'Configure at least one cryptocurrency wallet address',
        testedAt: new Date(),
      }
    }

    // Test exchange rate API connection
    const exchangeRateResponse = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum&vs_currencies=usd',
      {
        signal: AbortSignal.timeout(10000),
      }
    )

    if (exchangeRateResponse.ok) {
      const rates = await exchangeRateResponse.json()
      return {
        success: true,
        provider: 'Crypto',
        message: 'Exchange rates API accessible',
        responseTime: Date.now() - startTime,
        data: {
          usdtRate: rates.tether?.usd,
          btcRate: rates.bitcoin?.usd,
          ethRate: rates.ethereum?.usd,
          provider: 'CoinGecko',
          note: 'Wallet addresses cannot be programmatically verified - check manually',
        },
        testedAt: new Date(),
      }
    }

    return {
      success: false,
      provider: 'Crypto',
      message: 'Exchange rate API unavailable',
      responseTime: Date.now() - startTime,
      error: `HTTP ${exchangeRateResponse.status}`,
      testedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      provider: 'Crypto',
      message: 'Failed to verify crypto configuration',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      testedAt: new Date(),
    }
  }
}

// ============================================
// Exchange Rate Validation
// ============================================

/**
 * Validate exchange rate API configuration
 */
export function validateExchangeRateConfig(): ConfigValidationResult {
  const missingFields: string[] = []
  const warnings: string[] = []

  const hasFixerKey = !!process.env.FIXER_API_KEY && !process.env.FIXER_API_KEY.includes('your_')
  const hasCoinGeckoKey = !!process.env.COINGECKO_API_KEY
  const hasExchangeRateKey = !!process.env.EXCHANGERATE_API_KEY && !process.env.EXCHANGERATE_API_KEY.includes('your_')

  if (!hasFixerKey && !hasCoinGeckoKey && !hasExchangeRateKey) {
    missingFields.push('EXCHANGE_RATE_API_KEY (at least one required: FIXER, COINGECKO, or EXCHANGERATE)')
  }

  if (!hasFixerKey) {
    warnings.push('Fixer.io API key not configured')
  }
  if (!hasCoinGeckoKey) {
    // CoinGecko works without key for basic usage
    warnings.push('CoinGecko API key not configured (free tier available without key)')
  }

  return {
    isValid: hasFixerKey || hasCoinGeckoKey || hasExchangeRateKey,
    name: 'Exchange Rate APIs',
    provider: 'exchange',
    missingFields,
    warnings,
    status: (hasFixerKey || hasCoinGeckoKey || hasExchangeRateKey) ? 'configured' : 'missing',
    details: {
      fixerConfigured: hasFixerKey,
      coinGeckoConfigured: hasCoinGeckoKey,
      exchangeRateApiConfigured: hasExchangeRateKey,
      activeProvider: hasCoinGeckoKey ? 'coingecko' : hasFixerKey ? 'fixer' : hasExchangeRateKey ? 'exchangerate-api' : 'none',
    },
  }
}

// ============================================
// Combined Validation
// ============================================

/**
 * Run comprehensive validation on all payment configurations
 */
export function validatePaymentConfigs(): ValidationResult {
  const satimResult = validateSatimConfig()
  const stripeResult = validateStripeConfig()
  const cryptoResult = validateCryptoConfig()
  const exchangeResult = validateExchangeRateConfig()

  const providers = [satimResult, stripeResult, cryptoResult, exchangeResult]
  
  const allValid = providers.every(p => p.isValid)
  const criticalErrors = providers
    .filter(p => p.status === 'missing')
    .map(p => `${p.name}: ${p.missingFields.join(', ')}`)

  // Determine environment
  let environment: ValidationResult['environment'] = 'development'
  if (process.env.NODE_ENV === 'production') {
    environment = 'production'
  } else if (process.env.SATIM_ENVIRONMENT === 'test' || process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    environment = 'staging'
  }

  return {
    isValid: allValid,
    providers,
    issueCount: providers.reduce((sum, p) => sum + p.missingFields.length + p.warnings.length, 0),
    criticalErrors,
    validatedAt: new Date(),
    environment,
  }
}

// ============================================
// Webhook Configuration
// ============================================

/**
 * Get webhook configuration for all payment providers
 */
export function getWebhookConfigs(): WebhookConfig[] {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://algeriatrade.dz'

  return [
    {
      provider: 'SATIM / CIB',
      url: `${baseUrl}/api/payments/satim/notification`,
      events: ['PAYMENT_SUCCESS', 'PAYMENT_FAILURE', 'PAYMENT_CANCELLED', 'REFUND_PROCESSED'],
      setupUrl: 'https://www.cib.dz/support',
      hasSecret: !!process.env.SATIM_WEBHOOK_SECRET && !process.env.SATIM_WEBHOOK_SECRET?.includes('test_'),
      status: !!process.env.SATIM_WEBHOOK_SECRET ? 'active' : 'inactive',
    },
    {
      provider: 'Stripe',
      url: `${baseUrl}/api/payments/stripe/webhook`,
      events: [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'charge.refunded',
        'checkout.session.completed',
      ],
      setupUrl: 'https://dashboard.stripe.com/webhooks',
      hasSecret: !!process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET?.includes('test_'),
      status: !!process.env.STRIPE_WEBHOOK_SECRET ? 'active' : 'inactive',
    },
    {
      provider: 'Crypto Payments',
      url: `${baseUrl}/api/payments/crypto/webhook`,
      events: ['PAYMENT_RECEIVED', 'CONFIRMATION_COMPLETE', 'PAYMENT_EXPIRED'],
      setupUrl: '#blockchain-monitoring',
      hasSecret: !!process.env.CRYPTO_WEBHOOK_SECRET && !process.env.CRYPTO_WEBHOOK_SECRET?.includes('default_'),
      status: !!process.env.CRYPTO_WEBHOOK_SECRET ? 'active' : 'inactive',
    },
  ]
}

// ============================================
// Utility Functions
// ============================================

/**
 * Mask sensitive values for display
 */
export function maskValue(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) {
    return '••••'
  }
  return `${value.substring(0, visibleChars)}${'•'.repeat(Math.min(value.length - visibleChars, 20))}`
}

/**
 * Get current environment summary
 */
export function getEnvironmentSummary(): {
  environment: string
  nodeEnv: string
  appUrl: string
  isProduction: boolean
} {
  return {
    environment: process.env.SATIM_ENVIRONMENT || process.env.NODE_ENV || 'unknown',
    nodeEnv: process.env.NODE_ENV || 'unknown',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not configured',
    isProduction: process.env.NODE_ENV === 'production',
  }
}

/**
 * Get payment method status based on feature flags
 */
export function getPaymentMethodStatuses(): {
  method: string
  enabled: boolean
  configured: boolean
}[] {
  return [
    {
      method: 'SATIM (Local Cards)',
      enabled: process.env.ENABLE_SATIM_PAYMENTS !== 'false',
      configured: validateSatimConfig().isValid,
    },
    {
      method: 'Stripe (International)',
      enabled: process.env.ENABLE_STRIPE_PAYMENTS !== 'false',
      configured: validateStripeConfig().isValid,
    },
    {
      method: 'Cryptocurrency',
      enabled: process.env.ENABLE_CRYPTO_PAYMENTS === 'true',
      configured: validateCryptoConfig().isValid,
    },
  ]
}
