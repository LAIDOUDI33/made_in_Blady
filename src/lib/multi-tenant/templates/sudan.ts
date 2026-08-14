/**
 * Sudan Country Template for Multi-Tenant System
 * Template pour le Soudan - Marché B2B Afrique/Arabe
 */

import { CountryTemplate } from './index';

export const sudanTemplate: CountryTemplate = {
  id: 'sudan',
  name: 'Sudan',
  slug: 'sudan',
  displayName: 'SudanTrade',
  displayNameFr: 'SudanTrade',
  country: 'Sudan',
  countryFr: 'Soudan',
  countryCode: 'SD',
  currency: 'SDG',
  currencySymbol: 'ج.س',
  language: 'ar',
  languages: ['ar', 'en'],
  phonePrefix: '+249',
  primaryColor: '#007a3d', // Green
  secondaryColor: '#ce1126', // Red
  timezone: 'Africa/Khartoum',
  flagEmoji: '🇸🇩',
  regions: 18,
  regionName: 'States',
  regionNameFr: 'États',
  features: [
    'catalog',
    'rfq',
    'messaging',
    'payments',
    'reviews',
    'arabic_rtl',
    'agriculture',
    'livestock',
    'mining',
    'gold',
  ],
  description: 'SudanTrade - B2B Marketplace for Sudan\'s Agriculture, Livestock & Mining sectors',
  descriptionFr: 'SudanTrade - Marketplace B2B pour les secteurs agricole, de l\'élevage et minier au Soudan',
  defaultStrings: {
    welcome: 'مرحبا بك في SudanTrade',
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
    currencyFormat: '{amount} ج.س',
    dateFormat: 'DD/MM/YYYY',
  },
};
