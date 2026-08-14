/**
 * Mauritania Country Template for Multi-Tenant System
 * Template pour la Mauritanie - Marché B2B Ouest-Africain
 */

import { CountryTemplate } from './index';

export const mauritaniaTemplate: CountryTemplate = {
  id: 'mauritania',
  name: 'Mauritania',
  slug: 'mauritania',
  displayName: 'MauritanieB2B',
  displayNameFr: 'MauritanieB2B',
  country: 'Mauritania',
  countryFr: 'Mauritanie',
  countryCode: 'MR',
  currency: 'MRU',
  currencySymbol: 'UM',
  language: 'fr',
  languages: ['fr', 'ar'],
  phonePrefix: '+222',
  primaryColor: '#00875a', // Green (flag color)
  secondaryColor: '#ffd700', // Gold accent
  timezone: 'Africa/Nouakchott',
  flagEmoji: '🇲🇷',
  regions: 12,
  regionName: 'Régions',
  regionNameFr: 'Wilayas',
  features: [
    'catalog',
    'rfq',
    'messaging',
    'payments',
    'reviews',
    'mining_sector',
    'fishing',
    'agriculture',
  ],
  description: 'MauritanieB2B - B2B Marketplace for Mauritania\'s Mining, Fishing & Agriculture sectors',
  descriptionFr: 'MauritanieB2B - Marketplace B2B pour les secteurs minier, de la pêche et agricole en Mauritanie',
  defaultStrings: {
    welcome: 'Bienvenue sur MauritanieB2B',
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
    currencyFormat: '{amount} UM',
    dateFormat: 'DD/MM/YYYY',
  },
};
