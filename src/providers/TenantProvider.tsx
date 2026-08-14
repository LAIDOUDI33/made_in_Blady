'use client';

/**
 * Tenant Provider - Provides tenant context to all components
 * Wraps the application with tenant-specific theme and configuration
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Tenant, TenantContext, ThemeConfig, LocaleConfig, FeatureFlags } from '@/lib/multi-tenant/tenantResolver';
import { generateCSSVariables } from '@/lib/multi-tenant/themeGenerator';

// Default tenant context for when no tenant is loaded
const defaultTenant: Tenant = {
  id: 'default',
  slug: 'algeriatrade',
  name: 'AlgeriaTrade',
  domain: null,
  primaryColor: '#006233',
  secondaryColor: '#D52B1E',
  logoUrl: null,
  faviconUrl: null,
  backgroundImage: null,
  defaultLanguage: 'fr',
  currency: 'DZD',
  currencySymbol: 'د.ج',
  locale: 'fr-DZ',
  timezone: 'Africa/Algiers',
  countryName: 'Algérie',
  countryCode: 'DZ',
  phonePrefix: '+213',
  features: JSON.stringify(['catalog', 'rfq', 'messaging', 'payments', 'reviews']),
  isActive: true,
  isPublic: true,
  ownerId: null,
  planType: 'free',
  subscriptionEnd: null,
  customCSS: null,
  customJS: null,
  footerText: null,
  contactEmail: null,
  contactPhone: null,
  websiteUrl: null,
  facebookUrl: null,
  linkedinUrl: null,
  twitterUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultTheme: ThemeConfig = generateDefaultTheme(defaultTenant);
const defaultLocale: LocaleConfig = generateDefaultLocale(defaultTenant);
const defaultFeatures: FeatureFlags = {
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

interface TenantContextType {
  tenant: Tenant;
  theme: ThemeConfig;
  locale: LocaleConfig;
  features: FeatureFlags;
  isLoading: boolean;
  error: string | null;
  setTenant: (tenant: Tenant) => void;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  // Utility functions
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  formatPhone: (phone: string) => string;
  t: (key: string) => string;
}

const TenantContext = createContext<TenantContextType>({
  tenant: defaultTenant,
  theme: defaultTheme,
  locale: defaultLocale,
  features: defaultFeatures,
  isLoading: true,
  error: null,
  setTenant: () => {},
  updateTheme: () => {},
  formatCurrency: () => '',
  formatDate: () => '',
  formatPhone: () => '',
  t: (key) => key,
});

function generateDefaultTheme(tenant: Tenant): ThemeConfig {
  return {
    colors: {
      primary: tenant.primaryColor,
      secondary: tenant.secondaryColor,
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#1a1a1a',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      accent: tenant.primaryColor + '20',
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

function generateDefaultLocale(tenant: Tenant): LocaleConfig {
  const rtlLanguages = ['ar'];
  return {
    language: tenant.defaultLanguage,
    locale: tenant.locale,
    timezone: tenant.timezone,
    currency: tenant.currency,
    currencySymbol: tenant.currencySymbol,
    countryName: tenant.countryName,
    countryCode: tenant.countryCode,
    phonePrefix: tenant.phonePrefix,
    direction: rtlLanguages.includes(tenant.defaultLanguage) ? 'rtl' : 'ltr',
  };
}

export function TenantProvider({ 
  children, 
  initialTenant 
}: { 
  children: React.ReactNode;
  initialTenant?: Tenant;
}) {
  const [tenant, setTenantState] = useState<Tenant>(initialTenant || defaultTenant);
  const [theme, setTheme] = useState<ThemeConfig>(generateDefaultTheme(initialTenant || defaultTenant));
  const [locale, setLocale] = useState<LocaleConfig>(generateDefaultLocale(initialTenant || defaultTenant));
  const [features, setFeatures] = useState<FeatureFlags>(defaultFeatures);
  const [isLoading, setIsLoading] = useState(!initialTenant);
  const [error, setError] = useState<string | null>(null);

  // Set tenant and update derived state
  const setTenant = useCallback((newTenant: Tenant) => {
    setTenantState(newTenant);
    setTheme(generateDefaultTheme(newTenant));
    setLocale(generateDefaultLocale(newTenant));
    
    // Parse features
    try {
      const parsedFeatures = JSON.parse(newTenant.features || '[]');
      const featureFlags: FeatureFlags = {
        catalog: parsedFeatures.includes('catalog'),
        rfq: parsedFeatures.includes('rfq'),
        messaging: parsedFeatures.includes('messaging'),
        payments: parsedFeatures.includes('payments'),
        reviews: parsedFeatures.includes('reviews'),
        analytics: parsedFeatures.includes('analytics'),
        whiteLabel: parsedFeatures.includes('whiteLabel'),
        customDomain: parsedFeatures.includes('customDomain'),
        apiAccess: parsedFeatures.includes('apiAccess'),
        ...parsedFeatures.reduce((acc, f: string) => ({ ...acc, [f]: true }), {}),
      };
      setFeatures(featureFlags);
    } catch {
      setFeatures(defaultFeatures);
    }
    
    setIsLoading(false);
    setError(null);
  }, []);

  // Update theme partially
  const updateTheme = useCallback((updates: Partial<ThemeConfig>) => {
    setTheme(prev => ({
      ...prev,
      ...updates,
      colors: { ...prev.colors, ...updates.colors },
      branding: { ...prev.branding, ...updates.branding },
      fonts: { ...prev.fonts, ...updates.fonts },
    }));
  }, []);

  // Apply CSS variables when theme changes
  useEffect(() => {
    const styleId = 'tenant-theme-variables';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = generateCSSVariables(theme);
    
    // Update document direction
    document.documentElement.dir = locale.direction;
    document.documentElement.lang = locale.language;
  }, [theme, locale]);

  // Load custom CSS if configured
  useEffect(() => {
    if (tenant.customCSS) {
      const customStyleId = 'tenant-custom-css';
      let customStyleElement = document.getElementById(customStyleId);
      
      if (!customStyleElement) {
        customStyleElement = document.createElement('style');
        customStyleElement.id = customStyleId;
        document.head.appendChild(customStyleElement);
      }
      
      customStyleElement.textContent = `/* Custom CSS for ${tenant.name} */\n${tenant.customCSS}`;
    }
  }, [tenant.customCSS, tenant.name]);

  // Format currency based on tenant config
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat(locale.locale, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ` ${locale.currencySymbol}`;
  }, [locale.locale, locale.currencySymbol]);

  // Format date based on tenant's locale and timezone
  const formatDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat(locale.locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: locale.timezone,
    }).format(date);
  }, [locale.locale, locale.timezone]);

  // Format phone number with tenant's prefix
  const formatPhone = useCallback((phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith(locale.phonePrefix.replace('+', ''))) {
      return `${locale.phonePrefix} ${cleanPhone.slice(locale.phonePrefix.length - 1)}`;
    }
    return `${locale.phonePrefix} ${cleanPhone}`;
  }, [locale.phonePrefix]);

  // Simple translation function (can be extended)
  const t = useCallback((key: string): string => {
    // This is a placeholder - in a real app, you'd load translations
    const translations: Record<string, Record<string, string>> = {
      fr: {
        home: 'Accueil',
        products: 'Produits',
        suppliers: 'Fournisseurs',
        search: 'Rechercher',
        login: 'Connexion',
        register: "S'inscrire",
        contact: 'Contact',
        about: 'À propos',
        price: 'Prix',
        company: 'Entreprise',
        category: 'Catégorie',
      },
      ar: {
        home: 'الرئيسية',
        products: 'المنتجات',
        suppliers: 'الموردون',
        search: 'بحث',
        login: 'تسجيل الدخول',
        register: 'إنشاء حساب',
        contact: 'اتصل بنا',
        about: 'حول',
        price: 'السعر',
        company: 'الشركة',
        category: 'الفئة',
      },
    };
    
    return translations[locale.language]?.[key] || key;
  }, [locale.language]);

  const value: TenantContextType = {
    tenant,
    theme,
    locale,
    features,
    isLoading,
    error,
    setTenant,
    updateTheme,
    formatCurrency,
    formatDate,
    formatPhone,
    t,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to access tenant context
 */
export function useTenant() {
  const context = useContext(TenantContext);
  
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  
  return context;
}

/**
 * Hook to check if a feature is enabled
 */
export function useFeature(featureId: string): boolean {
  const { features } = useTenant();
  return features[featureId as keyof FeatureFlags] || false;
}

/**
 * Hook to get current tenant's formatting utilities
 */
export function useFormatting() {
  const { formatCurrency, formatDate, formatPhone, locale } = useTenant();
  
  return {
    formatCurrency,
    formatDate,
    formatPhone,
    locale,
  };
}

export default TenantContext;
