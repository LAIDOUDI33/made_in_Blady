/**
 * useTenant Hook
 * Convenience hook for accessing tenant context
 * 
 * This hook provides access to:
 * - Current tenant information
 * - Theme configuration
 * - Locale settings
 * - Feature flags
 * - Formatting utilities
 */

'use client';

import { useTenant as useTenantContext, useFeature, useFormatting } from '@/providers/TenantProvider';
import type { Tenant, ThemeConfig, LocaleConfig, FeatureFlags } from '@/lib/multi-tenant/tenantResolver';

/**
 * Main hook for accessing tenant context
 */
export function useTenant() {
  return useTenantContext();
}

/**
 * Hook to check if a specific feature is enabled
 * @param featureId - The feature to check
 * @returns boolean indicating if feature is enabled
 * 
 * @example
 * ```tsx
 * const isPaymentsEnabled = useFeature('payments');
 * if (isPaymentsEnabled) {
 *   // Show payment UI
 * }
 * ```
 */
export { useFeature };

/**
 * Hook to get formatting utilities based on tenant locale
 * 
 * @returns Object with formatCurrency, formatDate, formatPhone functions
 * 
 * @example
 * ```tsx
 * const { formatCurrency } = useFormatting();
 * <span>{formatCurrency(1500)}</span> // "1,500.00 د.ج"
 * ```
 */
export { useFormatting };

// Re-export types for convenience
export type {
  Tenant,
  ThemeConfig,
  LocaleConfig,
  FeatureFlags,
};

/**
 * Higher-Order Component for feature-gated content
 * Only renders children if the specified feature is enabled
 */

import React from 'react';

interface FeatureGateProps {
  featureId: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({ featureId, fallback = null, children }: FeatureGateProps) {
  const isEnabled = useFeature(featureId);
  
  if (!isEnabled) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export default useTenant;
