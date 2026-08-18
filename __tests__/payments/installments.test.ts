// DPA (Deferred Payment Agreement) Tests
// Comprehensive test suite for installment plan functionality

import {
  dpaConfig,
  getPlanById,
  getAvailablePlans,
  getRecommendedPlan,
  estimateMonthlyPayment,
  formatDZD,
  formatPercent,
  validateOrderEligibility,
  generateAgreementNumber,
} from '@/lib/payments/installments/config'

import {
  calculateInstallmentSchedule,
  calculateTotalInterest,
  calculateMonthlyPayment,
  calculateEarlySettlementDiscount,
  calculateLateFee,
  calculateRemainingBalance,
  generateAmortizationTable,
  assessEligibility,
  getEligiblePlans,
} from '@/lib/payments/installments/calculator'

// ============================================
// Configuration Tests
// ============================================

describe('DPA Configuration', () => {
  describe('dpaConfig', () => {
    it('should have correct eligibility rules', () => {
      expect(dpaConfig.eligibility.minimumOrderAmount).toBe(500000)
      expect(dpaConfig.eligibility.maximumOrderAmount).toBe(50000000)
      expect(dpaConfig.eligibility.buyerMinimumOrders).toBe(5)
      expect(dpaConfig.eligibility.buyerMinimumRating).toBe(4.0)
    })

    it('should have at least 4 plans available', () => {
      expect(dpaConfig.plans.length).toBeGreaterThanOrEqual(4)
    })

    it('should have valid plan configurations', () => {
      for (const plan of dpaConfig.plans) {
        expect(plan.id).toBeTruthy()
        expect(plan.months).toBeGreaterThan(0)
        expect(plan.interestRate).toBeGreaterThanOrEqual(0)
        expect(plan.adminFee).toBeGreaterThanOrEqual(0)
        expect(plan.minAmount).toBeGreaterThan(0)
        expect(plan.maxAmount).toBeGreaterThan(plan.minAmount)
      }
    })

    it('should have schedule rules defined', () => {
      expect(dpaConfig.schedule.firstPaymentDueDays).toBe(30)
      expect(dpaConfig.schedule.gracePeriodDays).toBe(5)
      expect(dpaConfig.schedule.lateFeePercent).toBe(2.0)
    })

    it('should have partner banks configured', () => {
      expect(dpaConfig.partnerBanks.length).toBeGreaterThan(0)
      for (const bank of dpaConfig.partnerBanks) {
        expect(bank.id).toBeTruthy()
        expect(bank.name).toBeTruthy()
      }
    })
  })

  describe('getPlanById', () => {
    it('should return plan for valid ID', () => {
      const plan = getPlanById('dpa-3m')
      expect(plan).toBeDefined()
      expect(plan?.id).toBe('dpa-3m')
      expect(plan?.months).toBe(3)
    })

    it('should return undefined for invalid ID', () => {
      const plan = getPlanById('invalid-plan')
      expect(plan).toBeUndefined()
    })
  })

  describe('getAvailablePlans', () => {
    it('should return plans within amount range', () => {
      const plans = getAvailablePlans(1000000)
      expect(plans.length).toBeGreaterThan(0)
      
      for (const plan of plans) {
        expect(1000000).toBeGreaterThanOrEqual(plan.minAmount)
        expect(1000000).toBeLessThanOrEqual(plan.maxAmount)
      }
    })

    it('should return empty array for amount below minimum', () => {
      const plans = getAvailablePlans(100000)
      expect(plans).toHaveLength(0)
    })

    it('should return empty array for amount above maximum', () => {
      const plans = getAvailablePlans(100000000)
      expect(plans).toHaveLength(0)
    })

    it('should include 6-month plan for 5,000,000 DZD order', () => {
      const plans = getAvailablePlans(5000000)
      const has6MonthPlan = plans.some(p => p.id === 'dpa-6m')
      expect(has6MonthPlan).toBe(true)
    })
  })

  describe('validateOrderEligibility', () => {
    it('should approve eligible amount', () => {
      const result = validateOrderEligibility(1000000)
      expect(result.eligible).toBe(true)
    })

    it('should reject below minimum', () => {
      const result = validateOrderEligibility(100000)
      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('500,000')
    })

    it('should reject above maximum', () => {
      const result = validateOrderEligibility(100000000)
      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('50,000,000')
    })
  })

  describe('formatDZD', () => {
    it('should format amounts correctly', () => {
      expect(formatDZD(1000000)).toContain('1,000,000')
      expect(formatDZD(1234.56)).toContain('1,234.56')
    })

    it('should include DZD symbol', () => {
      expect(formatDZD(1000)).toContain('د.ج')
    })
  })

  describe('generateAgreementNumber', () => {
    it('should generate valid agreement number format', () => {
      const number = generateAgreementNumber()
      expect(number).toMatch(/^DPA-\d{8}-\d{5}$/)
    })

    it('should generate unique numbers', () => {
      const number1 = generateAgreementNumber()
      const number2 = generateAgreementNumber()
      expect(number1).not.toBe(number2)
    })
  })
})

// ============================================
// Calculator Tests
// ============================================

describe('DPA Calculator', () => {
  describe('calculateInstallmentSchedule', () => {
    it('should generate correct number of installments for 3-month plan', () => {
      const plan = getPlanById('dpa-3m')!
      const result = calculateInstallmentSchedule(1000000, plan)
      
      expect(result.schedule.length).toBe(3)
      expect(result.plan.months).toBe(3)
    })

    it('should generate correct number of installments for 12-month plan', () => {
      const plan = getPlanById('dpa-12m')!
      const result = calculateInstallmentSchedule(5000000, plan)
      
      expect(result.schedule.length).toBe(12)
    })

    it('should calculate total amount correctly', () => {
      const plan = getPlanById('dpa-6m')!
      const principal = 2000000
      const result = calculateInstallmentSchedule(principal, plan)
      
      // Total should be >= principal + interest + admin fee
      expect(result.totalAmount).toBeGreaterThanOrEqual(principal)
      expect(result.totalInterest).toBeGreaterThan(0)
      expect(result.adminFee).toBe(plan.adminFee)
    })

    it('should have first due date 30 days from start', () => {
      const plan = getPlanById('dpa-3m')!
      const startDate = new Date('2024-01-15')
      const result = calculateInstallmentSchedule(1000000, plan, { startDate })
      
      const expectedFirstDue = new Date(startDate)
      expectedFirstDue.setDate(expectedFirstDue.getDate() + 30)
      
      expect(result.firstDueDate.toDateString()).toBe(expectedFirstDue.toDateString())
    })

    it('should handle zero interest correctly', () => {
      // Create a custom calculation with 0% interest
      const plan = { ...getPlanById('dpa-3m')!, interestRate: 0 }
      const result = calculateInstallmentSchedule(1000000, plan)
      
      expect(result.totalInterest).toBe(0)
    })
  })

  describe('calculateTotalInterest', () => {
    it('should calculate flat interest correctly', () => {
      const interest = calculateTotalInterest(1000000, 5)
      expect(interest).toBe(50000) // 5% of 1M
    })

    it('should return 0 for 0% interest', () => {
      const interest = calculateTotalInterest(1000000, 0)
      expect(interest).toBe(0)
    })

    it('should handle large amounts precisely', () => {
      const interest = calculateTotalInterest(50000000, 16)
      expect(interest).toBe(8000000) // 16% of 50M
    })
  })

  describe('calculateMonthlyPayment', () => {
    it('should divide evenly with no interest', () => {
      const monthly = calculateMonthlyPayment(120000, 12, 0)
      expect(monthly).toBe(10000)
    })

    it('should include interest in payment', () => {
      const monthly = calculateMonthlyPayment(100000, 6, 10)
      // With 10% flat rate: (100000 + 10000) / 6 = 18333.33
      expect(monthly).toBeGreaterThan(16667) // Base without interest
    })
  })

  describe('calculateEarlySettlementDiscount', () => {
    it('should provide discount for early settlement', () => {
      const plan = getPlanById('dpa-12m')!
      const calculation = calculateInstallmentSchedule(3000000, plan)
      
      // Simulate paying off after 6 months
      const discount = calculateEarlySettlementDiscount(calculation, 6, new Date())
      
      expect(discount.discountAmount).toBeGreaterThan(0)
      expect(discount.settlementAmount).toBeLessThan(discount.originalTotalRemaining)
    })

    it('should have no discount when all payments made', () => {
      const plan = getPlanById('dpa-3m')!
      const calculation = calculateInstallmentSchedule(1000000, plan)
      
      const discount = calculateEarlySettlementDiscount(calculation, 3, new Date())
      
      expect(discount.discountAmount).toBe(0)
      expect(discount.settlementAmount).toBe(0)
    })

    it('should break down savings correctly', () => {
      const plan = getPlanById('dpa-6m')!
      const calculation = calculateInstallmentSchedule(2000000, plan)
      
      const discount = calculateEarlySettlementDiscount(calculation, 2, new Date())
      
      expect(discount.savingsBreakdown.interestSaved).toBeGreaterThanOrEqual(0)
      expect(discount.savingsBreakdown.adminFeeRefund).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculateLateFee', () => {
    it('should be 0 within grace period', () => {
      const fee = calculateLateFee(100000, 3) // 3 days overdue
      expect(fee.finalFee).toBe(0)
    })

    it('should apply minimum fee after grace period', () => {
      const fee = calculateLateFee(100000, 10) // 10 days overdue
      expect(fee.finalFee).toBeGreaterThanOrEqual(5000) // Minimum fee
    })

    it('should cap late fee at maximum percentage', () => {
      const fee = calculateLateFee(100000, 365) // Very overdue
      expect(fee.capped).toBe(true)
      expect(fee.finalFee).toBeLessThanOrEqual(10000) // Max 10% of 100K
    })

    it('should use custom rate if provided', () => {
      const defaultFee = calculateLateFee(100000, 30)
      const customFee = calculateLateFee(100000, 30, { customRate: 5 })
      
      expect(customFee.calculatedFee).not.toBe(defaultFee.calculatedFee)
    })
  })

  describe('assessEligibility', () => {
    const eligibleBuyerProfile = {
      registrationDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
      completedOrders: 10,
      averageOrderValue: 500000,
      rating: 4.8,
      hasBankGuarantee: true,
    }

    it('should approve eligible buyer', () => {
      const result = assessEligibility(2000000, eligibleBuyerProfile)
      expect(result.eligible).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(70)
    })

    it('should reject buyer with low rating', () => {
      const ineligibleProfile = {
        ...eligibleBuyerProfile,
        rating: 3.0,
      }
      
      const result = assessEligibility(2000000, ineligibleProfile)
      expect(result.disqualifications).toContain(
        expect.stringContaining('4.0')
      )
    })

    it('should reject new buyer', () => {
      const newBuyerProfile = {
        ...eligibleBuyerProfile,
        registrationDate: new Date(), // Just registered
      }
      
      const result = assessEligibility(2000000, newBuyerProfile)
      expect(result.score).toBeLessThan(80)
    })

    it('should recommend appropriate plan', () => {
      const result = assessEligibility(2000000, eligibleBuyerProfile)
      expect(result.recommendedPlan).toBeDefined()
      expect(result.availablePlans.length).toBeGreaterThan(0)
    })

    it('should penalize previous defaults', () => {
      const profileWithDefaults = {
        ...eligibleBuyerProfile,
        previousDPAHistory: {
          totalAgreements: 3,
          completedOnTime: 1,
          defaulted: 2,
        },
      }
      
      const result = assessEligibility(2000000, profileWithDefaults)
      expect(result.disqualifications).toContain(
        expect.stringContaining('défaut de paiement')
      )
    })
  })

  describe('generateAmortizationTable', () => {
    it('should generate correct number of rows', () => {
      const table = generateAmortizationTable(100000, 10, 12)
      expect(table.length).toBe(12)
    })

    it('should have ending balance reach 0', () => {
      const table = generateAmortizationTable(100000, 0, 6) // 0% interest
      const lastRow = table[table.length - 1]
      expect(lastRow.endingBalance).toBeCloseTo(0, 2)
    })

    it('should have cumulative principal equal to original balance', () => {
      const principal = 100000
      const table = generateAmortizationTable(principal, 0, 6)
      const lastRow = table[table.length - 1]
      expect(lastRow.cumulativePrincipal).toBeCloseTo(principal, 2)
    })
  })
})

// ============================================
// Edge Case Tests
// ============================================

describe('Edge Cases', () => {
  it('should handle minimum eligible amount exactly', () => {
    const plans = getAvailablePlans(500000)
    expect(plans.length).toBeGreaterThan(0)
    
    const plan = plans[0]
    expect(500000).toBeGreaterThanOrEqual(plan.minAmount)
  })

  it('should handle maximum eligible amount exactly', () => {
    const plans = getAvailablePlans(50000000)
    expect(plans.length).toBeGreaterThan(0)
  })

  it('should handle boundary between plan tiers', () => {
    // At 2M DZD, 3-month plan should not be available (max is 2M)
    const plansAtBoundary = getAvailablePlans(2000000)
    const has3MonthPlan = plansAtBoundary.some(p => p.id === 'dpa-3m')
    
    // The 3-month plan max is 2M, so it should still be available
    expect(has3MonthPlan).toBe(true)
  })

  it('should handle very large orders', () => {
    const plans = getAvailablePlans(40000000)
    expect(plans.length).toBeGreaterThan(0)
    
    // Should only have 24-month plan available
    expect(plans.every(p => p.id === 'dpa-24m')).toBe(true)
  })

  it('should calculate correctly for 24-month plan', () => {
    const plan = getPlanById('dpa-24m')!
    const result = calculateInstallmentSchedule(15000000, plan)
    
    expect(result.schedule.length).toBe(24)
    expect(result.monthlyPayment).toBeGreaterThan(0)
    expect(result.totalAmount).toBeGreaterThan(result.principalAmount)
  })

  it('should handle insurance premium in calculations', () => {
    const plan = getPlanById('dpa-12m')!
    const withInsurance = calculateInstallmentSchedule(3000000, plan, { includeInsurance: true })
    const withoutInsurance = calculateInstallmentSchedule(3000000, plan, { includeInsurance: false })
    
    expect(withInsurance.insurancePremium).toBeGreaterThan(0)
    expect(withInsurance.totalAmount).toBeGreaterThan(withoutInsurance.totalAmount)
  })

  it('should handle leap year dates correctly', () => {
    const plan = getPlanById('dpa-3m')!
    const startDate = new Date('2024-02-28') // Leap year
    const result = calculateInstallmentSchedule(1000000, plan, { startDate })
    
    // All due dates should be valid
    for (const installment of result.schedule) {
      expect(installment.dueDate.getTime()).not.toBeNaN()
    }
  })
})

// ============================================
// Integration-style Tests
// ============================================

describe('DPA Flow Integration', () => {
  it('should support complete flow from eligibility to schedule', () => {
    // Step 1: Check eligibility
    const buyerProfile = {
      registrationDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
      completedOrders: 15,
      averageOrderValue: 800000,
      rating: 4.9,
      hasBankGuarantee: true,
    }

    const eligibilityResult = assessEligibility(5000000, buyerProfile)
    expect(eligibilityResult.eligible).toBe(true)

    // Step 2: Get recommended plan
    const recommendedPlan = eligibilityResult.recommendedPlan!
    expect(recommendedPlan).toBeDefined()

    // Step 3: Calculate schedule
    const calculation = calculateInstallmentSchedule(5000000, recommendedPlan)
    expect(calculation.schedule.length).toBe(recommendedPlan.months)

    // Step 4: Verify totals make sense
    expect(calculation.totalAmount).toBeGreaterThan(5000000)
    expect(calculation.monthlyPayment).toBe(
      Math.ceil(calculation.totalAmount / recommendedPlan.months)
    )

    // Step 5: Calculate early settlement scenario
    const earlySettlement = calculateEarlySettlementDiscount(calculation, 6, new Date())
    expect(earlySettlement.discountAmount).toBeGreaterThan(0)
  })

  it('should demonstrate cost comparison across all plans', () => {
    const orderAmount = 5000000
    const allPlans = getAvailablePlans(orderAmount)

    const results = allPlans.map(plan => ({
      planId: plan.id,
      months: plan.months,
      monthlyPayment: estimateMonthlyPayment(orderAmount, plan),
      totalInterest: (orderAmount * plan.interestRate) / 100,
      adminFee: plan.adminFee,
    }))

    // Longer plans should have higher total interest but lower monthly payments
    for (let i = 1; i < results.length; i++) {
      const shorter = results[i - 1]
      const longer = results[i]
      
      if (shorter.months < longer.months) {
        expect(longer.monthlyPayment).toBeLessThan(shorter.monthlyPayment)
      }
    }
  })

  it('should handle late fee accumulation scenario', () => {
    const plan = getPlanById('dpa-6m')!
    const calculation = calculateInstallmentSchedule(2000000, plan)
    const firstInstallment = calculation.schedule[0]

    // Simulate being 30 days late
    const lateFee30Days = calculateLateFee(firstInstallment.amount, 30 + 5) // + grace period
    
    // Simulate being 60 days late
    const lateFee60Days = calculateLateFee(firstInstallment.amount, 60 + 5)
    
    expect(lateFee60Days.finalFee).toBeGreaterThan(lateFee30Days.finalFee)
    expect(lateFee60Days.finalFee).toBeLessThanOrEqual(firstInstallment.amount * 0.1) // Cap check
  })
})
