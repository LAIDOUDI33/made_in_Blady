// Advanced Offer/Counter-Offer Negotiation System
// AI-powered negotiation assistance for B2B deals
// نظام التفاوض المتقدم للعروض والعروض المضادة

import { db } from '@/lib/db';
import { analyzeOfferWithAI, generateCounterSuggestion, type AIAnalysis, type CounterSuggestion } from './ai/negotiation-assistant';

// ============================================
// TYPES
// ============================================

export type NegotiationStatus = 
  | 'DRAFT'           // Initial offer being composed
  | 'SENT'            // Offer sent to other party
  | 'UNDER_REVIEW'    // Other party reviewing
  | 'COUNTERED'       // Counter-offer made
  | 'ACCEPTED'        // Both parties agreed
  | 'REJECTED'        // Offer rejected
  | 'EXPIRED'         // Offer expired
  | 'WITHDRAWN'       // Withdrawn by sender
  | 'ARCHIVED'        // Completed/negotiation ended

export type NegotiationType = 
  | 'PRICE'           // Price negotiation
  | 'QUANTITY'        // Volume discount negotiation
  | 'DELIVERY_TERMS'  // Delivery timeline negotiation
  | 'PAYMENT_TERMS'   // Payment conditions
  | 'SPECIFICATIONS'  // Product customization
  | 'BUNDLE'          // Package deal negotiation
  | 'COMPREHENSIVE'   // Multiple aspects

export type NegotiationRole = 'BUYER' | 'SELLER';

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED';

export interface NegotiationOffer {
  id: string;
  negotiationId: string;
  offerNumber: number; // Sequential per negotiation
  fromRole: NegotiationRole;
  fromUserId: string;
  toUserId: string;
  
  // Content
  type: NegotiationType;
  originalPrice?: number;
  offeredPrice?: number;
  quantity?: number;
  deliveryDays?: number;
  paymentTerms?: string;
  specifications?: Record<string, any>;
  notes?: string;
  
  // AI Analysis (optional)
  aiScore?: number; // 0-100, how fair is this offer?
  aiSuggestion?: string; // AI recommendation
  marketComparison?: { averagePrice: number; percentile: number };
  
  // Timestamps
  validUntil: Date; // Offer expiry (default 72h)
  respondedAt?: Date;
  
  status: OfferStatus;
  createdAt: Date;
}

export interface Negotiation {
  id: string;
  negotiationNumber: string; // NEG-YYYYMMDD-XXXX
  
  // Related entities
  productId?: string;
  orderId?: string;
  rfqId?: string;
  
  // Parties
  buyerId: string;
  sellerId: string;
  initiatorId: string; // Who started it
  currentRole: NegotiationRole; // Whose turn to respond
  
  // Status tracking
  status: NegotiationStatus;
  type: NegotiationType;
  
  // Progress
  totalOffers: number;
  counterOffers: number;
  lastOfferAt: Date;
  startedAt: Date;
  concludedAt?: Date;
  concludedOutcome?: string; // Accepted price, terms, etc.
  
  // Settings
  maxDuration: number; // Days before auto-expire (default 30)
  autoAcceptThreshold?: number; // If offer within X% of asking, auto-accept
  
  // Privacy
  isPrivate: boolean; // Hidden from other suppliers
  allowCounterOffer: boolean;
  
  offers: NegotiationOffer[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNegotiationParams {
  productId?: string;
  orderId?: string;
  rfqId?: string;
  buyerId: string;
  sellerId: string;
  initiatorId: string;
  type: NegotiationType;
  initialOffer?: {
    originalPrice?: number;
    offeredPrice?: number;
    quantity?: number;
    deliveryDays?: number;
    paymentTerms?: string;
    specifications?: Record<string, any>;
    notes?: string;
  };
  settings?: {
    maxDuration?: number;
    autoAcceptThreshold?: number;
    isPrivate?: boolean;
    allowCounterOffer?: boolean;
  };
}

export interface SubmitOfferParams {
  fromUserId: string;
  toUserId: string;
  fromRole: NegotiationRole;
  type: NegotiationType;
  originalPrice?: number;
  offeredPrice?: number;
  quantity?: number;
  deliveryDays?: number;
  paymentTerms?: string;
  specifications?: Record<string, any>;
  notes?: string;
  validUntilHours?: number; // Default 72
}

export interface CounterOfferParams {
  fromUserId: string;
  type: NegotiationType;
  originalPrice?: number;
  offeredPrice?: number;
  quantity?: number;
  deliveryDays?: number;
  paymentTerms?: string;
  specifications?: Record<string, any>;
  notes?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NegotiationFilters {
  status?: NegotiationStatus;
  type?: NegotiationType;
  productId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateNegotiationNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `NEG-${dateStr}-${random}`;
}

function calculateExpiryDate(hours: number = 72): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
}

function determineCurrentRole(negotiation: Negotiation, lastOfferFrom: NegotiationRole): NegotiationRole {
  return lastOfferFrom === 'BUYER' ? 'SELLER' : 'BUYER';
}

function isNegotiationExpired(negotiation: Negotiation): boolean {
  const started = new Date(negotiation.startedAt);
  const expires = new Date(started.getTime() + negotiation.maxDuration * 24 * 60 * 60 * 1000);
  return new Date() > expires;
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Create a new negotiation
 * إنشاء مفاوضات جديدة
 */
export async function createNegotiation(params: CreateNegotiationParams): Promise<Negotiation> {
  const negotiationNumber = generateNegotiationNumber();
  const now = new Date();
  
  const negotiation = await db.negotiation.create({
    data: {
      negotiationNumber,
      productId: params.productId,
      orderId: params.orderId,
      rfqId: params.rfqId,
      buyerId: params.buyerId,
      sellerId: params.sellerId,
      initiatorId: params.initiatorId,
      currentRole: params.initiatorId === params.buyerId ? 'SELLER' : 'BUYER',
      status: 'SENT',
      type: params.type,
      totalOffers: 0,
      counterOffers: 0,
      lastOfferAt: now,
      maxDuration: params.settings?.maxDuration ?? 30,
      autoAcceptThreshold: params.settings?.autoAcceptThreshold,
      isPrivate: params.settings?.isPrivate ?? false,
      allowCounterOffer: params.settings?.allowCounterOffer ?? true,
      startedAt: now,
    },
    include: {
      offers: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // If initial offer provided, submit it
  if (params.initialOffer) {
    const initiatorRole = params.initiatorId === params.buyerId ? 'BUYER' as NegotiationRole : 'SELLER' as NegotiationRole;
    const toUserId = initiatorRole === 'BUYER' ? params.sellerId : params.buyerId;
    
    await submitOffer(negotiation.id, {
      fromUserId: params.initiatorId,
      toUserId,
      fromRole: initiatorRole,
      type: params.type,
      ...params.initialOffer,
    });
    
    // Refresh negotiation with offer
    return getNegotiationById(negotiation.id) as Promise<Negotiation>;
  }

  return mapNegotationToInterface(negotiation);
}

/**
 * Submit a new offer to a negotiation
 * تقديم عرض جديد للمفاوضات
 */
export async function submitOffer(
  negotiationId: string,
  offer: SubmitOfferParams
): Promise<NegotiationOffer> {
  const negotiation = await db.negotiation.findUnique({
    where: { id: negotiationId },
    include: { offers: true },
  });

  if (!negotiation) {
    throw new Error('Negotiation not found - المفاوضات غير موجودة');
  }

  if (negotiation.status === 'ACCEPTED' || negotiation.status === 'REJECTED' || negotiation.status === 'ARCHIVED') {
    throw new Error(`Cannot submit offer to ${negotiation.status} negotiation - لا يمكن تقديم عرض لمفاوضات ${negotiation.status}`);
  }

  if (isNegotiationExpired(negotiation)) {
    await db.negotiation.update({
      where: { id: negotiationId },
      data: { status: 'EXPIRED', concludedAt: new Date() },
    });
    throw new Error('Negotiation has expired - انتهت صلاحية المفاوضات');
  }

  const offerNumber = negotiation.totalOffers + 1;
  const validUntil = calculateExpiryDate(offer.validUntilHours ?? 72);

  // Run AI analysis on the offer
  let aiAnalysis: AIAnalysis | null = null;
  try {
    aiAnalysis = await analyzeOfferWithAI({
      ...offer,
      id: '',
      negotiationId,
      offerNumber,
      validUntil,
      status: 'PENDING',
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('AI analysis failed:', error);
  }

  const newOffer = await db.negotiationOffer.create({
    data: {
      negotiationId,
      offerNumber,
      fromRole: offer.fromRole,
      fromUserId: offer.fromUserId,
      toUserId: offer.toUserId,
      type: offer.type,
      originalPrice: offer.originalPrice,
      offeredPrice: offer.offeredPrice,
      quantity: offer.quantity,
      deliveryDays: offer.deliveryDays,
      paymentTerms: offer.paymentTerms,
      specifications: offer.specifications as any,
      notes: offer.notes,
      aiScore: aiAnalysis?.fairnessScore,
      aiSuggestion: aiAnalysis?.recommendations?.join('. '),
      marketComparison: aiAnalysis ? { averagePrice: 0, percentile: 50 } as any : undefined,
      validUntil,
      status: 'PENDING',
    },
  });

  // Update negotiation stats
  const isCounter = negotiation.totalOffers > 0;
  await db.negotiation.update({
    where: { id: negotiationId },
    data: {
      totalOffers: { increment: 1 },
      counterOffers: isCounter ? { increment: 1 } : undefined,
      lastOfferAt: new Date(),
      currentRole: determineCurrentRole(
        mapNegotationToInterface(negotiation),
        offer.fromRole
      ),
      status: isCounter ? 'COUNTERED' : 'UNDER_REVIEW',
    },
  });

  return mapOfferToInterface(newOffer);
}

/**
 * Create a counter-offer
 * إنشاء عرض مضاد
 */
export async function counterOffer(
  negotiationId: string,
  parentOfferId: string,
  counterParams: CounterOfferParams
): Promise<NegotiationOffer> {
  const parentOffer = await db.negotiationOffer.findUnique({
    where: { id: parentOfferId },
  });

  if (!parentOffer) {
    throw new Error('Parent offer not found - العرض الأصلي غير موجود');
  }

  if (parentOffer.status !== 'PENDING') {
    throw new Error('Can only counter pending offers - يمكن فقط تقديم عروض مضادة للعروض المعلقة');
  }

  const negotiation = await db.negotiation.findUnique({
    where: { id: negotiationId },
  });

  if (!negotiation) {
    throw new Error('Negotiation not found');
  }

  // Update parent offer status
  await db.negotiationOffer.update({
    where: { id: parentOfferId },
    data: { status: 'COUNTERED', respondedAt: new Date() },
  });

  // Determine roles for counter-offer
  const counterFromRole = parentOffer.fromRole === 'BUYER' ? 'SELLER' : 'BUYER';
  const counterFromUserId = counterFromRole === 'BUYER' ? negotiation.buyerId : negotiation.sellerId;
  const counterToUserId = counterFromRole === 'BUYER' ? negotiation.sellerId : negotiation.buyerId;

  return submitOffer(negotiationId, {
    fromUserId: counterFromUserId,
    toUserId: counterToUserId,
    fromRole: counterFromRole,
    type: counterParams.type || (parentOffer.type as NegotiationType),
    originalPrice: counterParams.originalPrice ?? (parentOffer.offeredPrice?.toNumber() ?? parentOffer.originalPrice?.toNumber()),
    offeredPrice: counterParams.offeredPrice,
    quantity: counterParams.quantity ?? parentOffer.quantity?.toNumber(),
    deliveryDays: counterParams.deliveryDays ?? parentOffer.deliveryDays,
    paymentTerms: counterParams.paymentTerms ?? parentOffer.paymentTerms ?? undefined,
    specifications: counterParams.specifications,
    notes: counterParams.notes,
  });
}

/**
 * Accept an offer
 * قبول عرض
 */
export async function acceptOffer(
  negotiationId: string,
  offerId: string
): Promise<Negotiation> {
  const offer = await db.negotiationOffer.findUnique({
    where: { id: offerId },
  });

  if (!offer) {
    throw new Error('Offer not found - العرض غير موجود');
  }

  if (offer.status !== 'PENDING') {
    throw new Error('Offer is no longer pending - العرض لم يعد معلقاً');
  }

  // Update offer status
  await db.negotiationOffer.update({
    where: { id: offerId },
    data: { status: 'ACCEPTED', respondedAt: new Date() },
  });

  // Reject all other pending offers
  await db.negotiationOffer.updateMany({
    where: {
      negotiationId,
      status: 'PENDING',
      id: { not: offerId },
    },
    data: { status: 'REJECTED', respondedAt: new Date() },
  });

  // Update negotiation
  const concludedOutcome = `Accepted at ${offer.offeredPrice ?? offer.originalPrice} DZD`;
  const negotiation = await db.negotiation.update({
    where: { id: negotiationId },
    data: {
      status: 'ACCEPTED',
      concludedAt: new Date(),
      concludedOutcome,
    },
    include: {
      offers: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return mapNegotationToInterface(negotiation);
}

/**
 * Reject an offer
 * رفض عرض
 */
export async function rejectOffer(
  negotiationId: string,
  offerId: string,
  reason?: string
): Promise<void> {
  const offer = await db.negotiationOffer.findUnique({
    where: { id: offerId },
  });

  if (!offer) {
    throw new Error('Offer not found - العرض غير موجود');
  }

  if (offer.status !== 'PENDING') {
    throw new Error('Offer is no longer pending - العرض لم يعد معلقاً');
  }

  await db.negotiationOffer.update({
    where: { id: offerId },
    data: { 
      status: 'REJECTED', 
      respondedAt: new Date(),
      notes: reason ? `${offer.notes ?? ''}\nRejection reason: ${reason}`.trim() : offer.notes,
    },
  });
}

/**
 * Withdraw an offer
 * سحب عرض
 */
export async function withdrawOffer(
  negotiationId: string,
  offerId: string
): Promise<void> {
  const offer = await db.negotiationOffer.findUnique({
    where: { id: offerId },
  });

  if (!offer) {
    throw new Error('Offer not found - العرض غير موجود');
  }

  if (offer.status !== 'PENDING') {
    throw new Error('Can only withdraw pending offers - يمكن سحب العروض المعلقة فقط');
  }

  await db.negotiationOffer.update({
    where: { id: offerId },
    data: { status: 'REJECTED', respondedAt: new Date() },
  });

  // Check if this was the only pending offer, if so mark negotiation as withdrawn
  const remainingPending = await db.negotiationOffer.count({
    where: { negotiationId, status: 'PENDING' },
  });

  if (remainingPending === 0) {
    await db.negotiation.update({
      where: { id: negotiationId },
      data: { status: 'WITHDRAWN', concludedAt: new Date() },
    });
  }
}

/**
 * Withdraw/End a negotiation
 * إنهاء مفاوضات
 */
export async function withdrawNegotiation(negotiationId: string): Promise<void> {
  await db.negotiation.update({
    where: { id: negotiationId },
    data: { 
      status: 'WITHDRAWN', 
      concludedAt: new Date(),
    },
  });

  // Reject all pending offers
  await db.negotiationOffer.updateMany({
    where: { negotiationId, status: 'PENDING' },
    data: { status: 'REJECTED', respondedAt: new Date() },
  });
}

/**
 * Get AI analysis for an offer
 * الحصول على تحليل الذكاء الاصطناعي للعرض
 */
export async function getAIOfferAnalysis(offerId: string): Promise<AIAnalysis> {
  const offer = await db.negotiationOffer.findUnique({
    where: { id: offerId },
    include: { negotiation: true },
  });

  if (!offer) {
    throw new Error('Offer not found');
  }

  return analyzeOfferWithAI(mapOfferToInterface(offer));
}

/**
 * Generate AI counter-suggestion
 * توليد اقتراح مضاد بالذكاء الاصطناعي
 */
export async function getAICounterSuggestion(negotiationId: string): Promise<CounterSuggestion> {
  const negotiation = await db.negotiation.findUnique({
    where: { id: negotiationId },
    include: {
      offers: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!negotiation) {
    throw new Error('Negotiation not found');
  }

  return generateCounterSuggestion(mapNegotationToInterface(negotiation));
}

/**
 * Check for expiring negotiations (for cron job)
 * فحص المفاوضات منتهية الصلاحية
 */
export async function checkExpiringNegotiations(): Promise<Negotiation[]> {
  const negotiations = await db.negotiation.findMany({
    where: {
      status: { in: ['DRAFT', 'SENT', 'UNDER_REVIEW', 'COUNTERED'] },
    },
    include: {
      offers: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const expiring: Negotiation[] = [];

  for (const neg of negotiations) {
    const mapped = mapNegotationToInterface(neg);
    if (isNegotiationExpired(mapped)) {
      await db.negotiation.update({
        where: { id: neg.id },
        data: { status: 'EXPIRED', concludedAt: new Date() },
      });
      
      // Expire all pending offers
      await db.negotiationOffer.updateMany({
        where: { negotiationId: neg.id, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });

      expiring.push({ ...mapped, status: 'EXPIRED' });
    }
  }

  return expiring;
}

/**
 * Get negotiation history for a user
 * الحصول على تاريخ مفاوضات المستخدم
 */
export async function getNegotiationHistory(
  userId: string,
  filters?: NegotiationFilters
): Promise<PaginatedResult<Negotiation>> {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: any = {
    OR: [
      { buyerId: userId },
      { sellerId: userId },
    ],
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.productId) {
    where.productId = filters.productId;
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.startedAt = {};
    if (filters.dateFrom) where.startedAt.gte = filters.dateFrom;
    if (filters.dateTo) where.startedAt.lte = filters.dateTo;
  }

  const [negotiations, total] = await Promise.all([
    db.negotiation.findMany({
      where,
      include: {
        offers: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    db.negotiation.count({ where }),
  ]);

  return {
    data: negotiations.map(mapNegotationToInterface),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single negotiation by ID
 * الحصول على مفاوضات واحدة حسب المعرف
 */
export async function getNegotiationById(negotiationId: string): Promise<Negotiation | null> {
  const negotiation = await db.negotiation.findUnique({
    where: { id: negotiationId },
    include: {
      offers: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!negotiation) {
    return null;
  }

  return mapNegotationToInterface(negotiation);
}

/**
 * Calculate win rate for a seller
 * حساب معدل الفوز لبائع
 */
export async function calculateWinRate(sellerId: string): Promise<{
  won: number;
  lost: number;
  rate: number;
}> {
  const negotiations = await db.negotiation.findMany({
    where: {
      sellerId,
      status: { in: ['ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN', 'ARCHIVED'] },
    },
  });

  const won = negotiations.filter(n => n.status === 'ACCEPTED').length;
  const lost = negotiations.filter(n => 
    ['REJECTED', 'EXPIRED', 'WITHDRAWN'].includes(n.status)
  ).length;
  const total = won + lost;
  const rate = total > 0 ? Math.round((won / total) * 100) : 0;

  return { won, lost, rate };
}

/**
 * Get offers for a negotiation
 * الحصول على عروض المفاوضات
 */
export async function getNegotiationOffers(negotiationId: string): Promise<NegotiationOffer[]> {
  const offers = await db.negotiationOffer.findMany({
    where: { negotiationId },
    orderBy: { createdAt: 'asc' },
  });

  return offers.map(mapOfferToInterface);
}

// ============================================
// MAPPING FUNCTIONS
// ============================================

function mapNegotationToInterface(anyNeg: any): Negotiation {
  return {
    id: anyNeg.id,
    negotiationNumber: anyNeg.negotiationNumber,
    productId: anyNeg.productId ?? undefined,
    orderId: anyNeg.orderId ?? undefined,
    rfqId: anyNeg.rfqId ?? undefined,
    buyerId: anyNeg.buyerId,
    sellerId: anyNeg.sellerId,
    initiatorId: anyNeg.initiatorId,
    currentRole: anyNeg.currentRole as NegotiationRole,
    status: anyNeg.status as NegotiationStatus,
    type: anyNeg.type as NegotiationType,
    totalOffers: anyNeg.totalOffers,
    counterOffers: anyNeg.counterOffers,
    lastOfferAt: new Date(anyNeg.lastOfferAt),
    startedAt: new Date(anyNeg.startedAt),
    concludedAt: anyNeg.concludedAt ? new Date(anyNeg.concludedAt) : undefined,
    concludedOutcome: anyNeg.concludedOutcome ?? undefined,
    maxDuration: anyNeg.maxDuration,
    autoAcceptThreshold: anyNeg.autoAcceptThreshold ?? undefined,
    isPrivate: anyNeg.isPrivate,
    allowCounterOffer: anyNeg.allowCounterOffer,
    offers: Array.isArray(anyNeg.offers) 
      ? anyNeg.offers.map(mapOfferToInterface) 
      : [],
    createdAt: new Date(anyNeg.createdAt),
    updatedAt: new Date(anyNeg.updatedAt),
  };
}

function mapOfferToInterface(anyOffer: any): NegotiationOffer {
  return {
    id: anyOffer.id,
    negotiationId: anyOffer.negotiationId,
    offerNumber: anyOffer.offerNumber,
    fromRole: anyOffer.fromRole as NegotiationRole,
    fromUserId: anyOffer.fromUserId,
    toUserId: anyOffer.toUserId,
    type: anyOffer.type as NegotiationType,
    originalPrice: anyOffer.originalPrice?.toNumber?.() ?? anyOffer.originalPrice ?? undefined,
    offeredPrice: anyOffer.offeredPrice?.toNumber?.() ?? anyOffer.offeredPrice ?? undefined,
    quantity: anyOffer.quantity?.toNumber?.() ?? anyOffer.quantity ?? undefined,
    deliveryDays: anyOffer.deliveryDays ?? undefined,
    paymentTerms: anyOffer.paymentTerms ?? undefined,
    specifications: anyOffer.specifications ?? undefined,
    notes: anyOffer.notes ?? undefined,
    aiScore: anyOffer.aiScore ?? undefined,
    aiSuggestion: anyOffer.aiSuggestion ?? undefined,
    marketComparison: anyOffer.marketComparison ?? undefined,
    validUntil: new Date(anyOffer.validUntil),
    respondedAt: anyOffer.respondedAt ? new Date(anyOffer.respondedAt) : undefined,
    status: anyOffer.status as OfferStatus,
    createdAt: new Date(anyOffer.createdAt),
  };
}
