// Deep linking configuration for AlgeriaTrade app
// Supports custom URL scheme and universal links

export const DEEP_LINK_SCHEMES = {
  algeriatrade: 'algeriatrade',
  https: 'https://algeriatrade.dz',
  http: 'http://algeriatrade.dz',
} as const;

export const DEEP_LINK_ROUTES = {
  // Products
  product: '/product/:id',
  category: '/category/:slug',
  search: '/search?query=:query',
  products: '/products',
  
  // User
  profile: '/profile',
  settings: '/settings',
  messages: '/messages/:conversationId?',
  notifications: '/notifications',
  
  // Business
  rfq: '/rfq/:id?',
  createRfq: '/rfq/create',
  order: '/order/:id',
  orders: '/orders',
  company: '/company/:slug',
  
  // Auth
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  verifyEmail: '/verify-email?token=:token',
  resetPassword: '/reset-password?token=:token',
  
  // Dashboard
  dashboard: '/dashboard',
  sellerDashboard: '/dashboard/seller',
  buyerDashboard: '/dashboard/buyer',
  
  // Favorites & Saved
  favorites: '/favorites',
  savedSearches: '/saved-searches',
  
  // Support
  help: '/help',
  contact: '/contact',
  about: '/about',
  
  // Legal
  terms: '/terms',
  privacy: '/privacy-policy',
} as const;

export type DeepLinkRoute = keyof typeof DEEP_LINK_ROUTES;
export type DeepLinkParams = Record<string, string | undefined>;

/**
 * Build a deep link URL for a given route with optional parameters
 * @param route - The route name from DEEP_LINK_ROUTES
 * @param params - Optional parameters to substitute in the route
 * @param useHttps - Whether to use HTTPS scheme instead of custom scheme
 * @returns Complete deep link URL
 */
export function buildDeepLink(
  route: DeepLinkRoute,
  params?: DeepLinkParams,
  useHttps: boolean = false
): string {
  let pathTemplate = DEEP_LINK_ROUTES[route];
  let path = pathTemplate;

  // Replace route parameters (:param)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        path = path.replace(`:${key}`, value);
      }
    });
  }

  // Remove remaining optional parameters
  path = path.replace(/\/:[^?]*\?/g, '');
  path = path.replace(/:[^/]+/g, '');

  const scheme = useHttps ? DEEP_LINK_SCHEMES.https : DEEP_LINK_SCHEMES.algeriatrade;
  
  return `${scheme}://${path}`;
}

/**
 * Parse a deep link URL to extract route and parameters
 */
export function parseDeepLink(url: string): { route: DeepLinkRoute | null; params: DeepLinkParams } | null {
  try {
    let cleanUrl = url;
    
    // Remove scheme
    Object.values(DEEP_LINK_SCHEMES).forEach(scheme => {
      if (cleanUrl.startsWith(scheme)) {
        cleanUrl = cleanUrl.substring(scheme.length);
      }
    });

    // Remove leading ://
    cleanUrl = cleanUrl.replace(/^:\/\//, '');

    // Parse query parameters if present
    const [pathPart, queryPart] = cleanUrl.split('?');
    const params: DeepLinkParams = {};

    if (queryPart) {
      queryPart.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      });
    }

    // Match against known routes
    const segments = pathPart.split('/').filter(Boolean);

    // Simple route matching
    switch (segments[0]) {
      case 'product':
        if (segments[1]) {
          params.id = segments[1];
          return { route: 'product', params };
        }
        break;
      
      case 'category':
        if (segments[1]) {
          params.slug = segments[1];
          return { route: 'category', params };
        }
        break;
      
      case 'search':
        return { route: 'search', params };
      
      case 'profile':
        return { route: 'profile', params };
      
      case 'settings':
        return { route: 'settings', params };
      
      case 'messages':
        if (segments[1]) {
          params.conversationId = segments[1];
        }
        return { route: 'messages', params };
      
      case 'rfq':
        if (segments[1] === 'create') {
          return { route: 'createRfq', params };
        } else if (segments[1]) {
          params.id = segments[1];
        }
        return { route: 'rfq', params };
      
      case 'order':
        if (segments[1]) {
          params.id = segments[1];
          return { route: 'order', params };
        }
        break;
      
      case 'orders':
        return { route: 'orders', params };
      
      case 'company':
        if (segments[1]) {
          params.slug = segments[1];
          return { route: 'company', params };
        }
        break;
      
      case 'login':
        return { route: 'login', params };
      
      case 'register':
        return { route: 'register', params };
      
      case 'dashboard':
        if (segments[1] === 'seller') {
          return { route: 'sellerDashboard', params };
        } else if (segments[1] === 'buyer') {
          return { route: 'buyerDashboard', params };
        }
        return { route: 'dashboard', params };
      
      case 'favorites':
        return { route: 'favorites', params };
      
      case 'help':
        return { route: 'help', params };
      
      case 'terms':
        return { route: 'terms', params };
      
      case 'verify-email':
        return { route: 'verifyEmail', params };
    }

    return null;
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
}

/**
 * Check if a URL is an AlgeriaTrade deep link
 */
export function isAlgeriaTradeLink(url: string): boolean {
  return Object.values(DEEP_LINK_SCHEMES).some(scheme => 
    url.toLowerCase().startsWith(scheme.toLowerCase())
  );
}

/**
 * Get linking configuration for React Navigation
 */
export function getLinkingConfig() {
  return {
    prefixes: Object.values(DEEP_LINK_SCHEMES),
    config: {
      screens: {
        // Map deep links to screen names
        ProductDetail: 'product/:id',
        CategoryProducts: 'category/:slug',
        SearchResults: 'search',
        Profile: 'profile',
        Settings: 'settings',
        MessageDetail: 'messages/:conversationId',
        RFQDetail: 'rfq/:id',
        CreateRFQ: 'rfq/create',
        OrderDetail: 'order/:id',
        CompanyProfile: 'company/:slug',
        Login: 'login',
        Register: 'register',
        VerifyEmail: 'verify-email',
        Dashboard: 'dashboard',
        Favorites: 'favorites',
        Help: 'help',
      },
    },
    // Custom handler for complex routes
    async getInitialURL() {
      // Handle initial URL from cold start
      const Linking = require('react-native').Linking;
      const url = await Linking.getInitialURL();
      return url || null;
    },
    // Subscribe to incoming links
    subscribe(listener: (url: string) => void) {
      const Linking = require('react-native').Linking;
      const subscription = Linking.addEventListener('url', ({ url }: { url: string }) => {
        listener(url);
      });
      return () => subscription.remove();
    },
  };
}

/**
 * Generate common deep links for sharing
 */
export const ShareableLinks = {
  product: (productId: string, productName?: string) => ({
    url: buildDeepLink('product', { id: productId }, true),
    title: `${productName || 'Produit'} - AlgeriaTrade`,
    message: `Découvrez ce produit sur AlgeriaTrade: ${productName || 'Produit'}`,
  }),
  
  company: (companySlug: string, companyName?: string) => ({
    url: buildDeepLink('company', { slug: companySlug }, true),
    title: `${companyName || 'Entreprise'} - AlgeriaTrade`,
    message: `Découvrez ${companyName || 'cette entreprise'} sur AlgeriaTrade`,
  }),
  
  rfq: (rfqId: string, title?: string) => ({
    url: buildDeepLink('rfq', { id: rfqId }, true),
    title: `${title || 'Demande de devis'} - AlgeriaTrade`,
    message: `Consultez cette demande de devis sur AlgeriaTrade`,
  }),
  
  invite: (referralCode?: string) => ({
    url: buildDeepLink('register', referralCode ? { ref: referralCode } : undefined, true),
    title: 'Rejoignez AlgeriaTrade',
    message: `Rejoignez AlgeriaTrade, la plateforme B2B N°1 en Algérie${referralCode ? `. Code parrainage: ${referralCode}` : ''}`,
  }),
};

/**
 * Email verification deep link helper
 */
export function buildVerificationLink(token: string): string {
  return buildDeepLink('verifyEmail', { token });
}

/**
 * Password reset deep link helper
 */
export function buildPasswordResetLink(token: string): string {
  return buildDeepLink('resetPassword', { token });
}

// Examples of usage:
//
// algeriatrade://product/abc123
// algeriatrade://search?query=panneau+solaire
// algeriatrade://verify-email?token=xyz789
// https://algeriatrade.dz/product/abc123 (Universal Link)
//
// Building links:
// buildDeepLink('product', { id: 'abc123' }) 
// => "algeriatrade://product/abc123"
//
// Parsing links:
// parseDeepLink("algeriatrade://product/abc123")
// => { route: 'product', params: { id: 'abc123' } }
