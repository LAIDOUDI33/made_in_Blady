/**
 * Country Templates for Multi-Tenant System
 * Pre-configured templates for different markets
 * 
 * Phase 4: Expanded to 22 countries across Africa & MENA
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

// =============================================================================
// Maghreb Countries (North Africa)
// =============================================================================
export { algeriaTemplate } from './algeria';
export { tunisiaTemplate } from './tunisia';
export { moroccoTemplate } from './morocco';
export { libyaTemplate } from './libya';

// =============================================================================
// West African Francophone Countries
// =============================================================================
export { senegalTemplate } from './senegal';
export { ivoryCoastTemplate } from './ivorycoast';
export { mauritaniaTemplate } from './mauritania';
export { cameroonTemplate } from './cameroon';

// =============================================================================
// East African Countries
// =============================================================================
export { ethiopiaTemplate } from './ethiopia';
export { kenyaTemplate } from './kenya';

// =============================================================================
// West African Anglophone Countries
// =============================================================================
export { nigeriaTemplate } from './nigeria';
export { ghanaTemplate } from './ghana';

// =============================================================================
// Nile Valley & Horn of Africa
// =============================================================================
export { egyptTemplate } from './egypt';
export { sudanTemplate } from './sudan';

// =============================================================================
// Middle Eastern Arab Countries (MENA)
// =============================================================================
export { saudiArabiaTemplate } from './saudiarabia';
export { uaeTemplate } from './uae';
export { jordanTemplate } from './jordan';
export { qatarTemplate } from './qatar';
export { kuwaitTemplate } from './kuwait';
export { bahrainTemplate } from './bahrain';
export { omanTemplate } from './oman';
export { iraqTemplate } from './iraq';

// =============================================================================
// All Available Templates - Complete Registry
// =============================================================================
export const countryTemplates: Record<string, CountryTemplate> = {
  // Maghreb (8)
  algeria: algeriaTemplate,
  tunisia: tunisiaTemplate,
  morocco: moroccoTemplate,
  libya: libyaTemplate,
  
  // West Africa Francophone (4)
  senegal: senegalTemplate,
  ivorycoast: ivoryCoastTemplate,
  mauritania: mauritaniaTemplate,
  cameroon: cameroonTemplate,
  
  // East Africa (2)
  ethiopia: ethiopiaTemplate,
  kenya: kenyaTemplate,
  
  // West Africa Anglophone (2)
  nigeria: nigeriaTemplate,
  ghana: ghanaTemplate,
  
  // Nile Valley/Horn (2)
  egypt: egyptTemplate,
  sudan: sudanTemplate,
  
  // GCC/Middle East (8)
  saudiarabia: saudiArabiaTemplate,
  uae: uaeTemplate,
  jordan: jordanTemplate,
  qatar: qatarTemplate,
  kuwait: kuwaitTemplate,
  bahrain: bahrainTemplate,
  oman: omanTemplate,
  iraq: iraqTemplate,
};

// All tenants array for easy iteration
export const ALL_TENANTS = [
  // Maghreb
  algeriaTemplate,
  tunisiaTemplate,
  moroccoTemplate,
  libyaTemplate,
  
  // West Africa Francophone
  senegalTemplate,
  ivoryCoastTemplate,
  mauritaniaTemplate,
  cameroonTemplate,
  
  // East Africa
  ethiopiaTemplate,
  kenyaTemplate,
  
  // West Africa Anglophone
  nigeriaTemplate,
  ghanaTemplate,
  
  // Nile Valley/Horn
  egyptTemplate,
  sudanTemplate,
  
  // GCC/Middle East
  saudiArabiaTemplate,
  uaeTemplate,
  jordanTemplate,
  qatarTemplate,
  kuwaitTemplate,
  bahrainTemplate,
  omanTemplate,
  iraqTemplate,
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
export type TenantRegion = 'africa' | 'mena' | 'gcc' | 'maghreb' | 'westafrica' | 'eastafrica' | 'nilevalley' | 'all';

/**
 * Get templates filtered by region (e.g., "MENA", "Africa", "GCC")
 */
export function getTenantsByRegion(region: TenantRegion): CountryTemplate[] {
  switch (region) {
    case 'africa':
      // All African countries (14)
      return [
        algeriaTemplate,
        tunisiaTemplate,
        moroccoTemplate,
        libyaTemplate,
        senegalTemplate,
        ivoryCoastTemplate,
        mauritaniaTemplate,
        cameroonTemplate,
        ethiopiaTemplate,
        kenyaTemplate,
        nigeriaTemplate,
        ghanaTemplate,
        egyptTemplate,
        sudanTemplate,
      ];
    case 'mena':
      // Middle East & North Africa (16)
      return [
        algeriaTemplate,
        tunisiaTemplate,
        moroccoTemplate,
        libyaTemplate,
        egyptTemplate,
        sudanTemplate,
        saudiArabiaTemplate,
        uaeTemplate,
        jordanTemplate,
        qatarTemplate,
        kuwaitTemplate,
        bahrainTemplate,
        omanTemplate,
        iraqTemplate,
      ];
    case 'gcc':
      // Gulf Cooperation Council countries (6)
      return [
        saudiArabiaTemplate,
        uaeTemplate,
        qatarTemplate,
        kuwaitTemplate,
        bahrainTemplate,
        omanTemplate,
      ];
    case 'maghreb':
      // North African Arab countries (5)
      return [
        algeriaTemplate,
        tunisiaTemplate,
        moroccoTemplate,
        libyaTemplate,
        egyptTemplate,
      ];
    case 'westafrica':
      // West African countries (6)
      return [
        senegalTemplate,
        ivoryCoastTemplate,
        mauritaniaTemplate,
        cameroonTemplate,
        nigeriaTemplate,
        ghanaTemplate,
      ];
    case 'eastafrica':
      // East African countries (2)
      return [
        ethiopiaTemplate,
        kenyaTemplate,
      ];
    case 'nilevalley':
      // Nile Valley countries (2)
      return [
        egyptTemplate,
        sudanTemplate,
      ];
    case 'all':
    default:
      return ALL_TENANTS;
  }
}

/**
 * Get RTL (right-to-left) templates - Arabic language countries
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
 * Get Francophone countries (French as primary or official language)
 */
export function getFrancophoneTemplates(): CountryTemplate[] {
  return ALL_TENANTS.filter(t => t.languages.includes('fr'));
}

/**
 * Get Anglophone countries (English as primary language)
 */
export function getAnglophoneTemplates(): CountryTemplate[] {
  return ALL_TENANTS.filter(t => t.language === 'en');
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

/**
 * Get countries with specific payment methods
 */
export function getCountriesWithPaymentMethod(method: string): CountryTemplate[] {
  const paymentFeatureMap: Record<string, string[]> = {
    mpesa: ['mpesa'],
    orange_money: ['mobile_money_orange'],
    mtn_money: ['mobile_money_mtn'],
    baridimob: ['baridimob'],
    cib: ['cib', 'ccp'],
    stc_pay: ['stc_pay'],
  };
  
  const requiredFeatures = paymentFeatureMap[method] || [method];
  
  return ALL_TENANTS.filter(template =>
    requiredFeatures.some(feature => template.features.includes(feature))
  );
}
