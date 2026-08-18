// DPA (Deferred Payment Agreement) Manager
// Lifecycle management for installment agreements
// Handles creation, activation, payments, defaults, and closure

import { db } from '@/lib/db'
import { 
  generateAgreementNumber, 
  dpaConfig, 
  getPlanById,
  formatDZD,
  DPAPlan
} from './config'
import {
  calculateInstallmentSchedule,
  calculateLateFee,
  calculateEarlySettlementDiscount,
  CalculationResult,
  InstallmentScheduleItem,
} from './calculator'

// ============================================
// Types
// ============================================

export interface CreateDPAInput {
  orderId: string
  buyerId: string
  sellerId: string
  planId: string
  principalAmount: number
  insuranceEnabled?: boolean
  bankPartnerId?: string
  notes?: string
}

export interface DPAgreementDetails {
  id: string
  agreementNumber: string
  orderId: string
  buyerId: string
  sellerId: string
  principalAmount: number
  interestRate: number
  adminFee: number
  insurancePremium: number | null
  totalAmount: number
  planId: string
  totalInstallments: number
  installmentAmount: number
  firstDueDate: Date
  frequency: string
  status: string
  downPaymentReceived: boolean
  downPaymentAmount: number | null
  insuranceEnabled: boolean
  bankPartnerId: string | null
  guaranteeReference: string | null
  creditScore: number | null
  riskLevel: string | null
  appliedAt: Date
  approvedAt: Date | null
  activatedAt: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  installments: DPAInstallmentDetail[]
  documents: DPADocumentDetail[]
}

export interface DPAInstallmentDetail {
  id: string
  agreementId: string
  installmentNumber: number
  dueDate: Date
  amount: number
  principalPortion: number
  interestPortion: number
  status: string
  paidAmount: number
  paidAt: Date | null
  lateFeeApplied: number
  lateFeePaid: number
  notes: string | null
}

export interface DPADocumentDetail {
  id: string
  agreementId: string
  documentType: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  uploadedAt: Date
  verifiedAt: Date | null
  verifiedBy: string | null
  status: string
  rejectionReason: string | null
}

export interface DPPaymentRecord {
  id: string
  agreementId: string
  installmentId: string | null
  amount: number
  paymentMethod: string
  paymentReference: string | null
  notes: string | null
  createdAt: Date
}

export interface ProcessPaymentInput {
  agreementId: string
  installmentNumber?: number
  amount: number
  paymentMethod: string
  paymentReference?: string
  notes?: string
}

// ============================================
// Agreement Creation & Management
// ============================================

/**
 * Create a new DPA agreement
 */
export async function createDPAgreement(input: CreateDPAInput): Promise<DPAgreementDetails> {
  const plan = getPlanById(input.planId)
  
  if (!plan) {
    throw new Error(`Plan not found: ${input.planId}`)
  }
  
  // Calculate full schedule
  const calculation = calculateInstallmentSchedule(
    input.principalAmount,
    plan,
    {
      includeInsurance: input.insuranceEnabled ?? false,
    }
  )
  
  // Generate agreement number
  const agreementNumber = generateAgreementNumber()
  
  // Create the agreement
  const agreement = await db.dPAgreement.create({
    data: {
      agreementNumber,
      orderId: input.orderId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      principalAmount: calculation.principalAmount,
      interestRate: plan.interestRate,
      adminFee: calculation.adminFee,
      insurancePremium: calculation.insurancePremium || null,
      totalAmount: calculation.totalAmount,
      planId: plan.id,
      totalInstallments: plan.months,
      installmentAmount: calculation.monthlyPayment,
      firstDueDate: calculation.firstDueDate,
      frequency: 'MONTHLY',
      status: 'DRAFT',
      insuranceEnabled: input.insuranceEnabled ?? false,
      bankPartnerId: input.bankPartnerId || null,
      notes: input.notes,
    },
  })
  
  // Create installment schedule
  await createInstallmentSchedule(agreement.id, calculation.schedule)
  
  // Return full details
  return getDPAById(agreement.id)
}

/**
 * Create installment records from schedule
 */
async function createInstallmentSchedule(
  agreementId: string,
  schedule: InstallmentScheduleItem[]
): Promise<void> {
  const installments = schedule.map((item) => ({
    agreementId,
    installmentNumber: item.installmentNumber,
    dueDate: item.dueDate,
    amount: item.amount,
    principalPortion: item.principalPortion,
    interestPortion: item.interestPortion,
    status: 'PENDING',
    paidAmount: 0,
    lateFeeApplied: 0,
    lateFeePaid: 0,
  }))
  
  await db.dPAInstallment.createMany({
    data: installments,
  })
}

/**
 * Submit DPA application for approval
 */
export async function submitDPAApplication(
  agreementId: string
): Promise<DPAgreementDetails> {
  const agreement = await db.dPAgreement.findUnique({
    where: { id: agreementId },
    include: { documents: true },
  })
  
  if (!agreement) {
    throw new Error('Agreement not found')
  }
  
  if (agreement.status !== 'DRAFT') {
    throw new Error(`Cannot submit agreement in status: ${agreement.status}`)
  }
  
  // Check if required documents are present
  const requiredDocs = ['ID_CARD', 'BUSINESS_REG', 'BANK_STATEMENT']
  const uploadedDocTypes = agreement.documents.map(d => d.documentType)
  const missingDocs = requiredDocs.filter(doc => !uploadedDocTypes.includes(doc))
  
  if (missingDocs.length > 0) {
    // Update to pending documents status
    await db.dPAgreement.update({
      where: { id: agreementId },
      data: { status: 'PENDING_DOCUMENTS' },
    })
    
    throw new Error(`Documents requis manquants: ${missingDocs.join(', ')}`)
  }
  
  // Update to pending approval
  await db.dPAgreement.update({
    where: { id: agreementId },
    data: { status: 'PENDING_APPROVAL' },
  })
  
  return getDPAById(agreementId)
}

/**
 * Activate agreement after approval and first payment
 */
export async function activateAgreement(
  agreementId: string,
  downPaymentAmount?: number
): Promise<DPAgreementDetails> {
  const agreement = await db.dPAgreement.findUnique({
    where: { id: agreementId },
  })
  
  if (!agreement) {
    throw new Error('Agreement not found')
  }
  
  if (!['APPROVED', 'DRAFT'].includes(agreement.status)) {
    throw new Error(`Cannot activate agreement in status: ${agreement.status}`)
  }
  
  const updateData: any = {
    status: 'ACTIVE',
    activatedAt: new Date(),
  }
  
  if (downPaymentAmount) {
    updateData.downPaymentReceived = true
    updateData.downPaymentAmount = downPaymentAmount
  }
  
  await db.dPAgreement.update({
    where: { id: agreementId },
    data: updateData,
  })
  
  return getDPAById(agreementId)
}

/**
 * Approve DPA request (by seller or admin)
 */
export async function approveDPARequest(
  agreementId: string,
  approverId: string,
  options?: {
    creditScore?: number
    riskLevel?: string
    modifiedTerms?: {
      interestRate?: number
      adminFee?: number
    }
  }
): Promise<DPAgreementDetails> {
  const agreement = await db.dPAgreement.findUnique({
    where: { id: agreementId },
  })
  
  if (!agreement) {
    throw new Error('Agreement not found')
  }
  
  if (!['PENDING_APPROVAL', 'UNDER_REVIEW'].includes(agreement.status)) {
    throw new Error(`Cannot approve agreement in status: ${agreement.status}`)
  }
  
  const updateData: any = {
    status: 'APPROVED',
    approvedAt: new Date(),
  }
  
  if (options?.creditScore !== undefined) {
    updateData.creditScore = options.creditScore
  }
  
  if (options?.riskLevel) {
    updateData.riskLevel = options.riskLevel
  }
  
  if (options?.modifiedTerms?.interestRate !== undefined) {
    updateData.interestRate = options.modifiedTerms.interestRate
  }
  
  if (options?.modifiedTerms?.adminFee !== undefined) {
    updateData.adminFee = options.modifiedTerms.adminFee
  }
  
  await db.dPAgreement.update({
    where: { id: agreementId },
    data: updateData,
  })
  
  return getDPAById(agreementId)
}

// ============================================
// Payment Processing
// ============================================

/**
 * Process an installment payment
 */
export async function processInstallmentPayment(
  input: ProcessPaymentInput
): Promise<{
  payment: DPPaymentRecord
  installment: DPAInstallmentDetail
  agreement: DPAgreementDetails
}> {
  const { agreementId, installmentNumber, amount, paymentMethod, paymentReference, notes } = input
  
  const agreement = await db.dPAgreement.findUnique({
    where: { id: agreementId },
    include: { installments: { orderBy: { installmentNumber: 'asc' } } },
  })
  
  if (!agreement) {
    throw new Error('Agreement not found')
  }
  
  if (agreement.status !== 'ACTIVE') {
    throw new Error(`Cannot process payment for agreement in status: ${agreement.status}`)
  }
  
  // Find target installment
  let targetInstallment
  
  if (installmentNumber) {
    targetInstallment = agreement.installments.find(
      i => i.installmentNumber === installmentNumber
    )
  } else {
    // Find first pending/overdue installment
    targetInstallment = agreement.installments.find(
      i => ['PENDING', 'OVERDUE'].includes(i.status)
    )
  }
  
  if (!targetInstallment) {
    throw new Error('No eligible installment found for payment')
  }
  
  // Calculate total due (amount + late fees)
  const totalDue = Number(targetInstallment.amount) + Number(targetInstallment.lateFeeApplied) - Number(targetInstallment.paidAmount)
  
  if (amount < totalDue && amount < Number(targetInstallment.amount)) {
    // Partial payment - allow but mark as partial
    // This is a business decision - some may want to reject partial payments
  }
  
  // Determine payment status
  const isFullPayment = amount >= Number(targetInstallment.amount)
  const newStatus = isFullPayment ? 'PAID' : 'PARTIAL'
  
  // Record the payment
  const payment = await db.dPPayment.create({
    data: {
      agreementId,
      installmentId: targetInstallment.id,
      amount,
      paymentMethod,
      paymentReference,
      notes,
    },
  })
  
  // Update installment
  const updatedPaidAmount = Number(targetInstallment.paidAmount) + amount
  const updatedLateFeePaid = isFullPayment ? Number(targetInstallment.lateFeeApplied) : Number(targetInstallment.lateFeePaid)
  
  await db.dPAInstallment.update({
    where: { id: targetInstallment.id },
    data: {
      status: newStatus,
      paidAmount: updatedPaidAmount,
      paidAt: isFullPayment ? new Date() : targetInstallment.paidAt,
      lateFeePaid: updatedLateFeePaid,
    },
  })
  
  // Check if all installments are paid
  const allInstallments = await db.dPAInstallment.findMany({
    where: { agreementId },
  })
  
  const allPaid = allInstallments.every(i => i.status === 'PAID')
  
  if (allPaid) {
    await db.dPAgreement.update({
      where: { id: agreementId },
      data: {
        status: 'PAID',
        completedAt: new Date(),
      },
    })
  }
  
  // Return updated data
  const updatedAgreement = await getDPAById(agreementId)
  const updatedInstallment = updatedAgreement.installments.find(
    i => i.id === targetInstallment.id
  )!
  
  return {
    payment: mapDbPaymentToInterface(payment),
    installment: updatedInstallment,
    agreement: updatedAgreement,
  }
}

/**
 * Handle missed/overdue payment
 */
export async function handleMissedPayment(
  agreementId: string,
  installmentNumber: number
): Promise<{
  installment: DPAInstallmentDetail
  lateFeeApplied: number
}> {
  const installment = await db.dPAInstallment.findFirst({
    where: {
      agreementId,
      installmentNumber,
    },
  })
  
  if (!installment) {
    throw new Error('Installment not found')
  }
  
  if (installment.status === 'PAID') {
    throw new Error('Installment already paid')
  }
  
  const now = new Date()
  const dueDate = new Date(installment.dueDate)
  const daysOverdue = Math.floor(
    (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysOverdue <= 0) {
    throw new Error('Installment is not yet due')
  }
  
  // Calculate late fee
  const lateFeeResult = calculateLateFee(Number(installment.amount), daysOverdue)
  
  // Update installment with overdue status and late fee
  const updated = await db.dPAInstallment.update({
    where: { id: installment.id },
    data: {
      status: 'OVERDUE',
      lateFeeApplied: lateFeeResult.finalFee,
    },
  })
  
  // Update agreement to delinquent if not already
  await db.dPAgreement.update({
    where: { id: agreementId },
    data: { status: 'DELINQUENT' },
  })
  
  return {
    installment: mapDbInstallmentToInterface(updated),
    lateFeeApplied: lateFeeResult.finalFee,
  }
}

/**
 * Handle default (escalation procedures)
 */
export async function handleDefault(
  agreementId: string,
  reason: string
): Promise<DPAgreementDetails> {
  const agreement = await db.dPAgreement.findUnique({
    where: { id: agreementId },
  })
  
  if (!agreement) {
    throw new Error('Agreement not found')
  }
  
  if (agreement.status === 'DEFAULTED') {
    throw new Error('Agreement already in default status')
  }
  
  // Update to defaulted status
  await db.dPAgreement.update({
    where: { id: agreementId },
    data: {
      status: 'DEFAULTED',
      notes: `${agreement.notes ?? ''}\nDEFAULTED: ${reason} - ${new Date().toISOString()}`,
    },
  })
  
  // In production, this would trigger:
  // 1. Notification to seller
  // 2. Bank guarantee invocation if applicable
  // 3. Legal department notification
  // 4. Credit bureau reporting
  // 5. Collection agency referral
  
  return getDPAById(agreementId)
}

/**
 * Close/complete agreement successfully
 */
export async function closeAgreement(
  agreementId: string
): Promise<DPAgreementDetails> {
  const agreement = await db.dPAgreement.findUnique({
    where: { id: agreementId },
    include: { installments: true },
  })
  
  if (!agreement) {
    throw new Error('Agreement not found')
  }
  
  // Verify all installments are paid
  const unpaidInstallments = agreement.installments.filter(
    i => i.status !== 'PAID' && i.status !== 'WAIVED'
  )
  
  if (unpaidInstallments.length > 0) {
    throw new Error(`Cannot close: ${unpaidInstallments.length} installments remaining`)
  }
  
  await db.dPAgreement.update({
    where: { id: agreementId },
    data: {
      status: 'PAID',
      completedAt: new Date(),
    },
  })
  
  return getDPAById(agreementId)
}

/**
 * Process early settlement
 */
export async function processEarlySettlement(
  agreementId: string,
  settlementAmount: number,
  paymentMethod: string,
  paymentReference?: string
): Promise<{
  settlement: EarlySettlementInfo
  agreement: DPAgreementDetails
}> {
  const agreement = await db.dPAgreement.findUnique({
    where: { id: agreementId },
    include: { 
      installments: { orderBy: { installmentNumber: 'asc' } },
    },
  })
  
  if (!agreement) {
    throw new Error('Agreement not found')
  }
  
  if (!['ACTIVE', 'DELINQUENT'].includes(agreement.status)) {
    throw new Error(`Cannot settle agreement in status: ${agreement.status}`)
  }
  
  // Find how many installments have been paid
  const paidCount = agreement.installments.filter(i => i.status === 'PAID').length
  
  // Get plan info for calculation
  const plan = getPlanById(agreement.planId)
  if (!plan) {
    throw new Error('Plan configuration not found')
  }
  
  // Build schedule for calculation
  const schedule: InstallmentScheduleItem[] = agreement.installments.map(i => ({
    installmentNumber: i.installmentNumber,
    dueDate: new Date(i.dueDate),
    amount: Number(i.amount),
    principalPortion: Number(i.principalPortion),
    interestPortion: Number(i.interestPortion),
    remainingBalance: 0, // Will be recalculated
    status: i.status as any,
  }))
  
  // Recalculate remaining balance
  let balance = Number(agreement.principalAmount)
  for (const inst of agreement.installments) {
    if (inst.status === 'PAID') {
      balance -= Number(inst.principalPortion)
    }
  }
  
  // Update schedule with correct remaining balances
  let runningBalance = balance
  for (let i = schedule.length - 1; i >= 0; i--) {
    schedule[i].remainingBalance = runningBalance
    if (agreement.installments[i].status !== 'PAID') {
      runningBalance += Number(agreement.installments[i].principalPortion)
    }
  }
  
  const calculationResult: CalculationResult = {
    plan,
    principalAmount: Number(agreement.principalAmount),
    totalInterest: (Number(agreement.principalAmount) * Number(agreement.interestRate)) / 100,
    adminFee: Number(agreement.adminFee),
    insurancePremium: Number(agreement.insurancePremium ?? 0),
    totalAmount: Number(agreement.totalAmount),
    monthlyPayment: Number(agreement.installmentAmount),
    effectiveAPR: 0,
    schedule,
    amortizationTable: [],
    firstDueDate: new Date(agreement.firstDueDate),
    lastDueDate: new Date(),
  }
  
  // Calculate early settlement discount
  const settlementCalculation = calculateEarlySettlementDiscount(
    calculationResult,
    paidCount,
    new Date()
  )
  
  // Verify payment amount matches expected
  if (settlementAmount < settlementCalculation.settlementAmount * 0.98) {
    // Allow 2% variance for rounding
    throw new Error(
      `Montant de règlement insuffisant. Attendu: ${formatDZD(settlementCalculation.settlementAmount)}`
    )
  }
  
  // Record settlement payment
  await db.dPPayment.create({
    data: {
      agreementId,
      amount: settlementAmount,
      paymentMethod,
      paymentReference,
      notes: `Règlement anticipé - Remise: ${formatDZD(settlementCalculation.discountAmount)}`,
    },
  })
  
  // Mark all remaining installments as waived/paid
  for (const installment of agreement.installments) {
    if (installment.status !== 'PAID') {
      await db.dPAInstallment.update({
        where: { id: installment.id },
        data: {
          status: 'WAIVED',
          paidAmount: Number(installment.amount),
          paidAt: new Date(),
        },
      })
    }
  }
  
  // Update agreement status
  await db.dPAgreement.update({
    where: { id: agreementId },
    data: {
      status: 'EARLY_SETTLED',
      completedAt: new Date(),
    },
  })
  
  const updatedAgreement = await getDPAById(agreementId)
  
  return {
    settlement: {
      originalRemaining: settlementCalculation.originalTotalRemaining,
      settlementAmount: settlementCalculation.settlementAmount,
      discountAmount: settlementCalculation.discountAmount,
      discountPercent: settlementCalculation.discountPercent,
      savingsBreakdown: settlementCalculation.savingsBreakdown,
      effectiveDate: settlementCalculation.effectiveDate,
    },
    agreement: updatedAgreement,
  }
}

export interface EarlySettlementInfo {
  originalRemaining: number
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

/**
 * Cancel DPA agreement
 */
export async function cancelAgreement(
  agreementId: string,
  reason: string,
  cancelledBy: string
): Promise<DPAgreementDetails> {
  const agreement = await db.dPAgreement.findUnique({
    where: { id: agreementId },
  })
  
  if (!agreement) {
    throw new Error('Agreement not found')
  }
  
  if (!['DRAFT', 'PENDING_APPROVAL', 'PENDING_DOCUMENTS', 'APPROVED'].includes(agreement.status)) {
    throw new Error(`Cannot cancel agreement in status: ${agreement.status}`)
  }
  
  await db.dPAgreement.update({
    where: { id: agreementId },
    data: {
      status: 'CANCELLED',
      notes: `${agreement.notes ?? ''}\nAnnulé par ${cancelledBy}: ${reason} - ${new Date().toISOString()}`,
    },
  })
  
  // Cancel all pending installments
  await db.dPAInstallment.updateMany({
    where: {
      agreementId,
      status: 'PENDING',
    },
    data: { status: 'WAIVED' },
  })
  
  return getDPAById(agreementId)
}

/**
 * Modify/restructure agreement (special cases)
 */
export async function modifyAgreement(
  agreementId: string,
  modifications: {
    newPlanId?: string
    extendMonths?: number
    interestRateAdjustment?: number
    notes?: string
  }
): Promise<DPAgreementDetails> {
  const agreement = await db.dPAgreement.findUnique({
    where: { id: agreementId },
    include: { installments: true },
  })
  
  if (!agreement) {
    throw new Error('Agreement not found')
  }
  
  // Only active or delinquent agreements can be modified
  if (!['ACTIVE', 'DELINQUENT'].includes(agreement.status)) {
    throw new Error(`Cannot modify agreement in status: ${agreement.status}`)
  }
  
  const updateData: any = {}
  
  if (modifications.newPlanId) {
    const newPlan = getPlanById(modifications.newPlanId)
    if (!newPlan) throw new Error('Invalid plan ID')
    
    // Recalculate with new plan
    const calculation = calculateInstallmentSchedule(
      Number(agreement.principalAmount),
      newPlan
    )
    
    updateData.planId = newPlan.id
    updateData.totalInstallments = newPlan.months
    updateData.installmentAmount = calculation.monthlyPayment
    updateData.interestRate = newPlan.interestRate
    updateData.totalAmount = calculation.totalAmount
    
    // Delete old installments and create new schedule
    await db.dPAInstallment.deleteMany({ where: { agreementId } })
    await createInstallmentSchedule(agreementId, calculation.schedule)
  }
  
  if (modifications.interestRateAdjustment) {
    updateData.interestRate = Number(agreement.interestRate) + modifications.interestRateAdjustment
  }
  
  if (modifications.notes) {
    updateData.notes = `${agreement.notes ?? ''}\nModification: ${modifications.notes} - ${new Date().toISOString()}`
  }
  
  await db.dPAgreement.update({
    where: { id: agreementId },
    data: updateData,
  })
  
  return getDPAById(agreementId)
}

// ============================================
// Document Management
// ============================================

/**
 * Upload supporting document
 */
export async function uploadDPADocument(
  agreementId: string,
  documentType: string,
  fileName: string,
  fileUrl: string,
  fileSize: number,
  mimeType: string,
  uploadedBy?: string
): Promise<DPADocumentDetail> {
  const document = await db.dPADocument.create({
    data: {
      agreementId,
      documentType: documentType as any,
      fileName,
      fileUrl,
      fileSize,
      mimeType,
      status: 'PENDING',
    },
  })
  
  return mapDbDocumentToInterface(document)
}

/**
 * Verify document (admin action)
 */
export async function verifyDocument(
  documentId: string,
  verifiedBy: string,
  approved: boolean,
  rejectionReason?: string
): Promise<DPADocumentDetail> {
  const document = await db.dPADocument.update({
    where: { id: documentId },
    data: {
      status: approved ? 'VERIFIED' : 'REJECTED',
      verifiedAt: new Date(),
      verifiedBy,
      rejectionReason: rejectionReason ?? null,
    },
  })
  
  return mapDbDocumentToInterface(document)
}

/**
 * Get documents for agreement
 */
export async function getAgreementDocuments(
  agreementId: string
): Promise<DPADocumentDetail[]> {
  const documents = await db.dPADocument.findMany({
    where: { agreementId },
    orderBy: { uploadedAt: 'desc' },
  })
  
  return documents.map(mapDbDocumentToInterface)
}

// ============================================
// Query Functions
// ============================================

/**
 * Get DPA by ID with full details
 */
export async function getDPAById(agreementId: string): Promise<DPAgreementDetails> {
  const agreement = await db.dPAgreement.findUnique({
    where: { id: agreementId },
    include: {
      installments: { orderBy: { installmentNumber: 'asc' } },
      documents: true,
      payments: { orderBy: { createdAt: 'desc' } },
    },
  })
  
  if (!agreement) {
    throw new Error('Agreement not found')
  }
  
  return mapDbAgreementToInterface(agreement)
}

/**
 * Get user's DPA agreements (as buyer or seller)
 */
export async function getUserDPAs(
  userId: string,
  role: 'buyer' | 'seller' = 'buyer',
  filters?: {
    status?: string
    limit?: number
    offset?: number
  }
): Promise<{ agreements: DPAgreementDetails[]; total: number }> {
  const whereClause: any = {}
  
  if (role === 'buyer') {
    whereClause.buyerId = userId
  } else {
    whereClause.sellerId = userId
  }
  
  if (filters?.status) {
    whereClause.status = filters.status
  }
  
  const [agreements, total] = await Promise.all([
    db.dPAgreement.findMany({
      where: whereClause,
      include: {
        installments: { orderBy: { installmentNumber: 'asc' } },
        documents: true,
      },
      orderBy: { appliedAt: 'desc' },
      take: filters?.limit ?? 20,
      skip: filters?.offset ?? 0,
    }),
    db.dPAgreement.count({ where: whereClause }),
  ])
  
  return {
    agreements: agreements.map(mapDbAgreementToInterface),
    total,
  }
}

/**
 * Get payment history for agreement
 */
export async function getPaymentHistory(
  agreementId: string
): Promise<DPPaymentRecord[]> {
  const payments = await db.dPPayment.findMany({
    where: { agreementId },
    orderBy: { createdAt: 'desc' },
  })
  
  return payments.map(mapDbPaymentToInterface)
}

// ============================================
// Mapping Functions
// ============================================

function mapDbAgreementToInterface(dbAgreement: any): DPAgreementDetails {
  return {
    id: dbAgreement.id,
    agreementNumber: dbAgreement.agreementNumber,
    orderId: dbAgreement.orderId,
    buyerId: dbAgreement.buyerId,
    sellerId: dbAgreement.sellerId,
    principalAmount: Number(dbAgreement.principalAmount),
    interestRate: Number(dbAgreement.interestRate),
    adminFee: Number(dbAgreement.adminFee),
    insurancePremium: dbAgreement.insurancePremium ? Number(dbAgreement.insurancePremium) : null,
    totalAmount: Number(dbAgreement.totalAmount),
    planId: dbAgreement.planId,
    totalInstallments: dbAgreement.totalInstallments,
    installmentAmount: Number(dbAgreement.installmentAmount),
    firstDueDate: new Date(dbAgreement.firstDueDate),
    frequency: dbAgreement.frequency,
    status: dbAgreement.status,
    downPaymentReceived: dbAgreement.downPaymentReceived,
    downPaymentAmount: dbAgreement.downPaymentAmount ? Number(dbAgreement.downPaymentAmount) : null,
    insuranceEnabled: dbAgreement.insuranceEnabled,
    bankPartnerId: dbAgreement.bankPartnerId,
    guaranteeReference: dbAgreement.guaranteeReference,
    creditScore: dbAgreement.creditScore,
    riskLevel: dbAgreement.riskLevel,
    appliedAt: new Date(dbAgreement.appliedAt),
    approvedAt: dbAgreement.approvedAt ? new Date(dbAgreement.approvedAt) : null,
    activatedAt: dbAgreement.activatedAt ? new Date(dbAgreement.activatedAt) : null,
    completedAt: dbAgreement.completedAt ? new Date(dbAgreement.completedAt) : null,
    createdAt: new Date(dbAgreement.createdAt),
    updatedAt: new Date(dbAgreement.updatedAt),
    installments: (dbAgreement.installments ?? []).map(mapDbInstallmentToInterface),
    documents: (dbAgreement.documents ?? []).map(mapDbDocumentToInterface),
  }
}

function mapDbInstallmentToInterface(dbInstallment: any): DPAInstallmentDetail {
  return {
    id: dbInstallment.id,
    agreementId: dbInstallment.agreementId,
    installmentNumber: dbInstallment.installmentNumber,
    dueDate: new Date(dbInstallment.dueDate),
    amount: Number(dbInstallment.amount),
    principalPortion: Number(dbInstallment.principalPortion),
    interestPortion: Number(dbInstallment.interestPortion),
    status: dbInstallment.status,
    paidAmount: Number(dbInstallment.paidAmount),
    paidAt: dbInstallment.paidAt ? new Date(dbInstallment.paidAt) : null,
    lateFeeApplied: Number(dbInstallment.lateFeeApplied),
    lateFeePaid: Number(dbInstallment.lateFeePaid),
    notes: dbInstallment.notes,
  }
}

function mapDbDocumentToInterface(dbDocument: any): DPADocumentDetail {
  return {
    id: dbDocument.id,
    agreementId: dbDocument.agreementId,
    documentType: dbDocument.documentType,
    fileName: dbDocument.fileName,
    fileUrl: dbDocument.fileUrl,
    fileSize: dbDocument.fileSize,
    mimeType: dbDocument.mimeType,
    uploadedAt: new Date(dbDocument.uploadedAt),
    verifiedAt: dbDocument.verifiedAt ? new Date(dbDocument.verifiedAt) : null,
    verifiedBy: dbDocument.verifiedBy,
    status: dbDocument.status,
    rejectionReason: dbDocument.rejectionReason,
  }
}

function mapDbPaymentToInterface(dbPayment: any): DPPaymentRecord {
  return {
    id: dbPayment.id,
    agreementId: dbPayment.agreementId,
    installmentId: dbPayment.installmentId,
    amount: Number(dbPayment.amount),
    paymentMethod: dbPayment.paymentMethod,
    paymentReference: dbPayment.paymentReference,
    notes: dbPayment.notes,
    createdAt: new Date(dbPayment.createdAt),
  }
}
