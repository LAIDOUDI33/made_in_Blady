/**
 * Qatar Country Template for Multi-Tenant System
 * Template pour le Qatar - Marché B2B GCC
 */

import { CountryTemplate } from './index';

export const qatarTemplate: CountryTemplate = {
  id: 'qatar',
  name: 'Qatar',
  slug: 'qatar',
  displayName: 'QatarB2B',
  displayNameFr: 'QatarB2B',
  country: 'Qatar',
  countryFr: 'Qatar',
  countryCode: 'QA',
  currency: 'QAR',
  currencySymbol: 'ر.ق',
  language: 'ar',
  languages: ['ar', 'en'],
  phonePrefix: '+974',
  primaryColor: '#8d1b3d', // Maroon (flag color)
  secondaryColor: '#ffffff', // White
  timezone: 'Asia/Qatar',
  flagEmoji: '🇶🇦',
  regions: 8,
  regionName: 'Municipalities',
  regionNameFr: 'Municipalités',
  features: [
    'catalog',
    'rfq',
    'messaging',
    'payments',
    'reviews',
    'arabic_rtl',
    'oil_gas',
    'construction',
    'logistics',
    'events_2022',
  ],
  description: 'QatarB2B - Premium B2B Marketplace for Qatar\'s Construction, Oil & Gas sectors',
  descriptionFr: 'QatarB2B - Marketplace B2B premium pour les secteurs de la construction et pétrolier au Qatar',
  defaultStrings: {
    welcome: 'مرحبا بك في QatarB2B',
    searchProducts: 'البحث عن المنتجات',
    findSuppliers: 'العثور على الموردين',
    postRFQ: 'نشر طلب عرض السعر',
    marketplace: 'السوق',
    signIn: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    dashboard: 'لوحة التحكم',
    messages: 'الرسائل',
    orders: 'الطلبات',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    help: 'المساعدة',
    currencyFormat: '{amount} ر.ق',
    dateFormat: 'DD/MM/YYYY',
  },
};
