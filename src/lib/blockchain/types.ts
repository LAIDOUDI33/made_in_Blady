// Blockchain Supply Chain Types for AlgeriaTrade.dz
// Comprehensive type definitions for provenance tracking

export type SupplyChainEventType = 
  | 'manufacturing'      // Product creation/production
  | 'quality_control'    // QC inspection passed
  | 'packaging'          // Packaging completed
  | 'shipping'           // Shipment initiated
  | 'customs'            // Customs clearance
  | 'transit'            // In transit between locations
  | 'warehouse'          // Arrived at warehouse
  | 'delivery'           // Final delivery to recipient
  | 'verification'       // Third-party verification
  | 'certification'      // Certificate issued
  | 'recall'             // Product recall initiated
  | 'disposal'           // Product disposed
  | 'escrow_funded'      // Escrow payment funded
  | 'escrow_released'    // Escrow released to seller
  | 'escrow_refunded'    // Escrow refunded to buyer;

export type ProductCategory = 
  | 'pharmaceutical'
  | 'agricultural'
  | 'dates'             // Algerian specialty
  | 'olive_oil'         // Algerian specialty
  | 'textile'
  | 'construction_materials'
  | 'steel'
  | 'cement'
  | 'chemicals'
  | 'food_beverage'
  | 'electronics'
  | 'machinery';

export type VerificationStatus = 
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'flagged'
  | 'expired';

export type CertificateType = 
  | 'authenticity'        // Product authenticity certificate
  | 'origin'              // Certificate of origin (Algeria)
  | 'quality'             // Quality assurance certificate
  | 'organic'             // Organic certification
  | 'halal'               // Halal certification
  | 'iso'                 // ISO standard compliance
  | 'export_license'      // Export authorization
  | 'customs_clearance';  // Customs clearance certificate

export interface Location {
  city: string;
  wilaya: string;         // Algerian province
  wilayaCode: number;     // Wilaya code (1-58)
  latitude?: number;
  longitude?: number;
  address?: string;
  postalCode?: string;
}

export interface SupplyChainEvent {
  id: string;
  eventType: SupplyChainEventType;
  timestamp: string;       // ISO 8601 format
  location: Location;
  performedBy: string;     // Entity/user ID
  performedByName?: string;// Display name
  description: string;
  metadata?: Record<string, unknown>;
  hash: string;            // SHA-256 hash of this event
  previousHash: string;    // Hash of previous event (chain link)
  blockIndex: number;      // Position in chain
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;           // MIME type
  url: string;
  size: number;           // bytes
  hash: string;           // File integrity hash
  uploadedAt: string;
}

export interface ProvenanceRecord {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  batchNumber: string;
  category: ProductCategory;
  manufacturer: ManufacturerInfo;
  events: SupplyChainEvent[];
  currentStatus: VerificationStatus;
  currentLocation: Location;
  createdAt: string;
  updatedAt: string;
  rootHash: string;        // Merkle root or initial hash
  qrCodeData: string;      // Encoded QR data
  isSealed: boolean;       // Immutable once sealed
  escrowState?: EscrowState;
  certificates: Certificate[];
}

export interface ManufacturerInfo {
  id: string;
  name: string;
  registrationNumber: string; // Algerian company registry
  location: Location;
  contactEmail: string;
  contactPhone: string;
  verified: boolean;
  taxId?: string;
}

export interface Block {
  index: number;
  timestamp: string;
  data: SupplyChainEvent;
  previousHash: string;
  hash: string;
  nonce: number;           // For proof-of-work simulation
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  type: CertificateType;
  provenanceId: string;
  productId: string;
  productName: string;
  issuer: CertificateIssuer;
  issueDate: string;
  expiryDate?: string;
  status: 'active' | 'revoked' | 'expired';
  documentUrl?: string;
  hash: string;            // Certificate integrity hash
  qrCodeData: string;
  metadata?: Record<string, unknown>;
}

export interface CertificateIssuer {
  id: string;
  name: string;
  organization: string;
  title: string;
  signatureHash: string;
  digitalSignature?: string;
}

export interface EscrowState {
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
  fundedAt?: string;
  releasedAt?: string;
  buyerId: string;
  sellerId: string;
  releaseConditions: ReleaseCondition[];
}

export interface ReleaseCondition {
  id: string;
  type: 'delivery_confirmed' | 'inspection_passed' | 'customs_cleared' | 'timeout';
  satisfied: boolean;
  satisfiedAt?: string;
  description: string;
}

export interface VerificationResult {
  isValid: boolean;
  record: ProvenanceRecord | null;
  checks: VerificationCheck[];
  overallHash: string;
  timestamp: string;
}

export interface VerificationCheck {
  checkName: string;
  passed: boolean;
  details: string;
  expected?: string;
  actual?: string;
}

export interface BatchCertificationInput {
  productIds: string[];
  certificateType: CertificateType;
  issueDate: string;
  expiryDate?: string;
  issuer: Omit<CertificateIssuer, 'id' | 'signatureHash'>;
  notes?: string;
}

export interface SupplyChainStats {
  totalRecords: number;
  recordsByCategory: Record<ProductCategory, number>;
  recordsByStatus: Record<VerificationStatus, number>;
  totalEventsLogged: number;
  certificatesIssued: number;
  avgChainLength: number;
  recentVerifications: number;
  flaggedRecords: number;
}

// Algerian-specific constants
export const ALGERIAN_WILAYAS = [
  { code: 1, name: 'Adrar', arabicName: 'أدرار' },
  { code: 2, name: 'Chlef', arabicName: 'الشلف' },
  { code: 3, name: 'Laghouat', arabicName: 'الأغواط' },
  { code: 4, name: 'Oum El Bouaghi', arabicName: 'أم البواقي' },
  { code: 5, name: 'Batna', arabicName: 'باتنة' },
  { code: 6, name: 'Béjaïa', arabicName: 'بجاية' },
  { code: 7, name: 'Biskra', arabicName: 'بسكرة' },
  { code: 8, name: 'Béchar', arabicName: 'بشار' },
  { code: 9, name: 'Blida', arabicName: 'البليدة' },
  { code: 10, name: 'Bouira', arabicName: 'البويرة' },
  { code: 11, name: 'Tamanrasset', arabicName: 'تمنراست' },
  { code: 12, name: 'Tébessa', arabicName: 'تبسة' },
  { code: 13, name: 'Tlemcen', arabicName: 'تلمسان' },
  { code: 14, name: 'Tiaret', arabicName: 'تيارت' },
  { code: 15, name: 'Tizi Ouzou', arabicName: 'تيزي وزو' },
  { code: 16, name: 'Alger', arabicName: 'الجزائر' },
  { code: 17, name: 'Djelfa', arabicName: 'الجلفة' },
  { code: 18, name: 'Jijel', arabicName: 'جيجل' },
  { code: 19, name: 'Sétif', arabicName: 'سطيف' },
  { code: 20, name: 'Saïda', arabicName: 'سعيدة' },
  { code: 21, name: 'Skikda', arabicName: 'سكيكدة' },
  { code: 22, name: 'Sidi Bel Abbès', arabicName: 'سيدي بلعباس' },
  { code: 23, name: 'Annaba', arabicName: 'عنابة' },
  { code: 24, name: 'Guelma', arabicName: 'قالمة' },
  { code: 25, name: 'Constantine', arabicName: 'قسنطينة' },
  { code: 26, name: 'Médea', arabicName: 'المديعة' },
  { code: 27, name: 'Mostaganem', arabicName: 'مستغانم' },
  { code: 28, name: "M'Sila", arabicName: 'المسيلة' },
  { code: 29, name: 'Mascara', arabicName: 'معسكر' },
  { code: 30, name: 'Ouargla', arabicName: 'ورقلة' },
  { code: 31, name: 'Oran', arabicName: 'وهران' },
  { code: 32, name: 'El Bayadh', arabicName: ' البيض' },
  { code: 33, name: 'Illizi', arabicName: 'إيليزي' },
  { code: 34, name: 'Bordj Bou Arréridj', arabicName: 'برج بوعريريج' },
  { code: 35, name: 'Boumerdès', arabicName: 'بومرداس' },
  { code: 36, name: 'El Tarf', arabicName: 'الطارف' },
  { code: 37, name: 'Tindouf', arabicName: 'تندوف' },
  { code: 38, name: 'Tissemsilt', arabicName: 'تيسمسيلت' },
  { code: 39, name: 'El Oued', arabicName: 'الوادي' },
  { code: 40, name: 'Khenchela', arabicName: 'خنشلة' },
  { code: 41, name: 'Souk Ahras', arabicName: 'سوق أهراس' },
  { code: 42, name: 'Tipaza', arabicName: 'تيبازة' },
  { code: 43, name: 'Mila', arabicName: 'ميلة' },
  { code: 44, name: 'Aïn Defla', arabicName: 'عين الدفلى' },
  { code: 45, name: 'Naâma', arabicName: 'النعامة' },
  { code: 46, name: 'Aïn Témouchent', arabicName: 'عين تموشنت' },
  { code: 47, name: 'Ghardaïa', arabicName: 'غرداية' },
  { code: 48, name: 'Relizane', arabicName: 'غليزان' },
  { code: 49, name: 'El M\'Ghair', arabicName: 'المغير' },
  { code: 50, name: 'El Meniaa', arabicName: 'المنيعة' },
  { code: 51, name: 'Ouled Djellal', arabicName: 'اولاد جلال' },
  { code: 52, name: 'Bordj Baji Mokhtar', arabicName: 'برج باجي مختار' },
  { code: 53, name: 'Béni Abbès', arabicName: 'بي عباس' },
  { code: 54, name: 'Timimoun', arabicName: 'تيميمون' },
  { code: 55, name: 'Touggourt', arabicName: 'توقرت' },
  { code: 56, name: 'Djanet', arabicName: 'جانت' },
  { code: 57, name: 'In Salah', arabicName: 'إن سلام' },
  { code: 58, name: 'In Guezzam', arabicName: 'ان قزام' }
] as const;

export const EVENT_TYPE_LABELS: Record<SupplyChainEventType, string> = {
  manufacturing: 'Manufacturing',
  quality_control: 'Quality Control',
  packaging: 'Packaging',
  shipping: 'Shipping',
  customs: 'Customs Clearance',
  transit: 'In Transit',
  warehouse: 'Warehouse Arrival',
  delivery: 'Delivery',
  verification: 'Verification',
  certification: 'Certification',
  recall: 'Recall',
  disposal: 'Disposal',
  escrow_funded: 'Escrow Funded',
  escrow_released: 'Escrow Released',
  escrow_refunded: 'Escrow Refunded'
};

export const EVENT_TYPE_COLORS: Record<SupplyChainEventType, string> = {
  manufacturing: '#10b981',   // green
  quality_control: '#3b82f6', // blue
  packaging: '#8b5cf6',      // purple
  shipping: '#f59e0b',       // amber
  customs: '#ef4444',        // red
  transit: '#06b6d4',        // cyan
  warehouse: '#84cc16',     // lime
  delivery: '#22c55e',       // green-500
  verification: '#6366f1',   // indigo
  certification: '#ec4899',  // pink
  recall: '#dc2626',         // red-600
  disposal: '#78716c',       // stone
  escrow_funded: '#14b8a6',  // teal
  escrow_released: '#22c55e',// green-500
  escrow_refunded: '#f97316' // orange
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  pharmaceutical: 'Pharmaceutical',
  agricultural: 'Agricultural',
  dates: 'Dates (Deglet Nour)',
  olive_oil: 'Olive Oil',
  textile: 'Textile & Apparel',
  construction_materials: 'Construction Materials',
  steel: 'Steel Products',
  cement: 'Cement & Building Materials',
  chemicals: 'Chemicals',
  food_beverage: 'Food & Beverage',
  electronics: 'Electronics',
  machinery: 'Industrial Machinery'
};

export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  authenticity: 'Certificate of Authenticity',
  origin: 'Certificate of Origin (Algeria)',
  quality: 'Quality Assurance Certificate',
  organic: 'Organic Certification',
  halal: 'Halal Certification',
  iso: 'ISO Standard Compliance',
  export_license: 'Export License',
  customs_clearance: 'Customs Clearance Certificate'
};
