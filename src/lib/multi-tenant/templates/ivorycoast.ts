/**
 * Ivory Coast (Côte d'Ivoire) Template
 * CIV Trade - Ivorian B2B Marketplace
 */

import { CountryTemplate } from './index';

export const ivoryCoastTemplate: CountryTemplate = {
  id: 'ivorycoast',
  name: 'CIV Trade',
  slug: 'civtrade',
  displayName: 'CIV Trade',
  displayNameFr: "CIV Trade",
  country: "Côte d'Ivoire",
  countryFr: "Côte d'Ivoire",
  countryCode: 'CI',
  currency: 'XOF',
  currencySymbol: 'FCFA',
  language: 'fr',
  languages: ['fr'],
  phonePrefix: '+225',
  primaryColor: '#F77F00', // Ivory Coast orange
  secondaryColor: '#009639', // Ivory Coast green
  timezone: 'Africa/Abidjan',
  flagEmoji: '🇨🇮',
  regions: 31,
  regionName: 'Regions',
  regionNameFr: 'Régions',
  features: ['catalog', 'rfq', 'messaging', 'payments', 'reviews', 'emailNotifications'],
  description: "The leading B2B marketplace in Côte d'Ivoire connecting businesses across all 31 regions.",
  descriptionFr: "La marketplace B2B leader en Côte d'Ivoire connectant les entreprises sur les 31 régions.",
  
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
    
    // Specific to Ivory Coast
    wilaya: 'Région',
    commune: 'Département',
    nif: 'Contribuable N°',
    nis: 'Numéro CC',
    rc: 'RCCM',
    
    // Messages
    welcome: "Bienvenue sur CIV Trade",
    tagline: "Votre plateforme B2B de confiance en Côte d'Ivoire",
  },
};

// Ivorian Regions data for seed (31 Regions / Districts)
export const ivorianRegions = [
  { code: 'ABJ', name: 'Abidjan', nameAr: 'أبيدجان' },
  { code: 'BKF', name: 'Bouaké', nameAr: 'بواكي' },
  { code: 'YSS', name: 'Yamoussoukro', nameAr: 'ياموسوكرو' },
  { code: 'SAN', name: 'San-Pédro', nameAr: 'سان بيدرو' },
  { code: 'DAN', name: 'Daloa', nameAr: 'دالوا' },
  { code: 'MAN', name: 'Man', nameAr: 'مان' },
  { code: 'KOR', name: 'Korhogo', nameAr: 'كورهوغو' },
  { code: 'MAR', name: 'Maroussi', nameAr: 'ماروسي' },
  { code: 'DOD', name: 'Dodi', nameAr: 'دودي' },
  { code: 'ASS', name: 'Assinie', nameAr: 'أسيني' },
  { code: 'BON', name: 'Bondoukou', nameAr: 'بوندوكو' },
  { code: 'GUA', name: 'Guiglo', nameAr: 'غيغلو' },
  { code: 'ODI', name: 'Odienné', nameAr: 'أدييني' },
  { code: 'ABO', name: 'Abengourou', nameAr: 'أبونغورو' },
  { code: 'BEO', name: 'Béoumi', nameAr: 'بيومي' },
  { code: 'BFL', name: 'Bouaflé', nameAr: 'بوفالي' },
  { code: 'YAK', name: 'Yakassé-Attobrou', nameAr: 'ياكاسي أتوبرو' },
  { code: 'TBD', name: 'Tabou', nameAr: 'تابو' },
  { code: 'GRN', name: 'Grand-Bassam', nameAr: 'غران باسام' },
  { code: 'SAK', name: 'Sakassou', nameAr: 'ساكاسو' },
  { code: 'DAN2', name: 'Dabou', nameAr: 'دابو' },
  { code: 'LAC', name: 'Lac Region', nameAr: 'منطقة البحيرة' },
  { code: 'GOM', name: 'Gôh Region', nameAr: 'منطقة غوه' },
  { code: 'LKD', name: 'Lôh-Djiboua', nameAr: 'لوه جيبوا' },
  { code: 'GAG', name: 'Gbêkê', nameAr: 'غبكي' },
  { code: 'BKW', name: 'Bounkani', nameAr: 'بونكاني' },
  { code: 'PRL', name: 'Poro Region', nameAr: 'منطقة بورو' },
  { code: 'TMR', name: 'Tchologo', nameAr: 'تشولوغو' }
];

// Popular categories in Ivory Coast
export const ivorianCategories = [
  { name: 'Agriculture', slug: 'agriculture', icon: '🌾' },        // Cocoa, coffee, rubber
  { name: 'Mines & Extraction', slug: 'mining', icon: '⛏️' },       // Gold, diamonds
  { name: 'Industrie Alimentaire', slug: 'food', icon: '🍽️' },     // Food processing
  { name: 'Textiles & Habillement', slug: 'textiles', icon: '👔' }, // Garments
  { name: 'Énergie & Pétrole', slug: 'energy', icon: '⚡' },         // Oil & gas
  { name: 'Bois & Ameublement', slug: 'wood-furniture', icon: '🪵' },
  { name: 'Chimie & Parapharmacie', slug: 'chemie-parapharmacie', icon: '🧪' },
  { name: 'Bâtiment & Construction', slug: 'construction', icon: '🏗️' },
  { name: 'Services Professionnels', slug: 'services-professionnels', icon: '💼' },
  { name: 'Transport & Logistique', slug: 'transport-logistique', icon: '🚛' },
];

// Local payment methods for Ivory Coast
export const ivoryCoastPaymentMethods = [
  { id: 'orange_money', name: 'Orange Money', type: 'mobile' },
  { id: 'mtn_money', name: 'MTN Money', type: 'mobile' },
  { id: 'moov_money', name: 'Moov Money', type: 'mobile' },
  { id: 'wave', name: 'Wave', type: 'mobile' },
];
