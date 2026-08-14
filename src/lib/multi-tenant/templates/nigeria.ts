/**
 * Nigeria Country Template for Multi-Tenant System
 * Template pour le Nigeria - Marché B2B Afrique de l'Ouest
 */

import { CountryTemplate } from './index';

export const nigeriaTemplate: CountryTemplate = {
  id: 'nigeria',
  name: 'Nigeria',
  slug: 'nigeria',
  displayName: 'NigeriaTrade',
  displayNameFr: 'NigeriaTrade',
  country: 'Nigeria',
  countryFr: 'Nigéria',
  countryCode: 'NG',
  currency: 'NGN',
  currencySymbol: '₦',
  language: 'en',
  languages: ['en', 'yo', 'ha', 'ig'],
  phonePrefix: '+234',
  primaryColor: '#008751', // Green
  secondaryColor: '#ffffff', // White
  timezone: 'Africa/Lagos',
  flagEmoji: '🇳🇬',
  regions: 36,
  regionName: 'States',
  regionNameFr: 'États',
  features: [
    'catalog',
    'rfq',
    'messaging',
    'payments',
    'reviews',
    'oil_gas',
    'fintech',
    'agriculture',
    'entertainment',
    'ecommerce',
  ],
  description: 'NigeriaTrade - B2B Marketplace for Nigeria\'s Oil & Gas, Fintech & Agriculture sectors',
  descriptionFr: 'NigeriaTrade - Marketplace B2B pour les secteurs pétrolier, fintech et agricole au Nigéria',
  defaultStrings: {
    welcome: 'Welcome to NigeriaTrade',
    searchProducts: 'Search products',
    findSuppliers: 'Find suppliers',
    postRFQ: 'Post a request for quote',
    marketplace: 'Marketplace',
    signIn: 'Sign in',
    register: 'Create account',
    dashboard: 'Dashboard',
    messages: 'Messages',
    orders: 'Orders',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help',
    currencyFormat: '₦{amount}',
    dateFormat: 'DD/MM/YYYY',
  },
};
