/**
 * Country Templates for Multi-Tenant System
 * Pre-configured templates for different markets
 */

export interface CountryTemplate {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  displayNameFr: string; // French name for UI
  country: string;
  countryFr: string; // French name of country
  countryCode: string;
  currency: string;
  currencySymbol: string;
  language: string;
  languages: string[];
  phonePrefix: string;
  primaryColor: string;
  secondaryColor: string;
  timezone: string;
  flagEmoji: string;
  regions: number;
  regionName: string; // e.g., "Wilayas", "Governorates"
  regionNameFr: string;
  features: string[];
  description: string;
  descriptionFr: string;
  // Default localization strings
  defaultStrings: Record<string, string>;
}

// Export all country templates
export { algeriaTemplate } from './algeria';
export { tunisiaTemplate } from './tunisia';
export { moroccoTemplate } from './morocco';
export { egyptTemplate } from './egypt';
export { senegalTemplate } from './senegal';
export { ivoryCoastTemplate } from './ivorycoast';
export { saudiArabiaTemplate } from './saudiarabia';
export { uaeTemplate } from './uae';

// All available templates
export const countryTemplates: Record<string, CountryTemplate> = {
  algeria: algeriaTemplate,
  tunisia: tunisiaTemplate,
  morocco: moroccoTemplate,
  egypt: egyptTemplate,
  senegal: senegalTemplate,
  ivorycoast: ivoryCoastTemplate,
  saudiarabia: saudiArabiaTemplate,
  uae: uaeTemplate,
};

// All tenants array for easy iteration
export const ALL_TENANTS = [
  algeriaTemplate,
  tunisiaTemplate,
  moroccoTemplate,
  egyptTemplate,
  senegalTemplate,
  ivoryCoastTemplate,
  saudiArabiaTemplate,
  uaeTemplate,
];

/**
 * Get template by ID
 */
export function getCountryTemplate(id: string): CountryTemplate | undefined {
  return countryTemplates[id];
}

/**
 * Get tenant by slug
 */
export function getTenantBySlug(slug: string): CountryTemplate | undefined {
  return ALL_TENANTS.find(t => t.slug === slug);
}

/**
 * Get all available templates
 */
export function getAllCountryTemplates(): CountryTemplate[] {
  return Object.values(countryTemplates);
}

/**
 * Region type for filtering tenants
 */
export type TenantRegion = 'africa' | 'mena' | 'gcc' | 'maghreb' | 'westafrica' | 'all';

/**
 * Get templates filtered by region (e.g., "MENA", "Africa", "GCC")
 */
export function getTenantsByRegion(region: TenantRegion): CountryTemplate[] {
  switch (region) {
    case 'africa':
      // All African countries
      return [
        algeriaTemplate,
        tunisiaTemplate,
        moroccoTemplate,
        egyptTemplate,
        senegalTemplate,
        ivoryCoastTemplate,
      ];
    case 'mena':
      // Middle East & North Africa
      return [
        algeriaTemplate,
        tunisiaTemplate,
        moroccoTemplate,
        egyptTemplate,
        saudiArabiaTemplate,
        uaeTemplate,
      ];
    case 'gcc':
      // Gulf Cooperation Council countries
      return [
        saudiArabiaTemplate,
        uaeTemplate,
      ];
    case 'maghreb':
      // North African Arab countries
      return [
        algeriaTemplate,
        tunisiaTemplate,
        moroccoTemplate,
        egyptTemplate,
      ];
    case 'westafrica':
      // West African Francophone countries
      return [
        senegalTemplate,
        ivoryCoastTemplate,
      ];
    case 'all':
    default:
      return ALL_TENANTS;
  }
}

/**
 * Get RTL (right-to-left) templates
 */
export function getRtlTemplates(): CountryTemplate[] {
  return ALL_TENANTS.filter(t => t.language === 'ar');
}

/**
 * Get LTR (left-to-right) templates
 */
export function getLtrTemplates(): CountryTemplate[] {
  return ALL_TENANTS.filter(t => t.language !== 'ar');
}

/**
 * Create tenant data from template
 */
export function createTenantFromTemplate(
  template: CountryTemplate,
  overrides?: Partial<CountryTemplate>
) {
  return {
    ...template,
    ...overrides,
    // Ensure slug is unique if not overridden
    slug: overrides?.slug || template.slug,
  };
}

/**
 * Get suggested features based on market maturity
 */
export function getSuggestedFeatures(countryId: string): string[] {
  const template = getCountryTemplate(countryId);
  return template?.features || ['catalog', 'rfq', 'messaging'];
}

/**
 * Get tenant locale configuration for i18n
 */
export function getTenantLocale(template: CountryTemplate) {
  return {
    locale: template.languages[0] === 'ar' ? `${template.countryCode.toLowerCase()}-${template.countryCode}` : `${template.language}-${template.countryCode}`,
    direction: template.language === 'ar' ? 'rtl' as const : 'ltr' as const,
    currency: template.currency,
    currencySymbol: template.currencySymbol,
    timezone: template.timezone,
  };
}
