/**
 * Ethiopia Country Template for Multi-Tenant System
 * Template pour l'Éthiopie - Marché B2B Afrique de l'Est
 */

import { CountryTemplate } from './index';

export const ethiopiaTemplate: CountryTemplate = {
  id: 'ethiopia',
  name: 'Ethiopia',
  slug: 'ethiopia',
  displayName: 'EthioBiz',
  displayNameFr: 'EthioBiz',
  country: 'Ethiopia',
  countryFr: 'Éthiopie',
  countryCode: 'ET',
  currency: 'ETB',
  currencySymbol: 'Br',
  language: 'am',
  languages: ['am', 'en', 'om'],
  phonePrefix: '+251',
  primaryColor: '#006633', // Green (flag)
  secondaryColor: '#fecc00', // Yellow
  timezone: 'Africa/Addis_Ababa',
  flagEmoji: '🇪🇹',
  regions: 11,
  regionName: 'Regions',
  regionNameFr: 'Régions',
  features: [
    'catalog',
    'rfq',
    'messaging',
    'payments',
    'reviews',
    'coffee',
    'agriculture',
    'textile',
    'manufacturing',
  ],
  description: 'EthioBiz - B2B Marketplace for Ethiopia\'s Coffee, Agriculture & Textile sectors',
  descriptionFr: 'EthioBiz - Marketplace B2B pour les secteurs du café, agricole et textile en Éthiopie',
  defaultStrings: {
    welcome: 'እንኳን ደህና መጡ EthioBiz',
    searchProducts: 'ነገሮችን ይፈልጉ',
    findSuppliers: 'አቅራቢዎችን ያግኙ',
    postRFQ: 'የዋጋ ጥያቄ ያስገቡ',
    marketplace: 'ገበያ',
    signIn: 'ይግቡ',
    register: 'መለያ ይፍጠሩ',
    dashboard: 'ዳሽቦርድ',
    messages: 'መልእክቶች',
    orders: 'ትዕዛዞች',
    profile: 'መገለጫ',
    settings: 'ቅንብሮች',
    help: 'እርዳታ',
    currencyFormat: '{amount} Br',
    dateFormat: 'DD/MM/YYYY',
  },
};
