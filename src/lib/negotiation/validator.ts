// Negotiation Validator
// مدقق صحة المفاوضات

import { negotiationConfig, type NegotiationType, type ValidationResult } from './config';

/**
 * Validate price limits and business rules
 * التحقق من حدود السعر والقواعد التجارية
 */
export function validatePriceLimits(
  originalPrice: number,
  proposedPrice: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if prices are positive
  if (originalPrice <= 0) {
    errors.push('Original price must be positive - يجب أن يكون السعر الأصلي موجباً');
  }
  
  if (proposedPrice <= 0) {
    errors.push('Proposed price must be positive - يجب أن يكون السعر المقترح موجباً');
  }

  // Calculate price change percentage
  const priceChangePercent = ((originalPrice - proposedPrice) / originalPrice) * 100;

  // Check minimum price drop
  if (priceChangePercent < negotiationConfig.minPriceDropPercent && priceChangePercent > 0) {
    warnings.push(
      `Price change is less than ${negotiationConfig.minPriceDropPercent}% minimum - التغيير في السعر أقل من الحد الأدنى`
    );
  }

  // Check maximum price drop (discount)
  if (priceChangePercent > negotiationConfig.maxPriceDropPercent) {
    errors.push(
      `Discount cannot exceed ${negotiationConfig.maxPriceDropPercent}% - لا يمكن أن يتجاوز الخصم ${negotiationConfig.maxPriceDropPercent}%`
    );
  }

  // Check for price increase (buyer offering more than asking)
  if (priceChangePercent < 0) {
    warnings.push(
      'Proposed price is higher than original price - السعر المقترح أعلى من السعر الأصلي'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check user eligibility to participate in negotiation
 * التحقق من أهلية المستخدم للمشاركة في المفاوضات
 */
export function checkUserEligibility(
  userId: string,
  buyerId: string,
  sellerId: string,
  userRole: 'buyer' | 'seller'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!userId) {
    errors.push('User ID is required - معرف المستخدم مطلوب');
    return { valid: false, errors, warnings };
  }

  const isParticipant = userId === buyerId || userId === sellerId;
  
  if (!isParticipant) {
    errors.push('User is not a participant in this negotiation - المستخدم ليس مشاركاً في هذه المفاوضات');
    return { valid: false, errors, warnings };
  }

  // Check role consistency
  if (userRole === 'buyer' && userId !== buyerId) {
    errors.push('User is not the buyer - المستخدم ليس المشتري');
  }
  
  if (userRole === 'seller' && userId !== sellerId) {
    errors.push('User is not the seller - المستخدم ليس البائع');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Enforce business rules for negotiations
 * فرض القواعد التجارية للمفاوضات
 */
export function enforceBusinessRules(params: {
  currentCounterOffers: number;
  negotiationStatus: string;
  offerStatus: string;
  isValidOffer: boolean;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check counter-offer limit
  if (params.currentCounterOffers >= negotiationConfig.maxCounterOffers) {
    errors.push(
      `Maximum counter-offers (${negotiationConfig.maxCounterOffers}) reached - تم الوصول إلى الحد الأقصى للعروض المضادة`
    );
  }

  // Check negotiation status
  const activeStatuses = ['PENDING', 'COUNTERED'];
  if (!activeStatuses.includes(params.negotiationStatus)) {
    errors.push(
      `Negotiation is ${params.negotiationStatus}. Cannot submit offers - حالة المفاوضات ${params.negotiationStatus}. لا يمكن تقديم عروض`
    );
  }

  // Check offer status for counter-offers
  if (params.offerStatus !== 'PENDING') {
    errors.push(
      'Can only counter pending offers - يمكن تقديم عروض مضادة للعروض المعلقة فقط'
    );
  }

  // Validate offer data
  if (!params.isValidOffer) {
    errors.push('Invalid offer data - بيانات العرض غير صالحة');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate delivery date
 * التحقق من تاريخ التسليم
 */
export function validateDeliveryDate(deliveryDate?: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!deliveryDate) {
    // Delivery date is optional
    return { valid: true, errors, warnings };
  }

  const delivery = new Date(deliveryDate);
  const now = new Date();
  const minDeliveryDays = 1; // At least 1 day from now
  const maxDeliveryDays = 365; // Max 1 year from now

  const minDate = new Date(now.getTime() + minDeliveryDays * 24 * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() + maxDeliveryDays * 24 * 60 * 60 * 1000);

  if (delivery < minDate) {
    errors.push('Delivery date must be at least 1 day from now - يجب أن يكون تاريخ التسليم بعد يوم واحد على الأقل');
  }

  if (delivery > maxDate) {
    warnings.push('Delivery date is more than a year away - تاريخ التسليم بعد أكثر من عام');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate quantity
 * التحقق من الكمية
 */
export function validateQuantity(quantity?: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (quantity === undefined || quantity === null) {
    // Quantity is optional
    return { valid: true, errors, warnings };
  }

  if (quantity <= 0) {
    errors.push('Quantity must be positive - يجب أن تكون الكمية موجبة');
  }

  if (!Number.isInteger(quantity)) {
    errors.push('Quantity must be a whole number - يجب أن تكون الكمية رقماً صحيحاً');
  }

  if (quantity > 1000000) {
    warnings.push('Very large quantity - كمية كبيرة جداً');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate payment terms
 * التحقق من شروط الدفع
 */
export function validatePaymentTerms(paymentTerms?: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!paymentTerms) {
    // Payment terms are optional
    return { valid: true, errors, warnings };
  }

  const validTerms = negotiationConfig.paymentTerms.map(t => t.value);
  
  if (!validTerms.includes(paymentTerms as any)) {
    errors.push(`Invalid payment terms. Valid options: ${validTerms.join(', ')} - شروط دفع غير صالحة`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Comprehensive validation for creating an offer
 * تحليل شامل لإنشاء عرض
 */
export function validateOffer(params: {
  originalPrice: number;
  proposedPrice: number;
  quantity?: number;
  deliveryDate?: string;
  paymentTerms?: string;
  type: NegotiationType;
}): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Always validate price
  const priceValidation = validatePriceLimits(params.originalPrice, params.proposedPrice);
  allErrors.push(...priceValidation.errors);
  allWarnings.push(...priceValidation.warnings);

  // Type-specific validations
  if (['QUANTITY', 'BUNDLE'].includes(params.type)) {
    const qtyValidation = validateQuantity(params.quantity);
    allErrors.push(...qtyValidation.errors);
    allWarnings.push(...qtyValidation.warnings);
  }

  if (['DELIVERY_DATE', 'BUNDLE'].includes(params.type)) {
    const dateValidation = validateDeliveryDate(params.deliveryDate);
    allErrors.push(...dateValidation.errors);
    allWarnings.push(...dateValidation.warnings);
  }

  if (['PAYMENT_TERMS', 'BUNDLE'].includes(params.type)) {
    const termsValidation = validatePaymentTerms(params.paymentTerms);
    allErrors.push(...termsValidation.errors);
    allWarnings.push(...termsValidation.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Calculate auto-accept threshold check
 * حساب فحص حد القبول التلقائي
 */
export function shouldAutoAccept(
  originalPrice: number,
  proposedPrice: number,
  threshold?: number
): boolean {
  const autoAcceptThreshold = threshold ?? negotiationConfig.autoAcceptThreshold;
  const priceDifferencePercent = Math.abs((originalPrice - proposedPrice) / originalPrice * 100);
  
  return priceDifferencePercent <= autoAcceptThreshold;
}
