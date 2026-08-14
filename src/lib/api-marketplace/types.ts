// API Marketplace Types for AlgeriaTrade.dz
// Developer Portal & API Management System

export interface ApiKey {
  id: string;
  key: string; // Actual API key (hashed in DB)
  keyPrefix: string; // Display prefix like "at_xxxx"
  name: string;
  permissions: ApiPermission[];
  rateLimit: number; // Requests per minute
  allowedIps?: string[];
  webhookUrl?: string;
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  usageCount: number;
}

export type ApiPermission = 
  | 'products:read'
  | 'products:write'
  | 'orders:read'
  | 'orders:write'
  | 'rfq:read'
  | 'rfq:write'
  | 'companies:read'
  | 'categories:read'
  | 'search'
  | 'analytics:read'
  | 'webhooks:manage';

export interface ApiEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: { fr: string; en: string; ar: string };
  category: ApiCategory;
  requiredPermissions: ApiPermission[];
  requestSchema?: object;
  responseSchema?: object;
  rateLimitCost: number;
  version: string;
  deprecated?: boolean;
  deprecationDate?: Date;
}

export type ApiCategory = 
  | 'products'
  | 'orders'
  | 'rfqs'
  | 'companies'
  | 'search'
  | 'analytics'
  | 'webhooks'
  | 'account';

export interface WebhookEvent {
  id: string;
  eventType: WebhookEventType;
  url: string;
  secret: string;
  isActive: boolean;
  lastTriggeredAt?: Date;
  successCount: number;
  failureCount: number;
  createdAt: Date;
}

export type WebhookEventType = 
  | 'order.created'
  | 'order.updated'
  | 'rfq.created'
  | 'rfq.quotation_received'
  | 'product.created'
  | 'product.updated'
  | 'message.received'
  | 'company.verified';

export interface ApiUsageRecord {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export interface DeveloperApp {
  id: string;
  name: string;
  description: string;
  websiteUrl?: string;
  callbackUrl?: string;
  apiKeyId: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  meta?: {
    queriedAt: string;
    apiVersion: string;
    requestId?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Pricing Plans
export interface ApiPlan {
  id: string;
  name: string;
  nameFr: string;
  price: number; // In DZD
  currency: string;
  interval: 'monthly' | 'yearly';
  requestsPerDay: number;
  features: string[];
  endpoints: ApiCategory[];
  isPopular?: boolean;
}

export const API_PLANS: ApiPlan[] = [
  {
    id: 'free',
    name: 'Free',
    nameFr: 'Gratuit',
    price: 0,
    currency: 'DZD',
    interval: 'monthly',
    requestsPerDay: 100,
    features: [
      '100 requests/day',
      'Products & Search access',
      'Community support',
      'Basic documentation'
    ],
    endpoints: ['products', 'search']
  },
  {
    id: 'pro',
    name: 'Professional',
    nameFr: 'Professionnel',
    price: 9990,
    currency: 'DZD',
    interval: 'monthly',
    requestsPerDay: 10000,
    features: [
      '10,000 requests/day',
      'All endpoints access',
      'Real-time webhooks',
      'Priority support',
      'Advanced analytics',
      'SLA 99.5%'
    ],
    endpoints: ['products', 'orders', 'rfqs', 'companies', 'search', 'analytics', 'webhooks'],
    isPopular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    nameFr: 'Enterprise',
    price: 0,
    currency: 'DZD',
    interval: 'monthly',
    requestsPerDay: -1, // Unlimited
    features: [
      'Unlimited requests',
      'SLA 99.9% guaranteed',
      '24/7 dedicated support',
      'On-premise option',
      'Custom integrations',
      'Dedicated account manager'
    ],
    endpoints: ['products', 'orders', 'rfqs', 'companies', 'search', 'analytics', 'webhooks', 'account']
  }
];

// Permission descriptions (multilingual)
export const PERMISSION_DESCRIPTIONS: Record<ApiPermission, { fr: string; en: string; ar: string }> = {
  'products:read': {
    fr: 'Lire les produits',
    en: 'Read products',
    ar: 'قراءة المنتجات'
  },
  'products:write': {
    fr: 'Créer/modifier les produits',
    en: 'Create/modify products',
    ar: 'إنشاء/تعديل المنتجات'
  },
  'orders:read': {
    fr: 'Lire les commandes',
    en: 'Read orders',
    ar: 'قراءة الطلبات'
  },
  'orders:write': {
    fr: 'Créer/modifier les commandes',
    en: 'Create/modify orders',
    ar: 'إنشاء/تعديل الطلبات'
  },
  'rfq:read': {
    fr: 'Lire les appels d\'offres',
    en: 'Read RFQs',
    ar: 'قراءة طلبات عرض السعر'
  },
  'rfq:write': {
    fr: 'Créer des appels d\'offres',
    en: 'Create RFQs',
    ar: 'إنشاء طلبات عرض السعر'
  },
  'companies:read': {
    fr: 'Lire les entreprises',
    en: 'Read companies',
    ar: 'قراءة الشركات'
  },
  'categories:read': {
    fr: 'Lire les catégories',
    en: 'Read categories',
    ar: 'قراءة الفئات'
  },
  'search': {
    fr: 'Rechercher',
    en: 'Search',
    ar: 'البحث'
  },
  'analytics:read': {
    fr: 'Voir les statistiques',
    en: 'View analytics',
    ar: 'عرض الإحصائيات'
  },
  'webhooks:manage': {
    fr: 'Gérer les webhooks',
    en: 'Manage webhooks',
    ar: 'إدارة الويب هوكس'
  }
};
