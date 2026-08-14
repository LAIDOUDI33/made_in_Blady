/**
 * Multi-Tenant Resolution System
 * Resolves tenant from various sources: subdomain, domain, URL param, header, cookie
 */

import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  backgroundImage: string | null;
  defaultLanguage: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
  countryName: string;
  countryCode: string;
  phonePrefix: string;
  features: string;
  isActive: boolean;
  isPublic: boolean;
  ownerId: string | null;
  planType: string;
  subscriptionEnd: Date | null;
  customCSS: string | null;
  customJS: string | null;
  footerText: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantContext {
  tenant: Tenant;
  theme: ThemeConfig;
  locale: LocaleConfig;
  features: FeatureFlags;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  branding: {
    logo: string | null;
    favicon: string | null;
    name: string;
    backgroundImage: string | null;
  };
  borderRadius: string;
  fonts: {
    heading: string;
    body: string;
  };
}

export interface LocaleConfig {
  language: string;
  locale: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  countryName: string;
  countryCode: string;
  phonePrefix: string;
  direction: 'ltr' | 'rtl';
}

export interface FeatureFlags {
  catalog: boolean;
  rfq: boolean;
  messaging: boolean;
  payments: boolean;
  reviews: boolean;
  analytics: boolean;
  whiteLabel: boolean;
  customDomain: boolean;
  apiAccess: boolean;
  [key: string]: boolean;
}

// Default tenant slug
const DEFAULT_TENANT_SLUG = 'algeriatrade';

/**
 * Extract tenant identifier from request
 * Priority order:
 * 1. Subdomain (e.g., tunisie.algeriatrade.dz)
 * 2. Custom domain mapping
 * 3. URL parameter (?tenant=xxx)
 * 4. Header (X-Tenant-ID)
 * 5. Cookie (preferred_tenant)
 * 6. Default (algeriatrade)
 */
export async function extractTenantSlug(request: NextRequest): Promise<string> {
  const hostname = request.headers.get('host') || '';
  
  // 1. Check subdomain
  if (hostname) {
    // Remove port if present
    const hostWithoutPort = hostname.split(':')[0];
    
    // Check for known subdomain patterns
    const parts = hostWithoutPort.split('.');
    if (parts.length >= 3) {
      // e.g., tunisie.algeriatrade.dz or tunisie.localhost:3000
      const potentialSlug = parts[0];
      
      // Skip common subdomains that aren't tenants
      const skipSubdomains = ['www', 'api', 'admin', 'app', 'staging', 'dev', 'mail'];
      if (!skipSubdomains.includes(potentialSlug)) {
        // Verify this is a valid tenant
        const tenant = await db.tenant.findUnique({
          where: { slug: potentialSlug },
        });
        
        if (tenant && tenant.isActive) {
          return potentialSlug;
        }
      }
    }
    
    // 2. Check custom domain
    const tenantByDomain = await db.tenant.findFirst({
      where: {
        domain: hostWithoutPort,
        isActive: true,
      },
    });
    
    if (tenantByDomain) {
      return tenantByDomain.slug;
    }
  }
  
  // 3. Check URL parameter
  const { searchParams } = new URL(request.url);
  const urlTenant = searchParams.get('tenant');
  if (urlTenant) {
    const tenant = await db.tenant.findUnique({
      where: { slug: urlTenant },
    });
    if (tenant && tenant.isActive) {
      return urlTenant;
    }
  }
  
  // 4. Check header
  const headerTenant = request.headers.get('X-Tenant-ID');
  if (headerTenant) {
    const tenant = await db.tenant.findUnique({
      where: { slug: headerTenant },
    });
    if (tenant && tenant.isActive) {
      return headerTenant;
    }
  }
  
  // 5. Check cookie
  const cookieStore = await cookies();
  const cookieTenant = cookieStore.get('preferred_tenant')?.value;
  if (cookieTenant) {
    const tenant = await db.tenant.findUnique({
      where: { slug: cookieTenant },
    });
    if (tenant && tenant.isActive) {
      return cookieTenant;
    }
  }
  
  // 6. Return default
  return DEFAULT_TENANT_SLUG;
}

/**
 * Resolve full tenant context from slug
 */
export async function resolveTenant(slug: string): Promise<TenantContext | null> {
  const tenant = await db.tenant.findUnique({
    where: { slug },
  });
  
  if (!tenant || !tenant.isActive) {
    return null;
  }
  
  return {
    tenant,
    theme: generateTheme(tenant),
    locale: generateLocaleConfig(tenant),
    features: parseFeatures(tenant.features),
  };
}

/**
 * Resolve tenant from request with full context
 */
export async function resolveTenantFromRequest(request: NextRequest): Promise<TenantContext> {
  const slug = await extractTenantSlug(request);
  const context = await resolveTenant(slug);
  
  if (!context) {
    // Fallback to default tenant
    const defaultContext = await resolveTenant(DEFAULT_TENANT_SLUG);
    if (!defaultContext) {
      throw new Error('Default tenant not found');
    }
    return defaultContext;
  }
  
  return context;
}

/**
 * Generate theme configuration from tenant data
 */
export function generateTheme(tenant: Tenant): ThemeConfig {
  return {
    colors: {
      primary: tenant.primaryColor,
      secondary: tenant.secondaryColor,
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#1a1a1a',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      accent: tenant.primaryColor + '20', // 20% opacity
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    branding: {
      logo: tenant.logoUrl,
      favicon: tenant.faviconUrl,
      name: tenant.name,
      backgroundImage: tenant.backgroundImage,
    },
    borderRadius: '0.5rem',
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
  };
}

/**
 * Generate locale configuration from tenant data
 */
export function generateLocaleConfig(tenant: Tenant): LocaleConfig {
  // Determine text direction based on language
  const rtlLanguages = ['ar'];
  const direction: 'ltr' | 'rtl' = rtlLanguages.includes(tenant.defaultLanguage) ? 'rtl' : 'ltr';
  
  return {
    language: tenant.defaultLanguage,
    locale: tenant.locale,
    timezone: tenant.timezone,
    currency: tenant.currency,
    currencySymbol: tenant.currencySymbol,
    countryName: tenant.countryName,
    countryCode: tenant.countryCode,
    phonePrefix: tenant.phonePrefix,
    direction,
  };
}

/**
 * Parse features JSON string into feature flags object
 */
export function parseFeatures(featuresJson: string): FeatureFlags {
  try {
    const features: string[] = JSON.parse(featuresJson || '[]');
    
    return {
      catalog: features.includes('catalog'),
      rfq: features.includes('rfq'),
      messaging: features.includes('messaging'),
      payments: features.includes('payments'),
      reviews: features.includes('reviews'),
      analytics: features.includes('analytics'),
      whiteLabel: features.includes('whiteLabel'),
      customDomain: features.includes('customDomain'),
      apiAccess: features.includes('apiAccess'),
      // Add all features as flags
      ...features.reduce((acc, feature) => ({ ...acc, [feature]: true }), {}),
    };
  } catch {
    // Default features if parsing fails
    return {
      catalog: true,
      rfq: true,
      messaging: true,
      payments: false,
      reviews: true,
      analytics: false,
      whiteLabel: false,
      customDomain: false,
      apiAccess: false,
    };
  }
}

/**
 * Format currency amount based on tenant config
 */
export function formatCurrency(amount: number, tenant: Tenant): string {
  const formattedAmount = new Intl.NumberFormat(tenant.locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `${formattedAmount} ${tenant.currencySymbol}`;
}

/**
 * Format date based on tenant's locale and timezone
 */
export function formatDate(date: Date, tenant: Tenant): string {
  return new Intl.DateTimeFormat(tenant.locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: tenant.timezone,
  }).format(date);
}

/**
 * Format phone number with tenant's phone prefix
 */
export function formatPhone(phone: string, tenant: Tenant): string {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // If already has country code, return as is
  if (cleanPhone.startsWith(tenant.phonePrefix.replace('+', ''))) {
    return `${tenant.phonePrefix} ${cleanPhone.slice(tenant.phonePrefix.length - 1)}`;
  }
  
  return `${tenant.phonePrefix} ${cleanPhone}`;
}

/**
 * Get all public tenants for marketplace listing
 */
export async function getPublicTenants(): Promise<Tenant[]> {
  return db.tenant.findMany({
    where: {
      isActive: true,
      isPublic: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

/**
 * Get tenant by slug (public info only)
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return db.tenant.findUnique({
    where: { slug },
  });
}

/**
 * Create a new tenant
 */
export async function createTenant(data: {
  slug: string;
  name: string;
  domain?: string;
  primaryColor?: string;
  secondaryColor?: string;
  defaultLanguage?: string;
  currency?: string;
  currencySymbol?: string;
  locale?: string;
  timezone?: string;
  countryName?: string;
  countryCode?: string;
  phonePrefix?: string;
  features?: string[];
  ownerId?: string;
  planType?: string;
  contactEmail?: string;
  contactPhone?: string;
}): Promise<Tenant> {
  return db.tenant.create({
    data: {
      slug: data.slug,
      name: data.name,
      domain: data.domain || null,
      primaryColor: data.primaryColor || '#006233',
      secondaryColor: data.secondaryColor || '#D52B1E',
      defaultLanguage: data.defaultLanguage || 'fr',
      currency: data.currency || 'DZD',
      currencySymbol: data.currencySymbol || 'د.ج',
      locale: data.locale || 'fr-DZ',
      timezone: data.timezone || 'Africa/Algiers',
      countryName: data.countryName || 'Algérie',
      countryCode: data.countryCode || 'DZ',
      phonePrefix: data.phonePrefix || '+213',
      features: JSON.stringify(data.features || ['catalog', 'rfq', 'messaging']),
      ownerId: data.ownerId || null,
      planType: data.planType || 'free',
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
    },
  });
}

/**
 * Update an existing tenant
 */
export async function updateTenant(
  id: string,
  data: Partial<{
    name: string;
    domain: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    backgroundImage: string;
    defaultLanguage: string;
    currency: string;
    currencySymbol: string;
    locale: string;
    timezone: string;
    countryName: string;
    countryCode: string;
    phonePrefix: string;
    features: string[];
    isActive: boolean;
    isPublic: boolean;
    planType: string;
    subscriptionEnd: Date;
    customCSS: string;
    customJS: string;
    footerText: string;
    contactEmail: string;
    contactPhone: string;
    websiteUrl: string;
    facebookUrl: string;
    linkedinUrl: string;
    twitterUrl: string;
  }>
): Promise<Tenant> {
  const updateData: Record<string, unknown> = { ...data };
  
  // Convert features array to JSON string if provided
  if (data.features) {
    updateData.features = JSON.stringify(data.features);
  }
  
  return db.tenant.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete a tenant (soft delete by deactivating)
 */
export async function deactivateTenant(id: string): Promise<Tenant> {
  return db.tenant.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Permanently delete a tenant
 */
export async function deleteTenant(id: string): Promise<Tenant> {
  return db.tenant.delete({
    where: { id },
  });
}

/**
 * Get tenant statistics
 */
export async function getTenantStats(tenantId: string) {
  const [
    userCount,
    companyCount,
    productCount,
    rfqCount,
  ] = await Promise.all([
    db.user.count({ where: { tenantId } }),
    db.company.count({ where: { tenantId } }),
    db.product.count({ 
      where: { 
        company: { tenantId },
        status: 'published' 
      } 
    }),
    db.rfq.count({ 
      where: { 
        buyer: { tenantId },
        status: { not: 'DRAFT' }
      } 
    }),
  ]);
  
  return {
    userCount,
    companyCount,
    productCount,
    rfqCount,
  };
}
