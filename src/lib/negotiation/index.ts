// Negotiation Engine - Public API
// محرك التفاوض - الواجهة العامة

export { negotiationConfig } from './config';
export type {
  NegotiationType,
  NegotiationStatus,
  PaymentTerm,
  NegotiationOfferData,
  NegotiationCreateParams,
  CounterOfferParams,
  ValidationResult,
  NegotiationSummary,
} from './config';

export {
  validatePriceLimits,
  checkUserEligibility,
  enforceBusinessRules,
  validateDeliveryDate,
  validateQuantity,
  validatePaymentTerms,
  validateOffer,
  shouldAutoAccept,
} from './validator';

export {
  createOffer,
  createCounterOffer,
  acceptOffer,
  rejectOffer,
  withdrawOffer,
  expireOffers,
  getNegotiationHistory,
  calculateBestDeal,
  getNegotiationById,
} from './engine';

export type {
  NegotiationWithOffers,
  NegotiationOfferRecord,
  CreateOfferResult,
  CounterOfferResult,
} from './engine';
