/**
 * Egypt Template
 * EgyptTrade - Egyptian B2B Marketplace
 */

import { CountryTemplate } from './index';

export const egyptTemplate: CountryTemplate = {
  id: 'egypt',
  name: 'EgyptTrade',
  slug: 'egypttrade',
  displayName: 'EgyptTrade',
  displayNameFr: 'EgyptTrade',
  country: 'Egypt',
  countryFr: 'Égypte',
  countryCode: 'EG',
  currency: 'EGP',
  currencySymbol: 'ج.م',
  language: 'ar', // Primary language is Arabic for Egypt
  languages: ['ar', 'en'],
  phonePrefix: '+20',
  primaryColor: '#FFFFFF',
  secondaryColor: '#000000',
  timezone: 'Africa/Cairo',
  flagEmoji: '🇪🇬',
  regions: 27,
  regionName: 'Governorates',
  regionNameFr: 'Gouvernorats',
  features: ['catalog', 'rfq', 'messaging', 'payments', 'reviews', 'emailNotifications'],
  description: 'The leading B2B marketplace in Egypt connecting businesses across all 27 governorates.',
  descriptionFr: 'La marketplace B2B leader en Égypte connectant les entreprises sur les 27 gouvernorats.',
  
  defaultStrings: {
    // Navigation (Arabic first for Egypt)
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
    currency: 'ج.م',
    location: 'الموقع',
    company: 'الشركة',
    category: 'الفئة',
    
    // Specific to Egypt
    wilaya: 'المحافظة',
    commune: 'المركز/القسم',
    nif: 'الرقم الضريبي',
    nis: 'السجل التجاري',
    rc: 'س.ت',
    
    // Messages
    welcome: 'مرحباً بك في EgyptTrade',
    tagline: 'منصتك التجارية الموثوقة في مصر',
  },
};

// Egyptian Governorates data for seed
export const egyptianGovernorates = [
  { code: '01', name: 'Cairo', nameAr: 'القاهرة' },
  { code: '02', name: 'Alexandria', nameAr: 'الإسكندرية' },
  { code: '03', name: 'Port Said', nameAr: 'بور سعيد' },
  { code: '04', name: 'Suez', nameAr: 'السويس' },
  { code: '05', name: 'Damietta', nameAr: 'دمياط' },
  { code: '06', name: 'Dakahlia', nameAr: 'الدقهلية' },
  { code: '07', name: 'Sharqia', nameAr: 'الشرقية' },
  { code: '08', name: 'Qalyubia', nameAr: 'القليوبية' },
  { code: '09', name: 'Kafr El Sheikh', nameAr: 'كفر الشيخ' },
  { code: '10', name: 'Gharbia', nameAr: 'الغربية' },
  { code: '11', name: 'Monufia', nameAr: 'منوفية' },
  { code: '12', name: 'Beheira', nameAr: 'البحيرة' },
  { code: '13', name: 'Ismailia', nameAr: 'الإسماعيلية' },
  { code: '14', name: 'Giza', nameAr: 'الجيزة' },
  { code: '15', name: 'Faiyum', nameAr: 'الفيوم' },
  { code: '16', name: 'Minya', nameAr: 'المنيا' },
  { code: '17', name: 'Beni Suef', nameAr: 'بني سويف' },
  { code: '18', name: 'Sohag', nameAr: 'سوهاج' },
  { code: '19', name: 'Qena', nameAr: 'قنا' },
  { code: '20', name: 'Aswan', nameAr: 'أسوان' },
  { code: '21', name: 'Luxor', nameAr: 'الأقصر' },
  { code: '22', name: 'Red Sea', nameAr: 'البحر الأحمر' },
  { code: '23', name: 'New Valley', nameAr: 'الوادي الجديد' },
  { code: '24', name: 'Matrouh', nameAr: ' مطروح' },
  { code: '25', name: 'North Sinai', nameAr: 'شمال سيناء' },
  { code: '26', name: 'South Sinai', nameAr: 'جنوب سيناء' },
  { code: '27', name: 'Helwan', nameAr: 'حلوان' }, // Note: Helwan was merged back into Cairo, keeping for reference
];

// Default categories for Egypt
export const egyptianCategories = [
  { name: 'الزراعة والغذاء', slug: 'agriculture-food', icon: '🌾' },
  { name: 'المنسوجات والملابس', slug: 'textiles-clothing', icon: '👔' },
  { name: 'الكيميائيات والأدوية', slug: 'chemicals-pharmaceuticals', icon: '🧪' },
  { name: 'الإلكترونيات والكهرباء', slug: 'electronics-electrical', icon: '⚡' },
  { name: 'الآلات والمعدات', slug: 'machinery-equipment', icon: '🏭' },
  { name: 'مواد البناء', slug: 'construction-materials', icon: '🏗️' },
  { name: 'الخدمات المهنية', slug: 'professional-services', icon: '💼' },
  { name: 'التكنولوجيا والبرمجيات', slug: 'technology-software', icon: '💻' },
  { name: 'السيارات وقطع الغيار', slug: 'automotive-parts', icon: '🚗' },
  { name: 'البترول والغاز', slug: 'petroleum-gas', icon: '🛢️' },
];
