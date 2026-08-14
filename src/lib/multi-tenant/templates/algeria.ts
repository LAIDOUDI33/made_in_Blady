/**
 * Algeria Template - Primary Market
 * AlgeriaTrade.dz - The original platform
 */

import { CountryTemplate } from './index';

export const algeriaTemplate: CountryTemplate = {
  id: 'algeria',
  name: 'AlgeriaTrade',
  slug: 'algeriatrade',
  displayName: 'AlgeriaTrade',
  displayNameFr: 'AlgeriaTrade',
  country: 'Algeria',
  countryFr: 'Algérie',
  countryCode: 'DZ',
  currency: 'DZD',
  currencySymbol: 'د.ج',
  language: 'fr',
  languages: ['fr', 'ar'],
  phonePrefix: '+213',
  primaryColor: '#006233', // Algerian green
  secondaryColor: '#D52B1E', // Algerian red
  timezone: 'Africa/Algiers',
  flagEmoji: '🇩🇿',
  regions: 58,
  regionName: 'Wilayas',
  regionNameFr: 'Wilayas',
  features: ['catalog', 'rfq', 'messaging', 'payments', 'reviews', 'emailNotifications'],
  description: 'The #1 B2B marketplace in Algeria connecting buyers with verified suppliers across all 58 wilayas.',
  descriptionFr: 'La marketplace B2B n°1 en Algérie connectant acheteurs et fournisseurs vérifiés sur les 58 wilayas.',
  
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
    currency: 'DZD',
    location: 'Localisation',
    company: 'Entreprise',
    category: 'Catégorie',
    
    // Specific to Algeria
    wilaya: 'Wilaya',
    commune: 'Commune',
    nif: 'NIF',
    nis: 'NIS',
    rc: 'RC',
    
    // Messages
    welcome: 'Bienvenue sur AlgeriaTrade',
    tagline: 'Votre plateforme B2B de confiance en Algérie',
  },
};

// Algerian Wilayas data for seed
export const algerianWilayas = [
  { code: '01', name: 'Adrar', nameAr: 'أدرار' },
  { code: '02', name: 'Chlef', nameAr: 'الشلف' },
  { code: '03', name: 'Laghouat', nameAr: 'الأغواط' },
  { code: '04', name: 'Oum El Bouaghi', nameAr: 'أم البواقي' },
  { code: '05', name: 'Batna', nameAr: 'باتنة' },
  { code: '06', name: 'Béjaïa', nameAr: 'بجاية' },
  { code: '07', name: 'Biskra', nameAr: 'بسكرة' },
  { code: '08', name: 'Béchar', nameAr: 'بشار' },
  { code: '09', name: 'Blida', nameAr: 'البليدة' },
  { code: '10', name: 'Bouira', nameAr: 'البويرة' },
  { code: '11', name: 'Tamanrasset', nameAr: 'تمنراست' },
  { code: '12', name: 'Tébessa', nameAr: 'تبسة' },
  { code: '13', name: 'Tlemcen', nameAr: 'تلمسان' },
  { code: '14', name: 'Tiaret', nameAr: 'تيارت' },
  { code: '15', name: 'Tizi Ouzou', nameAr: 'تيزي وزو' },
  { code: '16', name: 'Alger', nameAr: 'الجزائر' },
  { code: '17', name: 'Djelfa', nameAr: 'الجلفة' },
  { code: '18', name: 'Jijel', nameAr: 'جيل' },
  { code: '19', name: 'Sétif', nameAr: 'سطيف' },
  { code: '20', name: 'Saïda', nameAr: 'سعيدة' },
  { code: '21', name: 'Skikda', nameAr: 'سكيكدة' },
  { code: '22', name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس' },
  { code: '23', name: 'Annaba', nameAr: 'عنابة' },
  { code: '24', name: 'Guelma', nameAr: 'قلمة' },
  { code: '25', name: 'Constantine', nameAr: 'قسنطينة' },
  { code: '26', name: 'Médéa', nameAr: 'المديعة' },
  { code: '27', name: 'Mostaganem', nameAr: 'مستغانم' },
  { code: '28', name: "M'Sila", nameAr: 'المسيلة' },
  { code: '29', name: 'Mascara', nameAr: 'معسكر' },
  { code: '30', name: 'Ouargla', nameAr: 'ورقلة' },
  { code: '31', name: 'Oran', nameAr: 'وهران' },
  { code: '32', name: 'El Bayadh', nameAr: ' البيض' },
  { code: '33', name: 'Illizi', nameAr: 'إليزي' },
  { code: '34', name: 'Bordj Bou Arréridj', nameAr: 'برج بوعريريج' },
  { code: '35', name: 'Boumerdès', nameAr: 'بومرداس' },
  { code: '36', name: 'El Tarf', nameAr: 'الطارف' },
  { code: '37', name: 'Tindouf', nameAr: 'تندوف' },
  { code: '38', name: 'Tissemsilt', nameAr: 'تيسمسيلت' },
  { code: '39', name: 'El Oued', nameAr: 'الوادي' },
  { code: '40', name: 'Khenchela', nameAr: 'خنشلة' },
  { code: '41', name: 'Souk Ahras', nameAr: 'سوق أهراس' },
  { code: '42', name: 'Tipaza', nameAr: 'تيبازة' },
  { code: '43', name: 'Mila', nameAr: 'ميلة' },
  { code: '44', name: 'Aïn Defla', nameAr: 'عين الدفلى' },
  { code: '45', name: 'Naâma', nameAr: 'النعامة' },
  { code: '46', name: 'Aïn Témouchent', nameAr: 'عين تموشنت' },
  { code: '47', name: 'Ghardaïa', nameAr: 'غداية' },
  { code: '48', name: 'Relizane', nameAr: 'غليزان' },
  // New wilayas (2019)
  { code: '49', name: 'El M’Ghair', nameAr: 'المغير' },
  { code: '50', name: 'El Meniaa', nameAr: 'المنيعة' },
  { code: '51', name: 'Ouled Djellal', nameAr: 'اولاد جلال' },
  { code: '52', name: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار' },
  { code: '53', name: 'Béni Abbès', nameAr: 'بني عباس' },
  { code: '54', name: 'Timimoun', nameAr: 'تيميمون' },
  { code: '55', name: 'Touggourt', nameAr: 'تقرت' },
  { code: '56', name: 'Djanet', nameAr: 'جانت' },
  { code: '57', name: 'In Salah', nameAr: 'إن سلام' },
  { code: '58', name: 'In Guezzam', nameAr: 'ان قزام' },
];

// Default categories for Algeria
export const algerianCategories = [
  { name: 'Agroalimentaire', slug: 'agroalimentaire', icon: '🌾' },
  { name: 'Bâtiment & Construction', slug: 'batiment-construction', icon: '🏗️' },
  { name: 'Chimie & Parapharmacie', slug: 'chemie-parapharmacie', icon: '🧪' },
  { name: 'Électronique & Électrique', slug: 'electronique-electrique', icon: '⚡' },
  { name: 'Industrie & Machines', slug: 'industrie-machines', icon: '🏭' },
  { name: 'Informatique & High-Tech', slug: 'informatique-high-tech', icon: '💻' },
  { name: 'Matériaux & Matières Premières', slug: 'materiaux-matieres-premieres', icon: '🔧' },
  { name: 'Services Professionnels', slug: 'services-professionnels', icon: '💼' },
  { name: 'Textile & Habillement', slug: 'textile-habillement', icon: '👔' },
  { name: 'Transport & Logistique', slug: 'transport-logistique', icon: '🚛' },
];
