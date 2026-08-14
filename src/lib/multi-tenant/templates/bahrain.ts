/**
 * Bahrain Country Template for Multi-Tenant System
 * Template pour Bahreïn - Marché B2B GCC
 */

import { CountryTemplate } from './index';

export const bahrainTemplate: CountryTemplate = {
  id: 'bahrain',
  name: 'Bahrain',
  slug: 'bahrain',
  displayName: 'BahrainBiz',
  displayNameFr: 'BahrainBiz',
  country: 'Bahrain',
  countryFr: 'Bahreïn',
  countryCode: 'BH',
  currency: 'BHD',
  currencySymbol: '.د.ب',
  language: 'ar',
  languages: ['ar', 'en'],
  phonePrefix: '+973',
  primaryColor: '#ce1126', // Red
  secondaryColor: '#ffffff', // White
  timezone: 'Asia/Bahrain',
  flagEmoji: '🇧🇭',
  regions: 4,
  regionName: 'Governorates',
  regionNameFr: 'Gouvernorats',
  features: [
    'catalog',
    'rfq',
    'messaging',
    'payments',
    'reviews',
    'arabic_rtl',
    'finance_banking',
    'aluminum',
    'logistics',
    'fintech',
  ],
  description: 'BahrainBiz - B2B Marketplace for Bahrain\'s Finance, Aluminum & Logistics sectors',
  descriptionFr: 'BahrainBiz - Marketplace B2B pour les secteurs financier, de l\'aluminium et de la logistique à Bahreïn',
  defaultStrings: {
    welcome: 'مرحبا بك في BahrainBiz',
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
    currencyFormat: '{amount} .د.ب',
    dateFormat: 'DD/MM/YYYY',
  },
};
