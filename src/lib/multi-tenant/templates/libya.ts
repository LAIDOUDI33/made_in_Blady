/**
 * Libya Country Template for Multi-Tenant System
 * Template pour la Libye - Marché B2B Nord-Africain
 */

import { CountryTemplate } from './index';

export const libyaTemplate: CountryTemplate = {
  id: 'libya',
  name: 'Libya',
  slug: 'libya',
  displayName: 'LibyaTrade',
  displayNameFr: 'LibyaTrade',
  country: 'Libya',
  countryFr: 'Libye',
  countryCode: 'LY',
  currency: 'LYD',
  currencySymbol: 'ل.د',
  language: 'ar',
  languages: ['ar', 'en'],
  phonePrefix: '+218',
  primaryColor: '#1a237e', // Deep blue
  secondaryColor: '#c62828', // Red accent
  timezone: 'Africa/Tripoli',
  flagEmoji: '🇱🇾',
  regions: 22,
  regionName: 'Shabiyat',
  regionNameFr: 'Districts',
  features: [
    'catalog',
    'rfq',
    'messaging',
    'payments',
    'reviews',
    'arabic_rtl',
    'oil_gas_sector',
    'construction',
  ],
  description: 'LibyaTrade - B2B Marketplace for Libya\'s Oil, Gas & Construction sectors',
  descriptionFr: 'LibyaTrade - Marketplace B2B pour les secteurs pétrolier, gazier et de construction en Libye',
  defaultStrings: {
    welcome: 'مرحبا بك في LibyaTrade',
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
    currencyFormat: '{amount} ل.د',
    dateFormat: 'DD/MM/YYYY',
  },
};
