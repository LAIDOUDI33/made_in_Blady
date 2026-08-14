/**
 * Oman Country Template for Multi-Tenant System
 * Template pour Oman - Marché B2B GCC
 */

import { CountryTemplate } from './index';

export const omanTemplate: CountryTemplate = {
  id: 'oman',
  name: 'Oman',
  slug: 'oman',
  displayName: 'OmanTrade',
  displayNameFr: 'OmanTrade',
  country: 'Oman',
  countryFr: 'Oman',
  countryCode: 'OM',
  currency: 'OMR',
  currencySymbol: 'ر.ع.',
  language: 'ar',
  languages: ['ar', 'en'],
  phonePrefix: '+968',
  primaryColor: '#007a3d', // Green
  secondaryColor: '#ce1126', // Red
  timezone: 'Asia/Muscat',
  flagEmoji: '🇴🇲',
  regions: 11,
  regionName: 'Governorates',
  regionNameFr: 'Gouvernorats',
  features: [
    'catalog',
    'rfq',
    'messaging',
    'payments',
    'reviews',
    'arabic_rtl',
    'oil_gas',
    'tourism',
    'logistics',
    'fishing',
  ],
  description: 'OmanTrade - B2B Marketplace for Oman\'s Oil & Gas, Tourism & Logistics sectors',
  descriptionFr: 'OmanTrade - Marketplace B2B pour les secteurs pétrolier, touristique et de la logistique à Oman',
  defaultStrings: {
    welcome: 'مرحبا بك في OmanTrade',
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
    currencyFormat: '{amount} ر.ع.',
    dateFormat: 'DD/MM/YYYY',
  },
};
