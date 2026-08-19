// Blockchain Supply Chain Core Service for AlgeriaTrade.dz
// Implements hash-based provenance tracking, immutable audit trails,
// smart contract simulation, QR code generation, and digital certificates

import { createHash, randomBytes, createHmac } from 'crypto';
import QRCode from 'qrcode';
import type {
  ProvenanceRecord,
  SupplyChainEvent,
  SupplyChainEventType,
  Block,
  Certificate,
  CertificateType,
  CertificateIssuer,
  VerificationResult,
  VerificationCheck,
  VerificationStatus,
  ProductCategory,
  Location,
  ManufacturerInfo,
  EscrowState,
  ReleaseCondition,
  BatchCertificationInput,
  SupplyChainStats
} from './types';

// ============================================================================
// CRYPTOGRAPHIC UTILITIES
// ============================================================================

/**
 * Generate SHA-256 hash of data
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Generate HMAC-SHA256 for data integrity verification with key
 */
export function hmacSha256(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Generate a unique ID with cryptographic randomness
 */
export function generateId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate a certificate number in Algerian format
 */
export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `DZ-CERT-${year}-${random}`;
}

/**
 * Generate batch number for products
 */
export function generateBatchNumber(prefix: string = 'DZ'): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${date}-${random}`;
}

// ============================================================================
// BLOCKCHAIN CORE - BLOCK GENERATION & CHAINING
// ============================================================================

const GENESIS_HASH = '0'.repeat(64); // Genesis block previous hash

interface BlockData {
  eventType: SupplyChainEventType;
  timestamp: string;
  location: Location;
  performedBy: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Calculate block hash using proof-of-work simulation (simplified)
 */
function calculateBlockHash(
  index: number,
  timestamp: string,
  eventData: string,
  previousHash: string,
  nonce: number
): string {
  const data = `${index}${timestamp}${eventData}${previousHash}${nonce}`;
  return sha256(data);
}

/**
 * Mine a block (proof-of-work simulation) - finds nonce that produces hash starting with specified difficulty
 */
function mineBlock(
  index: number,
  timestamp: string,
  eventData: string,
  previousHash: string,
  difficulty: number = 2
): { hash: string; nonce: number } {
  let nonce = 0;
  const prefix = '0'.repeat(difficulty);
  
  while (true) {
    const hash = calculateBlockHash(index, timestamp, eventData, previousHash, nonce);
    if (hash.startsWith(prefix)) {
      return { hash, nonce };
    }
    nonce++;
    
    // Safety limit to prevent infinite loops
    if (nonce > 1000000) {
      break;
    }
  }
  
  return { hash: calculateBlockHash(index, timestamp, eventData, previousHash, 0), nonce: 0 };
}

/**
 * Create a new block in the supply chain
 */
export function createBlock(
  blockData: BlockData,
  previousBlock: Block | null,
  blockIndex: number
): Block {
  const timestamp = blockData.timestamp || new Date().toISOString();
  const previousHash = previousBlock?.hash || GENESIS_HASH;
  
  // Serialize event data for hashing
  const eventData = JSON.stringify({
    eventType: blockData.eventType,
    location: blockData.location,
    performedBy: blockData.performedBy,
    description: blockData.description,
    metadata: blockData.metadata
  });
  
  // Mine the block
  const { hash, nonce } = mineBlock(blockIndex, timestamp, eventData, previousHash, 2);
  
  const event: SupplyChainEvent = {
    id: generateId(),
    eventType: blockData.eventType,
    timestamp,
    location: blockData.location,
    performedBy: blockData.performedBy,
    description: blockData.description,
    metadata: blockData.metadata,
    hash,
    previousHash,
    blockIndex,
    attachments: []
  };
  
  return {
    index: blockIndex,
    timestamp,
    data: event,
    previousHash,
    hash,
    nonce
  };
}

/**
 * Verify chain integrity - validates all blocks are properly linked
 */
export function verifyChainIntegrity(blocks: Block[]): boolean {
  if (blocks.length === 0) return true;
  
  // Verify genesis block
  if (blocks[0].previousHash !== GENESIS_HASH) {
    return false;
  }
  
  for (let i = 0; i < blocks.length; i++) {
    const currentBlock = blocks[i];
    
    // Verify hash is valid
    const expectedHash = calculateBlockHash(
      currentBlock.index,
      currentBlock.timestamp,
      JSON.stringify(currentBlock.data),
      currentBlock.previousHash,
      currentBlock.nonce
    );
    
    if (currentBlock.hash !== expectedHash) {
      return false;
    }
    
    // Verify chain linkage
    if (i > 0) {
      if (currentBlock.previousHash !== blocks[i - 1].hash) {
        return false;
      }
    }
  }
  
  return true;
}

// ============================================================================
// PROVENANCE RECORD MANAGEMENT
// ============================================================================

// In-memory store for provenance records (would be database in production)
const provenanceStore = new Map<string, ProvenanceRecord>();
const certificateStore = new Map<string, Certificate>();

/**
 * Create a new provenance record
 */
export function createProvenanceRecord(params: {
  productId: string;
  productName: string;
  productSku?: string;
  category: ProductCategory;
  manufacturer: Omit<ManufacturerInfo, 'id'>;
  initialLocation: Location;
}): ProvenanceRecord {
  const id = generateId();
  const batchNumber = generateBatchNumber('DZ');
  const now = new Date().toISOString();
  
  // Create genesis block (manufacturing event)
  const manufacturingEvent = createBlock(
    {
      eventType: 'manufacturing',
      timestamp: now,
      location: params.initialLocation,
      performedBy: params.manufacturer.name,
      description: `Product manufactured at ${params.initialLocation.city}, ${params.initialLocation.wilaya}`,
      metadata: {
        manufacturer: params.manufacturer.name,
        registrationNumber: params.manufacturer.registrationNumber
      }
    },
    null,
    0
  );
  
  const record: ProvenanceRecord = {
    id,
    productId: params.productId,
    productName: params.productName,
    productSku: params.productSku,
    batchNumber,
    category: params.category,
    manufacturer: {
      ...params.manufacturer,
      id: generateId()
    },
    events: [manufacturingEvent.data],
    currentStatus: 'pending',
    currentLocation: params.initialLocation,
    createdAt: now,
    updatedAt: now,
    rootHash: manufacturingEvent.hash,
    qrCodeData: generateQRCodeData(id, batchNumber),
    isSealed: false,
    certificates: []
  };
  
  provenanceStore.set(id, record);
  return record;
}

/**
 * Add an event to existing provenance record
 */
export function addSupplyChainEvent(
  recordId: string,
  eventData: {
    eventType: SupplyChainEventType;
    location: Location;
    performedBy: string;
    performedByName?: string;
    description: string;
    metadata?: Record<string, unknown>;
  }
): SupplyChainEvent | null {
  const record = provenanceStore.get(recordId);
  if (!record || record.isSealed) {
    return null;
  }
  
  const lastEvent = record.events[record.events.length - 1];
  const previousBlock: Block = {
    index: lastEvent.blockIndex,
    timestamp: lastEvent.timestamp,
    data: lastEvent,
    previousHash: lastEvent.previousHash,
    hash: lastEvent.hash,
    nonce: 0
  };
  
  const newBlock = createBlock(
    {
      ...eventData,
      timestamp: new Date().toISOString()
    },
    previousBlock,
    record.events.length
  );
  
  const event = {
    ...newBlock.data,
    performedByName: eventData.performedByName
  };
  
  record.events.push(event);
  record.currentLocation = eventData.location;
  record.updatedAt = new Date().toISOString();
  
  // Update status based on event type
  updateRecordStatus(record, eventData.eventType);
  
  provenanceStore.set(recordId, record);
  return event;
}

/**
 * Update record status based on latest event
 */
function updateRecordStatus(record: ProvenanceRecord, eventType: SupplyChainEventType): void {
  switch (eventType) {
    case 'quality_control':
      record.currentStatus = 'verified';
      break;
    case 'delivery':
      record.currentStatus = 'verified';
      break;
    case 'recall':
      record.currentStatus = 'flagged';
      break;
    case 'verification':
      record.currentStatus = 'verified';
      break;
    default:
      // Keep current status
      break;
  }
}

/**
 * Seal a provenance record (make it immutable)
 */
export function sealProvenanceRecord(recordId: string): boolean {
  const record = provenanceStore.get(recordId);
  if (!record || record.isSealed) {
    return false;
  }
  
  record.isSealed = true;
  
  // Calculate final root hash (Merkle-like root from all events)
  const allHashes = record.events.map(e => e.hash);
  record.rootHash = computeMerkleRoot(allHashes);
  
  provenanceStore.set(recordId, record);
  return true;
}

/**
 * Compute Merkle root from array of hashes
 */
function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return sha256('');
  if (hashes.length === 1) return hashes[0];
  
  const nextLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] || hashes[i]; // Duplicate last if odd
    nextLevel.push(sha256(left + right));
  }
  
  return computeMerkleRoot(nextLevel);
}

/**
 * Get provenance record by ID
 */
export function getProvenanceRecord(recordId: string): ProvenanceRecord | undefined {
  return provenanceStore.get(recordId);
}

/**
 * Get provenance record by product ID
 */
export function getProvenanceByProductId(productId: string): ProvenanceRecord | undefined {
  for (const record of provenanceStore.values()) {
    if (record.productId === productId) {
      return record;
    }
  }
  return undefined;
}

/**
 * Get provenance record by batch number
 */
export function getProvenanceByBatchNumber(batchNumber: string): ProvenanceRecord | undefined {
  for (const record of provenanceStore.values()) {
    if (record.batchNumber === batchNumber) {
      return record;
    }
  }
  return undefined;
}

/**
 * Get all provenance records
 */
export function getAllProvenanceRecords(): ProvenanceRecord[] {
  return Array.from(provenanceStore.values());
}

// ============================================================================
// VERIFICATION SYSTEM
// ============================================================================

/**
 * Verify product authenticity by hash or ID
 */
export function verifyProductAuthenticity(identifier: string): VerificationResult {
  const timestamp = new Date().toISOString();
  const checks: VerificationCheck[] = [];
  
  // Try to find record by various identifiers
  let record: ProvenanceRecord | undefined;
  
  // Check by record ID
  record = provenanceStore.get(identifier);
  
  // Check by batch number
  if (!record) {
    record = getProvenanceByBatchNumber(identifier);
  }
  
  // Check by product ID
  if (!record) {
    record = getProvenanceByProductId(identifier);
  }
  
  // Check if identifier itself might be a root hash
  if (!record) {
    for (const r of provenanceStore.values()) {
      if (r.rootHash === identifier || r.qrCodeData.includes(identifier)) {
        record = r;
        break;
      }
    }
  }
  
  if (!record) {
    return {
      isValid: false,
      record: null,
      checks: [{
        checkName: 'Record Existence',
        passed: false,
        details: `No provenance record found for identifier: ${identifier}`
      }],
      overallHash: sha256(`not-found-${timestamp}`),
      timestamp
    };
  }
  
  // Perform verification checks
  
  // 1. Chain Integrity Check
  const blocks: Block[] = record.events.map((event, idx) => ({
    index: event.blockIndex,
    timestamp: event.timestamp,
    data: event,
    previousHash: event.previousHash,
    hash: event.hash,
    nonce: 0
  }));
  
  const chainValid = verifyChainIntegrity(blocks);
  checks.push({
    checkName: 'Chain Integrity',
    passed: chainValid,
    details: chainValid 
      ? 'All blockchain links are valid and unbroken' 
      : 'Chain integrity compromised - possible tampering detected'
  });
  
  // 2. Root Hash Verification
  const computedRoot = computeMerkleRoot(record.events.map(e => e.hash));
  const rootHashValid = computedRoot === record.rootHash;
  checks.push({
    checkName: 'Root Hash',
    passed: rootHashValid,
    details: rootHashValid 
      ? 'Merkle root matches stored value' 
      : 'Root hash mismatch detected',
    expected: record.rootHash,
    actual: computedRoot
  });
  
  // 3. Manufacturer Verification
  const manufacturerVerified = record.manufacturer.verified;
  checks.push({
    checkName: 'Manufacturer Status',
    passed: manufacturerVerified,
    details: manufacturerVerified 
      ? `Manufacturer ${record.manufacturer.name} is verified` 
      : `Manufacturer ${record.manufacturer.name} is not verified`
  });
  
  // 4. Record Seal Status
  const isSealed = record.isSealed;
  checks.push({
    checkName: 'Immutability',
    passed: isSealed,
    details: isSealed 
      ? 'Record is sealed and immutable' 
      : 'Record can still be modified'
  });
  
  // 5. Event Timeline Consistency
  const timelineValid = verifyTimelineConsistency(record.events);
  checks.push({
    checkName: 'Timeline Consistency',
    passed: timelineValid,
    details: timelineValid 
      ? 'Events are in chronological order' 
      : 'Timeline inconsistency detected'
  });
  
  // 6. Certificate Validation (if any)
  if (record.certificates.length > 0) {
    const activeCerts = record.certificates.filter(c => c.status === 'active');
    checks.push({
      checkName: 'Certificates',
      passed: activeCerts.length > 0,
      details: `${activeCerts.length} of ${record.certificates.length} certificates are active`
    });
  }
  
  // Overall validity requires critical checks to pass
  const isValid = chainValid && rootHashValid && record.isSealed;
  
  return {
    isValid,
    record,
    checks,
    overallHash: sha256(JSON.stringify({ recordId: record.id, timestamp })),
    timestamp
  };
}

/**
 * Verify that events are in chronological order
 */
function verifyTimelineConsistency(events: SupplyChainEvent[]): boolean {
  for (let i = 1; i < events.length; i++) {
    const prevTime = new Date(events[i - 1].timestamp).getTime();
    const currTime = new Date(events[i].timestamp).getTime();
    if (currTime < prevTime) {
      return false;
    }
  }
  return true;
}

// ============================================================================
// CERTIFICATE MANAGEMENT
// ============================================================================

/**
 * Issue a digital certificate for a product
 */
export function issueCertificate(params: {
  provenanceId: string;
  type: CertificateType;
  issuer: Omit<CertificateIssuer, 'id' | 'signatureHash'>;
  expiryDate?: string;
  metadata?: Record<string, unknown>;
}): Certificate | null {
  const record = provenanceStore.get(params.provenanceId);
  if (!record) {
    return null;
  }
  
  const id = generateId();
  const now = new Date().toISOString();
  const signatureHash = hmacSha256(
    `${id}${params.type}${record.id}${now}`,
    process.env.CERTIFICATE_SECRET || 'algeriatrade-secret-key-2024'
  );
  
  const certificate: Certificate = {
    id,
    certificateNumber: generateCertificateNumber(),
    type: params.type,
    provenanceId: params.provenanceId,
    productId: record.productId,
    productName: record.productName,
    issuer: {
      ...params.issuer,
      id: generateId(),
      signatureHash
    },
    issueDate: now,
    expiryDate: params.expiryDate,
    status: 'active',
    hash: sha256(`${id}${signatureHash}${now}`),
    qrCodeData: generateCertificateQRData(id, params.type),
    metadata: params.metadata
  };
  
  // Add certification event to supply chain
  addSupplyChainEvent(params.provenanceId, {
    eventType: 'certification',
    location: record.currentLocation,
    performedBy: params.issuer.name,
    description: `${params.type} certificate issued: ${certificate.certificateNumber}`,
    metadata: {
      certificateId: id,
      certificateNumber: certificate.certificateNumber,
      type: params.type
    }
  });
  
  // Add certificate to record
  record.certificates.push(certificate);
  provenanceStore.set(params.provenanceId, record);
  
  // Store certificate
  certificateStore.set(id, certificate);
  
  return certificate;
}

/**
 * Revoke a certificate
 */
export function revokeCertificate(certificateId: string, reason: string): boolean {
  const cert = certificateStore.get(certificateId);
  if (!cert || cert.status !== 'active') {
    return false;
  }
  
  cert.status = 'revoked';
  cert.metadata = { ...cert.metadata, revocationReason: reason, revokedAt: new Date().toISOString() };
  certificateStore.set(certificateId, cert);
  
  // Update status in provenance record
  const record = provenanceStore.get(cert.provenanceId);
  if (record) {
    const certIndex = record.certificates.findIndex(c => c.id === certificateId);
    if (certIndex >= 0) {
      record.certificates[certIndex] = cert;
      provenanceStore.set(cert.provenanceId, record);
    }
  }
  
  return true;
}

/**
 * Get certificate by ID
 */
export function getCertificate(certificateId: string): Certificate | undefined {
  return certificateStore.get(certificateId);
}

/**
* Get all certificates
*/
export function getAllCertificates(): Certificate[] {
  return Array.from(certificateStore.values());
}

/**
 * Batch certify multiple products
 */
export function batchCertify(input: BatchCertificationInput): Certificate[] {
  const certificates: Certificate[] = [];
  
  for (const productId of input.productIds) {
    const record = getProvenanceByProductId(productId);
    if (record) {
      const cert = issueCertificate({
        provenanceId: record.id,
        type: input.certificateType,
        issuer: input.issuer,
        expiryDate: input.expiryDate,
        metadata: { ...input.notes && { notes: input.notes }, batchCertified: true }
      });
      if (cert) {
        certificates.push(cert);
      }
    }
  }
  
  return certificates;
}

// ============================================================================
// ESCROW SMART CONTRACT SIMULATION
// ============================================================================

/**
 * Initialize escrow state for a transaction
 */
export function initializeEscrow(params: {
  provenanceId: string;
  amount: number;
  currency: string;
  buyerId: string;
  sellerId: string;
}): EscrowState | null {
  const record = provenanceStore.get(params.provenanceId);
  if (!record) {
    return null;
  }
  
  const escrowState: EscrowState = {
    transactionId: generateId(),
    amount: params.amount,
    currency: params.currency,
    status: 'pending',
    buyerId: params.buyerId,
    sellerId: params.sellerId,
    releaseConditions: [
      {
        id: generateId(),
        type: 'escrow_funded',
        satisfied: false,
        description: 'Escrow must be funded by buyer'
      },
      {
        id: generateId(),
        type: 'customs_cleared',
        satisfied: false,
        description: 'Product must clear customs'
      },
      {
        id: generateId(),
        type: 'delivery_confirmed',
        satisfied: false,
        description: 'Delivery must be confirmed by buyer'
      }
    ]
  };
  
  record.escrowState = escrowState;
  provenanceStore.set(params.provenanceId, record);
  
  return escrowState;
}

/**
 * Fund escrow (simulated)
 */
export function fundEscrow(provenanceId: string): boolean {
  const record = provenanceStore.get(provenanceId);
  if (!record?.escrowState || record.escrowState.status !== 'pending') {
    return false;
  }
  
  record.escrowState.status = 'funded';
  record.escrowState.fundedAt = new Date().toISOString();
  
  // Mark funding condition as satisfied
  const fundedCond = record.escrowState.releaseConditions.find(c => c.type === 'escrow_funded');
  if (fundedCond) {
    fundedCond.satisfied = true;
    fundedCond.satisfiedAt = new Date().toISOString();
  }
  
  // Log escrow funded event
  addSupplyChainEvent(provenanceId, {
    eventType: 'escrow_funded',
    location: record.currentLocation,
    performedBy: record.escrowState.buyerId,
    description: `Escrow funded: ${record.escrowState.amount} ${record.escrowState.currency}`
  });
  
  provenanceStore.set(provenanceId, record);
  return true;
}

/**
 * Release escrow when conditions are met (smart contract logic)
 */
export function releaseEscrow(provenanceId: string): { success: boolean; message: string } {
  const record = provenanceStore.get(provenanceId);
  if (!record?.escrowState) {
    return { success: false, message: 'No escrow found for this transaction' };
  }
  
  if (record.escrowState.status !== 'funded') {
    return { success: false, message: 'Escrow is not in funded state' };
  }
  
  // Check all release conditions
  const unsatisfiedConditions = record.escrowState.releaseConditions.filter(c => !c.satisfied);
  
  if (unsatisfiedConditions.length > 0) {
    return {
      success: false,
      message: `Release conditions not met: ${unsatisfiedConditions.map(c => c.description).join(', ')}`
    };
  }
  
  // Execute release
  record.escrowState.status = 'released';
  record.escrowState.releasedAt = new Date().toISOString();
  
  // Log escrow released event
  addSupplyChainEvent(provenanceId, {
    eventType: 'escrow_released',
    location: record.currentLocation,
    performedBy: 'smart-contract',
    description: `Escrow released to seller: ${record.escrowState.amount} ${record.escrowState.currency}`
  });
  
  provenanceStore.set(provenanceId, record);
  return { success: true, message: 'Escrow successfully released to seller' };
}

/**
 * Satisfy a release condition
 */
export function satisfyReleaseCondition(
  provenanceId: string,
  conditionType: ReleaseCondition['type']
): boolean {
  const record = provenanceStore.get(provenanceId);
  if (!record?.escrowState) {
    return false;
  }
  
  const condition = record.escrowState.releaseConditions.find(c => c.type === conditionType);
  if (!condition || condition.satisfied) {
    return false;
  }
  
  condition.satisfied = true;
  condition.satisfiedAt = new Date().toISOString();
  
  provenanceStore.set(provenanceId, record);
  return true;
}

/**
 * Refund escrow
 */
export function refundEscrow(provenanceId: string, reason: string): boolean {
  const record = provenanceStore.get(provenanceId);
  if (!record?.escrowState || !['funded', 'pending'].includes(record.escrowState.status)) {
    return false;
  }
  
  record.escrowState.status = 'refunded';
  
  addSupplyChainEvent(provenanceId, {
    eventType: 'escrow_refunded',
    location: record.currentLocation,
    performedBy: 'system',
    description: `Escrow refunded: ${reason}`
  });
  
  provenanceStore.set(provenanceId, record);
  return true;
}

// ============================================================================
// QR CODE GENERATION
// ============================================================================

/**
 * Generate QR code data for provenance record
 */
function generateQRCodeData(recordId: string, batchNumber: string): string {
  const data = {
    type: 'algeriatrade-provenance',
    version: '1.0',
    recordId,
    batchNumber,
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://algeriatrade.dz'}/verify/${recordId}`,
    verified: false
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Generate QR code data for certificate
 */
function generateCertificateQRData(certificateId: string, type: CertificateType): string {
  const data = {
    type: 'algeriatrade-certificate',
    version: '1.0',
    certificateId,
    certificateType: type,
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://algeriatrade.dz'}/certificate/${certificateId}`
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Generate QR code as base64 image (for display/download)
 */
export async function generateQRCodeImage(data: string, options?: {
  size?: number;
  margin?: number;
  color?: { dark?: string; light?: string };
}): Promise<string> {
  const defaults = {
    size: 300,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' }
  };
  
  const opts = { ...defaults, ...options };
  
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: opts.size,
      margin: opts.margin,
      color: opts.color,
      errorCorrectionLevel: 'H' // High error correction for reliability
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR Code generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(data: string, options?: {
  size?: number;
  margin?: number;
}): Promise<string> {
  const defaults = {
    size: 300,
    margin: 2
  };
  
  const opts = { ...defaults, ...options };
  
  try {
    const svg = await QRCode.toString(data, {
      type: 'svg',
      width: opts.size,
      margin: opts.margin,
      errorCorrectionLevel: 'H'
    });
    return svg;
  } catch (error) {
    console.error('QR Code SVG generation failed:', error);
    throw new Error('Failed to generate QR code SVG');
  }
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Get supply chain statistics
 */
export function getSupplyChainStats(): SupplyChainStats {
  const records = getAllProvenanceRecords();
  const certificates = getAllCertificates();
  
  const recordsByCategory = {} as Record<ProductCategory, number>;
  const recordsByStatus = {} as Record<VerificationStatus, number>;
  
  // Initialize counters
  const categories: ProductCategory[] = [
    'pharmaceutical', 'agricultural', 'dates', 'olive_oil', 'textile',
    'construction_materials', 'steel', 'cement', 'chemicals', 'food_beverage',
    'electronics', 'machinery'
  ];
  const statuses: VerificationStatus[] = ['pending', 'verified', 'rejected', 'flagged', 'expired'];
  
  categories.forEach(cat => recordsByCategory[cat] = 0);
  statuses.forEach(status => recordsByStatus[status] = 0);
  
  let totalEvents = 0;
  let flaggedCount = 0;
  
  records.forEach(record => {
    recordsByCategory[record.category]++;
    recordsByStatus[record.currentStatus]++;
    totalEvents += record.events.length;
    if (record.currentStatus === 'flagged') flaggedCount++;
  });
  
  const avgChainLength = records.length > 0 
    ? totalEvents / records.length 
    : 0;
  
  return {
    totalRecords: records.length,
    recordsByCategory,
    recordsByStatus,
    totalEventsLogged: totalEvents,
    certificatesIssued: certificates.filter(c => c.status === 'active').length,
    avgChainLength: Math.round(avgChainLength * 100) / 100,
    recentVerifications: records.filter(r => 
      new Date(r.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
    flaggedRecords: flaggedCount
  };
}

// ============================================================================
// MOCK DATA SEEDING (Algerian Products)
// ============================================================================

export interface MockProductData {
  name: string;
  category: ProductCategory;
  manufacturer: {
    name: string;
    registrationNumber: string;
    city: string;
    wilaya: string;
    wilayaCode: number;
    email: string;
    phone: string;
  };
  events: Array<{
    type: SupplyChainEventType;
    city: string;
    wilaya: string;
    wilayaCode: number;
    description: string;
    date: string;
  }>;
}

const ALGERIAN_MOCK_PRODUCTS: MockProductData[] = [
  {
    name: 'Deglet Nour Dates Premium',
    category: 'dates',
    manufacturer: {
      name: 'Biskra Dates Export SARL',
      registrationNumber: 'BIS-07-2024-001234',
      city: 'Biskra',
      wilaya: 'Biskra',
      wilayaCode: 7,
      email: 'export@biskradates.dz',
      phone: '+213 33 54 12 34'
    },
    events: [
      { type: 'manufacturing', city: 'Biskra', wilaya: 'Biskra', wilayaCode: 7, description: 'Harvested and sorted at oasis plantation', date: '2024-11-15T08:00:00Z' },
      { type: 'quality_control', city: 'Biskra', wilaya: 'Biskra', wilayaCode: 7, description: 'ISO 22000 quality inspection passed', date: '2024-11-16T10:30:00Z' },
      { type: 'packaging', city: 'Biskra', wilaya: 'Biskra', wilayaCode: 7, description: 'Vacuum-sealed in export-grade packaging', date: '2024-11-16T14:00:00Z' },
      { type: 'shipping', city: 'Biskra', wilaya: 'Biskra', wilayaCode: 7, description: 'Shipped via Algeria Post Express', date: '2024-11-17T09:00:00Z' },
      { type: 'customs', city: 'Algiers', wilaya: 'Algiers', wilayaCode: 16, description: 'Export customs clearance completed', date: '2024-11-18T11:00:00Z' },
      { type: 'transit', city: 'Algiers', wilaya: 'Algiers', wilayaCode: 16, description: 'In transit to port of Algiers', date: '2024-11-18T15:00:00Z' }
    ]
  },
  {
    name: 'Extra Virgin Olive Oil AOC',
    category: 'olive_oil',
    manufacturer: {
      name: 'Huilerie Kabyle Traditionnelle',
      registrationNumber: 'TIZ-15-2024-005678',
      city: 'Tizi Ouzou',
      wilaya: 'Tizi Ouzou',
      wilayaCode: 15,
      email: 'contact@huilekabyle.dz',
      phone: '+213 26 43 21 98'
    },
    events: [
      { type: 'manufacturing', city: 'Tizi Ouzou', wilaya: 'Tizi Ouzou', wilayaCode: 15, description: 'Cold press extraction from local olives', date: '2024-10-20T07:00:00Z' },
      { type: 'quality_control', city: 'Tizi Ouzou', wilaya: 'Tizi Ouzou', wilayaCode: 15, description: 'Acidity test: 0.3% - Extra Virgin grade confirmed', date: '2024-10-21T09:00:00Z' },
      { type: 'packaging', city: 'Tizi Ouzou', wilaya: 'Tizi Ouzou', wilayaCode: 15, description: 'Bottled in dark glass containers', date: '2024-10-21T14:00:00Z' },
      { type: 'shipping', city: 'Tizi Ouzou', wilaya: 'Tizi Ouzou', wilayaCode: 15, description: 'Shipped to distribution center', date: '2024-10-22T08:00:00Z' },
      { type: 'warehouse', city: 'Algiers', wilaya: 'Algiers', wilayaCode: 16, description: 'Arrived at central warehouse', date: '2024-10-22T16:00:00Z' },
      { type: 'customs', city: 'Algiers', wilaya: 'Algiers', wilayaCode: 16, description: 'Export documentation verified', date: '2024-10-23T10:00:00Z' }
    ]
  },
  {
    name: 'Amoxicillin 500mg Capsules',
    category: 'pharmaceutical',
    manufacturer: {
      name: 'SAIDAL Group - Unité Annaba',
      registrationNumber: 'ANN-23-2024-PHARM001',
      city: 'Annaba',
      wilaya: 'Annaba',
      wilayaCode: 23,
      email: 'quality@saidal.dz',
      phone: '+213 38 84 00 00'
    },
    events: [
      { type: 'manufacturing', city: 'Annaba', wilaya: 'Annaba', wilayaCode: 23, description: 'GMP-compliant manufacturing batch #AMX-2024-11420', date: '2024-11-01T06:00:00Z' },
      { type: 'quality_control', city: 'Annaba', wilaya: 'Annaba', wilayaCode: 23, description: 'Laboratory testing: potency 98.5%, dissolution 99.2%', date: '2024-11-05T14:00:00Z' },
      { type: 'packaging', city: 'Annaba', wilaya: 'Annaba', wilayaCode: 23, description: 'Blister packaging with tamper-evident seals', date: '2024-11-06T09:00:00Z' },
      { type: 'verification', city: 'Annaba', wilaya: 'Annaba', wilayaCode: 23, description: 'Ministry of Health batch release approved', date: '2024-11-07T11:00:00Z' },
      { type: 'shipping', city: 'Annaba', wilaya: 'Annaba', wilayaCode: 23, description: 'Temperature-controlled shipment initiated', date: '2024-11-08T08:00:00Z' },
      { type: 'transit', city: 'Constantine', wilaya: 'Constantine', wilayaCode: 25, description: 'In transit via cold chain logistics', date: '2024-11-08T18:00:00Z' },
      { type: 'warehouse', city: 'Algiers', wilaya: 'Algiers', wilayaCode: 16, description: 'Received at pharmaceutical warehouse (2-8°C)', date: '2024-11-09T06:00:00Z' }
    ]
  },
  {
    name: 'Reinforced Steel Bars (FeE400)',
    category: 'steel',
    manufacturer: {
      name: 'Acier du Sud - Usine Tébessa',
      registrationNumber: 'TEB-12-2024-STEEL042',
      city: 'Tébessa',
      wilaya: 'Tébessa',
      wilayaCode: 12,
      email: 'orders@aciersud.dz',
      phone: '+213 37 45 67 89'
    },
    events: [
      { type: 'manufacturing', city: 'Tébessa', wilaya: 'Tébessa', wilayaCode: 12, description: 'Hot rolling process completed - FeE400 grade', date: '2024-10-10T06:00:00Z' },
      { type: 'quality_control', city: 'Tébessa', wilaya: 'Tébessa', wilayaCode: 12, description: 'Tensile strength test: 420 MPa - NAJAR certified', date: '2024-10-11T10:00:00Z' },
      { type: 'packaging', city: 'Tébessa', wilaya: 'Tébessa', wilayaCode: 12, description: 'Bundled and tagged per order specifications', date: '2024-10-11T14:00:00Z' },
      { type: 'shipping', city: 'Tébessa', wilaya: 'Tébessa', wilayaCode: 12, description: 'Heavy transport via rail freight', date: '2024-10-12T07:00:00Z' },
      { type: 'transit', city: 'Constantine', wilaya: 'Constantine', wilayaCode: 25, description: 'Rail transit through Constantine hub', date: '2024-10-13T12:00:00Z' },
      { type: 'warehouse', city: 'Algiers', wilaya: 'Algiers', wilayaCode: 16, description: 'Delivered to construction site warehouse', date: '2024-10-14T08:00:00Z' },
      { type: 'delivery', city: 'Algiers', wilaya: 'Algiers', wilayaCode: 16, description: 'Final delivery confirmed by site manager', date: '2024-10-14T15:00:00Z' }
    ]
  },
  {
    name: 'Portland Cement CEM I 52.5R',
    category: 'cement',
    manufacturer: {
      name: 'SCIMAT - Cement de M\'Sila',
      registrationNumber: 'MSI-28-2024-CEMT078',
      city: "M'Sila",
      wilaya: "M'Sila",
      wilayaCode: 28,
      email: 'commercial@scimat.dz',
      phone: '+213 35 62 34 56'
    },
    events: [
      { type: 'manufacturing', city: "M'Sila", wilaya: "M'Sila", wilayaCode: 28, description: 'Clinker grinding and gypsum addition', date: '2024-11-05T04:00:00Z' },
      { type: 'quality_control', city: "M'Sila", wilaya: "M'Sila", wilayaCode: 28, description: 'Compressive strength: 54.2 MPa at 28 days', date: '2024-11-08T09:00:00Z' },
      { type: 'packaging', city: "M'Sila", wilaya: "M'Sila", wilayaCode: 28, description: '50kg paper bags with moisture barrier', date: '2024-11-08T14:00:00Z' },
      { type: 'shipping', city: "M'Sila", wilaya: "M'Sila", wilayaCode: 28, description: 'Bulk truck transport dispatched', date: '2024-11-09T06:00:00Z' },
      { type: 'transit', city: 'Bouira', wilaya: 'Bouira', wilayaCode: 10, description: 'Highway transit via N1 route', date: '2024-11-09T12:00:00Z' },
      { type: 'delivery', city: 'Setif', wilaya: 'Sétif', wilayaCode: 19, description: 'Delivered to construction project site', date: '2024-11-09T17:00:00Z' }
    ]
  },
  {
    name: 'Organic Tomato Paste (Double Concentrate)',
    category: 'food_beverage',
    manufacturer: {
      name: 'Conserverie Moderne de Ouargla',
      registrationNumber: 'OUA-30-2024-FOOD156',
      city: 'Ouargla',
      wilaya: 'Ouargla',
      wilayaCode: 30,
      email: 'export@cmo.dz',
      phone: '+213 29 71 23 45'
    },
    events: [
      { type: 'manufacturing', city: 'Ouargla', wilaya: 'Ouargla', wilayaCode: 30, description: 'Tomato processing and concentration (28% solids)', date: '2024-09-15T06:00:00Z' },
      { type: 'quality_control', city: 'Ouargla', wilaya: 'Ouargla', wilayaCode: 30, description: 'Organic certification verified - ECOCERT DZ', date: '2024-09-16T10:00:00Z' },
      { type: 'packaging', city: 'Ouargla', wilaya: 'Ouargla', wilayaCode: 30, description: 'Aseptic bag-in-box packaging (220kg)', date: '2024-09-16T15:00:00Z' },
      { type: 'certification', city: 'Ouargla', wilaya: 'Ouargla', wilayaCode: 30, description: 'Halal certificate issued: HALAL-DZ-2024-3344', date: '2024-09-17T09:00:00Z' },
      { type: 'shipping', city: 'Ouargla', wilaya: 'Ouargla', wilayaCode: 30, description: 'Refrigerated container loaded', date: '2024-09-18T07:00:00Z' },
      { type: 'customs', city: 'Algiers', wilaya: 'Algiers', wilayaCode: 16, description: 'Export customs with phytosanitary certificate', date: '2024-09-19T14:00:00Z' }
    ]
  },
  {
    name: 'Traditional Berber Carpet (Hand-woven)',
    category: 'textile',
    manufacturer: {
      name: 'Coopérative Tapis de Ghardaïa',
      registrationNumber: 'GHA-47-2024-ART089',
      city: 'Ghardaïa',
      wilaya: 'Ghardaïa',
      wilayaCode: 47,
      email: 'artisan@tapisghardaia.dz',
      phone: '+213 29 83 45 67'
    },
    events: [
      { type: 'manufacturing', city: 'Ghardaïa', wilaya: 'Ghardaïa', wilayaCode: 47, description: 'Hand-weaving completed - 6 months artisan work', date: '2024-08-01T10:00:00Z' },
      { type: 'quality_control', city: 'Ghardaïa', wilaya: 'Ghardaïa', wilayaCode: 47, description: 'ONAT authenticity inspection passed', date: '2024-08-03T11:00:00Z' },
      { type: 'packaging', city: 'Ghardaïa', wilaya: 'Ghardaïa', wilayaCode: 47, description: 'Rolled with acid-free tissue, cedar box', date: '2024-08-03T15:00:00Z' },
      { type: 'certification', city: 'Ghardaïa', wilaya: 'Ghardaïa', wilayaCode: 47, description: 'UNESCO-style certificate of origin issued', date: '2024-08-04T09:00:00Z' },
      { type: 'shipping', city: 'Ghardaïa', wilaya: 'Ghardaïa', wilayaCode: 47, description: 'Insured art transport arranged', date: '2024-08-05T08:00:00Z' },
      { type: 'transit', city: 'Algiers', wilaya: 'Algiers', wilayaCode: 16, description: 'In transit to international shipping hub', date: '2024-08-06T12:00:00Z' }
    ]
  },
  {
    name: 'Phosphoric Acid Industrial Grade',
    category: 'chemicals',
    manufacturer: {
      name: 'ASMIDAL - Complex Annaba',
      registrationNumber: 'ANN-23-2024-CHEM022',
      city: 'Annaba',
      wilaya: 'Annaba',
      wilayaCode: 23,
      email: 'exports@asmidal.dz',
      phone: '+213 38 87 65 43'
    },
    events: [
      { type: 'manufacturing', city: 'Annaba', wilaya: 'Annaba', wilayaCode: 23, description: 'Wet process phosphoric acid production', date: '2024-10-25T02:00:00Z' },
      { type: 'quality_control', city: 'Annaba', wilaya: 'Annaba', wilayaCode: 23, description: 'Purity analysis: 54% P2O5 - REACH compliant', date: '2024-10-26T08:00:00Z' },
      { type: 'packaging', city: 'Annaba', wilaya: 'Annaba', wilayaCode: 23, description: 'ISO tank container loading (25 tons)', date: '2024-10-26T14:00:00Z' },
      { type: 'verification', city: 'Annaba', wilaya: 'Annaba', wilayaCode: 23, description: 'DGPC hazardous materials approval obtained', date: '2024-10-27T10:00:00Z' },
      { type: 'shipping', city: 'Annaba Port', wilaya: 'Annaba', wilayaCode: 23, description: 'Port of Annaba loading complete', date: '2024-10-28T06:00:00Z' },
      { type: 'customs', city: 'Annaba', wilaya: 'Annaba', wilayaCode: 23, description: 'Export customs with MSDS documentation', date: '2024-10-28T14:00:00Z' }
    ]
  }
];

/**
 * Seed database with mock Algerian product data
 */
export function seedMockData(): { records: ProvenanceRecord[]; count: number } {
  const createdRecords: ProvenanceRecord[] = [];
  
  for (const product of ALGERIAN_MOCK_PRODUCTS) {
    // Create provenance record
    const record = createProvenanceRecord({
      productId: `PROD-${generateId().slice(0, 8).toUpperCase()}`,
      productName: product.name,
      category: product.category,
      manufacturer: {
        name: product.manufacturer.name,
        registrationNumber: product.manufacturer.registrationNumber,
        location: {
          city: product.manufacturer.city,
          wilaya: product.manufacturer.wilaya,
          wilayaCode: product.manufacturer.wilayaCode,
          address: `Zone Industrielle, ${product.manufacturer.city}`,
          postalCode: `${10000 + product.manufacturer.wilayaCode}`
        },
        contactEmail: product.manufacturer.email,
        contactPhone: product.manufacturer.phone,
        verified: true,
        taxId: `IF-${product.manufacturer.registrationNumber}`
      },
      initialLocation: {
        city: product.manufacturer.city,
        wilaya: product.manufacturer.wilaya,
        wilayaCode: product.manufacturer.wilayaCode
      }
    });
    
    // Add events (skip first manufacturing event as it's created automatically)
    for (let i = 1; i < product.events.length; i++) {
      const event = product.events[i];
      addSupplyChainEvent(record.id, {
        eventType: event.type,
        location: {
          city: event.city,
          wilaya: event.wilaya,
          wilayaCode: event.wilayaCode
        },
        performedBy: product.manufacturer.name,
        performedByName: product.manufacturer.name,
        description: event.description
      });
      
      // Override timestamp to match mock data
      const updatedRecord = provenanceStore.get(record.id)!;
      updatedRecord.events[i].timestamp = event.date;
      updatedRecord.updatedAt = event.date;
      provenanceStore.set(record.id, updatedRecord);
    }
    
    // Seal the record
    sealProvenanceRecord(record.id);
    
    createdRecords.push(provenanceStore.get(record.id)!);
  }
  
  return { records: createdRecords, count: createdRecords.length };
}

/**
 * Clear all data (for testing)
 */
export function clearAllData(): void {
  provenanceStore.clear();
  certificateStore.clear();
}
