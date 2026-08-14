/**
 * Iraq Country Template for Multi-Tenant System
 * Template pour l'Irak - Marché B2B MENA
 */

import { CountryTemplate } from './index';

export const iraqTemplate: CountryTemplate = {
  id: 'iraq',
  name: 'Iraq',
  slug: 'iraq',
  displayName: 'IraqTrade',
  displayNameFr: 'IraqTrade',
  country: 'Iraq',
  countryFr: 'Irak',
  countryCode: 'IQ',
  currency: 'IQD',
  currencySymbol: 'ع.د',
  language: 'ar',
  languages: ['ar', 'ku', 'en'],
  phonePrefix: '+964',
  primaryColor: '#007a3d', // Green
  secondaryColor: '#ce1126', // Red
  timezone: 'Asia/Baghdad',
  flagEmoji: '🇮🇶',
  regions: 19,
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
    'reconstruction',
    'agriculture',
    'construction',
  ],
  description: 'IraqTrade - B2B Marketplace for Iraq\'s Oil & Gas, Reconstruction & Agriculture sectors',
  descriptionFr: 'IraqTrade - Marketplace B2B pour les secteurs pétrolier, de la reconstruction et agricole en Irak',
  defaultStrings: {
    welcome: 'مرحبا بك في IraqTrade',
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
    currencyFormat: '{amount} ع.د',
    dateFormat: 'DD/MM/YYYY',
  },
};
