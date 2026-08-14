/**
 * Saudi Arabia Template
 * SaudiTrade - Saudi Arabian B2B Marketplace
 */

import { CountryTemplate } from './index';

export const saudiArabiaTemplate: CountryTemplate = {
  id: 'saudiarabia',
  name: 'SaudiTrade',
  slug: 'sauditrade',
  displayName: 'SaudiTrade',
  displayNameFr: 'SaudiTrade',
  country: 'المملكة العربية السعودية',
  countryFr: 'Arabie Saoudite',
  countryCode: 'SA',
  currency: 'SAR',
  currencySymbol: 'ر.س',
  language: 'ar', // Primary language is Arabic
  languages: ['ar', 'en'],
  phonePrefix: '+966',
  primaryColor: '#006C35', // Saudi green
  secondaryColor: '#C8102E', // Saudi flag accent
  timezone: 'Asia/Riyadh',
  flagEmoji: '🇸🇦',
  regions: 13,
  regionName: 'Provinces',
  regionNameFr: 'Provinces',
  features: ['catalog', 'rfq', 'messaging', 'payments', 'reviews', 'emailNotifications'],
  description: 'The premier B2B marketplace in Saudi Arabia connecting businesses across all 13 provinces.',
  descriptionFr: 'La marketplace B2B de référence en Arabie Saoudite connectant les entreprises sur les 13 provinces.',
  
  defaultStrings: {
    // Navigation (Arabic first for Saudi Arabia)
    home: 'الرئيسية',
    products: 'المنتجات',
    suppliers: 'الموردون',
    rfq: 'طلبات العروض',
    about: 'حول',
    contact: 'اتصل بنا',
    
    // Actions
    search: 'بحث',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    submit: 'إرسال',
    save: 'حفظ',
    cancel: 'إلغاء',
    
    // Labels
    price: 'السعر',
    currency: 'ر.س',
    location: 'الموقع',
    company: 'الشركة',
    category: 'الفئة',
    
    // Specific to Saudi Arabia
    wilaya: 'المنطقة',
    commune: 'المحافظة',
    nif: 'الرقم الضريبي',
    nis: 'السجل التجاري',
    rc: 'س.ت',
    
    // Messages
    welcome: 'مرحباً بك في SaudiTrade',
    tagline: 'منصتك التجارية الموثوقة في المملكة العربية السعودية',
  },
};

// Saudi Provinces data for seed (13 Provinces)
export const saudiProvinces = [
  { code: '01', name: 'Riyadh', nameAr: 'الرياض' },
  { code: '02', name: 'Makkah', nameAr: 'مكة المكرمة' },
  { code: '03', name: 'Madinah', nameAr: 'المدينة المنورة' },
  { code: '04', name: 'Eastern Province', nameAr: 'المنطقة الشرقية' },
  { code: '05', name: 'Qassim', nameAr: 'القصيم' },
  { code: '06', name: "Ha'il", nameAr: 'حائل' },
  { code: '07', name: 'Tabuk', nameAr: 'تبوك' },
  { code: '08', name: 'Northern Borders', nameAr: 'الحدود الشمالية' },
  { code: '09', name: 'Jizan', nameAr: 'جازان' },
  { code: '10', name: 'Najran', nameAr: 'نجران' },
  { code: '11', name: 'Bahah', nameAr: 'الباحة' },
  { code: '12', name: 'Jawf', nameAr: 'الجوف' },
  { code: '13', name: 'Asir', nameAr: 'عسير' },
];

// Popular categories in Saudi Arabia
export const saudiCategories = [
  { name: 'النفط والغاز', slug: 'oil_gas', icon: '🛢️' },           // Energy sector
  { name: 'البناء والتشييد', slug: 'construction', icon: '🏗️' },   // NEOM, Vision 2030 projects
  { name: 'المواد الكيميائية', slug: 'chemicals', icon: '🧪' },     // Petrochemicals
  { name: 'الأغذية والمشروبات', slug: 'food', icon: '🍽️' },        // Food processing
  { name: 'التقنية والبرمجيات', slug: 'technology', icon: '💻' },   // IT & software
  { name: 'السيارات وقطع الغيار', slug: 'automotive', icon: '🚗' },
  { name: 'الأجهزة الطبية', slug: 'medical', icon: '🏥' },
  { name: 'التجزئة والجملة', slug: 'retail-wholesale', icon: '🛒' },
  { name: 'الخدمات المالية', slug: 'finance', icon: '💰' },
  { name: 'الخدمات اللوجستية', slug: 'logistics', icon: '📦' },
];

// Local payment methods for Saudi Arabia
export const saudiPaymentMethods = [
  { id: 'mada', name: 'MADA', type: 'card' },
  { id: 'stc_pay', name: 'STC Pay', type: 'mobile' },
  { id: 'apple_pay', name: 'Apple Pay', type: 'wallet' },
  { id: 'bank_transfer', name: 'تحويل بنكي', type: 'bank_transfer' },
];
