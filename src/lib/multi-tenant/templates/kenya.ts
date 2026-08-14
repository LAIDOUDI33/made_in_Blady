/**
 * Kenya Country Template for Multi-Tenant System
 * Template pour le Kenya - Marché B2B Afrique de l'Est
 */

import { CountryTemplate } from './index';

export const kenyaTemplate: CountryTemplate = {
  id: 'kenya',
  name: 'Kenya',
  slug: 'kenya',
  displayName: 'KenyaBiz',
  displayNameFr: 'KenyaBiz',
  country: 'Kenya',
  countryFr: 'Kenya',
  countryCode: 'KE',
  currency: 'KES',
  currencySymbol: 'KSh',
  language: 'sw',
  languages: ['sw', 'en'],
  phonePrefix: '+254',
  primaryColor: '#006633', // Green (flag)
  secondaryColor: '#000000', // Black
  timezone: 'Africa/Nairobi',
  flagEmoji: '🇰🇪',
  regions: 47,
  regionName: 'Counties',
  regionNameFr: 'Comtés',
  features: [
    'catalog',
    'rfq',
    'messaging',
    'payments',
    'reviews',
    'mpesa',
    'agriculture',
    'tech_hub',
    'tourism',
    'logistics',
  ],
  description: 'KenyaBiz - B2B Marketplace for Kenya\'s Tech, Agriculture & Tourism sectors with M-Pesa integration',
  descriptionFr: 'KenyaBiz - Marketplace B2B pour les secteurs technologique, agricole et touristique au Kenya avec intégration M-Pesa',
  defaultStrings: {
    welcome: 'Karibu KenyaBiz',
    searchProducts: 'Tafuta bidhaa',
    findSuppliers: 'Pata wasambazaji',
    postRFQ: 'Toa ombi la bei',
    marketplace: 'Soko',
    signIn: 'Ingia',
    register: 'Jisajili',
    dashboard: 'Dashibodi',
    messages: 'Ujumbe',
    orders: 'Oda',
    profile: 'Wasifu',
    settings: 'Mipangilio',
    help: 'Msaada',
    currencyFormat: 'KSh {amount}',
    dateFormat: 'DD/MM/YYYY',
  },
};
