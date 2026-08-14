/**
 * Tunisia Template
 * TunisiaTrade - Tunisian B2B Marketplace
 */

import { CountryTemplate } from './index';

export const tunisiaTemplate: CountryTemplate = {
  id: 'tunisia',
  name: 'TunisiaTrade',
  slug: 'tunisiatrade',
  displayName: 'TunisiaTrade',
  displayNameFr: 'TunisiaTrade',
  country: 'Tunisia',
  countryFr: 'Tunisie',
  countryCode: 'TN',
  currency: 'TND',
  currencySymbol: 'د.ت',
  language: 'fr',
  languages: ['fr', 'ar'],
  phonePrefix: '+216',
  primaryColor: '#E70013', // Tunisian red
  secondaryColor: '#FFFFFF',
  timezone: 'Africa/Tunis',
  flagEmoji: '🇹🇳',
  regions: 24,
  regionName: 'Governorates',
  regionNameFr: 'Gouvernorats',
  features: ['catalog', 'rfq', 'messaging', 'emailNotifications'],
  description: 'The leading B2B marketplace in Tunisia connecting businesses across all 24 governorates.',
  descriptionFr: 'La marketplace B2B leader en Tunisie connectant les entreprises sur les 24 gouvernorats.',
  
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
    currency: 'TND',
    location: 'Localisation',
    company: 'Entreprise',
    category: 'Catégorie',
    
    // Specific to Tunisia
    wilaya: 'Gouvernorat',
    commune: 'Délégation',
    nif: 'Matricule Fiscal',
    nis: 'N° Identification',
    rc: 'RC',
    
    // Messages
    welcome: 'Bienvenue sur TunisiaTrade',
    tagline: 'Votre plateforme B2B de confiance en Tunisie',
  },
};

// Tunisian Governorates data for seed
export const tunisianGovernorates = [
  { code: '01', name: 'Tunis', nameAr: 'تونس' },
  { code: '02', name: 'Ariana', nameAr: 'أريانة' },
  { code: '03', name: 'Ben Arous', nameAr: 'بن عروس' },
  { code: '04', name: 'Manouba', nameAr: 'منوبة' },
  { code: '05', name: 'Nabeul', nameAr: 'نابل' },
  { code: '06', name: 'Zaghouan', nameAr: 'زغوان' },
  { code: '07', name: 'Bizerte', nameAr: 'بنزرت' },
  { code: '08', name: 'Beja', nameAr: 'باجة' },
  { code: '09', name: 'Jendouba', nameAr: 'ندوبة' },
  { code: '10', name: 'Kef', nameAr: 'الكاف' },
  { code: '11', name: 'Siliana', nameAr: 'سليانة' },
  { code: '12', name: 'Kairouan', nameAr: 'قيروان' },
  { code: '13', name: 'Kasserine', nameAr: 'قصرين' },
  { code: '14', name: 'Sidi Bouzid', nameAr: 'سيدي بوزيد' },
  { code: '15', name: 'Sousse', nameAr: 'سوسة' },
  { code: '16', name: 'Monastir', nameAr: 'منستير' },
  { code: '17', name: 'Mahdia', nameAr: 'المهدية' },
  { code: '18', name: 'Sfax', nameAr: 'صفاقس' },
  { code: '19', name: 'Gabès', nameAr: 'قابس' },
  { code: '20', name: 'Medenine', nameAr: 'مدنين' },
  { code: '21', name: 'Tataouine', nameAr: 'تطاوين' },
  { code: '22', name: 'Gafsa', nameAr: 'قفصة' },
  { code: '23', name: 'Tozeur', nameAr: 'توزر' },
  { code: '24', name: 'Kebili', nameAr: 'قبلي' },
];

// Default categories for Tunisia
export const tunisianCategories = [
  { name: 'Agroalimentaire', slug: 'agroalimentaire', icon: '🌾' },
  { name: 'Textile & Habillement', slug: 'textile-habillement', icon: '👔' },
  { name: 'Électronique & Électrique', slug: 'electronique-electrique', icon: '⚡' },
  { name: 'Mécanique & Métallurgie', slug: 'metallurgie', icon: '🔧' },
  { name: 'Chimie & Parapharmacie', slug: 'chemie-parapharmacie', icon: '🧪' },
  { name: 'Bâtiment & Construction', slug: 'batiment-construction', icon: '🏗️' },
  { name: 'Services Professionnels', slug: 'services-professionnels', icon: '💼' },
  { name: 'Tourisme & Hôtellerie', slug: 'tourisme-hotellerie', icon: '🏨' },
];
