// ============================================
// Google Analytics 4 Integration for AlgeriaTrade
// Complete event tracking system
// ============================================

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// GA4 Configuration
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
const GA_ENABLED = process.env.NEXT_PUBLIC_GA_ENABLED === 'true';

// ============================================
// Type Definitions
// ============================================

export interface GA4UserProperties {
  userRole?: 'buyer' | 'supplier' | 'admin';
  companyType?: string;
  wilaya?: string;
  membershipTier?: string;
  isVerified?: boolean;
}

export interface GA4Product {
  itemId: string;
  itemName: string;
  itemCategory?: string;
  itemCategory2?: string;
  itemCategory3?: string;
  price: number;
  quantity?: number;
}

export interface GA4EcommerceData {
  transactionId: string;
  value: number;
  currency: string;
  items: GA4Product[];
  coupon?: string;
}

export interface SearchData {
  search_term: string;
  results_count: number;
}

// ============================================
// Core GA4 Functions
// ============================================

/**
 * Initialize gtag function
 * Should be called once on app load via script tag
 */
export const initGA4 = (): string => {
  if (!GA_ENABLED || !GA_MEASUREMENT_ID) return '';
  
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', {
      send_page_view: false,
      cookie_flags: 'SameSite=None;Secure',
      custom_map: {
        'custom_parameter_1': 'user_role',
        'custom_parameter_2': 'wilaya',
        'custom_parameter_3': 'category'
      }
    });
  `;
};

/**
 * Get GA measurement ID
 */
export const getMeasurementId = (): string => GA_MEASUREMENT_ID;

/**
 * Check if GA is enabled
 */
export const isGAEnabled = (): boolean => GA_ENABLED && !!GA_MEASUREMENT_ID;

// ============================================
// Page View Tracking
// ============================================

interface PageViewParams {
  page_title: string;
  page_location: string;
  userRole?: string;
  wilaya?: string;
  category?: string;
}

/**
 * Track page view with custom dimensions
 */
export const trackPageView = (params: PageViewParams): void => {
  if (!isGAEnabled()) return;
  
  const { page_title, page_location, userRole, wilaya, category } = params;
  
  window.gtag('event', 'page_view', {
    page_title,
    page_location,
    send_to: GA_MEASUREMENT_ID,
    ...(userRole && { user_role: userRole }),
    ...(wilaya && { wilaya }),
    ...(category && { category }),
  });
};

// ============================================
// User Events
// ============================================

/**
 * Track user sign up
 */
export const trackSignUp = (method: string, role: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'sign_up', {
    method,
    user_role: role,
    send_to: GA_MEASUREMENT_ID,
  });
};

/**
 * Track user login
 */
export const trackLogin = (method: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'login', {
    method,
    send_to: GA_MEASUREMENT_ID,
  });
};

/**
 * Track user logout
 */
export const trackLogout = (): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'logout', {
    method: 'manual',
    send_to: GA_MEASUREMENT_ID,
  });
};

// ============================================
// Product Events (Enhanced Ecommerce)
// ============================================

/**
 * Track product view
 */
export const trackViewProduct = (
  productId: string,
  name: string,
  category: string,
  price: number
): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'view_item', {
    items: [{
      item_id: productId,
      item_name: name,
      item_category: category,
      price,
      quantity: 1,
    }],
    send_to: GA_MEASUREMENT_ID,
  });
};

/**
 * Track add to cart
 */
export const trackAddToCart = (
  productId: string,
  name: string,
  quantity: number,
  price?: number
): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'add_to_cart', {
    items: [{
      item_id: productId,
      item_name: name,
      quantity,
      ...(price && { price }),
    }],
    send_to: GA_MEASUREMENT_ID,
  });
  
  // Also log to our database
  logEventToDatabase('ecommerce', 'add_to_cart', {
    productId,
    productName: name,
    quantity,
  });
};

/**
 * Track remove from cart
 */
export const trackRemoveFromCart = (productId: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'remove_from_cart', {
    items: [{
      item_id: productId,
    }],
    send_to: GA_MEASUREMENT_ID,
  });
};

/**
 * Track initiate checkout
 */
export const trackInitiateCheckout = (
  products: GA4Product[],
  value: number
): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'begin_checkout', {
    currency: 'DZD',
    value,
    items: products,
    send_to: GA_MEASUREMENT_ID,
  });
};

/**
 * Track purchase completed
 */
export const trackPurchase = (
  orderId: string,
  value: number,
  products: GA4Product[],
  coupon?: string
): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'purchase', {
    transaction_id: orderId,
    value,
    currency: 'DZD',
    coupon,
    items: products,
    send_to: GA_MEASUREMENT_ID,
  });
  
  // Log to database
  logEventToDatabase('transaction', 'purchase', {
    orderId,
    value,
    productCount: products.length,
  });
};

/**
 * Track add to wishlist
 */
export const trackAddToWishlist = (productId: string, name: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'add_to_wishlist', {
    items: [{
      item_id: productId,
      item_name: name,
    }],
    send_to: GA_MEASUREMENT_ID,
  });
};

// ============================================
// RFQ Events (Custom AlgeriaTrade Events)
// ============================================

/**
 * Track RFQ posted
 */
export const trackPostRFQ = (category: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'post_rfq', {
    rfq_category: category,
    send_to: GA_MEASUREMENT_ID,
  });
  
  logEventToDatabase('rfq', 'post_rfq', { category });
};

/**
 * Track quotation submitted by supplier
 */
export const trackSubmitQuotation = (rfqId: string, supplierId: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'submit_quotation', {
    rfq_id: rfqId,
    supplier_id: supplierId,
    send_to: GA_MEASUREMENT_ID,
  });
  
  logEventToDatabase('rfq', 'submit_quotation', { rfqId, supplierId });
};

/**
 * Track quotation accepted by buyer
 */
export const trackAcceptQuotation = (rfqId: string, value: number): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'accept_quotation', {
    rfq_id: rfqId,
    value,
    currency: 'DZD',
    send_to: GA_MEASUREMENT_ID,
  });
  
  logEventToDatabase('rfq', 'accept_quotation', { rfqId, value });
};

// ============================================
// Engagement Events
// ============================================

/**
 * Track search query
 */
export const trackSearch = (query: string, resultsCount: number): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'search', {
    search_term: query,
    results_count: resultsCount,
    send_to: GA_MEASUREMENT_ID,
  });
  
  logEventToDatabase('engagement', 'search', { query, resultsCount });
};

/**
 * Track content sharing
 */
export const trackShare = (
  contentType: string,
  contentId: string,
  method: string
): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'share', {
    content_type: contentType,
    content_id: contentId,
    method,
    send_to: GA_MEASUREMENT_ID,
  });
};

/**
 * Track contact supplier action
 */
export const trackContactSupplier = (supplierId: string, method: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'contact_supplier', {
    supplier_id: supplierId,
    method, // 'message', 'phone', 'email', 'rfq'
    send_to: GA_MEASUREMENT_ID,
  });
  
  logEventToDatabase('engagement', 'contact_supplier', { supplierId, method });
};

/**
 * Track report download
 */
export const trackDownloadReport = (reportType: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'download', {
    file_name: reportType,
    file_extension: 'pdf',
    send_to: GA_MEASUREMENT_ID,
  });
};

// ============================================
// Performance & Form Events
// ============================================

/**
 * Track form start
 */
export const trackFormStart = (formName: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'form_start', {
    form_name: formName,
    send_to: GA_MEASUREMENT_ID,
  });
};

/**
 * Track form submission
 */
export const trackFormSubmit = (formName: string, success: boolean): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', success ? 'form_submit' : 'form_error', {
    form_name: formName,
    success,
    send_to: GA_MEASUREMENT_ID,
  });
};

/**
 * Track error events
 */
export const trackError = (errorType: string, errorMessage: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'error', {
    error_type: errorType,
    error_message: errorMessage.substring(0, 100), // Truncate long messages
    send_to: GA_MEASUREMENT_ID,
  });
  
  logEventToDatabase('error', errorType, { message: errorMessage });
};

// ============================================
// User Properties
// ============================================

/**
 * Set user ID for cross-device tracking
 */
export const setUserId = (userId: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    user_id: userId,
  });
};

/**
 * Set user properties for segmentation
 */
export const setUserProperties = (properties: GA4UserProperties): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    user_properties: properties,
  });
};

/**
 * Clear user data on logout
 */
export const clearUserData = (): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    user_id: undefined,
    user_properties: {},
  });
};

// ============================================
// Database Logging (Optional)
// ============================================

const logEventToDatabase = async (
  eventType: string,
  eventName: string,
  eventData: Record<string, unknown>
): Promise<void> => {
  // Only log if database logging is enabled
  if (process.env.NEXT_PUBLIC_ANALYTICS_DB_LOGGING !== 'true') return;
  
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        eventName,
        eventData,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      }),
    });
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.debug('[Analytics] Failed to log event:', error);
  }
};

// ============================================
// Consent Management (GDPR Compliant)
// ============================================

export interface ConsentState {
  analyticsStorage: 'granted' | 'denied';
  adStorage: 'granted' | 'denied';
  adUserData: 'granted' | 'denied';
  adPersonalization: 'granted' | 'denied';
}

/**
 * Update consent state
 */
export const updateConsent = (consent: Partial<ConsentState>): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('consent', 'update', consent);
};

/**
 * Grant all consent (on user acceptance)
 */
export const grantAllConsent = (): void => {
  updateConsent({
    analyticsStorage: 'granted',
    adStorage: 'granted',
    adUserData: 'granted',
    adPersonalization: 'granted',
  });
};

/**
 * Deny all consent (default/privacy mode)
 */
export const denyAllConsent = (): void => {
  updateConsent({
    analyticsStorage: 'denied',
    adStorage: 'denied',
    adUserData: 'denied',
    adPersonalization: 'denied',
  });
};

// ============================================
// Export all functions
// ============================================

export default {
  initGA4,
  getMeasurementId,
  isGAEnabled,
  trackPageView,
  trackSignUp,
  trackLogin,
  trackLogout,
  trackViewProduct,
  trackAddToCart,
  trackRemoveFromCart,
  trackInitiateCheckout,
  trackPurchase,
  trackAddToWishlist,
  trackPostRFQ,
  trackSubmitQuotation,
  trackAcceptQuotation,
  trackSearch,
  trackShare,
  trackContactSupplier,
  trackDownloadReport,
  trackFormStart,
  trackFormSubmit,
  trackError,
  setUserId,
  setUserProperties,
  clearUserData,
  updateConsent,
  grantAllConsent,
  denyAllConsent,
};
