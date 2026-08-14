/**
 * Morocco Template
 * MoroccoTrade - Moroccan B2B Marketplace
 */

import { CountryTemplate } from './index';

export const moroccoTemplate: CountryTemplate = {
  id: 'morocco',
  name: 'MoroccoTrade',
  slug: 'moroccotrade',
  displayName: 'MoroccoTrade',
  displayNameFr: 'MoroccoTrade',
  country: 'Morocco',
  countryFr: 'Maroc',
  countryCode: 'MA',
  currency: 'MAD',
  currencySymbol: 'MAD',
  language: 'fr',
  languages: ['fr', 'ar'],
  phonePrefix: '+212',
  primaryColor: '#C1272D', // Moroccan red
  secondaryColor: '#006233', // Green from flag
  timezone: 'Africa/Casablanca',
  flagEmoji: '🇲🇦',
  regions: 12,
  regionName: 'Regions',
  regionNameFr: 'Régions',
  features: ['catalog', 'rfq', 'messaging', 'payments', 'emailNotifications', 'reviews'],
  description: 'The premier B2B marketplace in Morocco connecting businesses across all 12 regions.',
  descriptionFr: 'La marketplace B2B de référence au Maroc connectant les entreprises sur les 12 régions.',
  
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
    currency: 'MAD',
    location: 'Localisation',
    company: 'Entreprise',
    category: 'Catégorie',
    
    // Specific to Morocco
    wilaya: 'Région',
    commune: 'Province/Préfecture',
    nif: 'Identifiant Fiscal',
    nis: 'ICE',
    rc: 'RC',
    
    // Messages
    welcome: 'Bienvenue sur MoroccoTrade',
    tagline: 'Votre plateforme B2B de confiance au Maroc',
  },
};

// Moroccan Regions data for seed
export const moroccanRegions = [
  { code: '01', name: 'Tanger-Tétouan-Al Hoceïma', nameAr: 'طنجة-تطوان-الحسيمة' },
  { code: '02', name: "L'Oriental", nameAr: 'الشرق' },
  { code: '03', name: 'Fès-Meknès', nameAr: 'فاس-مكناس' },
  { code: '04', name: 'Rabat-Salé-Kénitra', nameAr: 'الرباط-سلا-القنيطرة' },
  { code: '05', name: 'Béni Mellal-Khénifra', nameAr: 'بني ملال-خنيفرة' },
  { code: '06', name: 'Casablanca-Settat', nameAr: 'الدار البيضاء-سطات' },
  { code: '07', name: 'Marrakech-Safi', nameAr: 'مراكش-آسفي' },
  { code: '08', name: 'Drâa-Tafilalet', nameAr: 'درعة-تفيلالت' },
  { code: '09', name: 'Souss-Massa', nameAr: 'سوس-ماسة' },
  { code: '10', name: 'Guelmim-Oued Noun', nameAr: 'كلميم-واد نون' },
  { code: '11', name: 'Laâyoune-Sakia El Hamra', nameAr: 'العيون-الساقية الحمراء' },
  { code: '12', name: 'Dakhla-Oued Ed-Dahab', nameAr: 'الداخلة-وادي الذهب' },
];

// Default categories for Morocco
export const moroccanCategories = [
  { name: 'Agroalimentaire', slug: 'agroalimentaire', icon: '🌾' },
  { name: 'Textile & Cuir', slug: 'textile-cuir', icon: '👔' },
  { name: 'Chimie & Parapharmacie', slug: 'chemie-parapharmacie', icon: '🧪' },
  { name: 'Électronique & Électrique', slug: 'electronique-electrique', icon: '⚡' },
  { name: 'Mécanique & Automobile', slug: 'mecanique-automobile', icon: '🚗' },
  { name: 'Mines & Métallurgie', slug: 'mines-metallurgie', icon: '⛏️' },
  { name: 'Bâtiment & Matériaux', slug: 'batiment-materiaux', icon: '🏗️' },
  { name: 'Services Professionnels', slug: 'services-professionnels', icon: '💼' },
  { name: 'Tourisme & Artisanat', slug: 'tourisme-artisanat', icon: '🏺' },
  { name: 'Énergie Renouvelable', slug: 'energie-renouvelable', icon: '☀️' },
];
