// DPA (Deferred Payment Agreement) Module - Main Entry Point
// AlgeriaTrade.dz - B2B Marketplace Installment Plans

// Configuration
export {
  dpaConfig,
  getPlanById,
  getAvailablePlans,
  getRecommendedPlan,
  estimateMonthlyPayment,
  formatDZD,
  formatPercent,
  validateOrderEligibility,
  generateAgreementNumber,
  type DPAPlan,
  type DPAEligibilityRules,
  type DPAScheduleRules,
  type DPAInsuranceConfig,
  type PartnerBank,
  type DPAConfig,
} from './config'

// Calculator
export {
  calculateInstallmentSchedule,
  calculateTotalInterest,
  calculateMonthlyPayment,
  calculateEarlySettlementDiscount,
  calculateLateFee,
  calculateRemainingBalance,
  generateAmortizationTable,
  assessEligibility,
  getEligiblePlans,
  type InstallmentScheduleItem,
  type AmortizationRow,
  type CalculationResult,
  type EarlySettlementResult,
  type LateFeeResult,
  type EligibilityResult,
  type BuyerProfile,
} from './calculator'

// Manager (Lifecycle)
export {
  createDPAgreement,
  submitDPAApplication,
  activateAgreement,
  approveDPARequest,
  processInstallmentPayment,
  handleMissedPayment,
  handleDefault,
  closeAgreement,
  processEarlySettlement,
  cancelAgreement,
  modifyAgreement,
  uploadDPADocument,
  verifyDocument,
  getAgreementDocuments,
  getDPAById,
  getUserDPAs,
  getPaymentHistory,
  type CreateDPAInput,
  type DPAgreementDetails,
  type DPAInstallmentDetail,
  type DPADocumentDetail,
  type DPPaymentRecord,
  type ProcessPaymentInput,
  type EarlySettlementInfo,
} from './manager'
