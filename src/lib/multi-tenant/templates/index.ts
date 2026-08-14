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

export { algeriaTemplate } from './algeria';
export { tunisiaTemplate } from './tunisia';
export { moroccoTemplate } from './morocco';
export { egyptTemplate } from './egypt';

// All available templates
export const countryTemplates: Record<string, CountryTemplate> = {
  algeria: algeriaTemplate,
  tunisia: tunisiaTemplate,
  morocco: moroccoTemplate,
  egypt: egyptTemplate,
};

/**
 * Get template by ID
 */
export function getCountryTemplate(id: string): CountryTemplate | undefined {
  return countryTemplates[id];
}

/**
 * Get all available templates
 */
export function getAllCountryTemplates(): CountryTemplate[] {
  return Object.values(countryTemplates);
}

/**
 * Get templates filtered by region (e.g., "MENA", "Africa")
 */
export function getTemplatesByRegion(region: string): CountryTemplate[] {
  // For now, all templates are in MENA/Africa region
  return getAllCountryTemplates();
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
