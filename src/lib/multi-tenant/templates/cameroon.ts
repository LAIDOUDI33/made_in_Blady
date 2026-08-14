/**
 * Cameroon Country Template for Multi-Tenant System
 * Template pour le Cameroun - Marché B2B Afrique Centrale
 */

import { CountryTemplate } from './index';

export const cameroonTemplate: CountryTemplate = {
  id: 'cameroon',
  name: 'Cameroon',
  slug: 'cameroon',
  displayName: 'CamerounB2B',
  displayNameFr: 'CamerounB2B',
  country: 'Cameroon',
  countryFr: 'Cameroun',
  countryCode: 'CM',
  currency: 'XAF',
  currencySymbol: 'FCFA',
  language: 'fr',
  languages: ['fr', 'en'],
  phonePrefix: '+237',
  primaryColor: '#ce1126', // Red
  secondaryColor: '#007a3d', // Green
  timezone: 'Africa/Douala',
  flagEmoji: '🇨🇲',
  regions: 10,
  regionName: 'Regions',
  regionNameFr: 'Régions',
  features: [
    'catalog',
    'rfq',
    'messaging',
    'payments',
    'reviews',
    'mobile_money_orange',
    'mobile_money_mtn',
    'oil_gas',
    'agriculture',
    'timber',
    'bilingual',
  ],
  description: 'CamerounB2B - Bilingual B2B Marketplace for Cameroon\'s Oil, Agriculture & Timber sectors',
  descriptionFr: 'CamerounB2B - Marketplace B2B bilingue pour les secteurs pétrolier, agricole et forestier au Cameroun',
  defaultStrings: {
    welcome: 'Bienvenue sur CamerounB2B',
    searchProducts: 'Rechercher des produits',
    findSuppliers: 'Trouver des fournisseurs',
    postRFQ: 'Publier un appel d\'offres',
    marketplace: 'Marketplace',
    signIn: 'Se connecter',
    register: 'Créer un compte',
    dashboard: 'Tableau de bord',
    messages: 'Messages',
    orders: 'Commandes',
    profile: 'Profil',
    settings: 'Paramètres',
    help: 'Aide',
    currencyFormat: '{amount} FCFA',
    dateFormat: 'DD/MM/YYYY',
  },
};
