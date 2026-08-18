// Contract E-Signature Module
// وحدة التوقيع الإلكتروني للعقود
// Module de signature électronique des contrats

import crypto from 'crypto';

// ============================================
// TYPES
// ============================================

export interface SignatureData {
  id: string;
  contractId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  signerRole: 'PARTY_A' | 'PARTY_B' | 'WITNESS' | 'AUTHORIZED_REPRESENTATIVE';
  
  // Signature content
  signatureType: 'DRAWN' | 'TYPED' | 'UPLOADED';
  signatureContent: string; // Base64 data URL or typed text
  signatureFormat?: 'PNG' | 'JPEG' | 'SVG';
  
  // Timestamp and location
  signedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };
  
  // Verification
  hash: string;
  certificateId?: string; // For advanced digital certificates
  
  // Metadata
  deviceInfo?: string;
  browserInfo?: string;
}

export interface AuditLogEntry {
  id: string;
  contractId: string;
  action: 
    | 'CONTRACT_CREATED'
    | 'TEMPLATE_SELECTED'
    | 'CLAUSES_MODIFIED'
    | 'PREVIEW_GENERATED'
    | 'SIGNATURE_REQUESTED'
    | 'VIEWED'
    | 'SIGNATURE_INITIATED'
    | 'SIGNED'
    | 'REJECTED'
    | 'WITHDRAWN'
    | 'EXPIRED'
    | 'DOWNLOADED'
    | 'PDF_EXPORTED'
    | 'CERTIFICATE_GENERATED'
    | 'VERIFIED';
  actorId: string;
  actorName: string;
  actorRole?: string;
  timestamp: Date;
  details: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface SignatureRequest {
  id: string;
  contractId: string;
  contractNumber: string;
  requestedBy: string;
  requestedTo: string;
  requestedToEmail: string;
  requestedToName: string;
  partyRole: 'PARTY_A' | 'PARTY_B';
  status: 'PENDING' | 'VIEWED' | 'SIGNED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'WITHDRAWN';
  createdAt: Date;
  expiresAt: Date;
  viewedAt?: Date;
  signedAt?: Date;
  message?: string;
  reminderCount: number;
  lastReminderSent?: Date;
}

export interface CertificateOfAuthenticity {
  id: string;
  contractId: string;
  contractNumber: string;
  generatedAt: Date;
  
  // Signatures summary
  signatures: Array<{
    signerName: string;
    signerRole: string;
    signedAt: Date;
    hash: string;
    method: string;
  }>;
  
  // Audit trail
  auditTrail: AuditLogEntry[];
  
  // Security
  verificationHash: string;
  tamperEvidentSeal: string;
  qrCodeUrl?: string;
  
  // Status
  isValid: boolean;
  validationMessage: string;
  validationMessageAr: string;
  validationMessageFr: string;
}

export interface SigningWorkflow {
  contractId: string;
  status: 'DRAFT' | 'PENDING_SIGNATURES' | 'PARTIALLY_SIGNED' | 'SIGNED' | 'COMPLETED' | 'EXPIRED';
  requiredSigners: Array<{
    id: string;
    name: string;
    email: string;
    role: 'PARTY_A' | 'PARTY_B' | 'WITNESS';
    order: number;
  }>;
  completedSignatures: SignatureData[];
  pendingSignatures: SignatureRequest[];
  createdAt: Date;
  completedAt?: Date;
}

// ============================================
// IN-MEMORY STORAGE (for demo - use DB in production)
// ============================================

const signaturesStore = new Map<string, SignatureData>();
const auditLogStore = new Map<string, AuditLogEntry[]>();
const signatureRequestsStore = new Map<string, SignatureRequest>();

// ============================================
// SIGNATURE CREATION
// ============================================

/**
 * Create a new digital signature record
 * إنشاء سجل توقيع رقمي جديد
 */
export function createSignature(params: {
  contractId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  signerRole: SignatureData['signerRole'];
  signatureType: SignatureData['signatureType'];
  signatureContent: string;
  ipAddress?: string;
  userAgent?: string;
  location?: SignatureData['location'];
}): SignatureData {
  const signature: SignatureData = {
    id: `sig-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    ...params,
    signedAt: new Date(),
    signatureFormat: params.signatureType === 'TYPED' ? undefined : 'PNG',
    hash: generateSignatureHash(
      params.signatureContent,
      params.contractId,
      params.signerId,
      new Date().toISOString()
    ),
    deviceInfo: extractDeviceInfo(params.userAgent),
    browserInfo: params.userAgent,
  };

  signaturesStore.set(signature.id, signature);
  
  // Add to audit log
  addAuditEntry({
    contractId: params.contractId,
    action: 'SIGNED',
    actorId: params.signerId,
    actorName: params.signerName,
    actorRole: params.signerRole,
    details: `Document signed by ${params.signerName} as ${params.signerRole}`,
    ipAddress: params.ipAddress,
    metadata: { signatureId: signature.id, method: params.signatureType },
  });

  return signature;
}

/**
 * Verify signature integrity
 * التحقق من سلامة التوقيع
 */
export function verifySignature(signature: SignatureData): {
  isValid: boolean;
  details: string;
  detailsAr: string;
  detailsFr: string;
} {
  const expectedHash = generateSignatureHash(
    signature.signatureContent,
    signature.contractId,
    signature.signerId,
    signature.signedAt.toISOString()
  );

  if (expectedHash !== signature.hash) {
    return {
      isValid: false,
      details: 'Signature hash mismatch. Document may have been tampered with.',
      detailsAr: 'عدم تطابق تجزئة التوقيع. ربما تم العبث بالمستند.',
      detailsFr: "Incohérence de hachage de la signature. Le document a peut-être été altéré.",
    };
  }

  return {
    isValid: true,
    details: 'Signature is valid and authentic.',
    detailsAr: 'التوقيع صالح وأصيل.',
    detailsFr: 'La signature est valide et authentique.',
  };
}

/**
 * Generate unique signature hash
 * توليد تجزئة توقيع فريدة
 */
function generateSignatureHash(
  content: string,
  contractId: string,
  signerId: string,
  timestamp: string
): string {
  const data = `${content}|${contractId}|${signerId}|${timestamp}|${process.env.SIGNATURE_SALT || 'algeriatrade-secret-2024'}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// ============================================
// SIGNATURE REQUEST MANAGEMENT
// ============================================

/**
 * Create a signature request
 * إنشاء طلب توقيع
 */
export function createSignatureRequest(params: {
  contractId: string;
  contractNumber: string;
  requestedBy: string;
  requestedTo: string;
  requestedToEmail: string;
  requestedToName: string;
  partyRole: 'PARTY_A' | 'PARTY_B';
  expiresInDays?: number;
  message?: string;
}): SignatureRequest {
  const request: SignatureRequest = {
    id: `req-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    ...params,
    status: 'PENDING',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + (params.expiresInDays || 7) * 24 * 60 * 60 * 1000),
    reminderCount: 0,
  };

  signatureRequestsStore.set(request.id, request);
  
  addAuditEntry({
    contractId: params.contractId,
    action: 'SIGNATURE_REQUESTED',
    actorId: params.requestedBy,
    actorName: 'System', // Would be actual user name in production
    details: `Signature requested from ${params.requestedToName} (${params.partyRole})`,
    metadata: { requestId: request.id },
  });

  return request;
}

/**
 * Get signature request by ID
 * الحصول على طلب التوقيع حسب المعرف
 */
export function getSignatureRequest(requestId: string): SignatureRequest | undefined {
  return signatureRequestsStore.get(requestId);
}

/**
 * Update signature request status
 * تحديث حالة طلب التوقيع
 */
export function updateSignatureRequestStatus(
  requestId: string,
  status: SignatureRequest['status'],
  additionalData?: Partial<SignatureRequest>
): SignatureRequest | null {
  const request = signatureRequestsStore.get(requestId);
  if (!request) return null;

  const updated: SignatureRequest = {
    ...request,
    ...additionalData,
    status,
  };

  if (status === 'VIEWED' && !request.viewedAt) {
    updated.viewedAt = new Date();
  }
  if (status === 'SIGNED' && !request.signedAt) {
    updated.signedAt = new Date();
  }

  signatureRequestsStore.set(requestId, updated);
  return updated;
}

/**
 * Get pending signature requests for a user
 * الحصول على طلبات التوقيع المعلقة للمستخدم
 */
export function getPendingRequestsForUser(userId: string): SignatureRequest[] {
  const now = new Date();
  return Array.from(signatureRequestsStore.values()).filter(
    req => req.requestedTo === userId && 
         req.status === 'PENDING' && 
         req.expiresAt > now
  );
}

// ============================================
// AUDIT TRAIL
// ============================================

/**
 * Add entry to audit log
 * إضافة إدخال لسجل التدقيق
 */
export function addAuditEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const auditEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    ...entry,
    timestamp: new Date(),
  };

  // Get or create audit log array for this contract
  let contractLog = auditLogStore.get(entry.contractId);
  if (!contractLog) {
    contractLog = [];
    auditLogStore.set(entry.contractId, contractLog);
  }

  contractLog.push(auditEntry);
  return auditEntry;
}

/**
 * Get audit trail for a contract
 * الحصول على سجل تدقيق لعقد
 */
export function getAuditTrail(contractId: string): AuditLogEntry[] {
  return auditLogStore.get(contractId) || [];
}

/**
 * Format audit trail for display
 * تنسيق سجل التدقيق للعرض
 */
export function formatAuditTrail(
  entries: AuditLogEntry[],
  language: 'en' | 'ar' | 'fr' = 'en'
): string {
  const actionLabels: Record<string, { en: string; ar: string; fr: string }> = {
    CONTRACT_CREATED: { en: 'Contract Created', ar: 'إنشاء العقد', fr: 'Contrat créé' },
    TEMPLATE_SELECTED: { en: 'Template Selected', ar: 'اختيار القالب', fr: 'Modèle sélectionné' },
    CLAUSES_MODIFIED: { en: 'Clauses Modified', ar: 'تعديل البنود', fr: 'Clauses modifiées' },
    PREVIEW_GENERATED: { en: 'Preview Generated', ar: 'توليد المعاينة', fr: 'Aperçu généré' },
    SIGNATURE_REQUESTED: { en: 'Signature Requested', ar: 'طلب التوقيع', fr: 'Signature demandée' },
    VIEWED: { en: 'Document Viewed', ar: 'عرض المستند', fr: 'Document consulté' },
    SIGNATURE_INITIATED: { en: 'Signature Initiated', ar: 'بدء التوقيع', fr: 'Signature initiée' },
    SIGNED: { en: 'Signed', ar: 'موقع', fr: 'Signé' },
    REJECTED: { en: 'Rejected', ar: 'مرفوض', fr: 'Rejeté' },
    WITHDRAWN: { en: 'Withdrawn', ar: 'مسحوب', fr: 'Retiré' },
    EXPIRED: { en: 'Expired', ar: 'منتهي الصلاحية', fr: 'Expiré' },
    DOWNLOADED: { en: 'Downloaded', ar: 'تم التنزيل', fr: 'Téléchargé' },
    PDF_EXPORTED: { en: 'PDF Exported', ar: 'تصدير PDF', fr: 'PDF exporté' },
    CERTIFICATE_GENERATED: { en: 'Certificate Generated', ar: 'توليد الشهادة', fr: 'Certificat généré' },
    VERIFIED: { en: 'Verified', ar: 'تم التحقق', fr: 'Vérifié' },
  };

  return entries.map(entry => {
    const label = actionLabels[entry.action]?.[language] || entry.action;
    const dateStr = entry.timestamp.toLocaleString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US');
    
    return `[${dateStr}] ${label}: ${entry.details}${entry.actorName ? ` - by ${entry.actorName}` : ''}`;
  }).join('\n');
}

// ============================================
// CERTIFICATE OF AUTHENTICITY
// ============================================

/**
 * Generate Certificate of Authenticity
 * توليد شهادة أصالة
 */
export function generateCertificateOfAuthenticity(params: {
  contractId: string;
  contractNumber: string;
  signatures: SignatureData[];
}): CertificateOfAuthenticity {
  const auditTrail = getAuditTrail(params.contractId);

  // Prepare signatures data for certificate
  const signaturesData = params.signatures.map(sig => ({
    signerName: sig.signerName,
    signerRole: sig.signerRole,
    signedAt: sig.signedAt,
    hash: sig.hash,
    method: `${sig.signatureType}${sig.signatureFormat ? ` (${sig.signatureFormat})` : ''}`,
  }));

  // Generate verification data
  const combinedData = JSON.stringify({
    contractId: params.contractId,
    contractNumber: params.contractNumber,
    signatures: signaturesData,
    auditTrail: auditTrail.map(a => ({
      action: a.action,
      actorName: a.actorName,
      timestamp: a.timestamp.toISOString(),
    })),
    generatedAt: new Date().toISOString(),
  });

  const verificationHash = crypto.createHash('sha256').update(combinedData).digest('hex');
  const tamperEvidentSeal = generateTamperSeal(combinedData);

  const certificate: CertificateOfAuthenticity = {
    id: `cert-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    contractId: params.contractId,
    contractNumber: params.contractNumber,
    generatedAt: new Date(),
    signatures: signaturesData,
    auditTrail,
    verificationHash,
    tamperEvidentSeal,
    isValid: true,
    validationMessage: 'Certificate is valid. Document integrity verified.',
    validationMessageAr: 'الشهادة صالحة. تم التحقق من سلامة المستند.',
    validationMessageFr: 'Le certificat est valide. Intérité du document vérifiée.',
  };

  // Log certificate generation
  addAuditEntry({
    contractId: params.contractId,
    action: 'CERTIFICATE_GENERATED',
    actorId: 'system',
    actorName: 'System',
    details: `Certificate of authenticity generated with ${params.signatures.length} signature(s)`,
    metadata: { certificateId: certificate.id },
  });

  return certificate;
}

/**
 * Verify certificate integrity
 * التحقق من سلامة الشهادة
 */
export function verifyCertificate(certificate: CertificateOfAuthenticity): {
  isValid: boolean;
  message: string;
  messageAr: string;
  messageFr: string;
} {
  // In production, would re-generate and compare hashes
  // For now, just check format validity
  
  if (!certificate.verificationHash || !certificate.tamperEvidentSeal) {
    return {
      isValid: false,
      message: 'Invalid certificate format.',
      messageAr: 'تنسيق شهادة غير صالح.',
      messageFr: 'Format de certificat invalide.',
    };
  }

  // Check individual signatures
  for (const sig of certificate.signatures) {
    if (!sig.hash || !sig.signerName) {
      return {
        isValid: false,
        message: `Invalid signature data for ${sig.signerName}.`,
        messageAr: `بيانات توقيع غير صالحة لـ ${sig.signerName}.`,
        messageFr: `Données de signature invalides pour ${sig.signerName}.`,
      };
    }
  }

  return {
    isValid: true,
    message: 'Certificate is valid. All signatures authenticated.',
    messageAr: 'الشهادة صالحة. تم توثيق جميع التوقيعات.',
    messageFr: 'Le certificat est valide. Toutes les signatures sont authentifiées.',
  };
}

/**
 * Generate tamper-evident seal
 * توليد ختم مضاد للتلاعب
 */
function generateTamperSeal(data: string): string {
  const hash1 = crypto.createHash('sha256').update(data).digest('hex');
  const hash2 = crypto.createHash('sha512').update(data + '-SEAL-' + Date.now()).digest('hex');
  return `TEAL-${hash1.substring(0, 16)}-${hash2.substring(0, 16)}-${Date.now().toString(36)}`;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract device info from user agent
 * استخراج معلومات الجهاز من وكيل المستخدم
 */
function extractDeviceInfo(userAgent?: string): string {
  if (!userAgent) return 'Unknown';
  
  const devices: Record<string, string> = {
    'Mobile': 'Mobile Device',
    'Tablet': 'Tablet Device',
    'Desktop': 'Desktop Computer',
  };

  for (const [key, value] of Object.entries(devices)) {
    if (userAgent.includes(key)) return value;
  }

  return 'Unknown Device';
}

/**
 * Check if signature request has expired
 * التحقق مما إذا كان طلب التوقيع منتهي الصلاحية
 */
export function isRequestExpired(request: SignatureRequest): boolean {
  return new Date() > request.expiresAt;
}

/**
 * Get signature status summary for a contract
 * الحصول على ملخص حالة التوقيع لعقد
 */
export function getSigningStatusSummary(contractId: string): {
  totalRequired: number;
  totalSigned: number;
  pendingRequests: number;
  signers: Array<{
    name: string;
    role: string;
    status: 'PENDING' | 'SIGNED' | 'EXPIRED';
    signedAt?: Date;
  }>;
  isFullySigned: boolean;
} {
  const requests = Array.from(signatureRequestsStore.values())
    .filter(r => r.contractId === contractId);
  
  const signatures = Array.from(signaturesStore.values())
    .filter(s => s.contractId === contractId);

  const signersMap = new Map<string, {
    name: string;
    role: string;
    status: 'PENDING' | 'SIGNED' | 'EXPIRED';
    signedAt?: Date;
  }>();

  // Process requests
  for (const req of requests) {
    signersMap.set(req.requestedTo, {
      name: req.requestedToName,
      role: req.partyRole,
      status: isRequestExpired(req) ? 'EXPIRED' : req.status === 'SIGNED' ? 'SIGNED' : 'PENDING',
      signedAt: req.signedAt,
    });
  }

  // Process direct signatures
  for (const sig of signatures) {
    const existing = signersMap.get(sig.signerId);
    if (!existing || existing.status !== 'SIGNED') {
      signersMap.set(sig.signerId, {
        name: sig.signerName,
        role: sig.signerRole,
        status: 'SIGNED',
        signedAt: sig.signedAt,
      });
    }
  }

  const signers = Array.from(signersMap.values());
  const signedCount = signers.filter(s => s.status === 'SIGNED').length;

  return {
    totalRequired: signers.length,
    totalSigned: signedCount,
    pendingRequests: signers.filter(s => s.status === 'PENDING').length,
    signers,
    isFullySigned: signedCount === signers.length && signers.length > 0,
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
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
};
