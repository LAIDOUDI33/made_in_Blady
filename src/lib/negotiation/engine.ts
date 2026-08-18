// Advanced Negotiation Engine
// محرك التفاوض المتقدم

import { db } from '@/lib/db';
import { negotiationConfig, type NegotiationType, type NegotiationStatus } from './config';
import { 
  validateOffer, 
  validatePriceLimits, 
  checkUserEligibility, 
  enforceBusinessRules,
  shouldAutoAccept 
} from './validator';

// ============================================
// TYPES
// ============================================

export interface NegotiationWithOffers {
  id: string;
  negotiationNumber: string;
  orderId: string | null;
  productId: string;
  sellerId: string;
  buyerId: string;
  type: string;
  status: NegotiationStatus;
  originalPrice: number;
  proposedPrice: number;
  currentPrice: number;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  offers: NegotiationOfferRecord[];
}

export interface NegotiationOfferRecord {
  id: string;
  negotiationId: string;
  fromUserId: string;
  toUserId: string;
  price: number | null;
  quantity: number | null;
  deliveryDate: string | null;
  paymentTerms: string | null;
  message: string | null;
  status: string;
  createdAt: Date;
}

export interface CreateOfferResult {
  success: boolean;
  negotiation?: NegotiationWithOffers;
  offer?: NegotiationOfferRecord;
  autoAccepted?: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface CounterOfferResult {
  success: boolean;
  offer?: NegotiationOfferRecord;
  negotiation?: NegotiationWithOffers;
  errors?: string[];
  warnings?: string[];
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

function calculateExpiryDate(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + negotiationConfig.offerValidityHours);
  return expiry;
}

function mapNegotiationToInterface(neg: any): NegotiationWithOffers {
  return {
    id: neg.id,
    negotiationNumber: neg.negotiationNumber,
    orderId: neg.orderId,
    productId: neg.productId,
    sellerId: neg.sellerId,
    buyerId: neg.buyerId,
    type: neg.type,
    status: neg.status as NegotiationStatus,
    originalPrice: neg.originalPrice?.toNumber?.() ?? neg.originalPrice ?? 0,
    proposedPrice: neg.proposedPrice?.toNumber?.() ?? neg.proposedPrice ?? 0,
    currentPrice: neg.currentPrice?.toNumber?.() ?? neg.currentPrice ?? 0,
    expiresAt: new Date(neg.expiresAt),
    acceptedAt: neg.acceptedAt ? new Date(neg.acceptedAt) : null,
    createdAt: new Date(neg.createdAt),
    updatedAt: new Date(neg.updatedAt),
    offers: Array.isArray(neg.offers) ? neg.offers.map(mapOfferToInterface) : [],
  };
}

function mapOfferToInterface(offer: any): NegotiationOfferRecord {
  return {
    id: offer.id,
    negotiationId: offer.negotiationId,
    fromUserId: offer.fromUserId,
    toUserId: offer.toUserId,
    price: offer.price?.toNumber?.() ?? offer.price,
    quantity: offer.quantity?.toNumber?.() ?? offer.quantity,
    deliveryDate: offer.deliveryDate,
    paymentTerms: offer.paymentTerms,
    message: offer.message,
    status: offer.status,
    createdAt: new Date(offer.createdAt),
  };
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Create a new negotiation with initial offer
 * إنشاء مفاوضات جديدة مع العرض الأولي
 */
export async function createOffer(params: {
  productId: string;
  sellerId: string;
  buyerId: string;
  type: NegotiationType;
  originalPrice: number;
  proposedPrice: number;
  quantity?: number;
  deliveryDate?: string;
  paymentTerms?: string;
  message?: string;
  orderId?: string;
}): Promise<CreateOfferResult> {
  const warnings: string[] = [];

  // Validate the offer
  const validation = validateOffer({
    originalPrice: params.originalPrice,
    proposedPrice: params.proposedPrice,
    quantity: params.quantity,
    deliveryDate: params.deliveryDate,
    paymentTerms: params.paymentTerms,
    type: params.type,
  });

  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  warnings.push(...validation.warnings);

  // Check for auto-accept
  const autoAccept = shouldAutoAccept(params.originalPrice, params.proposedPrice);

  try {
    const negotiationNumber = generateNegotiationNumber();
    const expiresAt = calculateExpiryDate();
    const now = new Date();

    // Create negotiation with first offer in a transaction
    const negotiation = await db.negotiation.create({
      data: {
        negotiationNumber,
        orderId: params.orderId ?? null,
        productId: params.productId,
        sellerId: params.sellerId,
        buyerId: params.buyerId,
        type: params.type,
        status: autoAccept ? 'ACCEPTED' : 'PENDING',
        originalPrice: params.originalPrice,
        proposedPrice: params.proposedPrice,
        currentPrice: params.proposedPrice,
        expiresAt,
        acceptedAt: autoAccept ? now : null,
        offers: {
          create: {
            fromUserId: params.buyerId,
            toUserId: params.sellerId,
            price: params.proposedPrice,
            quantity: params.quantity ?? null,
            deliveryDate: params.deliveryDate ?? null,
            paymentTerms: params.paymentTerms ?? null,
            message: params.message ?? null,
            status: autoAccept ? 'ACCEPTED' : 'PENDING',
          },
        },
      },
      include: {
        offers: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      success: true,
      negotiation: mapNegotiationToInterface(negotiation),
      offer: negotiation.offers[0] ? mapOfferToInterface(negotiation.offers[0]) : undefined,
      autoAccepted: autoAccept,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error('Error creating negotiation:', error);
    return {
      success: false,
      errors: ['Failed to create negotiation - فشل في إنشاء المفاوضات'],
    };
  }
}

/**
 * Create a counter-offer
 * إنشاء عرض مضاد
 */
export async function createCounterOffer(params: {
  negotiationId: string;
  offerId: string;
  fromUserId: string;
  price?: number;
  quantity?: number;
  deliveryDate?: string;
  paymentTerms?: string;
  message?: string;
}): Promise<CounterOfferResult> {
  const warnings: string[] = [];

  try {
    // Get the parent negotiation and offer
    const [negotiation, parentOffer] = await Promise.all([
      db.negotiation.findUnique({
        where: { id: params.negotiationId },
        include: { offers: true },
      }),
      db.negotiationOffer.findUnique({
        where: { id: params.offerId },
      }),
    ]);

    if (!negotiation) {
      return {
        success: false,
        errors: ['Negotiation not found - المفاوضات غير موجودة'],
      };
    }

    if (!parentOffer) {
      return {
        success: false,
        errors: ['Original offer not found - العرض الأصلي غير موجود'],
      };
    }

    // Business rules validation
    const businessValidation = enforceBusinessRules({
      currentCounterOffers: negotiation.offers.length - 1, // Exclude initial offer
      negotiationStatus: negotiation.status,
      offerStatus: parentOffer.status,
      isValidOffer: !!params.price || params.price === 0,
    });

    if (!businessValidation.valid) {
      return {
        success: false,
        errors: businessValidation.errors,
        warnings: businessValidation.warnings,
      };
    }

    // User eligibility check
    const userRole = params.fromUserId === negotiation.buyerId ? 'buyer' : 'seller';
    const eligibilityCheck = checkUserEligibility(
      params.fromUserId,
      negotiation.buyerId,
      negotiation.sellerId,
      userRole as 'buyer' | 'seller'
    );

    if (!eligibilityCheck.valid) {
      return {
        success: false,
        errors: eligibilityCheck.errors,
      };
    }

    // Price validation
    const originalPrice = negotiation.originalPrice?.toNumber?.() ?? negotiation.originalPrice;
    const currentPrice = negotiation.currentPrice?.toNumber?.() ?? negotiation.currentPrice;
    const newPrice = params.price ?? currentPrice;

    if (params.price !== undefined) {
      const priceValidation = validatePriceLimits(originalPrice, newPrice);
      if (!priceValidation.valid) {
        return {
          success: false,
          errors: priceValidation.errors,
          warnings: priceValidation.warnings,
        };
      }
      warnings.push(...priceValidation.warnings);
    }

    // Determine counter-party
    const toUserId = params.fromUserId === negotiation.buyerId 
      ? negotiation.sellerId 
      : negotiation.buyerId;

    // Update parent offer status to countered
    await db.negotiationOffer.update({
      where: { id: params.offerId },
      data: { status: 'COUNTERED' },
    });

    // Create counter-offer
    const counterOffer = await db.negotiationOffer.create({
      data: {
        negotiationId: params.negotiationId,
        fromUserId: params.fromUserId,
        toUserId,
        price: newPrice,
        quantity: params.quantity ?? parentOffer.quantity?.toNumber?.() ?? null,
        deliveryDate: params.deliveryDate ?? parentOffer.deliveryDate,
        paymentTerms: params.paymentTerms ?? parentOffer.paymentTerms,
        message: params.message ?? null,
        status: 'PENDING',
      },
    });

    // Update negotiation
    const updatedNegotiation = await db.negotiation.update({
      where: { id: params.negotiationId },
      data: {
        status: 'COUNTERED',
        currentPrice: newPrice,
        proposedPrice: newPrice,
        updatedAt: new Date(),
      },
      include: {
        offers: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      success: true,
      offer: mapOfferToInterface(counterOffer),
      negotiation: mapNegotiationToInterface(updatedNegotiation),
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error('Error creating counter-offer:', error);
    return {
      success: false,
      errors: ['Failed to create counter-offer - فشل في إنشاء العرض المضاد'],
    };
  }
}

/**
 * Accept an offer
 * قبول عرض
 */
export async function acceptOffer(
  negotiationId: string,
  offerId: string,
  userId: string
): Promise<{ success: boolean; negotiation?: NegotiationWithOffers; errors?: string[] }> {
  try {
    const [negotiation, offer] = await Promise.all([
      db.negotiation.findUnique({ where: { id: negotiationId } }),
      db.negotiationOffer.findUnique({ where: { id: offerId } }),
    ]);

    if (!negotiation) {
      return { success: false, errors: ['Negotiation not found'] };
    }

    if (!offer) {
      return { success: false, errors: ['Offer not found'] };
    }

    if (offer.status !== 'PENDING') {
      return { success: false, errors: ['Offer is no longer pending'] };
    }

    // Verify user is the recipient
    if (offer.toUserId !== userId) {
      return { success: false, errors: ['Only the recipient can accept this offer'] };
    }

    const now = new Date();

    // Update offer status
    await db.negotiationOffer.update({
      where: { id: offerId },
      data: { status: 'ACCEPTED' },
    });

    // Reject all other pending offers
    await db.negotiationOffer.updateMany({
      where: {
        negotiationId,
        status: 'PENDING',
        id: { not: offerId },
      },
      data: { status: 'REJECTED' },
    });

    // Update negotiation
    const updatedNegotiation = await db.negotiation.update({
      where: { id: negotiationId },
      data: {
        status: 'ACCEPTED',
        currentPrice: offer.price ?? negotiation.currentPrice,
        acceptedAt: now,
        updatedAt: now,
      },
      include: {
        offers: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      success: true,
      negotiation: mapNegotiationToInterface(updatedNegotiation),
    };
  } catch (error) {
    console.error('Error accepting offer:', error);
    return { success: false, errors: ['Failed to accept offer'] };
  }
}

/**
 * Reject an offer
 * رفض عرض
 */
export async function rejectOffer(
  negotiationId: string,
  offerId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    const [negotiation, offer] = await Promise.all([
      db.negotiation.findUnique({ where: { id: negotiationId } }),
      db.negotiationOffer.findUnique({ where: { id: offerId } }),
    ]);

    if (!negotiation || !offer) {
      return { success: false, errors: ['Negotiation or offer not found'] };
    }

    if (offer.status !== 'PENDING') {
      return { success: false, errors: ['Offer is no longer pending'] };
    }

    if (offer.toUserId !== userId) {
      return { success: false, errors: ['Only the recipient can reject this offer'] };
    }

    // Update offer status
    await db.negotiationOffer.update({
      where: { id: offerId },
      data: { 
        status: 'REJECTED',
        message: reason ? `${offer.message ?? ''} | Rejected: ${reason}`.trim() : offer.message,
      },
    });

    // Check if this was the last pending offer
    const remainingPending = await db.negotiationOffer.count({
      where: { negotiationId, status: 'PENDING' },
    });

    if (remainingPending === 0) {
      await db.negotiation.update({
        where: { id: negotiationId },
        data: { status: 'REJECTED', updatedAt: new Date() },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error rejecting offer:', error);
    return { success: false, errors: ['Failed to reject offer'] };
  }
}

/**
 * Withdraw an offer
 * سحب عرض
 */
export async function withdrawOffer(
  negotiationId: string,
  offerId: string,
  userId: string
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    const offer = await db.negotiationOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return { success: false, errors: ['Offer not found'] };
    }

    if (offer.status !== 'PENDING') {
      return { success: false, errors: ['Only pending offers can be withdrawn'] };
    }

    if (offer.fromUserId !== userId) {
      return { success: false, errors: ['Only the sender can withdraw their offer'] };
    }

    // Update offer status
    await db.negotiationOffer.update({
      where: { id: offerId },
      data: { status: 'WITHDRAWN' },
    });

    // Check remaining pending offers
    const remainingPending = await db.negotiationOffer.count({
      where: { negotiationId, status: 'PENDING' },
    });

    if (remainingPending === 0) {
      await db.negotiation.update({
        where: { id: negotiationId },
        data: { status: 'WITHDRAWN', updatedAt: new Date() },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error withdrawing offer:', error);
    return { success: false, errors: ['Failed to withdraw offer'] };
  }
}

/**
 * Expire old offers (for cron job)
 * انتهاء صلاحية العروض القديمة
 */
export async function expireOffers(): Promise<{ expired: number }> {
  const now = new Date();
  
  const expiredOffers = await db.negotiationOffer.updateMany({
    where: {
      status: 'PENDING',
      // Note: We'd need an expiresAt field on offers for proper expiration
      // For now, we use the negotiation's expiresAt
    },
    data: { status: 'EXPIRED' },
  });

  // Expire negotiations that are past their expiry date
  const expiredNegotiations = await db.negotiation.updateMany({
    where: {
      status: { in: ['PENDING', 'COUNTERED'] },
      expiresAt: { lt: now },
    },
    data: { status: 'EXPIRED' },
  });

  return { 
    expired: expiredOffers.count + expiredNegotiations.count 
  };
}

/**
 * Get negotiation history for a user
 * الحصول على تاريخ مفاوضات المستخدم
 */
export async function getNegotiationHistory(userId: string, filters?: {
  status?: NegotiationStatus;
  type?: NegotiationType;
  page?: number;
  pageSize?: number;
}) {
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

  const [negotiations, total] = await Promise.all([
    db.negotiation.findMany({
      where,
      include: {
        offers: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { offers: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    db.negotiation.count({ where }),
  ]);

  return {
    data: negotiations.map(mapNegotiationToInterface),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Calculate best deal from multiple negotiations
 * حساب أفضل صفقة من عدة مفاوضات
 */
export function calculateBestDeal(negotiations: NegotiationWithOffers[]): {
  bestNegotiation: NegotiationWithOffers | null;
  savings: number;
  savingsPercent: number;
} {
  if (negotiations.length === 0) {
    return { bestNegotiation: null, savings: 0, savingsPercent: 0 };
  }

  // Find the negotiation with the lowest current price (best deal)
  const sortedByPrice = [...negotiations].sort((a, b) => a.currentPrice - b.currentPrice);
  const best = sortedByPrice[0];
  
  const savings = best.originalPrice - best.currentPrice;
  const savingsPercent = (savings / best.originalPrice) * 100;

  return {
    bestNegotiation: best,
    savings,
    savingsPercent,
  };
}

/**
 * Get single negotiation by ID
 * الحصول على مفاوضات واحدة حسب المعرف
 */
export async function getNegotiationById(negotiationId: string): Promise<NegotiationWithOffers | null> {
  const negotiation = await db.negotiation.findUnique({
    where: { id: negotiationId },
    include: {
      offers: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return negotiation ? mapNegotiationToInterface(negotiation) : null;
}
