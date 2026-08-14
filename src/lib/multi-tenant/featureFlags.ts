/**
 * Feature Flags System for Multi-Tenant Platform
 * Manages feature availability per tenant based on plan and configuration
 */

import { FeatureFlags } from './tenantResolver';

/**
 * All available features with their metadata
 */
export interface FeatureDefinition {
  id: string;
  name: string;
  nameFr: string; // French translation
  description: string;
  descriptionFr: string; // French translation
  icon: string;
  category: FeatureCategory;
  plans: string[]; // Plans that include this feature
  defaultEnabled: boolean;
}

export type FeatureCategory = 
  | 'catalog'
  | 'commerce'
  | 'communication'
  | 'analytics'
  | 'branding'
  | 'advanced';

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  // Catalog Features
  {
    id: 'catalog',
    name: 'Product Catalog',
    nameFr: 'Catalogue Produits',
    description: 'Browse and search product catalog',
    descriptionFr: 'Parcourir et rechercher le catalogue de produits',
    icon: 'Package',
    category: 'catalog',
    plans: ['free', 'professional', 'enterprise'],
    defaultEnabled: true,
  },
  {
    id: 'advancedSearch',
    name: 'Advanced Search',
    nameFr: 'Recherche Avancée',
    description: 'Advanced filters and search options',
    descriptionFr: 'Filtres avancés et options de recherche',
    icon: 'Search',
    category: 'catalog',
    plans: ['professional', 'enterprise'],
    defaultEnabled: false,
  },
  
  // Commerce Features
  {
    id: 'rfq',
    name: 'RFQ System',
    nameFr: "Système d'Appels d'Offres",
    description: 'Request for Quotation system',
    descriptionFr: "Système de demande de devis",
    icon: 'FileText',
    category: 'commerce',
    plans: ['free', 'professional', 'enterprise'],
    defaultEnabled: true,
  },
  {
    id: 'payments',
    name: 'Payment Processing',
    nameFr: 'Traitement des Paiements',
    description: 'Integrated payment processing',
    descriptionFr: 'Traitement des paiements intégré',
    icon: 'CreditCard',
    category: 'commerce',
    plans: ['professional', 'enterprise'],
    defaultEnabled: false,
  },
  {
    id: 'orders',
    name: 'Order Management',
    nameFr: 'Gestion des Commandes',
    description: 'Full order management system',
    descriptionFr: 'Système complet de gestion des commandes',
    icon: 'ShoppingCart',
    category: 'commerce',
    plans: ['free', 'professional', 'enterprise'],
    defaultEnabled: true,
  },
  
  // Communication Features
  {
    id: 'messaging',
    name: 'Messaging System',
    nameFr: 'Système de Messagerie',
    description: 'Real-time messaging between users',
    descriptionFr: 'Messagerie en temps réel entre utilisateurs',
    icon: 'MessageSquare',
    category: 'communication',
    plans: ['free', 'professional', 'enterprise'],
    defaultEnabled: true,
  },
  {
    id: 'notifications',
    name: 'Push Notifications',
    nameFr: 'Notifications Push',
    description: 'Push notification support',
    descriptionFr: 'Support des notifications push',
    icon: 'Bell',
    category: 'communication',
    plans: ['professional', 'enterprise'],
    defaultEnabled: false,
  },
  {
    id: 'emailNotifications',
    name: 'Email Notifications',
    nameFr: 'Notifications Email',
    description: 'Email notification system',
    descriptionFr: 'Système de notifications par email',
    icon: 'Mail',
    category: 'communication',
    plans: ['free', 'professional', 'enterprise'],
    defaultEnabled: true,
  },
  
  // Review & Trust
  {
    id: 'reviews',
    name: 'Reviews & Ratings',
    nameFr: 'Avis et Notations',
    description: 'Product and company reviews',
    descriptionFr: 'Avis sur les produits et entreprises',
    icon: 'Star',
    category: 'commerce',
    plans: ['free', 'professional', 'enterprise'],
    defaultEnabled: true,
  },
  {
    id: 'verification',
    name: 'Company Verification',
    nameFr: 'Vérification Entreprise',
    description: 'Company verification badges',
    descriptionFr: 'Badges de vérification entreprise',
    icon: 'Shield',
    category: 'commerce',
    plans: ['professional', 'enterprise'],
    defaultEnabled: false,
  },
  
  // Analytics Features
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    nameFr: 'Tableau de Bord Analytique',
    description: 'Basic analytics and reporting',
    descriptionFr: 'Analytiques et rapports de base',
    icon: 'BarChart3',
    category: 'analytics',
    plans: ['professional', 'enterprise'],
    defaultEnabled: false,
  },
  {
    id: 'advancedAnalytics',
    name: 'Advanced Analytics',
    nameFr: 'Analytiques Avancés',
    description: 'Advanced analytics with exports',
    descriptionFr: 'Analytiques avancés avec exportation',
    icon: 'TrendingUp',
    category: 'analytics',
    plans: ['enterprise'],
    defaultEnabled: false,
  },
  
  // Branding Features (White-label)
  {
    id: 'whiteLabel',
    name: 'White-Label Mode',
    nameFr: 'Mode White-Label',
    description: 'Remove AlgeriaTrade branding',
    descriptionFr: 'Supprimer le branding AlgeriaTrade',
    icon: 'EyeOff',
    category: 'branding',
    plans: ['enterprise'],
    defaultEnabled: false,
  },
  {
    id: 'customDomain',
    name: 'Custom Domain',
    nameFr: 'Domaine Personnalisé',
    description: 'Use your own domain',
    descriptionFr: 'Utiliser votre propre domaine',
    icon: 'Globe',
    category: 'branding',
    plans: ['enterprise'],
    defaultEnabled: false,
  },
  {
    id: 'customTheme',
    name: 'Custom Theme',
    nameFr: 'Thème Personnalisé',
    description: 'Full theme customization',
    descriptionFr: 'Personnalisation complète du thème',
    icon: 'Palette',
    category: 'branding',
    plans: ['professional', 'enterprise'],
    defaultEnabled: false,
  },
  
  // Advanced Features
  {
    id: 'apiAccess',
    name: 'API Access',
    nameFr: "Accès API",
    description: 'REST API access',
    descriptionFr: "Accès à l'API REST",
    icon: 'Code',
    category: 'advanced',
    plans: ['enterprise'],
    defaultEnabled: false,
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    nameFr: 'Webhooks',
    description: 'Webhook integration support',
    descriptionFr: 'Support d\'intégration webhook',
    icon: 'Webhook',
    category: 'advanced',
    plans: ['enterprise'],
    defaultEnabled: false,
  },
  {
    id: 'sso',
    name: 'Single Sign-On (SSO)',
    nameFr: 'Authentification Unique (SSO)',
    description: 'SSO/SAML integration',
    descriptionFr: 'Intégration SSO/SAML',
    icon: 'KeyRound',
    category: 'advanced',
    plans: ['enterprise'],
    defaultEnabled: false,
  },
];

/**
 * Plan definitions with limits and pricing info
 */
export interface PlanDefinition {
  id: string;
  name: string;
  nameFr: string;
  price: number;
  currency: string;
  maxUsers: number;
  maxProducts: number;
  maxCompanies: number;
  features: string[];
  description: string;
  descriptionFr: string;
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    nameFr: 'Gratuit',
    price: 0,
    currency: 'USD',
    maxUsers: 100,
    maxProducts: 500,
    maxCompanies: 50,
    features: ['catalog', 'rfq', 'messaging', 'orders', 'emailNotifications', 'reviews'],
    description: 'Perfect for getting started',
    descriptionFr: 'Parfait pour commencer',
  },
  {
    id: 'professional',
    name: 'Professional',
    nameFr: 'Professionnel',
    price: 99,
    currency: 'USD',
    maxUsers: 1000,
    maxProducts: 10000,
    maxCompanies: 500,
    features: [
      'catalog', 'advancedSearch', 'rfq', 'payments', 'orders',
      'messaging', 'notifications', 'emailNotifications', 'reviews', 'verification',
      'analytics', 'customTheme'
    ],
    description: 'For growing businesses',
    descriptionFr: 'Pour les entreprises en croissance',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    nameFr: 'Entreprise',
    price: 299,
    currency: 'USD',
    maxUsers: -1, // Unlimited
    maxProducts: -1,
    maxCompanies: -1,
    features: FEATURE_DEFINITIONS.map(f => f.id),
    description: 'Full platform access with white-label',
    descriptionFr: 'Accès complet à la plateforme en white-label',
  },
];

/**
 * Get feature definition by ID
 */
export function getFeatureDefinition(featureId: string): FeatureDefinition | undefined {
  return FEATURE_DEFINITIONS.find(f => f.id === featureId);
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: FeatureCategory): FeatureDefinition[] {
  return FEATURE_DEFINITIONS.filter(f => f.category === category);
}

/**
 * Get plan definition by ID
 */
export function getPlanDefinition(planId: string): PlanDefinition | undefined {
  return PLAN_DEFINITIONS.find(p => p.id === planId);
}

/**
 * Check if a feature is enabled for a given plan
 */
export function isFeatureAvailableForPlan(featureId: string, planId: string): boolean {
  const plan = getPlanDefinition(planId);
  if (!plan) return false;
  return plan.features.includes(featureId);
}

/**
 * Get features that can be enabled for a plan
 */
export function getAvailableFeaturesForPlan(planId: string): FeatureDefinition[] {
  return FEATURE_DEFINITIONS.filter(f => 
    isFeatureAvailableForPlan(f.id, planId)
  );
}

/**
 * Calculate if a tenant has exceeded their plan limits
 */
export function checkPlanLimits(
  planId: string,
  currentStats: {
    userCount: number;
    productCount: number;
    companyCount: number;
  }
): {
  withinLimits: boolean;
  exceeded: { resource: string; current: number; limit: number }[];
} {
  const plan = getPlanDefinition(planId);
  if (!plan || planId === 'enterprise') {
    // Enterprise has no limits
    return { withinLimits: true, exceeded: [] };
  }
  
  const exceeded: { resource: string; current: number; limit: number }[] = [];
  
  if (plan.maxUsers > 0 && currentStats.userCount > plan.maxUsers) {
    exceeded.push({ resource: 'users', current: currentStats.userCount, limit: plan.maxUsers });
  }
  
  if (plan.maxProducts > 0 && currentStats.productCount > plan.maxProducts) {
    exceeded.push({ resource: 'products', current: currentStats.productCount, limit: plan.maxProducts });
  }
  
  if (plan.maxCompanies > 0 && currentStats.companyCount > plan.maxCompanies) {
    exceeded.push({ resource: 'companies', current: currentStats.companyCount, limit: plan.maxCompanies });
  }
  
  return {
    withinLimits: exceeded.length === 0,
    exceeded,
  };
}

/**
 * Get default features for a plan
 */
export function getDefaultFeaturesForPlan(planId: string): string[] {
  const plan = getPlanDefinition(planId);
  return plan?.features || [];
}

/**
 * Validate feature flags object
 */
export function validateFeatureFlags(flags: Partial<FeatureFlags>): boolean {
  const validKeys = FEATURE_DEFINITIONS.map(f => f.id);
  return Object.keys(flags).every(key => validKeys.includes(key));
}
