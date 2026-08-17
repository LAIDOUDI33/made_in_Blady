// Deferred Payment Agreement (DPA) / Installment Plans
// For large B2B orders allowing payment over time
// Compliant with Algerian business practices

import { db } from '@/lib/db'
import { formatDZD } from './utils'

// ============================================
// Types
// ============================================

export type InstallmentPlanType = 
  | 'DPA_30_DAYS'   // 30-day deferred (common in Algeria)
  | 'DPA_60_DAYS'   // 60-day deferred
  | 'DPA_90_DAYS'   // 90-day deferred (with bank guarantee)
  | 'INSTALLMENT_3X' // 3 equal monthly installments
  | 'INSTALLMENT_6X' // 6 equal monthly installments
  | 'INSTALLMENT_12X' // 12 monthly installments (large orders)
  | 'CUSTOM'        // Custom plan negotiated

export type InstallmentStatus = 
  | 'PENDING_APPROVAL' // Awaiting seller/bank approval
  | 'APPROVED'         // Plan approved, payments scheduled
  | 'ACTIVE'           // Payments in progress
  | 'DELINQUENT'       // Payment overdue
  | 'DEFAULTED'        // Failed to pay
  | 'COMPLETED'        // All installments paid
  | 'CANCELLED'        // Plan cancelled

export type InstallmentFrequency = 'MONTHLY' | 'BI_MONTHLY' | 'QUARTERLY'

export type InstallmentPaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'WAIVED'

export interface InstallmentPlanInput {
  orderId: string
  buyerId: string
  sellerId: string
  type: InstallmentPlanType
  totalAmount: number
  downPaymentPercent?: number // Default 30%
  interestRate?: number // APR, default 0%
  firstPaymentDate: Date
  frequency?: InstallmentFrequency
  bankGuaranteeRequired?: boolean
  bankGuaranteeDocument?: string
  notes?: string
}

export interface InstallmentPlan {
  id: string
  orderId: string
  buyerId: string
  sellerId: string
  type: InstallmentPlanType
  totalAmount: number
  downPayment: number
  remainingBalance: number
  installmentCount: number
  installmentAmount: number
  interestRate: number // Annual percentage rate (APR)
  totalInterest: number
  firstPaymentDate: Date
  frequency: InstallmentFrequency
  status: InstallmentStatus
  bankGuaranteeRequired: boolean
  bankGuaranteeDocument?: string
  approvedAt?: Date
  approvedBy?: string
  nextInstallmentDue?: Date
  installmentsPaid: number
  notes?: string
  createdAt: Date
  updatedAt: Date
  installments: Installment[]
}

export interface Installment {
  id: string
  planId: string
  installmentNumber: number
  dueDate: Date
  amount: number
  principalPortion: number
  interestPortion: number
  paidAt?: Date
  paymentMethod?: string
  transactionId?: string
  status: InstallmentPaymentStatus
  lateFeeApplied: number
  notes?: string
}

export interface InstallmentCalculationResult {
  downPayment: number
  remainingBalance: number
  installmentCount: number
  installmentAmount: number
  totalInterest: number
  totalAmountPaid: number
  effectiveAPR: number
  schedule: InstallmentScheduleItem[]
}

export interface InstallmentScheduleItem {
  installmentNumber: number
  dueDate: Date
  amount: number
  principalPortion: number
  interestPortion: number
  remainingBalance: number
}

// ============================================
// Plan Type Configuration
// ============================================

export const PLAN_TYPE_CONFIG: Record<InstallmentPlanType, {
  label: string
  labelAr: string
  description: string
  defaultInstallments: number
  requiresBankGuarantee: boolean
  minOrderAmount: number
  maxOrderAmount?: number
  defaultDownPayment: number
  typicalInterestRate: number
}> = {
  DPA_30_DAYS: {
    label: 'Différé 30 jours',
    labelAr: 'أجل 30 يوم',
    description: 'Paiement différé de 30 jours - le plus courant en Algérie',
    defaultInstallments: 1,
    requiresBankGuarantee: false,
    minOrderAmount: 50000,
    defaultDownPayment: 0,
    typicalInterestRate: 0,
  },
  DPA_60_DAYS: {
    label: 'Différé 60 jours',
    labelAr: 'أجل 60 يوم',
    description: 'Paiement différé de 60 jours pour les commandes moyennes',
    defaultInstallments: 1,
    requiresBankGuarantee: false,
    minOrderAmount: 100000,
    defaultDownPayment: 0,
    typicalInterestRate: 1.5,
  },
  DPA_90_DAYS: {
    label: 'Différé 90 jours',
    labelAr: 'أجل 90 يوم',
    description: 'Paiement différé de 90 jours avec garantie bancaire',
    defaultInstallments: 1,
    requiresBankGuarantee: true,
    minOrderAmount: 200000,
    defaultDownPayment: 20,
    typicalInterestRate: 2.5,
  },
  INSTALLMENT_3X: {
    label: '3 Mensualités',
    labelAr: '3 أقساط شهرية',
    description: 'Paiement en 3 mensualités égales',
    defaultInstallments: 3,
    requiresBankGuarantee: false,
    minOrderAmount: 100000,
    defaultDownPayment: 30,
    typicalInterestRate: 3,
  },
  INSTALLMENT_6X: {
    label: '6 Mensualités',
    labelAr: '6 أقساط شهرية',
    description: 'Paiement en 6 mensualités égales',
    defaultInstallments: 6,
    requiresBankGuarantee: false,
    minOrderAmount: 250000,
    defaultDownPayment: 30,
    typicalInterestRate: 5,
  },
  INSTALLMENT_12X: {
    label: '12 Mensualités',
    labelAr: '12 قسط شهري',
    description: 'Paiement en 12 mensualités pour les grandes commandes',
    defaultInstallments: 12,
    requiresBankGuarantee: true,
    minOrderAmount: 500000,
    defaultDownPayment: 30,
    typicalInterestRate: 8,
  },
  CUSTOM: {
    label: 'Plan Personnalisé',
    labelAr: 'خطة مخصصة',
    description: 'Plan négocié selon vos besoins',
    defaultInstallments: 0,
    requiresBankGuarantee: true,
    minOrderAmount: 300000,
    defaultDownPayment: 30,
    typicalInterestRate: 0,
  },
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculate installment plan details based on order amount and plan type
 */
export function calculateInstallmentPlan(
  totalAmount: number,
  type: InstallmentPlanType,
  apr: number = 0,
  customOptions?: {
    downPaymentPercent?: number
    installmentCount?: number
  }
): InstallmentCalculationResult {
  const config = PLAN_TYPE_CONFIG[type]
  
  // Determine values
  const downPaymentPercent = customOptions?.downPaymentPercent ?? config.defaultDownPayment
  const installmentCount = customOptions?.installmentCount ?? config.defaultInstallments
  const interestRate = apr > 0 ? apr : config.typicalInterestRate
  
  // Calculate down payment
  const downPayment = Math.round((totalAmount * downPaymentPercent) / 100)
  const remainingBalance = totalAmount - downPayment
  
  // For DPA plans (single payment after deferral period)
  if (type.startsWith('DPA_')) {
    // Simple interest for deferred period
    const daysDeferred = type === 'DPA_30_DAYS' ? 30 : type === 'DPA_60_DAYS' ? 60 : 90
    const interest = Math.round((remainingBalance * interestRate * daysDeferred) / (365 * 100))
    
    return {
      downPayment,
      remainingBalance,
      installmentCount: 1,
      installmentAmount: remainingBalance + interest,
      totalInterest: interest,
      totalAmountPaid: downPayment + remainingBalance + interest,
      effectiveAPR: interestRate,
      schedule: [
        {
          installmentNumber: 1,
          dueDate: new Date(Date.now() + daysDeferred * 24 * 60 * 60 * 1000),
          amount: remainingBalance + interest,
          principalPortion: remainingBalance,
          interestPortion: interest,
          remainingBalance: 0,
        },
      ],
    }
  }
  
  // For installment plans (multiple equal payments)
  if (installmentCount <= 0) {
    throw new Error('Invalid installment count for non-DPA plan')
  }
  
  // Calculate monthly interest rate from APR
  const monthlyRate = interestRate / 100 / 12
  
  // Calculate installment using amortization formula
  let installmentAmount: number
  let totalInterest: number
  
  if (monthlyRate === 0) {
    // No interest - simple division
    installmentAmount = Math.ceil(remainingBalance / installmentCount)
    totalInterest = 0
  } else {
    // Standard amortization formula
    installmentAmount = Math.round(
      (remainingBalance * monthlyRate * Math.pow(1 + monthlyRate, installmentCount)) /
      (Math.pow(1 + monthlyRate, installmentCount) - 1)
    )
    totalInterest = (installmentAmount * installmentCount) - remainingBalance
  }
  
  // Generate schedule
  const schedule: InstallmentScheduleItem[] = []
  let balance = remainingBalance
  
  for (let i = 1; i <= installmentCount; i++) {
    const dueDate = new Date()
    dueDate.setMonth(dueDate.getMonth() + i)
    
    let interestPortion: number
    let principalPortion: number
    
    if (monthlyRate === 0) {
      interestPortion = 0
      principalPortion = i === installmentCount ? balance : installmentAmount
    } else {
      interestPortion = Math.round(balance * monthlyRate)
      principalPortion = installmentAmount - interestPortion
    }
    
    balance -= principalPortion
    if (balance < 0) balance = 0
    
    schedule.push({
      installmentNumber: i,
      dueDate,
      amount: installmentAmount,
      principalPortion,
      interestPortion,
      remainingBalance: Math.max(0, balance),
    })
  }
  
  return {
    downPayment,
    remainingBalance,
    installmentCount,
    installmentAmount,
    totalInterest,
    totalAmountPaid: downPayment + (installmentAmount * installmentCount),
    effectiveAPR: interestRate,
    schedule,
  }
}

/**
 * Calculate late fee for overdue installment
 */
export function calculateLateFee(
  installmentAmount: number,
  daysOverdue: number,
  baseRate: number = 0.1 // 0.1% per day default
): number {
  // Algerian commercial law typically allows up to 1% per month late fees
  // We use daily calculation capped at 10% of installment amount
  const dailyRate = baseRate / 100
  const rawFee = installmentAmount * dailyRate * daysOverdue
  const maxFee = installmentAmount * 0.10 // Cap at 10%
  
  return Math.min(Math.round(rawFee), Math.round(maxFee))
}

/**
 * Check if a plan type is eligible for given order amount
 */
export function isPlanTypeEligible(
  type: InstallmentPlanType,
  orderAmount: number
): { eligible: boolean; reason?: string } {
  const config = PLAN_TYPE_CONFIG[type]
  
  if (orderAmount < config.minOrderAmount) {
    return {
      eligible: false,
      reason: `Montant minimum: ${formatDZD(config.minOrderAmount)}`,
    }
  }
  
  if (config.maxOrderAmount && orderAmount > config.maxOrderAmount) {
    return {
      eligible: false,
      reason: `Montant maximum: ${formatDZD(config.maxOrderAmount)}`,
    }
  }
  
  return { eligible: true }
}

// ============================================
// Database Operations
// ============================================

/**
 * Create a new installment plan request
 */
export async function createInstallmentPlan(
  input: InstallmentPlanInput
): Promise<InstallmentPlan> {
  const config = PLAN_TYPE_CONFIG[input.type]
  const downPaymentPercent = input.downPaymentPercent ?? config.defaultDownPayment
  const interestRate = input.interestRate ?? config.typicalInterestRate
  const frequency = input.frequency ?? 'MONTHLY'
  
  // Calculate plan details
  const calculation = calculateInstallmentPlan(
    input.totalAmount,
    input.type,
    interestRate,
    {
      downPaymentPercent: downPaymentPercent,
      installmentCount: config.defaultInstallments,
    }
  )
  
  // Create the plan in database
  const plan = await db.installmentPlan.create({
    data: {
      orderId: input.orderId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      type: input.type as any,
      status: 'PENDING_APPROVAL',
      totalAmount: input.totalAmount,
      downPayment: calculation.downPayment,
      remainingBalance: calculation.remainingBalance,
      installmentCount: calculation.installmentCount,
      installmentAmount: calculation.installmentAmount,
      interestRate,
      totalInterest: calculation.totalInterest,
      firstPaymentDate: input.firstPaymentDate,
      frequency,
      bankGuaranteeRequired: input.bankGuaranteeRequired ?? config.requiresBankGuarantee,
      bankGuarrantyDocument: input.bankGuaranteeDocument,
      notes: input.notes,
    },
  })
  
  // Generate and create installment schedule
  await generateInstallmentSchedule(plan.id, calculation.schedule)
  
  return mapDbPlanToInterface(plan)
}

/**
 * Generate installment schedule for a plan
 */
async function generateInstallmentSchedule(
  planId: string,
  schedule: InstallmentScheduleItem[]
): Promise<void> {
  const installments = schedule.map((item) => ({
    planId,
    installmentNumber: item.installmentNumber,
    dueDate: item.dueDate,
    amount: item.amount,
    principalPortion: item.principalPortion,
    interestPortion: item.interestPortion,
    status: 'PENDING',
    lateFeeApplied: 0,
  }))
  
  await db.installment.createMany({
    data: installments as any[],
  })
}

/**
 * Approve an installment plan
 */
export async function approveInstallmentPlan(
  planId: string,
  approverId: string
): Promise<InstallmentPlan> {
  const plan = await db.installmentPlan.update({
    where: { id: planId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: approverId,
    },
    include: { installments: { orderBy: { installmentNumber: 'asc' } } },
  })
  
  return mapDbPlanToInterface(plan)
}

/**
 * Activate an approved plan (after down payment received)
 */
export async function activateInstallmentPlan(
  planId: string
): Promise<InstallmentPlan> {
  const plan = await db.installmentPlan.findUnique({
    where: { id: planId },
    include: { installments: true },
  })
  
  if (!plan) {
    throw new Error('Plan not found')
  }
  
  // Find next pending installment
  const nextPending = plan.installments
    .filter((i) => i.status === 'PENDING')
    .sort((a, b) => a.installmentNumber - b.installmentNumber)[0]
  
  await db.installmentPlan.update({
    where: { id: planId },
    data: {
      status: 'ACTIVE',
      nextInstallmentDue: nextPending?.dueDate,
    },
  })
  
  return getInstallmentPlanById(planId)
}

/**
 * Process an installment payment
 */
export async function processInstallmentPayment(
  planId: string,
  installmentNumber: number,
  paymentMethod: string,
  transactionId?: string
): Promise<{ installment: Installment; plan: InstallmentPlan }> {
  const plan = await db.installmentPlan.findUnique({
    where: { id: planId },
    include: { installments: true },
  })
  
  if (!plan) {
    throw new Error('Plan not found')
  }
  
  const installment = plan.installments.find(
    (i) => i.installmentNumber === installmentNumber
  )
  
  if (!installment) {
    throw new Error('Installment not found')
  }
  
  if (installment.status === 'PAID') {
    throw new Error('Installment already paid')
  }
  
  // Update installment status
  const updatedInstallment = await db.installment.update({
    where: { id: installment.id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      paymentMethod,
      transactionId,
    },
  })
  
  // Update plan status
  const paidCount = plan.installments.filter((i) => i.status === 'PAID').length + 1
  const totalCount = plan.installments.length
  
  let newPlanStatus = plan.status
  let nextDue: Date | undefined
  
  if (paidCount >= totalCount) {
    newPlanStatus = 'COMPLETED'
  } else {
    // Find next pending installment
    const nextPending = plan.installments
      .filter((i) => i.status === 'PENDING' && i.installmentNumber > installmentNumber)
      .sort((a, b) => a.installmentNumber - b.installmentNumber)[0]
    nextDue = nextPending?.dueDate
  }
  
  await db.installmentPlan.update({
    where: { id: planId },
    data: {
      status: newPlanStatus as any,
      installmentsPaid: paidCount,
      nextInstallmentDue: nextDue,
    },
  })
  
  const updatedPlan = await getInstallmentPlanById(planId)
  
  return {
    installment: mapDbInstallmentToInterface(updatedInstallment),
    plan: updatedPlan,
  }
}

/**
 * Get installment plan by ID
 */
export async function getInstallmentPlanById(
  planId: string
): Promise<InstallmentPlan> {
  const plan = await db.installmentPlan.findUnique({
    where: { id: planId },
    include: { installments: { orderBy: { installmentNumber: 'asc' } } },
  })
  
  if (!plan) {
    throw new Error('Plan not found')
  }
  
  return mapDbPlanToInterface(plan)
}

/**
 * Get installment plans for a user (as buyer or seller)
 */
export async function getUserInstallmentPlans(
  userId: string,
  role: 'buyer' | 'seller' = 'buyer',
  filters?: {
    status?: InstallmentStatus
    limit?: number
    offset?: number
  }
): Promise<InstallmentPlan[]> {
  const whereClause: any = {}
  
  if (role === 'buyer') {
    whereClause.buyerId = userId
  } else {
    whereClause.sellerId = userId
  }
  
  if (filters?.status) {
    whereClause.status = filters.status
  }
  
  const plans = await db.installmentPlan.findMany({
    where: whereClause,
    include: { installments: { orderBy: { installmentNumber: 'asc' } } },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit ?? 20,
    skip: filters?.offset ?? 0,
  })
  
  return plans.map(mapDbPlanToInterface)
}

/**
 * Check for overdue installments (for cron job)
 */
export async function checkOverdueInstallments(): Promise<Installment[]> {
  const now = new Date()
  
  const overdueInstallments = await db.installment.findMany({
    where: {
      status: 'PENDING',
      dueDate: { lt: now },
    },
    include: {
      plan: true,
    },
  })
  
  const results: Installment[] = []
  
  for (const installment of overdueInstallments) {
    const daysOverdue = Math.floor(
      (now.getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    const lateFee = calculateLateFee(
      Number(installment.amount),
      daysOverdue
    )
    
    // Update installment with late fee and overdue status
    const updated = await db.installment.update({
      where: { id: installment.id },
      data: {
        status: 'OVERDUE',
        lateFeeApplied: lateFee,
      },
    })
    
    results.push(mapDbInstallmentToInterface(updated))
    
    // Update plan status to DELINQUENT if any installment is overdue
    await db.installmentPlan.update({
      where: { id: installment.planId },
      data: { status: 'DELINQUENT' },
    })
  }
  
  return results
}

/**
 * Handle defaulted plan (escalation procedures)
 */
export async function handleDefaultedPlan(
  planId: string,
  reason: string
): Promise<InstallmentPlan> {
  const plan = await db.installmentPlan.update({
    where: { id: planId },
    data: {
      status: 'DEFAULTED',
      notes: `DEFAULTED: ${reason} - ${new Date().toISOString()}`,
    },
    include: { installments: true },
  })
  
  // In production, this would trigger:
  // 1. Notification to seller
  // 2. Bank guarantee invocation if applicable
  // 3. Legal department notification
  // 4. Credit bureau reporting
  
  return mapDbPlanToInterface(plan)
}

/**
 * Cancel an installment plan
 */
export async function cancelInstallmentPlan(
  planId: string,
  reason: string,
  cancelledBy: string
): Promise<InstallmentPlan> {
  const plan = await db.installmentPlan.update({
    where: { id: planId },
    data: {
      status: 'CANCELLED',
      notes: `${plan.notes ?? ''}\nCancelled by ${cancelledBy}: ${reason} - ${new Date().toISOString()}`,
    },
    include: { installments: true },
  })
  
  // Cancel all pending installments
  await db.installment.updateMany({
    where: {
      planId,
      status: 'PENDING',
    },
    data: { status: 'WAIVED' },
  })
  
  return mapDbPlanToInterface(plan)
}

/**
 * Get installment schedule for a plan
 */
export async function getInstallmentSchedule(
  planId: string
): Promise<Installment[]> {
  const installments = await db.installment.findMany({
    where: { planId },
    orderBy: { installmentNumber: 'asc' },
  })
  
  return installments.map(mapDbInstallmentToInterface)
}

// ============================================
// Mapping Functions
// ============================================

function mapDbPlanToInterface(dbPlan: any): InstallmentPlan {
  return {
    id: dbPlan.id,
    orderId: dbPlan.orderId,
    buyerId: dbPlan.buyerId,
    sellerId: dbPlan.sellerId,
    type: dbPlan.type as InstallmentPlanType,
    totalAmount: Number(dbPlan.totalAmount),
    downPayment: Number(dbPlan.downPayment),
    remainingBalance: Number(dbPlan.remainingBalance),
    installmentCount: dbPlan.installmentCount,
    installmentAmount: Number(dbPlan.installmentAmount),
    interestRate: Number(dbPlan.interestRate),
    totalInterest: Number(dbPlan.totalInterest),
    firstPaymentDate: new Date(dbPlan.firstPaymentDate),
    frequency: dbPlan.frequency as InstallmentFrequency,
    status: dbPlan.status as InstallmentStatus,
    bankGuaranteeRequired: dbPlan.bankGuaranteeRequired,
    bankGuaranteeDocument: dbPlan.bankGuarrantyDocument ?? undefined,
    approvedAt: dbPlan.approvedAt ? new Date(dbPlan.approvedAt) : undefined,
    approvedBy: dbPlan.approvedBy ?? undefined,
    nextInstallmentDue: dbPlan.nextInstallmentDue ? new Date(dbPlan.nextInstallmentDue) : undefined,
    installmentsPaid: dbPlan.installmentsPaid,
    notes: dbPlan.notes ?? undefined,
    createdAt: new Date(dbPlan.createdAt),
    updatedAt: new Date(dbPlan.updatedAt),
    installments: (dbPlan.installments ?? []).map(mapDbInstallmentToInterface),
  }
}

function mapDbInstallmentToInterface(dbInstallment: any): Installment {
  return {
    id: dbInstallment.id,
    planId: dbInstallment.planId,
    installmentNumber: dbInstallment.installmentNumber,
    dueDate: new Date(dbInstallment.dueDate),
    amount: Number(dbInstallment.amount),
    principalPortion: Number(dbInstallment.principalPortion),
    interestPortion: Number(dbInstallment.interestPortion),
    paidAt: dbInstallment.paidAt ? new Date(dbInstallment.paidAt) : undefined,
    paymentMethod: dbInstallment.paymentMethod ?? undefined,
    transactionId: dbInstallment.transactionId ?? undefined,
    status: dbInstallment.status as InstallmentPaymentStatus,
    lateFeeApplied: Number(dbInstallment.lateFeeApplied),
    notes: dbInstallment.notes ?? undefined,
  }
}
