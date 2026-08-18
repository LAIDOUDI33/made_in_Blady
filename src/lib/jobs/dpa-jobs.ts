// DPA Automated Jobs
// Background tasks for managing installment agreements
// These would typically be run via cron jobs or a job queue

import { db } from '@/lib/db'
import {
  handleMissedPayment,
  handleDefault,
  type DPAgreementDetails,
} from '@/lib/payments/installments/manager'
import { calculateLateFee, formatDZD } from '@/lib/payments/installments/calculator'
import { dpaConfig } from '@/lib/payments/installments/config'

// ============================================
// Types
// ============================================

interface JobResult {
  success: boolean
  processed: number
  errors: string[]
  details: string[]
}

interface PaymentReminderData {
  agreementId: string
  buyerId: string
  sellerId: string
  installmentNumber: number
  amount: number
  dueDate: Date
  daysUntilDue: number
}

interface OverduePaymentData {
  agreementId: string
  installmentId: string
  installmentNumber: number
  amount: number
  daysOverdue: number
  lateFeeApplied: number
}

// ============================================
// Daily Jobs
// ============================================

/**
 * Check for upcoming payments and send reminders (3 days before due date)
 * Should run daily at 9:00 AM
 */
export async function sendUpcomingPaymentReminders(): Promise<JobResult> {
  const result: JobResult = {
    success: true,
    processed: 0,
    errors: [],
    details: [],
  }

  try {
    const now = new Date()
    
    // Calculate reminder window (3 to 4 days from now)
    const reminderStart = new Date(now)
    reminderStart.setDate(reminderStart.getDate() + 3)
    reminderStart.setHours(0, 0, 0, 0)
    
    const reminderEnd = new Date(reminderStart)
    reminderEnd.setDate(reminderEnd.getDate() + 1)

    // Find installments due in the reminder window
    const upcomingInstallments = await db.dPAInstallment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: reminderStart,
          lt: reminderEnd,
        },
      },
      include: {
        agreement: {
          include: {
            buyer: true,
            seller: true,
          },
        },
      },
    })

    result.details.push(`Found ${upcomingInstallments.length} upcoming payments`)

    for (const installment of upcomingInstallments) {
      try {
        const daysUntilDue = Math.ceil(
          (new Date(installment.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        const reminderData: PaymentReminderData = {
          agreementId: installment.agreementId,
          buyerId: installment.agreement.buyerId,
          sellerId: installment.agreement.sellerId,
          installmentNumber: installment.installmentNumber,
          amount: Number(installment.amount),
          dueDate: new Date(installment.dueDate),
          daysUntilDue,
        }

        // Send notification (in production, this would use your notification service)
        await sendPaymentReminder(reminderData)
        
        result.processed++
        result.details.push(
          `Reminder sent for agreement ${installment.agreement.agreementNumber}, installment #${installment.installmentNumber}`
        )
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Failed to send reminder for ${installment.id}: ${errorMsg}`)
      }
    }
  } catch (error) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return result
}

/**
 * Check for overdue payments and apply late fees
 * Should run daily at 12:00 AM (midnight)
 */
export async function processOverduePayments(): Promise<JobResult> {
  const result: JobResult = {
    success: true,
    processed: 0,
    errors: [],
    details: [],
  }

  try {
    const now = new Date()
    
    // Find all pending installments that are past their due date + grace period
    const gracePeriodDays = dpaConfig.schedule.gracePeriodDays
    
    // Installments that are past due date but not yet marked overdue
    const pendingOverdue = await db.dPAInstallment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: now,
        },
      },
      include: {
        agreement: {
          include: {
            buyer: true,
            seller: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    result.details.push(`Found ${pendingOverdue.length} potentially overdue installments`)

    for (const installment of pendingOverdue) {
      try {
        const dueDate = new Date(installment.dueDate)
        const daysOverdue = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Only process if past grace period
        if (daysOverdue > gracePeriodDays) {
          // Apply late fee and mark as overdue
          const { lateFeeApplied } = await handleMissedPayment(
            installment.agreementId,
            installment.installmentNumber
          )

          const overdueData: OverduePaymentData = {
            agreementId: installment.agreementId,
            installmentId: installment.id,
            installmentNumber: installment.installmentNumber,
            amount: Number(installment.amount),
            daysOverdue,
            lateFeeApplied,
          }

          // Send notifications
          await sendOverdueNotification(overdueData)
          
          result.processed++
          result.details.push(
            `Late fee of ${formatDZD(lateFeeApplied)} applied to installment #${installment.installmentNumber}`
          )
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Failed to process ${installment.id}: ${errorMsg}`)
      }
    }

    // Check for agreements that should be defaulted
    await checkForDefaults(result)
  } catch (error) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return result
}

/**
 * Weekly risk assessment update
 * Should run weekly on Monday at 6:00 AM
 */
export async function runWeeklyRiskAssessment(): Promise<JobResult> {
  const result: JobResult = {
    success: true,
    processed: 0,
    errors: [],
    details: [],
  }

  try {
    // Get all active agreements
    const activeAgreements = await db.dPAgreement.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        installments: true,
        buyer: true,
      },
    })

    result.details.push(`Assessing risk for ${activeAgreements.length} active agreements`)

    for (const agreement of activeAgreements) {
      try {
        const riskScore = calculateRiskScore(agreement)
        
        // Update risk level if changed
        const newRiskLevel = getRiskLevelFromScore(riskScore)
        
        if (newRiskLevel !== agreement.riskLevel) {
          await db.dPAgreement.update({
            where: { id: agreement.id },
            data: {
              creditScore: riskScore,
              riskLevel: newRiskLevel,
            },
          })

          result.details.push(
            `Risk updated for ${agreement.agreementNumber}: ${agreement.riskLevel} -> ${newRiskLevel} (${riskScore})`
          )
        }
        
        result.processed++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Failed to assess ${agreement.id}: ${errorMsg}`)
      }
    }
  } catch (error) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return result
}

/**
 * Monthly statement generation
 * Should run on the 1st of each month at 8:00 AM
 */
export async function generateMonthlyStatements(): Promise<JobResult> {
  const result: JobResult = {
    success: true,
    processed: 0,
    errors: [],
    details: [],
  }

  try {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Get all active agreements
    const activeAgreements = await db.dPAgreement.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
        buyer: true,
      },
    })

    result.details.push(`Generating statements for ${activeAgreements.length} active agreements`)

    for (const agreement of activeAgreements) {
      try {
        // Generate monthly statement data
        const statementData = generateStatementData(agreement, currentMonth, currentYear)
        
        // In production, this would create a PDF and store it
        // For now, we'll just log it
        result.details.push(
          `Statement generated for ${agreement.agreementNumber}`
        )
        
        // Send statement notification
        await sendMonthlyStatementNotification(agreement.buyerId, statementData)
        
        result.processed++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Failed to generate statement for ${agreement.id}: ${errorMsg}`)
      }
    }
  } catch (error) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return result
}

// ============================================
// Helper Functions
// ============================================

async function checkForDefaults(jobResult: JobResult): Promise<void> {
  // Find delinquent agreements with significant overdue amounts or duration
  const delinquentAgreements = await db.dPAgreement.findMany({
    where: {
      status: 'DELINQUENT',
    },
    include: {
      installments: {
        where: {
          status: 'OVERDUE',
        },
      },
    },
  })

  for (const agreement of delinquentAgreements) {
    // Count total overdue days across all overdue installments
    let maxOverdueDays = 0
    let totalLateFees = 0

    for (const installment of agreement.installments) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(installment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      maxOverdueDays = Math.max(maxOverdueDays, daysOverdue)
      totalLateFees += Number(installment.lateFeeApplied)
    }

    // Default after 90 days of being overdue OR if late fees exceed 20% of principal
    const shouldDefault = 
      maxOverdueDays > 90 ||
      totalLateFees > (Number(agreement.principalAmount) * 0.2)

    if (shouldDefault) {
      try {
        await handleDefault(
          agreement.id,
          `Automatic default: ${maxOverdueDays} days overdue, ${formatDZD(totalLateFees)} in late fees`
        )
        
        jobResult.details.push(
          `Agreement ${agreement.agreementNumber} defaulted automatically`
        )
        jobResult.processed++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        jobResult.errors.push(`Failed to default ${agreement.id}: ${errorMsg}`)
      }
    }
  }
}

function calculateRiskScore(agreement: any): number {
  let score = 100 // Start with perfect score
  
  const overdueInstallments = agreement.installments.filter(
    (i: any) => i.status === 'OVERDUE'
  )
  
  // Deduct points for overdue payments
  score -= overdueInstallments.length * 15
  
  // Deduct more for multiple overdue
  if (overdueInstallments.length > 1) {
    score -= (overdueInstallments.length - 1) * 10
  }
  
  // Deduct for late fees
  const totalLateFees = agreement.installments.reduce(
    (sum: number, i: any) => sum + Number(i.lateFeeApplied),
    0
  )
  
  if (totalLateFees > 0) {
    const lateFeeRatio = totalLateFees / Number(agreement.principalAmount)
    score -= Math.min(30, lateFeeRatio * 100)
  }
  
  return Math.max(0, Math.round(score))
}

function getRiskLevelFromScore(score: number): string {
  if (score >= 80) return 'LOW'
  if (score >= 60) return 'MEDIUM'
  if (score >= 40) return 'HIGH'
  return 'VERY_HIGH'
}

async function sendPaymentReminder(data: PaymentReminderData): Promise<void> {
  // In production, integrate with your email/SMS/notification system
  console.log(`[DPA Reminder] Sending payment reminder to buyer ${data.buyerId}`, {
    agreementId: data.agreementId,
    installmentNumber: data.installmentNumber,
    amount: formatDZD(data.amount),
    dueDate: data.dueDate.toISOString(),
    daysUntilDue: data.daysUntilDue,
  })
}

async function sendOverdueNotification(data: OverduePaymentData): Promise<void> {
  // In production, integrate with your notification system
  console.log(`[DPA Overdue] Sending overdue notification`, {
    agreementId: data.agreementId,
    installmentNumber: data.installmentNumber,
    amount: formatDZD(data.amount),
    daysOverdue: data.daysOverdue,
    lateFeeApplied: formatDZD(data.lateFeeApplied),
  })
}

async function sendMonthlyStatementNotification(buyerId: string, statementData: any): Promise<void> {
  // In production, integrate with your notification system
  console.log(`[DPA Statement] Sending monthly statement to buyer ${buyerId}`)
}

function generateStatementData(agreement: any, month: number, year: number): object {
  // Filter installments for the given month
  const monthInstallments = agreement.installments.filter((i: any) => {
    const dueDate = new Date(i.dueDate)
    return dueDate.getMonth() === month && dueDate.getFullYear() === year
  })

  const paidThisMonth = monthInstallments.filter((i: any) => i.status === 'PAID')
  const overdueThisMonth = monthInstallments.filter((i: any) => i.status === 'OVERDUE')

  return {
    agreementNumber: agreement.agreementNumber,
    period: `${month + 1}/${year}`,
    principalAmount: agreement.principalAmount,
    totalPaid: paidThisMonth.reduce((sum: number, i: any) => sum + Number(i.paidAmount), 0),
    totalOverdue: overdueThisMonth.reduce((sum: number, i: any) => sum + Number(i.amount), 0),
    remainingBalance: calculateRemainingBalanceForAgreement(agreement),
    installments: monthInstallments.map((i: any) => ({
      number: i.installmentNumber,
      dueDate: i.dueDate,
      amount: i.amount,
      status: i.status,
      paidAmount: i.paidAmount,
      lateFeeApplied: i.lateFeeApplied,
    })),
  }
}

function calculateRemainingBalanceForAgreement(agreement: any): number {
  return agreement.installments
    .filter((i: any) => !['PAID', 'WAIVED'].includes(i.status))
    .reduce((sum: number, i: any) => sum + (Number(i.amount) - Number(i.paidAmount)), 0)
}

// Export all job functions
export {
  sendUpcomingPaymentReminders,
  processOverduePayments,
  runWeeklyRiskAssessment,
  generateMonthlyStatements,
}
