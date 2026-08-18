// DPA (Deferred Payment Agreement) Configuration
// AlgeriaTrade.dz - B2B Marketplace Installment Plans
// Compliant with Bank of Algeria regulations

// ============================================
// Types
// ============================================

export interface DPAPlan {
  id: string
  name: string
  nameAr: string
  nameEn: string
  months: number
  interestRate: number // Total interest percentage for the term
  adminFee: number // Fixed administrative fee in DZD
  minAmount: number // Minimum order amount in DZD
  maxAmount: number // Maximum order amount in DZD
  description: string
  descriptionAr: string
}

export interface DPAEligibilityRules {
  minimumOrderAmount: number
  maximumOrderAmount: number
  buyerMinimumAge: number // Years registered on platform
  buyerMinimumOrders: number // Previous completed orders
  buyerMinimumRating: number // Star rating (0-5)
  sellerApprovalRequired: boolean
}

export interface DPAScheduleRules {
  firstPaymentDueDays: number
  gracePeriodDays: number
  lateFeePercent: number // Monthly late fee percentage
  lateFeeFixedMin: number // Minimum late fee in DZD
  maxLateFeePercent: number // Cap at X% of installment
}

export interface DPAInsuranceConfig {
  enabled: boolean
  provider: string
  premiumPercent: number // % of total order value
  coveragePercent: number // % covered if buyer defaults
}

export interface PartnerBank {
  id: string
  name: string
  nameAr: string
  logo: string
}

export interface DPAConfig {
  eligibility: DPAEligibilityRules
  plans: DPAPlan[]
  schedule: DPAScheduleRules
  insurance: DPAInsuranceConfig
  partnerBanks: PartnerBank[]
}

// ============================================
// Main Configuration
// ============================================

export const dpaConfig: DPAConfig = {
  // Eligibility rules for DPA qualification
  eligibility: {
    minimumOrderAmount: 500000, // 500,000 DZD minimum (~$3,700 USD)
    maximumOrderAmount: 50000000, // 50M DZD maximum
    buyerMinimumAge: 21, // Days since registration (in days, ~3 years)
    buyerMinimumOrders: 5, // Previous completed orders
    buyerMinimumRating: 4.0, // Star rating
    sellerApprovalRequired: true,
  },

  // Available installment plans
  plans: [
    {
      id: 'dpa-3m',
      name: '3 Mois',
      nameAr: '3 أشهر',
      nameEn: '3 Months',
      months: 3,
      interestRate: 2.5, // 2.5% total interest
      adminFee: 5000, // 5,000 DZD admin fee
      minAmount: 500000,
      maxAmount: 2000000,
      description: 'Paiement en 3 mensualités - Idéal pour les petites commandes',
      descriptionAr: 'الدفع على 3 أقساط - مثالي للطلبات الصغيرة',
    },
    {
      id: 'dpa-6m',
      name: '6 Mois',
      nameAr: '6 أشهر',
      nameEn: '6 Months',
      months: 6,
      interestRate: 5.0,
      adminFee: 8000,
      minAmount: 1000000,
      maxAmount: 10000000,
      description: 'Paiement en 6 mensualités - Plan le plus populaire',
      descriptionAr: 'الدفع على 6 أقسط - الخطة الأكثر شعبية',
    },
    {
      id: 'dpa-12m',
      name: '12 Mois',
      nameAr: '12 شهر',
      nameEn: '12 Months',
      months: 12,
      interestRate: 9.0,
      adminFee: 15000,
      minAmount: 3000000,
      maxAmount: 30000000,
      description: 'Paiement en 12 mensualités - Pour les commandes importantes',
      descriptionAr: 'الدفع على 12 قسط - للطلبات الكبيرة',
    },
    {
      id: 'dpa-24m',
      name: '24 Mois',
      nameAr: '24 شهر',
      nameEn: '24 Months',
      months: 24,
      interestRate: 16.0,
      adminFee: 25000,
      minAmount: 10000000,
      maxAmount: 50000000,
      description: 'Paiement en 24 mensualités - Pour les très grandes commandes',
      descriptionAr: 'الدفع على 24 قسط - للطلبات الكبيرة جداً',
    },
  ],

  // Payment schedule rules
  schedule: {
    firstPaymentDueDays: 30, // First payment due 30 days after order
    gracePeriodDays: 5, // Grace period before late fee
    lateFeePercent: 2.0, // Monthly late fee percentage
    lateFeeFixedMin: 5000, // Minimum late fee in DZD
    maxLateFeePercent: 10, // Cap at 10% of installment
  },

  // Insurance/Guarantee options
  insurance: {
    enabled: true,
    provider: 'sgs-algerie', // SGS Algeria, or CGR/SNR
    premiumPercent: 1.5, // % of total order value
    coveragePercent: 80, // % covered if buyer defaults
  },

  // Bank partnerships for official DPA
  partnerBanks: [
    { 
      id: 'bna', 
      name: "Banque Nationale d'Algérie", 
      nameAr: 'البنك الوطني الجزائري',
      logo: '/banks/bna.png' 
    },
    { 
      id: 'bea', 
      name: "Banque Extérieure d'Algérie", 
      nameAr: 'البنك الخارجي الجزائري',
      logo: '/banks/bea.png' 
    },
    { 
      id: 'bdl', 
      name: 'Banque de Développement Local', 
      nameAr: 'بنك التنمية المحلية',
      logo: '/banks/bdl.png' 
    },
    { 
      id: 'cpa', 
      name: "Crédit Populaire d'Algérie", 
      nameAr: 'الائتمان الشعبي الجزائري',
      logo: '/banks/cpa.png' 
    },
  ],
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): DPAPlan | undefined {
  return dpaConfig.plans.find(plan => plan.id === planId)
}

/**
 * Get available plans for a given order amount
 */
export function getAvailablePlans(orderAmount: number): DPAPlan[] {
  return dpaConfig.plans.filter(
    plan => orderAmount >= plan.minAmount && orderAmount <= plan.maxAmount
  )
}

/**
 * Get recommended plan based on order amount and buyer profile
 */
export function getRecommendedPlan(
  orderAmount: number, 
  buyerProfile?: {
    monthlyRevenue?: number
    creditScore?: number
  }
): DPAPlan | null {
  const availablePlans = getAvailablePlans(orderAmount)
  
  if (availablePlans.length === 0) return null
  
  // If no buyer profile, return shortest available plan
  if (!buyerProfile) {
    return availablePlans.reduce((prev, current) => 
      prev.months < current.months ? prev : current
    )
  }
  
  // Simple recommendation logic
  const { monthlyRevenue } = buyerProfile
  
  if (monthlyRevenue) {
    // Find plan where monthly payment is <= 30% of revenue
    for (const plan of availablePlans) {
      const estimatedMonthly = estimateMonthlyPayment(orderAmount, plan)
      if (estimatedMonthly <= monthlyRevenue * 0.3) {
        return plan
      }
    }
  }
  
  // Default to middle option
  return availablePlans[Math.floor(availablePlans.length / 2)]
}

/**
 * Estimate monthly payment for a plan (rough calculation)
 */
export function estimateMonthlyPayment(orderAmount: number, plan: DPAPlan): number {
  const totalInterest = (orderAmount * plan.interestRate) / 100
  const totalWithInterest = orderAmount + totalInterest + plan.adminFee
  return Math.ceil(totalWithInterest / plan.months)
}

/**
 * Format currency in DZD
 */
export function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' د.ج'
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Validate order amount eligibility
 */
export function validateOrderEligibility(amount: number): {
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

/**
 * Generate agreement number
 */
export function generateAgreementNumber(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `DPA-${dateStr}-${random}`
}

// Export types for use in other modules
export type {
  DPAPlan,
  DPAEligibilityRules,
  DPAScheduleRules,
  DPAInsuranceConfig,
  PartnerBank,
  DPAConfig,
}
