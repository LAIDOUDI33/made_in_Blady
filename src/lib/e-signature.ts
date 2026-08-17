// E-Signature Service
// خدمة التوقيع الإلكتروني
// Service de signature électronique

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
  signerRole: 'PARTY_A' | 'PARTY_B' | 'WITNESS';
  
  // Signature content (base64 image or typed text)
  signatureType: 'DRAWN' | 'TYPED';
  signatureContent: string; // Base64 data URL or text
  
  // Timestamp
  signedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  
  // Verification
  hash: string;
  certificateId?: string;
}

export interface AuditLogEntry {
  id: string;
  contractId: string;
  action: 'SIGNATURE_REQUESTED' | 'SIGNED' | 'REJECTED' | 'EXPIRED' | 'VIEWED' | 'DOWNLOADED';
  actorId: string;
  actorName: string;
  timestamp: Date;
  details: string;
  ipAddress?: string;
}

export interface CertificateOfAuthenticity {
  contractId: string;
  contractNumber: string;
  generatedAt: Date;
  signatures: SignatureData[];
  auditTrail: AuditLogEntry[];
  verificationHash: string;
  tamperEvidentSeal: string;
}

// ============================================
// SIGNATURE FUNCTIONS
// ============================================

/**
 * Create a signature record
 * إنشاء سجل توقيع
 */
export function createSignatureRecord(params: {
  contractId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  signerRole: 'PARTY_A' | 'PARTY_B' | 'WITNESS';
  signatureType: 'DRAWN' | 'TYPED';
  signatureContent: string;
  ipAddress?: string;
  userAgent?: string;
}): SignatureData {
  const signature: SignatureData = {
    id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...params,
    signedAt: new Date(),
    hash: generateSignatureHash(params.signatureContent, params.contractId, params.signerId),
  };

  return signature;
}

/**
 * Verify a signature's integrity
 * التحقق من سلامة التوقيع
 */
export function verifySignatureIntegrity(signature: SignatureData): boolean {
  const expectedHash = generateSignatureHash(
    signature.signatureContent,
    signature.contractId,
    signature.signerId
  );

  return expectedHash === signature.hash;
}

/**
 * Generate a unique hash for signature verification
 * توليد تجزئة فريدة للتحقق من التوقيع
 */
function generateSignatureHash(content: string, contractId: string, signerId: string): string {
  const data = `${content}-${contractId}-${signerId}-${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Add entry to audit log
 * إضافة إدخال لسجل التدقيق
 */
export function addAuditLogEntry(params: {
  contractId: string;
  action: AuditLogEntry['action'];
  actorId: string;
  actorName: string;
  details: string;
  ipAddress?: string;
}): AuditLogEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...params,
    timestamp: new Date(),
  };
}

/**
 * Generate Certificate of Authenticity
 * توليد شهادة أصالة
 */
export function generateCertificateOfAuthenticity(params: {
  contractId: string;
  contractNumber: string;
  signatures: SignatureData[];
  auditTrail: AuditLogEntry[];
}): CertificateOfAuthenticity {
  const signaturesData = JSON.stringify(params.signatures.map(s => ({
    signerId: s.signerId,
    signerName: s.signerName,
    signedAt: s.signedAt,
    hash: s.hash,
  })));

  const auditData = JSON.stringify(params.auditTrail.map(a => ({
    action: a.action,
    actorName: a.actorName,
    timestamp: a.timestamp,
  })));

  const combinedData = `${params.contractId}-${signaturesData}-${auditData}`;

  return {
    contractId: params.contractId,
    contractNumber: params.contractNumber,
    generatedAt: new Date(),
    signatures: params.signatures,
    auditTrail: params.auditTrail,
    verificationHash: crypto.createHash('sha256').update(combinedData).digest('hex'),
    tamperEvidentSeal: generateTamperEvidentSeal(combinedData),
  };
}

/**
 * Generate tamper-evident seal
 * توليد ختم مضاد للتلاعب
 */
function generateTamperEvidentSeal(data: string): string {
  const hash = crypto.createHash('sha512').update(data + '-SEAL-' + Date.now()).digest('hex');
  return `TEAL-${hash.substring(0, 32)}-${hash.substring(32, 64)}`;
}

/**
 * Verify document integrity using certificate
 * التحقق من سلامة المستند باستخدام الشهادة
 */
export function verifyDocumentIntegrity(certificate: CertificateOfAuthenticity): boolean {
  const signaturesData = JSON.stringify(certificate.signatures.map(s => ({
    signerId: s.signerId,
    signerName: s.signerName,
    signedAt: s.signedAt,
    hash: s.hash,
  })));

  const auditData = JSON.stringify(certificate.auditTrail.map(a => ({
    action: a.action,
    actorName: a.actorName,
    timestamp: a.timestamp,
  })));

  const combinedData = `${certificate.contractId}-${signaturesData}-${auditData}`;
  const computedHash = crypto.createHash('sha256').update(combinedData).digest('hex');

  return computedHash === certificate.verificationHash;
}

/**
 * Check if document has been tampered with
 * فحص ما إذا كان المستند قد تم العبث به
 */
export function checkForTampering(certificate: CertificateOfAuthenticity): {
  isTampered: boolean;
  message: string;
  messageAr: string;
  messageFr: string;
} {
  const isValid = verifyDocumentIntegrity(certificate);

  if (!isValid) {
    return {
      isTampered: true,
      message: 'WARNING: Document integrity check failed. This document may have been tampered with.',
      messageAr: 'تحذير: فشل فحص سلامة المستند. ربما تم العبث بهذا المستند.',
      messageFr: "ATTENTION: La vérification d'intégrité a échoué. Ce document a peut-être été altéré.",
    };
  }

  // Also verify individual signatures
  for (const sig of certificate.signatures) {
    if (!verifySignatureIntegrity(sig)) {
      return {
        isTampered: true,
        message: `WARNING: Signature from ${sig.signerName} appears to be invalid or tampered.`,
        messageAr: `تحذير: يبدو أن توقيع ${sig.signerName} غير صالح أو تم العبث به.`,
        messageFr: `ATTENTION: La signature de ${sig.signerName} semble invalide ou altérée.`,
      };
    }
  }

  return {
    isTampered: false,
    message: 'Document integrity verified. All signatures are valid.',
    messageAr: 'تم التحقق من سلامة المستند. جميع التوقيعات صالحة.',
    messageFr: "Intégrité du document vérifiée. Toutes les signatures sont valides.",
  };
}

/**
 * Export audit trail as formatted text
 * تصدير سجل التدقيق كنص منسق
 */
export function formatAuditTrail(auditTrail: AuditLogEntry[], language: 'en' | 'ar' | 'fr' = 'en'): string {
  if (language === 'ar') {
    return auditTrail.map(entry => 
      `[${new Date(entry.timestamp).toLocaleString('ar-DZ')}] ${entry.action}: ${entry.details} - بواسطة ${entry.actorName}`
    ).join('\n');
  }

  if (language === 'fr') {
    return auditTrail.map(entry => 
      `[${new Date(entry.timestamp).toLocaleString('fr-FR')}] ${entry.action}: ${entry.details} - par ${entry.actorName}`
    ).join('\n');
  }

  return auditTrail.map(entry => 
    `[${new Date(entry.timestamp).toLocaleString()}] ${entry.action}: ${entry.details} - by ${entry.actorName}`
  ).join('\n');
}

/**
 * Get signature status summary
 * الحصول على ملخص حالة التوقيع
 */
export function getSignatureStatusSummary(signatures: SignatureData[]): {
  totalRequired: number;
  totalSigned: number;
  pendingSigners: { name: string; role: string }[];
  isFullySigned: boolean;
} {
  const partyASig = signatures.find(s => s.signerRole === 'PARTY_A');
  const partyBSig = signatures.find(s => s.signerRole === 'PARTY_B');

  const pendingSigners: { name: string; role: string }[] = [];
  if (!partyASig) pendingSigners.push({ name: 'Party A', role: 'Supplier' });
  if (!partyBSig) pendingSigners.push({ name: 'Party B', role: 'Buyer' });

  return {
    totalRequired: 2,
    totalSigned: [partyASig, partyBSig].filter(Boolean).length,
    pendingSigners,
    isFullySigned: !!partyASig && !!partyBSig,
  };
}
