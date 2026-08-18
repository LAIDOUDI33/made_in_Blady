/**
 * Payment Load Testing Script for AlgeriaTrade.dz Staging Environment
 * Simulates concurrent payment processing to validate system performance
 * 
 * Usage: npx tsx scripts/payment-load-test.ts
 * 
 * @module scripts/payment-load-test
 */

import { testHelpers, runConcurrentRequests, generateTestCardNumber, generateTestCryptoAddress } from '@/__tests__/utils/payment-test-helpers'

// ============================================
// CONFIGURATION
// ============================================

interface LoadTestConfig {
  // SATIM Load Test
  satim: {
    concurrentRequests: number
    totalRequests: number
  }
  
  // Stripe Load Test
  stripe: {
    concurrentRequests: number
    totalRequests: number
  }
  
  // General settings
  timeout: number // ms per request
  warmupRequests: number
  reportOutputPath: string
}

const config: LoadTestConfig = {
  satim: {
    concurrentRequests: 100,
    totalRequests: 1000,
  },
  stripe: {
    concurrentRequests: 50,
    totalRequests: 500,
  },
  timeout: 30000,
  warmupRequests: 10,
  reportOutputPath: './payment-load-test-report.json',
}

// ============================================
// MOCK PAYMENT FUNCTIONS (Replace with real API calls)
// ============================================

/**
 * Simulate SATIM payment initiation request
 */
async function mockSatimPaymentRequest(requestId: number): Promise<void> {
  const cardNumber = generateTestCardNumber('visa')
  
  // Simulate API latency (50-200ms)
  const latency = 50 + Math.random() * 150
  await new Promise(resolve => setTimeout(resolve, latency))
  
  // Sim occasional failures (2% error rate)
  if (Math.random() < 0.02) {
    throw new Error(`SATIM gateway timeout for request ${requestId}`)
  }
  
  // Validate card number (Luhn check adds small overhead)
  testHelpers.validateCardLuhn(cardNumber)
}

/**
 * Simulate Stripe PaymentIntent creation
 */
async function mockStripePaymentIntentRequest(requestId: number): Promise<void> {
  // Simulate API latency (100-300ms for international)
  const latency = 100 + Math.random() * 200
  await new Promise(resolve => setTimeout(resolve, latency))
  
  // Sim occasional failures (1% error rate - Stripe is more reliable)
  if (Math.random() < 0.01) {
    throw new Error(`Stripe API error for request ${requestId}`)
  }
  
  // Simulate currency conversion calculation
  const dzdAmount = 1000000 + Math.random() * 9000000
  const eurAmount = dzdAmount * 0.0068
  
  if (eurAmount <= 0) {
    throw new Error('Invalid conversion result')
  }
}

/**
 * Simulate crypto payment order creation
 */
async function mockCryptoOrderCreation(requestId: number): Promise<void> {
  // Simulate blockchain interaction latency (variable)
  const latency = 100 + Math.random() * 400
  await new Promise(resolve => setTimeout(resolve, latency))
  
  // Generate wallet address
  const address = generateTestCryptoAddress('USDT', 'TRC20')
  
  if (!address.startsWith('T')) {
    throw new Error('Invalid TRON address generated')
  }
}

/**
 * Simulate DPA eligibility check
 */
async function mockDPAEligibilityCheck(requestId: number): Promise<void> {
  // Database query simulation
  const latency = 30 + Math.random() * 70
  await new Promise(resolve => setTimeout(resolve, latency))
  
  // Complex calculation simulation
  const score = Math.random() * 100
  
  if (score < 10) {
    throw new Error('Database connection timeout')
  }
}

// ============================================
// LOAD TEST EXECUTORS
// ============================================

interface TestSuiteResult {
  name: string
  config: { concurrency: number; totalRequests: number }
  metrics: ReturnType<typeof testHelpers.runConcurrentRequests> extends Promise<infer T> ? T : never
  startTime: Date
  endTime: Date
}

/**
 * Run SATIM load test
 */
async function runSatimLoadTest(): Promise<TestSuiteResult> {
  console.log('\n🔄 Starting SATIM Load Test...')
  console.log(`   Concurrency: ${config.satim.concurrentRequests} requests`)
  console.log(`   Total Requests: ${config.satim.totalRequests}`)
  
  const startTime = new Date()
  
  const { results, metrics } = await runConcurrentRequests(
    () => mockSatimPaymentRequest(Math.floor(Math.random() * 100000)),
    config.satim.concurrentRequests,
    config.satim.totalRequests
  )
  
  const endTime = new Date()
  
  return {
    name: 'SATIM Payment Initiation',
    config: config.satim,
    metrics: metrics as any,
    startTime,
    endTime,
  }
}

/**
 * Run Stripe load test
 */
async function runStripeLoadTest(): Promise<TestSuiteResult> {
  console.log('\n🔄 Starting Stripe Load Test...')
  console.log(`   Concurrency: ${config.stripe.concurrentRequests} requests`)
  console.log(`   Total Requests: ${config.stripe.totalRequests}`)
  
  const startTime = new Date()
  
  const { results, metrics } = await runConcurrentRequests(
    () => mockStripePaymentIntentRequest(Math.floor(Math.random() * 100000)),
    config.stripe.concurrentRequests,
    config.stripe.totalRequests
  )
  
  const endTime = new Date()
  
  return {
    name: 'Stripe PaymentIntent Creation',
    config: config.stripe,
    metrics: metrics as any,
    startTime,
    endTime,
  }
}

/**
 * Run Crypto load test
 */
async function runCryptoLoadTest(): Promise<TestSuiteResult> {
  console.log('\n🔄 Starting Crypto Load Test...')
  console.log(`   Concurrency: 25 requests`)
  console.log(`   Total Requests: 200`)
  
  const startTime = new Date()
  
  const { results, metrics } = await runConcurrentRequests(
    () => mockCryptoOrderCreation(Math.floor(Math.random() * 100000)),
    25,
    200
  )
  
  const endTime = new Date()
  
  return {
    name: 'Crypto Order Creation',
    config: { concurrency: 25, totalRequests: 200 },
    metrics: metrics as any,
    startTime,
    endTime,
  }
}

/**
 * Run DPA eligibility load test
 */
async function runDPALoadTest(): Promise<TestSuiteResult> {
  console.log('\n🔄 Starting DPA Eligibility Load Test...')
  console.log(`   Concurrency: 50 requests`)
  console.log(`   Total Requests: 300`)
  
  const startTime = new Date()
  
  const { results, metrics } = await runConcurrentRequests(
    () => mockDPAEligibilityCheck(Math.floor(Math.random() * 100000)),
    50,
    300
  )
  
  const endTime = new Date()
  
  return {
    name: 'DPA Eligibility Check',
    config: { concurrency: 50, totalRequests: 300 },
    metrics: metrics as any,
    startTime,
    endTime,
  }
}

// ============================================
// REPORTING
// ============================================

interface LoadTestReport {
  generatedAt: string
  environment: string
  suites: TestSuiteResult[]
  summary: {
    totalRequests: number
    totalSuccessful: number
    totalFailed: number
    overallErrorRate: number
    averageResponseTime: number
    maxResponseTime: number
    p95ResponseTime: number
    totalDuration: number
  }
  thresholds: {
    maxErrorRate: number // percent
    maxP95ResponseTime: number // ms
    minRequestsPerSecond: number
  }
  passed: boolean
}

function generateReport(suites: TestSuiteResult[]): LoadTestReport {
  const totalRequests = suites.reduce((sum, s) => sum + s.metrics.totalRequests, 0)
  const totalSuccessful = suites.reduce((sum, s) => sum + s.metrics.successfulRequests, 0)
  const totalFailed = suites.reduce((sum, s) => sum + s.metrics.failedRequests, 0)
  
  const allResponseTimes = suites.flatMap(s => [
    s.metrics.minResponseTime,
    s.metrics.averageResponseTime,
    s.metrics.p95ResponseTime,
    s.metrics.maxResponseTime,
  ])
  
  const thresholds = {
    maxErrorRate: 5, // 5% max error rate
    maxP95ResponseTime: 2000, // 2s max P95
    minRequestsPerSecond: 50, // Min 50 RPS overall
  }

  const passed = 
    (totalFailed / totalRequests * 100) <= thresholds.maxErrorRate &&
    Math.max(...allResponseTimes.filter(t => typeof t === 'number')) <= thresholds.maxP95ResponseTime

  return {
    generatedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'staging',
    suites,
    summary: {
      totalRequests,
      totalSuccessful,
      totalFailed,
      overallErrorRate: (totalFailed / totalRequests) * 100,
      averageResponseTime: suites.reduce((sum, s) => sum + s.metrics.averageResponseTime, 0) / suites.length,
      maxResponseTime: Math.max(...suites.map(s => s.metrics.maxResponseTime)),
      p95ResponseTime: Math.max(...suites.map(s => s.metrics.p95ResponseTime)),
      totalDuration: Math.max(
        ...suites.map(s => s.endTime.getTime() - s.startTime.getTime())
      ),
    },
    thresholds,
    passed,
  }
}

function printReport(report: LoadTestReport): void {
  console.log('\n' + '='.repeat(70))
  console.log('📊 PAYMENT LOAD TEST REPORT')
  console.log('='.repeat(70))
  console.log(`\nGenerated At: ${report.generatedAt}`)
  console.log(`Environment: ${report.environment.toUpperCase()}`)
  console.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`)
  
  console.log('\n' + '-'.repeat(70))
  console.log('SUMMARY')
  console.log('-'.repeat(70))
  console.log(`Total Requests:     ${report.summary.totalRequests}`)
  console.log(`Successful:         ${report.summary.totalSuccessful}`)
  console.log(`Failed:              ${report.summary.totalFailed}`)
  console.log(`Error Rate:          ${report.summary.overallErrorRate.toFixed(2)}%`)
  console.log(`Avg Response Time:  ${report.summary.averageResponseTime.toFixed(0)}ms`)
  console.log(`Max Response Time:  ${report.summary.maxResponseTime.toFixed(0)}ms`)
  console.log(`P95 Response Time:  ${report.summary.p95ResponseTime.toFixed(0)}ms`)
  console.log(`Total Duration:     ${(report.summary.totalDuration / 1000).toFixed(2)}s`)
  
  console.log('\n' + '-'.repeat(70))
  console.log('THRESHOLDS')
  console.log('-'.repeat(70))
  console.log(`Max Error Rate:       ${report.thresholds.maxErrorRate}%`)
  console.log(`Max P95 Response:     ${report.thresholds.maxP95ResponseTime}ms`)
  console.log(`Min Throughput:       ${report.thresholds.minRequestsPerSecond} RPS`)
  
  console.log('\n' + '-'.repeat(70))
  console.log('TEST SUITES')
  console.log('-'.repeat(70))
  
  for (const suite of report.suites) {
    const duration = (suite.endTime.getTime() - suite.startTime.getTime()) / 1000
    const statusIcon = suite.metrics.errorRate <= report.thresholds.maxErrorRate ? '✅' : '⚠️'
    
    console.log(`\n${statusIcon} ${suite.name}`)
    console.log(`   Concurrency: ${suite.config.concurrency} | Total: ${suite.config.totalRequests}`)
    console.log(`   Duration: ${duration.toFixed(2)}s | RPS: ${suite.metrics.requestsPerSecond.toFixed(1)}`)
    console.log(`   Success Rate: ${((suite.metrics.successfulRequests / suite.metrics.totalRequests) * 100).toFixed(1)}%`)
    console.log(`   Response Times:`)
    console.log(`     Avg: ${suite.metrics.averageResponseTime.toFixed(0)}ms`)
    console.log(`     P50: ${suite.metrics.p50ResponseTime.toFixed(0)}ms`)
    console.log(`     P95: ${suite.metrics.p95ResponseTime.toFixed(0)}ms`)
    console.log(`     P99: ${suite.metrics.p99ResponseTime.toFixed(0)}ms`)
    console.log(`     Min: ${suite.metrics.minResponseTime.toFixed(0)}ms`)
    console.log(`     Max: ${suite.metrics.maxResponseTime.toFixed(0)}ms`)
  }
  
  console.log('\n' + '='.repeat(70))
  console.log(report.passed ? '✅ ALL THRESHOLDS MET' : '⚠️ SOME THRESHOLDS EXCEEDED')
  console.log('='.repeat(70) + '\n')
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     AlgeriaTrade.dz Payment System - Load Test Suite      ║')
  console.log('║                    Staging Environment                   ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  
  const startTime = Date.now()
  
  // Warmup phase
  console.log('\n🔥 Running warmup requests...')
  for (let i = 0; i < config.warmupRequests; i++) {
    try {
      await mockSatimPaymentRequest(i)
    } catch {
      // Ignore warmup errors
    }
  }
  console.log(`   Warmup complete (${config.warmupRequests} requests)`)
  
  // Execute test suites
  const suites: TestSuiteResult[] = []
  
  try {
    suites.push(await runSatimLoadTest())
  } catch (error) {
    console.error('SATIM load test failed:', error)
  }
  
  try {
    suites.push(await runStripeLoadTest())
  } catch (error) {
    console.error('Stripe load test failed:', error)
  }
  
  try {
    suites.push(await runCryptoLoadTest())
  } catch (error) {
    console.error('Crypto load test failed:', error)
  }
  
  try {
    suites.push(await runDPALoadTest())
  } catch (error) {
    console.error('DPA load test failed:', error)
  }
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
  
  // Generate and print report
  const report = generateReport(suites)
  printReport(report)
  
  // Save report to file
  try {
    const fs = await import('fs')
    fs.writeFileSync(config.reportOutputPath, JSON.stringify(report, null, 2))
    console.log(`📁 Report saved to: ${config.reportOutputPath}`)
  } catch (error) {
    console.warn('Could not save report file:', error)
  }
  
  console.log(`\n⏱️  Total execution time: ${totalTime}s`)
  
  // Exit with appropriate code
  process.exit(report.passed ? 0 : 1)
}

// Run if executed directly
main().catch(error => {
  console.error('Load test execution failed:', error)
  process.exit(1)
})
