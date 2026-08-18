// DPA Financial Calculator
// Precise decimal arithmetic for installment calculations
// Compliant with Algerian financial regulations

import { 
  dpaConfig, 
  DPAPlan, 
  formatDZD,
  getAvailablePlans 
} from './config'

// ============================================
// Types
// ============================================

export interface InstallmentScheduleItem {
  installmentNumber: number
  dueDate: Date
  amount: number
  principalPortion: number
  interestPortion: number
  remainingBalance: number
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'FUTURE'
}

export interface AmortizationRow {
  installmentNumber: number
  paymentDate: Date
  beginningBalance: number
  paymentAmount: number
  principalPayment: number
  interestPayment: number
  endingBalance: number
  cumulativeInterest: number
  cumulativePrincipal: number
}

export interface CalculationResult {
  plan: DPAPlan
  principalAmount: number
  totalInterest: number
  adminFee: number
  insurancePremium: number
  totalAmount: number // Total to be paid (principal + interest + fees)
  monthlyPayment: number
  effectiveAPR: number // Annual percentage rate
  schedule: InstallmentScheduleItem[]
  amortizationTable: AmortizationRow[]
  firstDueDate: Date
  lastDueDate: Date
}

export interface EarlySettlementResult {
  originalTotalRemaining: number
  settlementAmount: number
  discountAmount: number
  discountPercent: number
  savingsBreakdown: {
    interestSaved: number
    adminFeeRefund: number
    insuranceRefund: number
  }
  effectiveDate: Date
}

export interface LateFeeResult {
  baseAmount: number
  daysOverdue: number
  calculatedFee: number
  minimumFeeApplied: boolean
  capped: boolean
  finalFee: number
}

export interface EligibilityResult {
  eligible: boolean
  score: number // 0-100
  disqualifications: string[]
  warnings: string[]
  availablePlans: DPAPlan[]
  recommendedPlan?: DPAPlan
}

export interface BuyerProfile {
  registrationDate: Date
  completedOrders: number
  averageOrderValue: number
  rating: number
  monthlyRevenue?: number
  hasBankGuarantee: boolean
  previousDPAHistory?: {
    totalAgreements: number
    completedOnTime: number
    defaulted: number
  }
}

// ============================================
// Core Calculation Functions
// ============================================

/**
 * Calculate full installment schedule for a DPA agreement
 * Uses precise decimal-like arithmetic with rounding at each step
 */
export function calculateInstallmentSchedule(
  principalAmount: number,
  plan: DPAPlan,
  options?: {
    startDate?: Date
    includeInsurance?: boolean
  }
): CalculationResult {
  const startDate = options?.startDate ?? new Date()
  const includeInsurance = options?.includeInsurance ?? false
  
  // Calculate fees
  const totalInterest = calculateTotalInterest(principalAmount, plan.interestRate)
  const adminFee = plan.adminFee
  const insurancePremium = includeInsurance 
    ? (principalAmount * dpaConfig.insurance.premiumPercent) / 100 
    : 0
  
  // Total amount to finance
  const financeAmount = principalAmount + totalInterest
  
  // Calculate monthly payment using amortization formula
  const monthlyRate = plan.interestRate / 100 / plan.months // Simplified for flat rate
  let monthlyPayment: number
  
  if (plan.interestRate === 0) {
    // No interest - equal division
    monthlyPayment = Math.ceil(financeAmount / plan.months)
  } else {
    // Flat rate calculation (common in Algeria)
    monthlyPayment = Math.ceil((financeAmount) / plan.months)
  }
  
  // Adjust last payment to handle rounding differences
  const totalFromMonthly = monthlyPayment * (plan.months - 1)
  const lastPayment = financeAmount - totalFromMonthly
  
  // Generate payment schedule
  const schedule: InstallmentScheduleItem[] = []
  const amortizationTable: AmortizationRow[] = []
  
  let balance = principalAmount
  let cumulativeInterest = 0
  let cumulativePrincipal = 0
  
  const firstDueDate = new Date(startDate)
  firstDueDate.setDate(firstDueDate.getDate() + dpaConfig.schedule.firstPaymentDueDays)
  
  for (let i = 1; i <= plan.months; i++) {
    const dueDate = new Date(firstDueDate)
    dueDate.setMonth(dueDate.getMonth() + (i - 1))
    
    const isLastInstallment = i === plan.months
    const paymentAmount = isLastInstallment ? Math.max(lastPayment, 0) : monthlyPayment
    
    // Calculate interest and principal portions (straight-line for simplicity)
    const interestPortion = isLastInstallment 
      ? totalInterest - cumulativeInterest 
      : Math.round((totalInterest / plan.months) * 100) / 100
    
    const principalPortion = paymentAmount - interestPortion
    
    // Update running totals
    cumulativeInterest += interestPortion
    cumulativePrincipal += principalPortion
    balance = Math.max(0, principalAmount - cumulativePrincipal)
    
    // Determine status based on date
    const now = new Date()
    const status: InstallmentScheduleItem['status'] = 
      dueDate < now ? 'PENDING' : 'FUTURE'
    
    schedule.push({
      installmentNumber: i,
      dueDate,
      amount: paymentAmount,
      principalPortion,
      interestPortion,
      remainingBalance: balance,
      status,
    })
    
    amortizationTable.push({
      installmentNumber: i,
      paymentDate: dueDate,
      beginningBalance: balance + principalPortion,
      paymentAmount,
      principalPayment: principalPortion,
      interestPayment: interestPortion,
      endingBalance: balance,
      cumulativeInterest,
      cumulativePrincipal,
    })
  }
  
  // Calculate total amount including all fees
  const totalAmount = principalAmount + totalInterest + adminFee + insurancePremium
  
  // Calculate effective APR
  const effectiveAPR = calculateEffectiveAPR(
    principalAmount, 
    totalAmount - principalAmount - adminFee - insurancePremium, 
    plan.months
  )
  
  return {
    plan,
    principalAmount,
    totalInterest,
    adminFee,
    insurancePremium,
    totalAmount,
    monthlyPayment,
    effectiveAPR,
    schedule,
    amortizationTable,
    firstDueDate,
    lastDueDate: schedule[schedule.length - 1]?.dueDate ?? firstDueDate,
  }
}

/**
 * Calculate total interest for the term
 */
export function calculateTotalInterest(
  principal: number,
  interestRatePercent: number
): number {
  // Flat interest calculation (common in Algerian banking)
  return Math.round((principal * interestRatePercent) / 100 * 100) / 100
}

/**
 * Calculate fixed monthly payment amount
 */
export function calculateMonthlyPayment(
  principal: number,
  totalMonths: number,
  interestRatePercent: number
): number {
  if (interestRatePercent === 0) {
    return Math.ceil(principal / totalMonths)
  }
  
  const totalInterest = calculateTotalInterest(principal, interestRatePercent)
  const totalWithInterest = principal + totalInterest
  return Math.ceil(totalWithInterest / totalMonths)
}

/**
 * Calculate early settlement discount
 * Buyers get discount for paying off early
 */
export function calculateEarlySettlementDiscount(
  calculationResult: CalculationResult,
  installmentsPaid: number,
  settlementDate: Date
): EarlySettlementResult {
  const { 
    principalAmount, 
    totalInterest, 
    adminFee, 
    insurancePremium,
    schedule,
    plan 
  } = calculationResult
  
  const remainingInstallments = plan.months - installmentsPaid
  
  if (remainingInstallments <= 0) {
    return {
      originalTotalRemaining: 0,
      settlementAmount: 0,
      discountAmount: 0,
      discountPercent: 0,
      savingsBreakdown: {
        interestSaved: 0,
        adminFeeRefund: 0,
        insuranceRefund: 0,
      },
      effectiveDate: settlementDate,
    }
  }
  
  // Calculate remaining principal from schedule
  const currentInstallment = schedule[installmentsPaid]
  const remainingBalance = currentInstallment?.remainingBalance ?? 0
  
  // Original amount that would have been paid
  let originalTotalRemaining = 0
  for (let i = installmentsPaid; i < schedule.length; i++) {
    originalTotalRemaining += schedule[i].amount
  }
  
  // Add pro-rated admin fee portion
  const adminFeeProRated = (adminFee * remainingInstallments) / plan.months
  
  // Interest saved (discount)
  let interestSaved = 0
  for (let i = installmentsPaid; i < schedule.length; i++) {
    interestSaved += schedule[i].interestPortion
  }
  
  // Insurance refund (pro-rated)
  const insuranceRefund = (insurancePremium * remainingInstallments) / plan.months
  
  // Admin fee refund (partial - 50% of remaining)
  const adminFeeRefund = adminFeeProRated * 0.5
  
  // Total discount
  const discountAmount = interestSaved + adminFeeRefund + insuranceRefund
  
  // Settlement amount
  const settlementAmount = remainingBalance + adminFeeProRated * 0.5
  
  // Discount percentage
  const discountPercent = originalTotalRemaining > 0 
    ? (discountAmount / originalTotalRemaining) * 100 
    : 0
  
  return {
    originalTotalRemaining,
    settlementAmount: Math.round(settlementAmount),
    discountAmount: Math.round(discountAmount),
    discountPercent: Math.round(discountPercent * 10) / 10,
    savingsBreakdown: {
      interestSaved: Math.round(interestSaved),
      adminFeeRefund: Math.round(adminFeeRefund),
      insuranceRefund: Math.round(insuranceRefund),
    },
    effectiveDate: settlementDate,
  }
}

/**
 * Calculate late fee for overdue installment
 * Per Bank of Algeria regulations
 */
export function calculateLateFee(
  installmentAmount: number,
  daysOverdue: number,
  options?: {
    gracePeriodDays?: number
    customRate?: number
  }
): LateFeeResult {
  const gracePeriod = options?.gracePeriodDays ?? dpaConfig.schedule.gracePeriodDays
  const customRate = options?.customRate
  
  // Apply grace period
  const chargeableDays = Math.max(0, daysOverdue - gracePeriod)
  
  if (chargeableDays <= 0) {
    return {
      baseAmount: installmentAmount,
      daysOverdue,
      calculatedFee: 0,
      minimumFeeApplied: false,
      capped: false,
      finalFee: 0,
    }
  }
  
  // Calculate late fee (monthly rate converted to daily)
  const monthlyRate = (customRate ?? dpaConfig.schedule.lateFeePercent) / 100
  const dailyRate = monthlyRate / 30 // Approximate days in month
  
  // Base calculation
  let calculatedFee = installmentAmount * dailyRate * chargeableDays
  
  // Check minimum fee
  const minimumFee = dpaConfig.schedule.lateFeeFixedMin
  const minimumFeeApplied = calculatedFee < minimumFee
  
  if (minimumFeeApplied) {
    calculatedFee = minimumFee
  }
  
  // Check maximum cap (percentage of installment)
  const maxFee = installmentAmount * (dpaConfig.schedule.maxLateFeePercent / 100)
  const capped = calculatedFee > maxFee
  
  if (capped) {
    calculatedFee = maxFee
  }
  
  // Round to nearest dinar
  const finalFee = Math.round(calculatedFee)
  
  return {
    baseAmount: installmentAmount,
    daysOverdue,
    calculatedFee: Math.round(calculatedFee * 100) / 100,
    minimumFeeApplied,
    capped,
    finalFee,
  }
}

/**
 * Calculate remaining balance on an agreement
 */
export function calculateRemainingBalance(
  schedule: InstallmentScheduleItem[],
  currentInstallmentIndex: number
): number {
  if (currentInstallmentIndex >= schedule.length) {
    return 0
  }
  
  return schedule[currentInstallmentIndex].remainingBalance
}

/**
 * Generate complete amortization table
 */
export function generateAmortizationTable(
  principal: number,
  annualRate: number,
  months: number,
  startDate?: Date
): AmortizationRow[] {
  const start = startDate ?? new Date()
  const monthlyRate = annualRate / 100 / 12
  
  // Calculate monthly payment using standard amortization formula
  let monthlyPayment: number
  
  if (monthlyRate === 0) {
    monthlyPayment = principal / months
  } else {
    monthlyPayment = (
      principal * 
      monthlyRate * 
      Math.pow(1 + monthlyRate, months)
    ) / (
      Math.pow(1 + monthlyRate, months) - 1
    )
  }
  
  const table: AmortizationRow[] = []
  let balance = principal
  let cumulativeInterest = 0
  let cumulativePrincipal = 0
  
  for (let i = 1; i <= months; i++) {
    const paymentDate = new Date(start)
    paymentDate.setMonth(paymentDate.getMonth() + i)
    
    const interestPayment = balance * monthlyRate
    const principalPayment = monthlyPayment - interestPayment
    
    cumulativeInterest += interestPayment
    cumulativePrincipal += principalPayment
    balance -= principalPayment
    
    // Adjust last payment
    const isLast = i === months
    const adjustedPrincipal = isLast ? principalPayment + balance : principalPayment
    const adjustedPayment = isLast ? monthlyPayment + balance : monthlyPayment
    
    table.push({
      installmentNumber: i,
      paymentDate,
      beginningBalance: balance + adjustedPrincipal,
      paymentAmount: Math.round(adjustedPayment * 100) / 100,
      principalPayment: Math.round(adjustedPrincipal * 100) / 100,
      interestPayment: Math.round(interestPayment * 100) / 100,
      endingBalance: Math.max(0, Math.round(balance * 100) / 100),
      cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
      cumulativePrincipal: Math.round(cumulativePrincipal * 100) / 100,
    })
  }
  
  return table
}

/**
 * Assess buyer eligibility for DPA
 */
export function assessEligibility(
  orderAmount: number,
  buyerProfile: BuyerProfile
): EligibilityResult {
  const disqualifications: string[] = []
  const warnings: string[] = []
  let score = 100
  
  // Check order amount eligibility
  const { eligible: amountEligible, reason: amountReason } = validateOrderEligibility(orderAmount)
  if (!amountEligible && amountReason) {
    disqualifications.push(amountReason)
    score = 0
  }
  
  // Check buyer age (registration duration)
  const now = new Date()
  const registrationAgeDays = Math.floor(
    (now.getTime() - buyerProfile.registrationDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  if (registrationAgeDays < dpaConfig.eligibility.buyerMinimumAge) {
    disqualifications.push(
      `L'inscription doit avoir au moins ${dpaConfig.eligibility.buyerMinimumAge} jours (${registrationAgeDays} jours)`
    )
    score -= 30
  } else if (registrationAgeDays < dpaConfig.eligibility.buyerMinimumAge * 2) {
    warnings.push('Compte récent - limites de crédit réduites')
    score -= 10
  }
  
  // Check completed orders
  if (buyerProfile.completedOrders < dpaConfig.eligibility.buyerMinimumOrders) {
    disqualifications.push(
      `Minimum ${dpaConfig.eligibility.buyerMinimumOrders} commandes complétées requises (${buyerProfile.completedOrders})`
    )
    score -= 25
  }
  
  // Check rating
  if (buyerProfile.rating < dpaConfig.eligibility.buyerMinimumRating) {
    disqualifications.push(
      `Note minimale de ${dpaConfig.eligibility.buyerMinimumRating}/5 requise (${buyerProfile.rating}/5)`
    )
    score -= 20
  } else if (buyerProfile.rating < 4.5) {
    warnings.push('Note moyenne - conditions standards appliquées')
    score -= 10
  }
  
  // Bonus points for good history
  if (buyerProfile.previousDPAHistory) {
    const { totalAgreements, completedOnTime, defaulted } = buyerProfile.previousDPAHistory
    
    if (totalAgreements > 0) {
      const onTimeRate = completedOnTime / totalAgreements
      
      if (onTimeRate === 1 && totalAgreements >= 3) {
        score = Math.min(100, score + 15) // Excellent history bonus
        warnings.push('Excellent historique de paiement - Conditions préférentielles possibles')
      } else if (defaulted > 0) {
        disqualifications.push('Historique de défaut de paiement détecté')
        score -= 50
      }
    }
  }
  
  // Bonus for bank guarantee
  if (buyerProfile.hasBankGuarantee) {
    score = Math.min(100, score + 10)
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score))
  
  // Get available plans
  const availablePlans = getAvailablePlans(orderAmount)
  
  // Get recommended plan
  let recommendedPlan: DPAPlan | undefined
  if (score >= 70 && availablePlans.length > 0) {
    recommendedPlan = availablePlans[Math.floor(availablePlans.length / 2)]
  } else if (score >= 50 && availablePlans.length > 0) {
    // Lower credit score = shorter plans only
    recommendedPlan = availablePlans.find(p => p.months <= 6) ?? availablePlans[0]
  }
  
  return {
    eligible: score >= 60 && disqualifications.length === 0,
    score,
    disqualifications,
    warnings,
    availablePlans,
    recommendedPlan,
  }
}

/**
 * Get available plans for order amount
 */
export function getEligiblePlans(orderAmount: number): {
  plans: DPAPlan[]
  hasPlans: boolean
  message?: string
} {
  const plans = getAvailablePlans(orderAmount)
  
  if (plans.length === 0) {
    return {
      plans: [],
      hasPlans: false,
      message: `Aucun plan disponible pour ce montant. Minimum: ${formatDZD(dpaConfig.eligibility.minimumOrderAmount)}`
    }
  }
  
  return { plans, hasPlans: true }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate Effective APR from total interest
 */
function calculateEffectiveAPR(
  principal: number,
  totalInterest: number,
  months: number
): number {
  if (principal === 0 || months === 0) return 0
  
  // Simple approximation of APR
  const totalRate = (totalInterest / principal) * 100
  return (totalRate / months) * 12 // Annualize
}

/**
 * Validate order amount eligibility (re-exported from config)
 */
function validateOrderEligibility(amount: number): {
  eligible: boolean
  reason?: string
} {
  if (amount < dpaConfig.eligibility.minimumOrderAmount) {
    return {
      eligible: false,
      reason: `Le montant minimum pour un paiement différé est de ${formatDZD(dpaConfig.eligibility.minimumOrderAmount)}`
    }
  }
  
  if (amount > dpaConfig.eligibility.maximumOrderAmount) {
    return {
      eligible: false,
      reason: `Le montant maximum pour un paiement différé est de ${formatDZD(dpaConfig.eligibility.maximumOrderAmount)}`
    }
  }
  
  return { eligible: true }
}

// Export types
export type {
  InstallmentScheduleItem,
  AmortizationRow,
  CalculationResult,
  EarlySettlementResult,
  LateFeeResult,
  EligibilityResult,
  BuyerProfile,
}
