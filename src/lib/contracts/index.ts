// Contract Module - Main Export
// وحدة العقود - التصدير الرئيسي
// Module Contrats - Export principal

// Core types
export type {
  ContractType,
  ContractStatus,
  ContractLanguage,
  ContractParty,
  ContractClause,
  ContractAttachment,
  Contract,
  SignatureRequest as ContractSignatureRequest,
  ContractChange,
  CreateContractParams,
} from '../contracts';

// Configuration
export {
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  CONTRACT_TYPES,
  ALGERIAN_LAW_REFERENCES,
  LEGAL_FORMS,
  WILAYAS,
  CLAUSE_CATEGORIES,
  getAllClauses,
  getClausesByCategory,
  getClauseById,
  searchClauses,
  getRequiredClauses,
  getTemplatePlaceholders,
} from './config';

export type {
  ContractTypeConfig,
  CompanyLegalInfo,
  ClauseCategory,
} from './config';

// Templates
export {
  getContractTemplate,
  listAvailableTemplates,
  createSalesContractTemplate,
  createPurchaseOrderTemplate,
  createNDATemplate,
  createServiceAgreementTemplate,
  createDistributionTemplate,
  createPartnershipTemplate,
  createExclusivityTemplate,
} from './templates';

export type { ContractTemplate } from './config';

// Generator
export {
  fillTemplate,
  addClauses,
  removeClauses,
  generatePreview,
  generateContract,
} from './generator';

export type {
  TemplateVariable,
  GenerateContractOptions,
  PreviewData,
  PreviewSection,
} from './generator';

// Clauses Management
export {
  findClauses,
  getSuggestedClauses,
  getCategorySummary,
  validateClause,
  hasUnfilledPlaceholders,
  getLibraryStats,
  createCustomClause,
  getCustomClause,
  updateCustomClause,
  deleteCustomClause,
  incrementUsage,
} from './clauses';

export type {
  CustomClause,
  ClauseFilter,
  ClauseLibraryStats,
} from './clauses';

// E-Signature
export {
  createSignature,
  verifySignature,
  createSignatureRequest,
  getSignatureRequest,
  updateSignatureRequestStatus,
  getPendingRequestsForUser,
  addAuditEntry,
  getAuditTrail,
  formatAuditTrail,
  generateCertificateOfAuthenticity,
  verifyCertificate,
  isRequestExpired,
  getSigningStatusSummary,
} from './e-signature';

export type {
  SignatureData,
  AuditLogEntry,
  SignatureRequest,
  CertificateOfAuthenticity,
  SigningWorkflow,
} from './e-signature';

// PDF Export
export {
  generateContractHTML,
  generatePDFFilename,
  getPDFStats,
} from './pdf-export';

export type {
  PDFOptions,
  PDFGenerationResult,
  LetterheadConfig,
} from './pdf-export';
