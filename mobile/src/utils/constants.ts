/**
 * AlgeriaTrade Design System - Constants
 * 
 * This file contains all design tokens, colors, spacing,
 * and constants used throughout the mobile application.
 */

// ============================================
// Colors (Algerian Theme)
// ============================================

export const Colors = {
  // Primary Colors (Algerian Flag)
  primary: '#006233',
  primaryLight: '#007a3d',
  primaryDark: '#004d28',
  secondary: '#D52B1E',    // Algerian red
  secondaryLight: '#E8453A',
  secondaryDark: '#B82218',

  // Neutral Colors
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceVariant: '#EEEEEE',
  
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  divider: '#EEEEEE',

  // Status Colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Semantic Colors
  online: '#10B981',
  offline: '#EF4444',
  unread: '#006233',

  // Gradients
  gradientStart: '#006233',
  gradientEnd: '#008f47',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

// ============================================
// Typography
// ============================================

export const FontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const FontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 32,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

// ============================================
// Spacing
// ============================================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// ============================================
// Border Radius
// ============================================

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// ============================================
// Shadows
// ============================================

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ============================================
// Icons
// ============================================

export const Icons = {
  home: 'home-outline',
  homeFilled: 'home',
  search: 'search-outline',
  searchFilled: 'search',
  add: 'add-circle-outline',
  addFilled: 'add-circle',
  messages: 'chatbubble-outline',
  messagesFilled: 'chatbubble',
  profile: 'person-outline',
  profileFilled: 'person',
  notifications: 'notifications-outline',
  notificationsFilled: 'notifications',
  settings: 'settings-outline',
  settingsFilled: 'settings',
  heart: 'heart-outline',
  heartFilled: 'heart',
  cart: 'cart-outline',
  cartFilled: 'cart',
  document: 'document-text-outline',
  documentFilled: 'document-text',
  star: 'star-outline',
  starFilled: 'star',
  location: 'location-outline',
  locationFilled: 'location',
  phone: 'call-outline',
  mail: 'mail-outline',
  globe: 'globe-outline',
  camera: 'camera-outline',
  image: 'image-outline',
  filter: 'filter-outline',
  sort: 'swap-vertical-outline',
  chevronForward: 'chevron-forward',
  chevronBack: 'chevron-back',
  chevronDown: 'chevron-down',
  close: 'close',
  menu: 'menu-outline',
  logout: 'log-out-outline',
  checkmark: 'checkmark-circle',
  alert: 'alert-circle-outline',
  info: 'information-circle-outline',
  eye: 'eye-outline',
  eyeOff: 'eye-off-outline',
  edit: 'create-outline',
  trash: 'trash-outline',
  share: 'share-outline',
  bookmark: 'bookmark-outline',
  bookmarkFilled: 'bookmark',
  time: 'time-outline',
  calendar: 'calendar-outline',
  tag: 'pricetag-outline',
  business: 'business-outline',
  package: 'cube-outline',
  truck: 'car-outline',
};

// ============================================
// API & Configuration
// ============================================

export const APIConfig = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.algeriatrade.dz',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

export const AppConfig = {
  name: 'AlgeriaTrade',
  version: '1.0.0',
  description: 'Plateforme B2B Algérie',
  supportEmail: 'support@algeriatrade.dz',
  supportPhone: '+213 XXX XXX XXX',
  website: 'https://algeriatrade.dz',
  
  // Pagination
  defaultPageSize: 20,
  maxPageSize: 100,

  // Features
  features: {
    pushNotifications: true,
    offlineMode: true,
    deepLinking: true,
    biometricAuth: true,
  },

  // Currency
  currency: {
    code: 'DZD',
    symbol: 'DA',
    locale: 'fr-DZ',
    decimals: 2,
  },
};

// ============================================
// Status Options
// ============================================

export const RFQStatus = {
  DRAFT: 'draft',
  OPEN: 'open',
  CLOSED: 'closed',
  EXPIRED: 'expired',
} as const;

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const UserRole = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
} as const;

// ============================================
// French Labels (for UI)
// ============================================

export const Labels = {
  // Auth
  login: 'Connexion',
  register: "S'inscrire",
  email: 'Email',
  password: 'Mot de passe',
  confirmPassword: 'Confirmer le mot de passe',
  forgotPassword: 'Mot de passe oublié ?',
  rememberMe: 'Se souvenir de moi',
  noAccount: "Pas de compte ?",
  hasAccount: 'Déjà un compte ?',
  
  // Navigation
  home: 'Accueil',
  search: 'Rechercher',
  postRFQ: 'Poster AO',
  messages: 'Messages',
  profile: 'Profil',
  
  // Actions
  save: 'Enregistrer',
  cancel: 'Annuler',
  delete: 'Supprimer',
  edit: 'Modifier',
  confirm: 'Confirmer',
  submit: 'Envoyer',
  search: 'Rechercher',
  filter: 'Filtrer',
  sort: 'Trier',
  loadMore: 'Charger plus',
  refresh: 'Actualiser',
  
  // Common
  loading: 'Chargement...',
  error: 'Une erreur est survenue',
  success: 'Opération réussie',
  noData: 'Aucune donnée disponible',
  offline: 'Vous êtes hors ligne',
  retry: 'Réessayer',
  
  // Products
  products: 'Produits',
  productDetails: 'Détails du produit',
  price: 'Prix',
  quantity: 'Quantité',
  addToCart: 'Ajouter au panier',
  buyNow: 'Acheter maintenant',
  contactSupplier: 'Contacter le fournisseur',
  
  // RFQs
  rfq: "Appel d'offres",
  rfqs: "Appels d'offres",
  newRFQ: 'Nouvel appel d\'offres',
  myRFQs: 'Mes appels d\'offres',
  quotations: 'Devis reçus',
  
  // Messages
  newMessage: 'Nouveau message',
  typeMessage: 'Tapez votre message...',
  
  // Profile
  myProfile: 'Mon profil',
  settings: 'Paramètres',
  logout: 'Déconnexion',
  favorites: 'Favoris',
  orders: 'Commandes',
};

export default {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadows,
  Icons,
  APIConfig,
  AppConfig,
  RFQStatus,
  OrderStatus,
  UserRole,
  Labels,
};
