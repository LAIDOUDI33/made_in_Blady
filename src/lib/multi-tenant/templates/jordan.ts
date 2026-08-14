/**
 * Jordan Country Template for Multi-Tenant System
 * Template pour la Jordanie - Marché B2B MENA
 */

import { CountryTemplate } from './index';

export const jordanTemplate: CountryTemplate = {
  id: 'jordan',
  name: 'Jordan',
  slug: 'jordan',
  displayName: 'JordanTrade',
  displayNameFr: 'JordanTrade',
  country: 'Jordan',
  countryFr: 'Jordanie',
  countryCode: 'JO',
  currency: 'JOD',
  currencySymbol: 'د.أ',
  language: 'ar',
  languages: ['ar', 'en'],
  phonePrefix: '+962',
  primaryColor: '#007a3d', // Green
  secondaryColor: '#ffffff', // White
  timezone: 'Asia/Amman',
  flagEmoji: '🇯🇴',
  regions: 12,
  regionName: 'Governorates',
  regionNameFr: 'Gouvernorats',
  features: [
    'catalog',
    'rfq',
    'messaging',
    'payments',
    'reviews',
    'arabic_rtl',
    'pharmaceuticals',
    'it_sector',
    'tourism',
  ],
  description: 'JordanTrade - B2B Marketplace for Jordan\'s Pharmaceuticals, IT & Tourism sectors',
  descriptionFr: 'JordanTrade - Marketplace B2B pour les secteurs pharmaceutique, IT et touristique en Jordanie',
  defaultStrings: {
    welcome: 'مرحبا بك في JordanTrade',
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
    currencyFormat: '{amount} د.أ',
    dateFormat: 'DD/MM/YYYY',
  },
};
