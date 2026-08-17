// Automated Legal Document Generation
// نظام توليد المستندات القانونية التلقائي
// Supports Arabic and French contracts compliant with Algerian law

import { db } from '@/lib/db';
import { getContractTemplate } from './contracts/templates';
import type { ContractTemplate, ContractClause as TemplateClause } from './contracts/templates';

// ============================================
// TYPES
// ============================================

export type ContractType = 
  | 'SALES_AGREEMENT'       // Contrat de vente
  | 'SUPPLY_CONTRACT'       // Contrat de fourniture
  | 'SERVICE_AGREEMENT'      // Contrat de prestation
  | 'DISTRIBUTION_AGREEMENT' // Contrat de distribution
  | 'NON_DISCLOSURE'         // Accord de confidentialité
  | 'EXCLUSIVITY'           // Clause d'exclusivité
  | 'FRAMEWORK_AGREEMENT'   // Accord-cadre

export type ContractStatus = 
  | 'DRAFT'       // Being edited
  | 'REVIEW'      // Under review by party
  | 'PENDING_SIGNATURE' // Ready for signing
  | 'SIGNED'      // Fully signed
  | 'ACTIVE'      // In effect
  | 'EXPIRED'     // Past end date
  | 'TERMINATED'  // Early termination
  | 'VOID'        // Cancelled

export type ContractLanguage = 'AR' | 'FR' | 'BILINGUAL';

export interface ContractParty {
  companyId: string;
  companyName: string;
  representativeName: string;
  representativeTitle: string;
  email: string;
  phone: string;
  address: string;
  commercialRegister: string; // NRC
  taxId: string; // NIF
  stamp?: string; // Company stamp image URL
}

export interface ContractClause {
  id: string;
  clauseType: string; // PRICE, DELIVERY, WARRANTY, PENALTY, FORCE_MAJEURE, etc.
  title: string;
  titleAr: string;
  titleFr: string;
  content: string;
  contentAr: string;
  contentFr: string;
  isRequired: boolean;
  isEditable: boolean;
  order: number;
}

export interface ContractAttachment {
  id: string;
  contractId: string;
  fileName: string;
  fileType: 'PDF' | 'DOCX' | 'IMAGE' | 'OTHER';
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  description?: string;
  createdAt: Date;
}

export interface Contract {
  id: string;
  contractNumber: string; // CTR-YYYYMMDD-XXXX
  contractType: ContractType;
  status: ContractStatus;
  language: ContractLanguage;
  
  // Parties
  partyA: ContractParty; // Usually supplier
  partyB: ContractParty; // Usually buyer
  
  // Subject matter
  subject: string;
  subjectAr: string;
  subjectFr: string;
  effectiveDate: Date;
  endDate: Date | null; // Null for indefinite
  
  // Financial terms
  totalValue: number;
  currency: string;
  paymentTerms: string;
  penaltyClause: string; // Late payment penalties
  warrantyTerms: string;
  
  // Clauses
  clauses: ContractClause[];
  customClauses: ContractClause[];
  
  // Signatures
  partyASignedAt?: Date;
  partyBSignedAt?: Date;
  partyASignatureUrl?: string;
  partyBSignatureUrl?: string;
  
  // Attachments
  attachments: ContractAttachment[];
  
  // Metadata
  version: number;
  parentContractId?: string; // For amendments
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  relatedNegotiationId?: string;
  relatedOrderId?: string;
}

export interface SignatureRequest {
  id: string;
  contractId: string;
  partyId: string; // 'A' or 'B'
  requestedTo: string; // User ID
  requestedAt: Date;
  expiresAt: Date;
  status: 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
  signedAt?: Date;
  signatureUrl?: string;
}

export interface ContractChange {
  clauseId: string;
  field: 'content' | 'contentAr' | 'contentFr';
  oldValue: string;
  newValue: string;
  reason: string;
}

export interface CreateContractParams {
  type: ContractType;
  language?: ContractLanguage;
  partyA: ContractParty;
  partyB: ContractParty;
  subject: string;
  subjectAr?: string;
  subjectFr?: string;
  effectiveDate: Date;
  endDate?: Date | null;
  totalValue: number;
  currency?: string;
  paymentTerms: string;
  penaltyClause?: string;
  warrantyTerms?: string;
  customClauses?: Partial<ContractClause>[];
  relatedNegotiationId?: string;
  relatedOrderId?: string;
  createdBy: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateContractNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CTR-${dateStr}-${random}`;
}

function mapContractToInterface(dbContract: any): Contract {
  return {
    id: dbContract.id,
    contractNumber: dbContract.contractNumber,
    contractType: dbContract.contractType as ContractType,
    status: dbContract.status as ContractStatus,
    language: dbContract.language as ContractLanguage,
    partyA: typeof dbContract.partyAInfo === 'string' 
      ? JSON.parse(dbContract.partyAInfo) 
      : dbContract.partyAInfo,
    partyB: typeof dbContract.partyBInfo === 'string'
      ? JSON.parse(dbContract.partyBInfo)
      : dbContract.partyBInfo,
    subject: dbContract.subject,
    subjectAr: dbContract.subjectAr,
    subjectFr: dbContract.subjectFr,
    effectiveDate: new Date(dbContract.effectiveDate),
    endDate: dbContract.endDate ? new Date(dbContract.endDate) : null,
    totalValue: typeof dbContract.totalValue === 'number' 
      ? dbContract.totalValue 
      : parseFloat(dbContract.totalValue),
    currency: dbContract.currency || 'DZD',
    paymentTerms: dbContract.paymentTerms,
    penaltyClause: dbContract.penaltyClause || '',
    warrantyTerms: dbContract.warrantyTerms || '',
    clauses: typeof dbContract.clauses === 'string'
      ? JSON.parse(dbContract.clauses)
      : (dbContract.clauses || []),
    customClauses: typeof dbContract.customClauses === 'string'
      ? JSON.parse(dbContract.customClauses)
      : (dbContract.customClauses || []),
    partyASignedAt: dbContract.partyASignedAt ? new Date(dbContract.partyASignedAt) : undefined,
    partyBSignedAt: dbContract.partyBSignedAt ? new Date(dbContract.partyBSignedAt) : undefined,
    partyASignatureUrl: dbContract.partyASignatureUrl || undefined,
    partyBSignatureUrl: dbContract.partyBSignatureUrl || undefined,
    attachments: Array.isArray(dbContract.attachments) ? dbContract.attachments : [],
    version: dbContract.version || 1,
    parentContractId: dbContract.parentContractId || undefined,
    createdBy: dbContract.createdBy,
    createdAt: new Date(dbContract.createdAt),
    updatedAt: new Date(dbContract.updatedAt),
    relatedNegotiationId: dbContract.relatedNegotiationId || undefined,
    relatedOrderId: dbContract.relatedOrderId || undefined,
  };
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Generate a unique contract number
 * توليد رقم عقد فريد
 */
export function generateContractNumber(): string {
  return generateContractNumber();
}

/**
 * Create a new contract from parameters
 * إنشاء عقد جديد من المعلمات
 */
export async function createContract(params: CreateContractParams): Promise<Contract> {
  const template = getContractTemplate(params.type, params.language || 'BILINGUAL');
  
  const contract = await db.contract.create({
    data: {
      contractNumber: generateContractNumber(),
      contractType: params.type,
      status: 'DRAFT',
      language: params.language || 'BILINGUAL',
      partyAInfo: params.partyA as any,
      partyBInfo: params.partyB as any,
      subject: params.subject,
      subjectAr: params.subjectAr || params.subject,
      subjectFr: params.subjectFr || params.subject,
      effectiveDate: params.effectiveDate,
      endDate: params.endDate,
      totalValue: params.totalValue,
      currency: params.currency || 'DZD',
      paymentTerms: params.paymentTerms,
      penaltyClause: params.penaltyClause || template.defaultPenaltyClause,
      warrantyTerms: params.warrantyTerms || template.defaultWarrantyTerms,
      clauses: template.clauses as any,
      customClauses: (params.customClauses || []) as any,
      version: 1,
      createdBy: params.createdBy,
      relatedNegotiationId: params.relatedNegotiationId,
      relatedOrderId: params.relatedOrderId,
    },
  });

  return mapContractToInterface(contract);
}

/**
 * Create a contract from a completed negotiation
 * إنشاء عقد من مفاوضات مكتملة
 */
export async function createContractFromNegotiation(
  negotiationId: string,
  additionalParams?: Partial<CreateContractParams>
): Promise<Contract> {
  // In a real implementation, fetch the negotiation and extract agreed terms
  // For now, we'll create with default values based on negotiation data
  
  const negotiation = await db.negotiation.findUnique({
    where: { id: negotiationId },
    include: { offers: true },
  });

  if (!negotiation) {
    throw new Error('Negotiation not found - المفاوضات غير موجودة');
  }

  if (negotiation.status !== 'ACCEPTED') {
    throw new Error('Can only create contract from accepted negotiations - يمكن فقط إنشاء عقد من مفاوضات مقبولة');
  }

  const lastOffer = negotiation.offers[negotiation.offers.length - 1];
  
  return createContract({
    type: 'SALES_AGREEMENT',
    language: 'BILINGUAL',
    partyA: {
      companyId: negotiation.sellerId,
      companyName: 'Supplier Company', // Would fetch from DB
      representativeName: 'Representative',
      representativeTitle: 'Manager',
      email: 'supplier@example.com',
      phone: '+213 XXX XXX XXX',
      address: 'Algeria',
      commercialRegister: '',
      taxId: '',
    },
    partyB: {
      companyId: negotiation.buyerId,
      companyName: 'Buyer Company',
      representativeName: 'Representative',
      representativeTitle: 'Manager',
      email: 'buyer@example.com',
      phone: '+213 XXX XXX XXX',
      address: 'Algeria',
      commercialRegister: '',
      taxId: '',
    },
    subject: `Sales Agreement - ${negotiation.negotiationNumber}`,
    subjectAr: `اتفاقية بيع - ${negotiation.negotiationNumber}`,
    subjectFr: `Contrat de vente - ${negotiation.negotiationNumber}`,
    effectiveDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    totalValue: lastOffer?.offeredPrice?.toNumber?.() || lastOffer?.originalPrice?.toNumber?.() || 0,
    paymentTerms: lastOffer?.paymentTerms || 'Net 30',
    relatedNegotiationId: negotiationId,
    createdBy: negotiation.initiatorId,
    ...additionalParams,
  });
}

/**
 * Get contract template for a specific type and language
 * الحصول على قالب عقد لنوع ولغة محددين
 */
export function getContractTemplateForAPI(
  type: ContractType,
  language: ContractLanguage = 'BILINGUAL'
): ContractTemplate {
  return getContractTemplate(type, language);
}

/**
 * Add a custom clause to a contract
 * إضافة بند مخصص للعقد
 */
export async function addCustomClause(
  contractId: string,
  clause: Partial<ContractClause>
): Promise<ContractClause> {
  const contract = await db.contract.findUnique({ where: { id: contractId } });
  
  if (!contract) {
    throw new Error('Contract not found - العقد غير موجود');
  }

  if (contract.status !== 'DRAFT') {
    throw new Error('Can only modify draft contracts - يمكن تعديل المسودات فقط');
  }

  const newClause: ContractClause = {
    id: `clause-${Date.now()}`,
    clauseType: clause.clauseType || 'CUSTOM',
    title: clause.title || 'Custom Clause',
    titleAr: clause.titleAr || 'بند مخصص',
    titleFr: clause.titleFr || 'Clause personnalisée',
    content: clause.content || '',
    contentAr: clause.contentAr || '',
    contentFr: clause.contentFr || '',
    isRequired: clause.isRequired ?? false,
    isEditable: clause.isEditable ?? true,
    order: clause.order || 999,
  };

  const currentClauses: ContractClause[] = typeof contract.customClauses === 'string'
    ? JSON.parse(contract.customClauses)
    : (contract.customClauses || []);

  currentClauses.push(newClause);

  await db.contract.update({
    where: { id: contractId },
    data: { customClauses: currentClauses as any },
  });

  return newClause;
}

/**
 * Remove a clause from a contract
 * إزالة بند من العقد
 */
export async function removeClause(contractId: string, clauseId: string): Promise<void> {
  const contract = await db.contract.findUnique({ where: { id: contractId } });
  
  if (!contract) {
    throw new Error('Contract not found');
  }

  if (contract.status !== 'DRAFT') {
    throw new Error('Can only modify draft contracts');
  }

  // Check if it's a required standard clause
  const clauses: ContractClause[] = typeof contract.clauses === 'string'
    ? JSON.parse(contract.clauses)
    : [];
  
  const clauseToRemove = clauses.find(c => c.id === clauseId);
  if (clauseToRemove?.isRequired) {
    throw new Error('Cannot remove required clause - لا يمكن إزالة البند المطلوب');
  }

  // Try removing from custom clauses first
  let customClauses: ContractClause[] = typeof contract.customClauses === 'string'
    ? JSON.parse(contract.customClauses)
    : [];

  customClauses = customClauses.filter(c => c.id !== clauseId);

  await db.contract.update({
    where: { id: contractId },
    data: { customClauses: customClauses as any },
  });
}

/**
 * Update contract clauses/content
 * تحديث بنود/محتوى العقد
 */
export async function updateContract(
  contractId: string,
  updates: {
    clauses?: ContractClause[];
    customClauses?: ContractClause[];
    subject?: string;
    subjectAr?: string;
    subjectFr?: string;
    totalValue?: number;
    paymentTerms?: string;
    penaltyClause?: string;
    warrantyTerms?: string;
    effectiveDate?: Date;
    endDate?: Date | null;
    partyA?: Partial<ContractParty>;
    partyB?: Partial<ContractParty>;
  }
): Promise<Contract> {
  const contract = await db.contract.findUnique({ where: { id: contractId } });

  if (!contract) {
    throw new Error('Contract not found');
  }

  if (contract.status !== 'DRAFT') {
    throw new Error('Can only modify draft contracts');
  }

  const updateData: any = {};

  if (updates.clauses) updateData.clauses = updates.clauses as any;
  if (updates.customClauses) updateData.customClauses = updates.customClauses as any;
  if (updates.subject) updateData.subject = updates.subject;
  if (updates.subjectAr) updateData.subjectAr = updates.subjectAr;
  if (updates.subjectFr) updateData.subjectFr = updates.subjectFr;
  if (updates.totalValue !== undefined) updateData.totalValue = updates.totalValue;
  if (updates.paymentTerms) updateData.paymentTerms = updates.paymentTerms;
  if (updates.penaltyClause !== undefined) updateData.penaltyClause = updates.penaltyClause;
  if (updates.warrantyTerms !== undefined) updateData.warrantyTerms = updates.warrantyTerms;
  if (updates.effectiveDate) updateData.effectiveDate = updates.effectiveDate;
  if (updates.endDate !== undefined) updateData.endDate = updates.endDate;

  if (updates.partyA) {
    const currentPartyA = typeof contract.partyAInfo === 'string'
      ? JSON.parse(contract.partyAInfo)
      : contract.partyAInfo;
    updateData.partyAInfo = { ...currentPartyA, ...updates.partyA } as any;
  }

  if (updates.partyB) {
    const currentPartyB = typeof contract.partyBInfo === 'string'
      ? JSON.parse(contract.partyBInfo)
      : contract.partyBInfo;
    updateData.partyBInfo = { ...currentPartyB, ...updates.partyB } as any;
  }

  const updated = await db.contract.update({
    where: { id: contractId },
    data: updateData,
  });

  return mapContractToInterface(updated);
}

/**
 * Request signature from a party
 * طلب توقيع من طرف
 */
export async function requestSignature(
  contractId: string,
  partyId: 'A' | 'B',
  requestedToUserId: string,
  expiresInDays: number = 7
): Promise<SignatureRequest> {
  const contract = await db.contract.findUnique({ where: { id: contractId } });

  if (!contract) {
    throw new Error('Contract not found');
  }

  // Update contract status to pending signature
  await db.contract.update({
    where: { id: contractId },
    data: { status: 'PENDING_SIGNATURE' },
  });

  // Return signature request info (in real app, would store in separate table)
  return {
    id: `sig-req-${Date.now()}`,
    contractId,
    partyId,
    requestedTo: requestedToUserId,
    requestedAt: new Date(),
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
    status: 'PENDING',
  };
}

/**
 * Sign a contract
 * توقيع عقد
 */
export async function signContract(
  contractId: string,
  userId: string,
  signatureImage: string,
  partyId: 'A' | 'B'
): Promise<Contract> {
  const contract = await db.contract.findUnique({ where: { id: contractId } });

  if (!contract) {
    throw new Error('Contract not found');
  }

  if (!['DRAFT', 'REVIEW', 'PENDING_SIGNATURE'].includes(contract.status)) {
    throw new Error(`Cannot sign contract in ${contract.status} status`);
  }

  const now = new Date();
  const updateData: any = {
    status: 'SIGNED',
  };

  if (partyId === 'A') {
    updateData.partyASignedAt = now;
    updateData.partyASignatureUrl = signatureImage;
    
    // If Party B already signed, mark as fully signed
    if (contract.partyBSignedAt) {
      updateData.status = 'SIGNED';
    } else {
      updateData.status = 'REVIEW'; // Waiting for other party
    }
  } else {
    updateData.partyBSignedAt = now;
    updateData.partyBSignatureUrl = signatureImage;
    
    if (contract.partyASignedAt) {
      updateData.status = 'SIGNED';
    } else {
      updateData.status = 'REVIEW';
    }
  }

  const updated = await db.contract.update({
    where: { id: contractId },
    data: updateData,
  });

  return mapContractToInterface(updated);
}

/**
 * Terminate a contract early
 * إنهاء عقد مبكراً
 */
export async function terminateContract(
  contractId: string,
  reason: string,
  effectiveDate: Date
): Promise<Contract> {
  const contract = await db.contract.findUnique({ where: { id: contractId } });

  if (!contract) {
    throw new Error('Contract not found');
  }

  if (!['SIGNED', 'ACTIVE'].includes(contract.status)) {
    throw new Error('Can only terminate active contracts');
  }

  const updated = await db.contract.update({
    where: { id: contractId },
    data: {
      status: 'TERMINATED',
      endDate: effectiveDate,
    },
  });

  return mapContractToInterface(updated);
}

/**
 * Extend a contract
 * تمديد عقد
 */
export async function extendContract(
  contractId: string,
  newEndDate: Date,
  amendmentTerms: string
): Promise<Contract> {
  const contract = await db.contract.findUnique({ where: { id: contractId } });

  if (!contract) {
    throw new Error('Contract not found');
  }

  if (!['ACTIVE', 'SIGNED'].includes(contract.status)) {
    throw new Error('Can only extend active contracts');
  }

  const updated = await db.contract.update({
    where: { id: contractId },
    data: {
      endDate: newEndDate,
      version: { increment: 1 },
    },
  });

  return mapContractToInterface(updated);
}

/**
 * Amend a contract with changes
 * تعديل عقد بتغييرات
 */
export async function amendContract(
  contractId: string,
  changes: ContractChange[]
): Promise<Contract> {
  const contract = await db.contract.findUnique({ where: { id: contractId } });

  if (!contract) {
    throw new Error('Contract not found');
  }

  if (!['ACTIVE', 'SIGNED'].includes(contract.status)) {
    throw new Error('Can only amend active contracts');
  }

  // Apply changes to clauses
  const clauses: ContractClause[] = typeof contract.clauses === 'string'
    ? JSON.parse(contract.clauses)
    : [];

  for (const change of changes) {
    const clauseIndex = clauses.findIndex(c => c.id === change.clauseId);
    if (clauseIndex >= 0) {
      (clauses[clauseIndex] as any)[change.field] = change.newValue;
    }
  }

  const updated = await db.contract.update({
    where: { id: contractId },
    data: {
      clauses: clauses as any,
      version: { increment: 1 },
    },
  });

  return mapContractToInterface(updated);
}

/**
 * Get contract by ID
 * الحصول على عقد حسب المعرف
 */
export async function getContractById(contractId: string): Promise<Contract | null> {
  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: {
      attachments: true,
    },
  });

  if (!contract) {
    return null;
  }

  return mapContractToInterface(contract);
}

/**
 * List contracts with filters
 * قائمة العقود مع تصفية
 */
export async function listContracts(filters?: {
  status?: ContractStatus;
  type?: ContractType;
  createdBy?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: Contract[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.type) where.contractType = filters.type;
  if (filters?.createdBy) where.createdBy = filters.createdBy;

  const [contracts, total] = await Promise.all([
    db.contract.findMany({
      where,
      include: { attachments: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    db.contract.count({ where }),
  ]);

  return {
    data: contracts.map(mapContractToInterface),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
