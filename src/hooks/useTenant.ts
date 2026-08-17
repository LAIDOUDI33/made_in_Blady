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
 */
export { useFeature };

/**
 * Hook to get formatting utilities based on tenant locale
 * @returns Object with formatCurrency, formatDate, formatPhone functions
 */
export { useFormatting };

// Re-export types for convenience
export type {
  Tenant,
  ThemeConfig,
  LocaleConfig,
  FeatureFlags,
};

export default useTenant;
