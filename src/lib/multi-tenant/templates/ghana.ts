/**
 * Ghana Country Template for Multi-Tenant System
 * Template pour le Ghana - Marché B2B Afrique de l'Ouest
 */

import { CountryTemplate } from './index';

export const ghanaTemplate: CountryTemplate = {
  id: 'ghana',
  name: 'Ghana',
  slug: 'ghana',
  displayName: 'GhanaBiz',
  displayNameFr: 'GhanaBiz',
  country: 'Ghana',
  countryFr: 'Ghana',
  countryCode: 'GH',
  currency: 'GHS',
  currencySymbol: '₵',
  language: 'en',
  languages: ['en', 'ak', 'tw'],
  phonePrefix: '+233',
  primaryColor: '#ce1126', // Red (flag)
  secondaryColor: '#fcd116', // Yellow
  timezone: 'Africa/Accra',
  flagEmoji: '🇬🇭',
  regions: 16,
  regionName: 'Regions',
  regionNameFr: 'Régions',
  features: [
    'catalog',
    'rfq',
    'messaging',
    'payments',
    'reviews',
    'mobile_money',
    'gold_mining',
    'cocoa',
    'oil_gas',
    'tech',
  ],
  description: 'GhanaBiz - B2B Marketplace for Ghana\'s Gold, Cocoa & Oil sectors with Mobile Money integration',
  descriptionFr: 'GhanaBiz - Marketplace B2B pour les secteurs de l\'or, du cacao et pétrolier au Ghana avec intégration Mobile Money',
  defaultStrings: {
    welcome: 'Akwaaba to GhanaBiz',
    searchProducts: 'Hwɛ nneɛma',
    findSuppliers: 'Hwehwɛ nkitahodi',
    postRFQ: 'Pree bi a wopɛ sɛ woanya bo',
    marketplace: 'Ntɛkyerɛde',
    signIn: 'Log in',
    register: 'Bue akaunt',
    dashboard: 'Dashboard',
    messages: 'Asɛm',
    orders: 'Ndɛm',
    profile: 'Profile',
    settings: 'Nhyehyɛe',
    help: 'Mboafo',
    currencyFormat: '₵{amount}',
    dateFormat: 'DD/MM/YYYY',
  },
};
