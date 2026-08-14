/**
 * Kuwait Country Template for Multi-Tenant System
 * Template pour le Koweït - Marché B2B GCC
 */

import { CountryTemplate } from './index';

export const kuwaitTemplate: CountryTemplate = {
  id: 'kuwait',
  name: 'Kuwait',
  slug: 'kuwait',
  displayName: 'KuwaitTrade',
  displayNameFr: 'KuwaitTrade',
  country: 'Kuwait',
  countryFr: 'Koweït',
  countryCode: 'KW',
  currency: 'KWD',
  currencySymbol: 'د.ك',
  language: 'ar',
  languages: ['ar', 'en'],
  phonePrefix: '+965',
  primaryColor: '#007a3d', // Green
  secondaryColor: '#ce1126', // Red
  timezone: 'Asia/Kuwait',
  flagEmoji: '🇰🇼',
  regions: 6,
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
    'finance',
    'water_desalination',
  ],
  description: 'KuwaitTrade - B2B Marketplace for Kuwait\'s Oil, Finance & Water sectors',
  descriptionFr: 'KuwaitTrade - Marketplace B2B pour les secteurs pétrolier, financier et de la désalinisation au Koweït',
  defaultStrings: {
    welcome: 'مرحبا بك في KuwaitTrade',
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
    currencyFormat: '{amount} د.ك',
    dateFormat: 'DD/MM/YYYY',
  },
};
