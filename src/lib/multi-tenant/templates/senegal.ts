/**
 * Senegal Template
 * SenegalTrade - Senegalese B2B Marketplace
 */

import { CountryTemplate } from './index';

export const senegalTemplate: CountryTemplate = {
  id: 'senegal',
  name: 'SenegalTrade',
  slug: 'senegaltrade',
  displayName: 'SenegalTrade',
  displayNameFr: 'SenegalTrade',
  country: 'Senegal',
  countryFr: 'Sénégal',
  countryCode: 'SN',
  currency: 'XOF',
  currencySymbol: 'FCFA',
  language: 'fr',
  languages: ['fr', 'wo'],
  phonePrefix: '+221',
  primaryColor: '#00853F', // Senegal green
  secondaryColor: '#FEBE10', // Senegal yellow
  timezone: 'Africa/Dakar',
  flagEmoji: '🇸🇳',
  regions: 14,
  regionName: 'Regions',
  regionNameFr: 'Régions',
  features: ['catalog', 'rfq', 'messaging', 'reviews', 'emailNotifications'],
  description: 'The #1 B2B marketplace in Senegal connecting buyers with verified suppliers across all 14 regions.',
  descriptionFr: 'La marketplace B2B n°1 au Sénégal connectant acheteurs et fournisseurs vérifiés sur les 14 régions.',
  
  defaultStrings: {
    // Navigation
    home: 'Accueil',
    products: 'Produits',
    suppliers: 'Fournisseurs',
    rfq: "Appels d'offres",
    about: 'À propos',
    contact: 'Contact',
    
    // Actions
    search: 'Rechercher',
    login: 'Connexion',
    register: "S'inscrire",
    submit: 'Soumettre',
    save: 'Enregistrer',
    cancel: 'Annuler',
    
    // Labels
    price: 'Prix',
    currency: 'FCFA',
    location: 'Localisation',
    company: 'Entreprise',
    category: 'Catégorie',
    
    // Specific to Senegal
    wilaya: 'Région',
    commune: 'Département',
    nif: 'NINEA',
    nis: 'Numéro SYSCOHADA',
    rc: 'RCCM',
    
    // Messages
    welcome: 'Bienvenue sur SenegalTrade',
    tagline: 'Votre plateforme B2B de confiance au Sénégal',
  },
};

// Senegalese Regions data for seed (14 Regions of Senegal)
export const senegaleseRegions = [
  { code: 'DK', name: 'Dakar', nameAr: 'داكار' },
  { code: 'TH', name: 'Thiès', nameAr: 'تيس' },
  { code: 'DI', name: 'Diourbel', nameAr: 'ديوربل' },
  { code: 'SL', name: 'Saint-Louis', nameAr: 'سان لويس' },
  { code: 'KA', name: 'Kaolack', nameAr: 'كولاك' },
  { code: 'LO', name: 'Louga', nameAr: 'لوغا' },
  { code: 'TM', name: 'Tamba', nameAr: 'تمبا' },
  { code: 'KL', name: 'Kolda', nameAr: 'كولدا' },
  { code: 'FG', name: 'Fatick', nameAr: 'فاتيك' },
  { code: 'KA2', name: 'Kaffrine', nameAr: 'كافرين' },
  { code: 'KD', name: 'Kédougou', nameAr: 'كيديوغو' },
  { code: 'MT', name: 'Matam', nameAr: 'ماتام' },
  { code: 'SG', name: 'Sédhiou', nameAr: 'سيديو' },
  { code: 'ZG', name: 'Ziguinchor', nameAr: 'زيغينشور' },
];

// Popular categories in Senegal
export const senegaleseCategories = [
  { name: 'Agriculture', slug: 'agriculture', icon: '🌾' },        // Peanuts, cotton, millet
  { name: 'Pêche & Produits de la Mer', slug: 'fishing', icon: '🐟' }, // Seafood industry
  { name: 'Mines & Extraction', slug: 'mining', icon: '⛏️' },       // Phosphates, gold
  { name: 'Textiles & Tissus', slug: 'textiles', icon: '👔' },      // Traditional fabrics
  { name: 'Bâtiment & Construction', slug: 'construction', icon: '🏗️' }, // Building materials
  { name: 'Agroalimentaire', slug: 'agroalimentaire', icon: '🍽️' },
  { name: 'Chimie & Parapharmacie', slug: 'chemie-parapharmacie', icon: '🧪' },
  { name: 'Énergie Renouvelable', slug: 'energie-renouvelable', icon: '☀️' },
  { name: 'Services Professionnels', slug: 'services-professionnels', icon: '💼' },
  { name: 'Transport & Logistique', slug: 'transport-logistique', icon: '🚛' },
];

// Local payment methods for Senegal
export const senegalPaymentMethods = [
  { id: 'orange_money', name: 'Orange Money', type: 'mobile' },
  { id: 'wave', name: 'Wave', type: 'mobile' },
  { id: 'free_money', name: 'Free Money', type: 'mobile' },
  { id: 'cbao', name: 'CBAO', type: 'bank_transfer' },
  { id: 'cod', name: 'Paiement à la livraison', type: 'cash' },
];
