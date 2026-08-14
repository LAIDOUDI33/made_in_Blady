/**
 * UAE (United Arab Emirates) Template
 * EmiratesTrade - UAE B2B Marketplace
 */

import { CountryTemplate } from './index';

export const uaeTemplate: CountryTemplate = {
  id: 'uae',
  name: 'EmiratesTrade',
  slug: 'emiratestrade',
  displayName: 'EmiratesTrade',
  displayNameFr: 'EmiratesTrade',
  country: 'United Arab Emirates',
  countryFr: 'Émirats Arabes Unis',
  countryCode: 'AE',
  currency: 'AED',
  currencySymbol: 'د.إ',
  language: 'en', // Primary language is English
  languages: ['en', 'ar'],
  phonePrefix: '+971',
  primaryColor: '#00732F', // UAE green
  secondaryColor: '#FF000D', // UAE red accent
  timezone: 'Asia/Dubai',
  flagEmoji: '🇦🇪',
  regions: 7,
  regionName: 'Emirates',
  regionNameFr: 'Émirats',
  features: ['catalog', 'rfq', 'messaging', 'payments', 'reviews', 'emailNotifications'],
  description: 'The leading B2B marketplace in the UAE connecting businesses across all 7 emirates.',
  descriptionFr: 'La marketplace B2B leader dans les ÉAU connectant les entreprises sur les 7 émirats.',
  
  defaultStrings: {
    // Navigation (English first for UAE)
    home: 'Home',
    products: 'Products',
    suppliers: 'Suppliers',
    rfq: 'Request for Quote',
    about: 'About',
    contact: 'Contact',
    
    // Actions
    search: 'Search',
    login: 'Login',
    register: 'Register',
    submit: 'Submit',
    save: 'Save',
    cancel: 'Cancel',
    
    // Labels
    price: 'Price',
    currency: 'AED',
    location: 'Location',
    company: 'Company',
    category: 'Category',
    
    // Specific to UAE
    wilaya: 'Emirate',
    commune: 'Area/City',
    nif: 'TRN (Tax Registration)',
    nis: 'Trade License No.',
    rc: 'DED License',
    
    // Messages
    welcome: 'Welcome to EmiratesTrade',
    tagline: 'Your trusted B2B platform in the United Arab Emirates',
  },
};

// UAE Emirates data for seed (7 Emirates)
export const uaeEmirates = [
  { code: 'DU', name: 'Dubai', nameAr: 'دبي' },
  { code: 'AB', name: 'Abu Dhabi', nameAr: 'أبوظبي' },
  { code: 'SH', name: 'Sharjah', nameAr: 'الشارقة' },
  { code: 'AJ', name: 'Ajman', nameAr: 'عجمان' },
  { code: 'FU', name: 'Fujairah', nameAr: 'الفجيرة' },
  { code: 'RA', name: 'Ras Al Khaimah', nameAr: 'رأس الخيمة' },
  { code: 'UA', name: 'Umm Al Quwain', nameAr: 'أم القيوين' },
];

// Popular categories in UAE
export const uaeCategories = [
  { name: 'Real Estate & Construction', slug: 'real_estate', icon: '🏢' },   // Property & construction
  { name: 'Logistics & Trade', slug: 'logistics', icon: '🚢' },             // Ports & trade
  { name: 'Tourism & Hospitality', slug: 'tourism', icon: '🏨' },           // Hospitality
  { name: 'Finance & Fintech', slug: 'finance', icon: '💰' },               // Banking & fintech
  { name: 'Technology & Smart Solutions', slug: 'technology', icon: '💻' }, // Smart city solutions
  { name: 'Oil & Gas', slug: 'oil_gas', icon: '🛢️' },
  { name: 'Aviation & Aerospace', slug: 'aviation', icon: '✈️' },
  { name: 'Healthcare & Medical', slug: 'healthcare', icon: '🏥' },
  { name: 'Retail & E-commerce', slug: 'retail', icon: '🛒' },
  { name: 'Professional Services', slug: 'services', icon: '💼' },
];

// Local payment methods for UAE
export const uaePaymentMethods = [
  { id: 'apple_pay', name: 'Apple Pay', type: 'wallet' },
  { id: 'google_pay', name: 'Google Pay', type: 'wallet' },
  { id: 'card', name: 'Credit/Debit Card', type: 'card' },
  { id: 'cod', name: 'Cash on Delivery', type: 'cash' },
];
