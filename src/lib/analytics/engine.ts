/**
 * Advanced Analytics & Reporting Engine for AlgeriaTrade.dz
 * Comprehensive business intelligence system with real-time analytics
 */

// ============== Types & Interfaces ==============

export interface MetricDefinition {
  id: string;
  name: string;
  nameAr: string;
  category: MetricCategory;
  unit: string;
  format: 'number' | 'currency' | 'percentage' | 'duration';
  description: string;
}

export type MetricCategory = 
  | 'revenue' 
  | 'orders' 
  | 'users' 
  | 'products' 
  | 'engagement'
  | 'geographic'
  | 'conversion'
  | 'financial';

export interface TimeSeriesPoint {
  date: string;
  value: number;
  previousValue?: number;
  projected?: boolean;
}

export interface KPIData {
  metricId: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  changeDirection: 'up' | 'down' | 'neutral';
  trend: TimeSeriesPoint[];
  sparklineData: number[];
}

export interface WilayaAnalytics {
  code: number;
  name: string;
  nameAr: string;
  region: string;
  totalTransactions: number;
  totalRevenue: number;
  activeCompanies: number;
  activeUsers: number;
  avgOrderValue: number;
  growthRate: number;
  marketShare: number;
  coordinates: { lat: number; lng: number };
}

export interface SectorAnalytics {
  id: string;
  name: string;
  nameAr: string;
  totalRevenue: number;
  transactionCount: number;
  companyCount: number;
  growthRate: number;
  marketShare: number;
  topProducts: string[];
}

export interface CompanySizeSegment {
  size: 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
  companyCount: number;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

export interface CohortData {
  cohort: string;
  cohortSize: number;
  retentionRates: { month: number; rate: number }[];
}

export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  percentage: number;
  dropoff?: number;
}

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  metrics: string[];
  dimensions: ('wilaya' | 'sector' | 'companySize' | 'time')[];
  dateRange: {
    start: Date;
    end: Date;
    compareStart?: Date;
    compareEnd?: Date;
  };
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'area';
  filters?: Record<string, unknown>;
  scheduledExport?: ScheduleConfig;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:mm format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  recipients: string[];
  format: 'csv' | 'excel' | 'pdf';
  lastRunAt?: Date;
  nextRunAt?: Date;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  downloadUrl: string;
  recordCount: number;
  generatedAt: Date;
  format: string;
}

// ============== Algerian Market Data Constants ==============

export const ALGERIAN_WILAYAS = [
  { code: 1, name: "Adrar", nameAr: "أدرار", region: "South", lat: 27.8833, lng: -0.2789 },
  { code: 2, name: "Chlef", nameAr: "الشلف", region: "North", lat: 36.1667, lng: 1.3333 },
  { code: 3, name: "Laghouat", nameAr: "الأغواط", region: "High Plateaus", lat: 33.4333, lng: 2.8667 },
  { code: 4, name: "Oum El Bouaghi", nameAr: "أم البواقي", region: "East", lat: 35.8681, lng: 7.1108 },
  { code: 5, name: "Batna", nameAr: "باتنة", region: "East", lat: 35.5556, lng: 6.1750 },
  { code: 6, name: "Béjaïa", nameAr: "بجاية", region: "Kabylie", lat: 36.7200, lng: 5.0667 },
  { code: 7, name: "Biskra", nameAr: "بسكرة", region: "Southeast", lat: 34.8083, lng: 5.7083 },
  { code: 8, name: "Béchar", nameAr: "بشار", region: "Southwest", lat: 31.6181, lng: -2.2167 },
  { code: 9, name: "Blida", nameAr: "البليدة", region: "Center", lat: 36.4736, lng: 2.8281 },
  { code: 10, name: "Bouira", nameAr: "بويرة", region: "Center", lat: 36.3833, lng: 3.9000 },
  { code: 11, name: "Tamanrasset", nameAr: "تمنراست", region: "Far South", lat: 22.7850, lng: 5.5228 },
  { code: 12, name: "Tébessa", nameAr: "تبسة", region: "Extreme East", lat: 32.4000, lng: 8.1167 },
  { code: 13, name: "Tlemcen", nameAr: "تلمسان", region: "Northwest", lat: 34.8883, lng: -1.3167 },
  { code: 14, name: "Tiaret", nameAr: "تيارت", region: "Center-West", lat: 35.2572, lng: 1.3189 },
  { code: 15, name: "Tizi Ouzou", nameAr: "تيزي وزو", region: "Kabylie", lat: 36.7167, lng: 4.0500 },
  { code: 16, name: "Alger", nameAr: "الجزائر", region: "Center (Capital)", lat: 36.7538, lng: 3.0588 },
  { code: 17, name: "Djelfa", nameAr: "الجلفة", region: "High Plateaus", lat: 34.7000, lng: 3.2500 },
  { code: 18, name: "Jijel", nameAr: "جيجل", region: "North Coast", lat: 36.8000, lng: 5.7500 },
  { code: 19, name: "Sétif", nameAr: "سطيف", region: "East", lat: 36.1900, lng: 5.4083 },
  { code: 20, name: "Saïda", nameAr: "سعيدة", region: "Northwest", lat: 34.8000, lng: 0.1500 },
  { code: 21, name: "Skikda", nameAr: "سكيكدة", region: "North East", lat: 36.8500, lng: 6.9000 },
  { code: 22, name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس", region: "Northwest", lat: 34.6833, lng: -0.6500 },
  { code: 23, name: "Annaba", nameAr: "عنابة", region: "Northeast", lat: 36.9000, lng: 7.7667 },
  { code: 24, name: "Guelma", nameAr: "قالمة", region: "East", lat: 36.4500, lng: 7.4167 },
  { code: 25, name: "Constantine", nameAr: "قسنطينة", region: "East", lat: 36.3650, lng: 6.6147 },
  { code: 26, name: "Médéa", nameAr: "المدية", region: "Center", lat: 36.2569, lng: 2.7556 },
  { code: 27, name: "Mostaganem", nameAr: "مستغانم", region: "Northwest", lat: 35.9333, lng: 0.0833 },
  { code: 28, name: "M'Sila", nameAr: "المسيلة", region: "High Plateaus", lat: 35.7083, lng: 4.5500 },
  { code: 29, name: "Mascara", nameAr: "معسكر", region: "Northwest", lat: 35.3833, lng: 0.1500 },
  { code: 30, name: "Ouargla", nameAr: "ورقلة", region: "Southeast", lat: 33.8167, lng: 5.3167 },
  { code: 31, name: "Oran", nameAr: "وهران", region: "Northwest", lat: 35.6911, lng: -0.6417 },
  { code: 32, name: "El Bayadh", nameAr: " البيض", region: "High Plateaus", lat: 33.6833, lng: 0.9833 },
  { code: 33, name: "Illizi", nameAr: "إليزي", region: "Far Southeast", lat: 26.5000, lng: 8.4667 },
  { code: 34, name: "Bordj Bou Arréridj", nameAr: "برج بوعريريج", region: "East", lat: 36.0667, lng: 4.7833 },
  { code: 35, name: "Boumerdès", nameAr: "بومرداس", region: "Center", lat: 36.7667, lng: 3.4833 },
  { code: 36, name: "El Tarf", nameAr: "الطارف", region: "Extreme Northeast", lat: 36.7500, lng: 8.3167 },
  { code: 37, name: "Tindouf", nameAr: "تندوف", region: "Far Southwest", lat: 27.6667, lng: -8.1333 },
  { code: 38, name: "Tissemsilt", nameAr: "تيسمسيلت", region: "Center-West", lat: 35.6083, lng: 1.8167 },
  { code: 39, name: "El Oued", nameAr: "الوادي", region: "Southeast", lat: 33.3667, lng: 7.3833 },
  { code: 40, name: "Khenchela", nameAr: "خنشلة", region: "Aures", lat: 35.4333, lng: 7.1500 },
  { code: 41, name: "Souk Ahras", nameAr: "سوق أهراس", region: "Extreme East", lat: 36.2833, lng: 7.9500 },
  { code: 42, name: "Tipaza", nameAr: "تيبازة", region: "North Center", lat: 36.5833, lng: 2.4500 },
  { code: 43, name: "Mila", nameAr: "ميلة", region: "East", lat: 36.4500, lng: 6.2667 },
  { code: 44, name: "Aïn Defla", nameAr: "عين الدفلى", region: "Center", lat: 36.2500, lng: 2.1833 },
  { code: 45, name: "Naâma", nameAr: "النعامة", region: "Southwest", lat: 33.2667, lng: -0.3167 },
  { code: 46, name: "Aïn Témouchent", nameAr: "عين تموشنت", region: "Northwest", lat: 35.3000, lng: -1.3667 },
  { code: 47, name: "Ghardaïa", nameAr: "غرداية", region: "Northern Sahara", lat: 32.4833, lng: 3.6667 },
  { code: 48, name: "Relizane", nameAr: "الريزاني", region: "Northwest", lat: 35.9031, lng: 0.5264 },
  { code: 49, name: "El M'Ghair", nameAr: "المغير", region: "Southeast", lat: 33.6000, lng: -2.8000 },
  { code: 50, name: "El Meniaa", nameAr: "المنيعة", region: "Northern Sahara", lat: 30.3000, lng: 2.8667 },
  { code: 51, name: "Ouled Djellal", nameAr: "اولاد جلال", region: "High Plateaus", lat: 35.8167, lng: 5.9833 },
  { code: 52, name: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", region: "Far South", lat: 21.3333, lng: 0.9500 },
  { code: 53, name: "Béni Abbès", nameAr: "بنى عباس", region: "Southwest", lat: 30.0833, lng: -2.2000 },
  { code: 54, name: "Timimoun", nameAr: "تيميمون", region: "Grand Erg Occidental", lat: 29.2833, lng: 0.2500 },
  { code: 55, name: "Touggourt", nameAr: "تقرت", region: "Oued Righ", lat: 33.1000, lng: 6.0667 },
  { code: 56, name: "Djanet", nameAr: "جانيت", region: "Tassili n'Ajjer", lat: 26.5333, lng: 9.4833 },
  { code: 57, name: "In Salah", nameAr: "إن صلاح", region: "Tadmait", lat: 27.2000, lng: 2.4667 },
  { code: 58, name: "In Guezzam", nameAr: "إن قزام", region: "Far South", lat: 23.0000, lng: 5.7333 }
];

export const INDUSTRY_SECTORS = [
  { id: 'agriculture', name: 'Agriculture & Agro-alimentary', nameAr: 'الفلاحة والصناعات الغذائية', color: '#22c55e' },
  { id: 'hydrocarbons', name: 'Hydrocarbons & Energy', nameAr: 'المحروقات والطاقة', color: '#ef4444' },
  { id: 'mining', name: 'Mining & Metallurgy', nameAr: 'التعدين والمعادن', color: '#78716c' },
  { id: 'construction', name: 'Construction & Building Materials', nameAr: 'البناء ومواد البناء', color: '#f97316' },
  { id: 'pharmaceuticals', name: 'Pharmaceuticals & Healthcare', nameAr: 'الصيدلة والصحة', color: '#ec4899' },
  { id: 'textiles', name: 'Textiles & Leather', nameAr: 'النسائيات والجلد', color: '#8b5cf6' },
  { id: 'chemicals', name: 'Chemical Industry', nameAr: 'الصناعة الكيميائية', color: '#06b6d4' },
  { id: 'mechanical', name: 'Mechanical & Automotive', nameAr: 'الميكانيك والسيارات', color: '#64748b' },
  { id: 'electronics', name: 'Electronics & IT', nameAr: 'الإلكترونيات وتكنولوجيا المعلومات', color: '#3b82f6' },
  { id: 'tourism', name: 'Tourism & Hospitality', nameAr: 'السياحة والضيافة', color: '#eab308' },
  { id: 'logistics', name: 'Transportation & Logistics', nameAr: 'النقل واللوجستيك', color: '#f43f5e' },
  { id: 'trade', name: 'Commerce & Distribution', nameAr: 'التجارة والتوزيع', color: '#84cc16' },
  { id: 'finance', name: 'Financial Services', nameAr: 'الخدمات المالية', color: '#14b8a6' },
  { id: 'telecom', name: 'Telecommunications', nameAr: 'الاتصالات', color: '#6366f1' },
  { id: 'services', name: 'Professional Services', nameAr: 'الخدمات المهنية', color: '#a855f7' }
];

// ============== Available Metrics Definition ==============

export const AVAILABLE_METRICS: MetricDefinition[] = [
  // Revenue Metrics
  { id: 'total_revenue', name: 'Total Revenue', nameAr: 'إجمالي الإيرادات', category: 'revenue', unit: 'DZD', format: 'currency', description: 'Total revenue generated in the period' },
  { id: 'net_revenue', name: 'Net Revenue', nameAr: 'صافي الإيرادات', category: 'revenue', unit: 'DZD', format: 'currency', description: 'Revenue after deductions and refunds' },
  { id: 'avg_order_value', name: 'Average Order Value', nameAr: 'متوسط قيمة الطلب', category: 'revenue', unit: 'DZD', format: 'currency', description: 'Average revenue per order' },
  { id: 'revenue_per_user', name: 'Revenue Per User', nameAr: 'إيرادات لكل مستخدم', category: 'revenue', unit: 'DZD', format: 'currency', description: 'Average revenue generated per active user' },
  { id: 'monthly_recurring_revenue', name: 'Monthly Recurring Revenue', nameAr: 'الإيرادات المتكررة الشهرية', category: 'revenue', unit: 'DZD', format: 'currency', description: 'Predictable monthly revenue from subscriptions' },
  
  // Order Metrics
  { id: 'total_orders', name: 'Total Orders', nameAr: 'إجمالي الطلبات', category: 'orders', unit: '', format: 'number', description: 'Total number of orders placed' },
  { id: 'completed_orders', name: 'Completed Orders', nameAr: 'الطلبات المكتملة', category: 'orders', unit: '', format: 'number', description: 'Orders successfully completed' },
  { id: 'pending_orders', name: 'Pending Orders', nameAr: 'الطلبات المعلقة', category: 'orders', unit: '', format: 'number', description: 'Orders awaiting processing' },
  { id: 'cancelled_orders', name: 'Cancelled Orders', nameAr: 'الطلبات الملغاة', category: 'orders', unit: '', format: 'number', description: 'Orders that were cancelled' },
  { id: 'order_completion_rate', name: 'Order Completion Rate', nameAr: 'معدل إتمام الطلبات', category: 'orders', unit: '%', format: 'percentage', description: 'Percentage of orders successfully completed' },
  { id: 'rfq_count', name: 'RFQ Count', nameAr: 'عدد طلبات الأسعار', category: 'orders', unit: '', format: 'number', description: 'Number of Request for Quotations' },
  
  // User Metrics
  { id: 'active_users', name: 'Active Users', nameAr: 'المستخدمون النشطون', category: 'users', unit: '', format: 'number', description: 'Users active in the period' },
  { id: 'new_registrations', name: 'New Registrations', nameAr: 'التسجيلات الجديدة', category: 'users', unit: '', format: 'number', description: 'New user registrations' },
  { id: 'buyer_count', name: 'Active Buyers', nameAr: 'المشترون النشطون', category: 'users', unit: '', format: 'number', description: 'Number of active buyer accounts' },
  { id: 'seller_count', name: 'Active Sellers', nameAr: 'البائعون النشطون', category: 'users', unit: '', format: 'number', description: 'Number of active seller accounts' },
  { id: 'verified_companies', name: 'Verified Companies', nameAr: 'الشركات الموثقة', category: 'users', unit: '', format: 'number', description: 'Companies with verified status' },
  { id: 'user_retention_rate', name: 'User Retention Rate', nameAr: 'معدل احتفاظ المستخدمين', category: 'users', unit: '%', format: 'percentage', description: 'Percentage of users returning to platform' },
  
  // Product Metrics
  { id: 'total_products', name: 'Total Products', nameAr: 'إجمالي المنتجات', category: 'products', unit: '', format: 'number', description: 'Total products listed on platform' },
  { id: 'new_listings', name: 'New Listings', nameAr: 'القوائم الجديدة', category: 'products', unit: '', format: 'number', description: 'New products added in period' },
  { id: 'product_views', name: 'Product Views', nameAr: 'مشاهدات المنتجات', category: 'products', unit: '', format: 'number', description: 'Total product page views' },
  { id: 'inquiry_rate', name: 'Inquiry Rate', nameAr: 'معدل الاستفسارات', category: 'products', unit: '%', format: 'percentage', description: 'Percentage of views leading to inquiries' },
  
  // Engagement Metrics
  { id: 'session_duration', name: 'Avg Session Duration', nameAr: 'متوسط مدة الجلسة', category: 'engagement', unit: 'min', format: 'duration', description: 'Average time spent per session' },
  { id: 'page_views', name: 'Page Views', nameAr: 'مشاهدات الصفحات', category: 'engagement', unit: '', format: 'number', description: 'Total page views' },
  { id: 'bounce_rate', name: 'Bounce Rate', nameAr: 'معدل الارتداد', category: 'engagement', unit: '%', format: 'percentage', description: 'Percentage of single-page sessions' },
  { id: 'messages_exchanged', name: 'Messages Exchanged', nameAr: 'الرسائل المتبادلة', category: 'engagement', unit: '', format: 'number', description: 'Total messages between users' },
  { id: 'negotiations_started', name: 'Negotiations Started', nameAr: 'المفاوضات المبدوءة', category: 'engagement', unit: '', format: 'number', description: 'New negotiation sessions initiated' },
  
  // Conversion Metrics
  { id: 'conversion_rate', name: 'Conversion Rate', nameAr: 'معدل التحويل', category: 'conversion', unit: '%', format: 'percentage', description: 'Visitor to customer conversion rate' },
  { id: 'lead_to_deal_rate', name: 'Lead to Deal Rate', nameAr: 'معدل التحويل من عميل محتمل', category: 'conversion', unit: '%', format: 'percentage', description: 'Leads converted to deals' },
  { id: 'quote_acceptance_rate', name: 'Quote Acceptance Rate', nameAr: 'معدل قبول العروض', category: 'conversion', unit: '%', format: 'percentage', description: 'Percentage of quotes accepted' },
  
  // Financial Metrics
  { id: 'gross_margin', name: 'Gross Margin', nameAr: 'هامش الربح الإجمالي', category: 'financial', unit: '%', format: 'percentage', description: 'Revenue minus cost of goods sold' },
  { id: 'commission_earned', name: 'Commission Earned', nameAr: ' العمولات المكتسبة', category: 'financial', unit: 'DZD', format: 'currency', description: 'Platform commission revenue' },
  { id: 'escrow_balance', name: 'Escrow Balance', nameAr: 'رصيد الضمان', category: 'financial', unit: 'DZD', format: 'currency', description: 'Total funds held in escrow' },
  { id: 'payment_success_rate', name: 'Payment Success Rate', nameAr: 'معدل نجاح الدفع', category: 'financial', unit: '%', format: 'percentage', description: 'Successful payment transactions' },
  
  // Geographic Metrics
  { id: 'wilaya_coverage', name: 'Wilaya Coverage', nameAr: 'تغطية الولايات', category: 'geographic', unit: '', format: 'number', description: 'Number of wilayas with activity' },
  { id: 'regional_revenue_share', name: 'Regional Revenue Share', nameAr: 'حصة الإيرادات الإقليمية', category: 'geographic', unit: '%', format: 'percentage', description: 'Revenue distribution by region' },
  { id: 'top_wilaya_transactions', name: 'Top Wilaya Transactions', nameAr: 'أكثر الولايات معاملات', category: 'geographic', unit: '', format: 'number', description: 'Transaction count for top wilayas' }
];

// ============== Analytics Engine Class ==============

class AnalyticsEngine {
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate realistic mock data for KPIs based on Algerian B2B market patterns
   */
  generateKPIData(): KPIData[] {
    const now = new Date();
    
    return [
      this.createKPI('total_revenue', 2847563890, 2412356780, now),
      this.createKPI('total_orders', 47291, 39842, now),
      this.createKPI('active_users', 128456, 105892, now),
      this.createKPI('new_registrations', 3847, 3201, now),
      this.createKPI('completed_orders', 42156, 35678, now),
      this.createKPI('avg_order_value', 60210, 58450, now),
      this.createKPI('seller_count', 8542, 7234, now),
      this.createKPI('buyer_count', 119914, 98658, now),
      this.createKPI('product_views', 2847563, 2456123, now),
      this.createKPI('conversion_rate', 3.8, 3.2, now),
      this.createKPI('commission_earned', 56951278, 48247136, now),
      this.createKPI('verified_companies', 6547, 5432, now)
    ];
  }

  private createKPI(metricId: string, current: number, previous: number, now: Date): KPIData {
    const changePercent = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    const trend = this.generateTimeSeries(30, current / 30, changePercent);
    const sparklineData = trend.map(t => t.value);
    
    return {
      metricId,
      currentValue: current,
      previousValue: previous,
      changePercent: Math.round(changePercent * 100) / 100,
      changeDirection: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral',
      trend,
      sparklineData
    };
  }

  private generateTimeSeries(days: number, dailyAvg: number, growthRate: number): TimeSeriesPoint[] {
    const points: TimeSeriesPoint[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some randomness and trend
      const randomFactor = 0.8 + Math.random() * 0.4;
      const trendFactor = 1 - (days - i) * (growthRate / 100 / days);
      const value = Math.round(dailyAvg * randomFactor * trendFactor);
      const previousValue = i > 0 ? Math.round(dailyAvg * (0.85 + Math.random() * 0.3)) : undefined;
      
      points.push({
        date: date.toISOString().split('T')[0],
        value,
        previousValue,
        projected: i > days - 7 // Last 7 days are projections
      });
    }
    
    return points;
  }

  /**
   * Generate wilaya-level analytics data with realistic Algerian market distribution
   */
  generateWilayaAnalytics(): WilayaAnalytics[] {
    return ALGERIAN_WILAYAS.map(wilaya => {
      // Higher activity in northern/coastal regions and major cities
      let baseMultiplier = 1;
      if ([16, 31, 25, 19, 6, 15, 23, 13].includes(wilaya.code)) {
        baseMultiplier = 3 + Math.random() * 2; // Major cities
      } else if (wilaya.region.includes('North') || wilaya.region.includes('Center')) {
        baseMultiplier = 1.5 + Math.random(); // Northern regions
      } else if (wilaya.region.includes('South') || wilaya.region.includes('Sahara')) {
        baseMultiplier = 0.2 + Math.random() * 0.3; // Southern regions
      }
      
      const totalTransactions = Math.round((50 + Math.random() * 200) * baseMultiplier);
      const totalRevenue = totalTransactions * (40000 + Math.random() * 60000);
      const activeCompanies = Math.round((5 + Math.random() * 30) * baseMultiplier);
      const activeUsers = Math.round((20 + Math.random() * 200) * baseMultiplier);
      
      return {
        code: wilaya.code,
        name: wilaya.name,
        nameAr: wilaya.nameAr,
        region: wilaya.region,
        totalTransactions,
        totalRevenue: Math.round(totalRevenue),
        activeCompanies,
        activeUsers,
        avgOrderValue: Math.round(totalRevenue / totalTransactions),
        growthRate: Math.round((-5 + Math.random() * 20) * 100) / 100,
        marketShare: 0,
        coordinates: { lat: wilaya.lat, lng: wilaya.lng }
      };
    }).map((w, _, arr) => ({
      ...w,
      marketShare: Math.round((w.totalRevenue / arr.reduce((sum, x) => sum + x.totalRevenue, 0)) * 10000) / 100
    }));
  }

  /**
   * Generate sector performance analytics
   */
  generateSectorAnalytics(): SectorAnalytics[] {
    return INDUSTRY_SECTORS.map(sector => {
      // Realistic distribution based on Algerian economy
      const sectorWeights: Record<string, number> = {
        hydrocarbons: 0.22,
        agriculture: 0.12,
        construction: 0.15,
        trade: 0.14,
        services: 0.10,
        mechanical: 0.07,
        chemicals: 0.05,
        pharmaceuticals: 0.04,
        textiles: 0.03,
        electronics: 0.02,
        mining: 0.02,
        tourism: 0.01,
        logistics: 0.02,
        finance: 0.01,
        telecom: 0.01
      };
      
      const weight = sectorWeights[sector.id] || 0.02;
      const baseRevenue = 2800000000 * weight;
      
      return {
        id: sector.id,
        name: sector.name,
        nameAr: sector.nameAr,
        totalRevenue: Math.round(baseRevenue * (0.9 + Math.random() * 0.2)),
        transactionCount: Math.round(5000 * weight * (0.8 + Math.random() * 0.4)),
        companyCount: Math.round(1000 * weight * (0.8 + Math.random() * 0.4)),
        growthRate: Math.round((-3 + Math.random() * 18) * 100) / 100,
        marketShare: Math.round(weight * 10000) / 100,
        topProducts: this.generateTopProducts(sector.id)
      };
    });
  }

  private generateTopProducts(sectorId: string): string[] {
    const productMap: Record<string, string[]> = {
      hydrocarbons: ['Crude Oil', 'Natural Gas', 'LPG', 'Refined Petroleum', 'Lubricants'],
      agriculture: ['Dates', 'Olives & Olive Oil', 'Citrus Fruits', 'Cereals', 'Dairy Products'],
      construction: ['Cement', 'Steel Rebars', 'Ceramic Tiles', 'Paints', 'Insulation Materials'],
      trade: ['Consumer Electronics', 'Textiles', 'Food Products', 'Household Items'],
      services: ['Consulting', 'IT Services', 'Legal Services', 'Accounting'],
      mechanical: ['Auto Parts', 'Industrial Machinery', 'Pumps & Valves', 'Bearings'],
      chemicals: ['Fertilizers', 'Plastics', 'Industrial Chemicals', 'Paints & Coatings'],
      pharmaceuticals: ['Generic Medicines', 'Medical Supplies', 'Vaccines', 'Supplements']
    };
    return productMap[sectorId] || ['Product A', 'Product B', 'Product C'];
  }

  /**
   * Generate company size segmentation data
   */
  generateCompanySizeSegments(): CompanySizeSegment[] {
    return [
      {
        size: 'micro',
        companyCount: 4521,
        revenue: 284567890,
        orders: 12453,
        avgOrderValue: 22857
      },
      {
        size: 'small',
        companyCount: 2834,
        revenue: 512345678,
        orders: 18234,
        avgOrderValue: 28094
      },
      {
        size: 'medium',
        companyCount: 956,
        revenue: 876543210,
        orders: 12345,
        avgOrderValue: 71037
      },
      {
        size: 'large',
        companyCount: 198,
        revenue: 756789012,
        orders: 3456,
        avgOrderValue: 218997
      },
      {
        size: 'enterprise',
        companyCount: 33,
        revenue: 415318100,
        orders: 803,
        avgOrderValue: 517208
      }
    ];
  }

  /**
   * Generate cohort analysis data for customer retention
   */
  generateCohortAnalysis(): CohortData[] {
    const cohorts: CohortData[] = [];
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
                    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'];
    
    months.forEach((cohort, index) => {
      const cohortSize = Math.round(250 + Math.random() * 150);
      const retentionRates: { month: number; rate: number }[] = [];
      
      for (let m = 0; m < 12 - index; m++) {
        // Retention decreases over time but stabilizes
        const baseRetention = 100 - (m * 8) - (Math.random() * 10);
        retentionRates.push({
          month: m,
          rate: Math.max(Math.min(baseRetention, 100), 5)
        });
      }
      
      cohorts.push({ cohort, cohortSize, retentionRates });
    });
    
    return cohorts;
  }

  /**
   * Generate conversion funnel data
   */
  generateFunnelData(): FunnelStage[] {
    const stages = [
      { stage: 'visitors', label: 'Website Visitors', count: 1256789 },
      { stage: 'registered', label: 'Registered Users', count: 187456 },
      { stage: 'active', label: 'Active Users', count: 128456 },
      { stage: 'inquiry', label: 'Product Inquiries', count: 45234 },
      { stage: 'rfq', label: 'RFQ Submitted', count: 12847 },
      { stage: 'negotiation', label: 'In Negotiation', count: 5632 },
      { stage: 'order', label: 'Orders Placed', count: 3245 },
      { stage: 'completed', label: 'Completed Orders', count: 2891 }
    ];
    
    const totalCount = stages[0].count;
    
    return stages.map((stage, index) => ({
      ...stage,
      percentage: Math.round((stage.count / totalCount) * 10000) / 100,
      dropoff: index > 0 ? Math.round(((stages[index - 1].count - stage.count) / stages[index - 1].count) * 10000) / 100 : undefined
    }));
  }

  /**
   * Generate historical trends data
   */
  generateHistoricalTrends(months: number = 12): Record<string, TimeSeriesPoint[]> {
    const metrics = ['revenue', 'orders', 'users', 'conversion'];
    const result: Record<string, TimeSeriesPoint[]> = {};
    
    const now = new Date();
    
    metrics.forEach(metric => {
      const points: TimeSeriesPoint[] = [];
      let baseValue: number;
      let volatility: number;
      
      switch (metric) {
        case 'revenue':
          baseValue = 220000000;
          volatility = 0.15;
          break;
        case 'orders':
          baseValue = 3800;
          volatility = 0.12;
          break;
        case 'users':
          baseValue = 10000;
          volatility = 0.18;
          break;
        case 'conversion':
          baseValue = 3.2;
          volatility = 0.2;
          break;
        default:
          baseValue = 1000;
          volatility = 0.1;
      }
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const growthFactor = 1 + (months - i) * 0.02; // 2% month-over-month growth
        const seasonalFactor = this.getSeasonalFactor(date.getMonth());
        const randomFactor = 1 + (Math.random() - 0.5) * volatility;
        
        const value = metric === 'conversion'
          ? baseValue * growthFactor * seasonalFactor * randomFactor
          : Math.round(baseValue * growthFactor * seasonalFactor * randomFactor);
        
        points.push({
          date: date.toISOString().split('T')[0],
          value: typeof value === 'number' ? Math.round(value * 100) / 100 : value
        });
      }
      
      result[metric] = points;
    });
    
    return result;
  }

  private getSeasonalFactor(month: number): number {
    // Algerian business seasonality (Ramadan, summer slowdown, etc.)
    const factors = [1.0, 0.95, 1.05, 1.1, 1.15, 0.9, 0.85, 0.9, 1.05, 1.1, 1.05, 1.15];
    return factors[month] || 1;
  }

  /**
   * Generate real-time activity feed
   */
  generateActivityFeed(limit: number = 20): ActivityEvent[] {
    const eventTypes = ['order_placed', 'user_registered', 'company_verified', 'rfq_submitted', 
                        'deal_closed', 'payment_received', 'product_listed', 'message_sent'];
    const activities: ActivityEvent[] = [];
    
    const companies = ['Sonatrach', 'CEVITAL', ' Saidal', 'Nestlé Algérie', 'Condor', 
                       'Biopharm', 'PME-Plus', 'Algerie Telecom', 'Air Algérie', 'Engie Algérie'];
    const wilayas = [16, 31, 25, 19, 6, 15, 23, 13, 9, 35]; // Major cities
    
    for (let i = 0; i < limit; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const wilayaCode = wilayas[Math.floor(Math.random() * wilayas.length)];
      const minutesAgo = Math.floor(Math.random() * 120);
      
      activities.push({
        id: `evt-${Date.now()}-${i}`,
        type: eventType,
        title: this.generateActivityTitle(eventType, company),
        company,
        wilayaCode,
        amount: eventType.includes('order') || eventType.includes('payment') 
          ? Math.round(50000 + Math.random() * 500000) 
          : undefined,
        timestamp: new Date(Date.now() - minutesAgo * 60000)
      });
    }
    
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private generateActivityTitle(type: string, company: string): string {
    const titles: Record<string, string> = {
      order_placed: `${company} placed a new order`,
      user_registered: `New seller registered: ${company}`,
      company_verified: `${company} verification approved`,
      rfq_submitted: `${company} submitted RFQ`,
      deal_closed: `Deal closed with ${company}`,
      payment_received: `Payment received from ${company}`,
      product_listed: `${company} listed new products`,
      message_sent: `New inquiry about ${company}`
    };
    return titles[type] || 'Activity recorded';
  }

  // ============== Cache Management ==============

  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private setCache<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ============== Public API Methods ==============

  async getExecutiveKPIs(forceRefresh = false): Promise<KPIData[]> {
    const cacheKey = 'executive_kpis';
    
    if (!forceRefresh) {
      const cached = this.getCache<KPIData[]>(cacheKey);
      if (cached) return cached;
    }
    
    const data = this.generateKPIData();
    this.setCache(cacheKey, data);
    return data;
  }

  async getWilayaAnalytics(forceRefresh = false): Promise<WilayaAnalytics[]> {
    const cacheKey = 'wilaya_analytics';
    
    if (!forceRefresh) {
      const cached = this.getCache<WilayaAnalytics[]>(cacheKey);
      if (cached) return cached;
    }
    
    const data = this.generateWilayaAnalytics();
    this.setCache(cacheKey, data, 10 * 60 * 1000); // 10 min cache
    return data;
  }

  async getSectorAnalytics(forceRefresh = false): Promise<SectorAnalytics[]> {
    const cacheKey = 'sector_analytics';
    
    if (!forceRefresh) {
      const cached = this.getCache<SectorAnalytics[]>(cacheKey);
      if (cached) return cached;
    }
    
    const data = this.generateSectorAnalytics();
    this.setCache(cacheKey, data, 10 * 60 * 1000);
    return data;
  }

  async getCompanySizeSegments(): Promise<CompanySizeSegment[]> {
    return this.generateCompanySizeSegments();
  }

  async getCohortAnalysis(): Promise<CohortData[]> {
    return this.generateCohortAnalysis();
  }

  async getFunnelData(): Promise<FunnelStage[]> {
    return this.generateFunnelData();
  }

  async getHistoricalTrends(months?: number): Promise<Record<string, TimeSeriesPoint[]>> {
    return this.generateHistoricalTrends(months);
  }

  async getActivityFeed(limit?: number): Promise<ActivityEvent[]> {
    return this.generateActivityFeed(limit);
  }

  // ============== Report Builder Logic ==============

  async buildCustomReport(config: ReportConfig): Promise<ReportResult> {
    const startTime = Date.now();
    
    try {
      // Gather data based on config
      const dataPromises = config.metrics.map(async (metricId) => {
        const metricDef = AVAILABLE_METRICS.find(m => m.id === metricId);
        if (!metricDef) return null;
        
        const kpiData = await this.getExecutiveKPIs();
        const kpi = kpiData.find(k => k.metricId === metricId);
        
        return {
          metric: metricDef,
          data: kpi,
          timeSeries: this.generateTimeSeriesForMetric(metricId, config.dateRange)
        };
      });
      
      const results = await Promise.all(dataPromises);
      
      // Apply dimension breakdowns
      const dimensionData = await this.applyDimensions(config.dimensions, config.dateRange);
      
      return {
        success: true,
        reportId: config.id,
        generatedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
        metrics: results.filter(r => r !== null) as ReportMetric[],
        dimensionBreakdown: dimensionData,
        summary: this.generateReportSummary(results.filter(r => r !== null) as ReportMetric[])
      };
    } catch (error) {
      return {
        success: false,
        reportId: config.id,
        generatedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private generateTimeSeriesForMetric(metricId: string, dateRange: { start: Date; end: Date }): TimeSeriesPoint[] {
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const metric = AVAILABLE_METRICS.find(m => m.id === metricId);
    
    if (!metric) return [];
    
    const kpiData = this.generateKPIData();
    const kpi = kpiData.find(k => k.metricId === metricId);
    
    if (!kpi) return [];
    
    const dailyValue = kpi.currentValue / Math.max(days, 1);
    return this.generateTimeSeries(days, dailyValue, kpi.changePercent);
  }

  private async applyDimensions(
    dimensions: ('wilaya' | 'sector' | 'companySize' | 'time')[],
    dateRange: { start: Date; end: Date }
  ): Promise<DimensionBreakdown> {
    const breakdown: DimensionBreakdown = {};
    
    for (const dim of dimensions) {
      switch (dim) {
        case 'wilaya':
          breakdown.wilaya = await this.getWilayaAnalytics();
          break;
        case 'sector':
          breakdown.sector = await this.getSectorAnalytics();
          break;
        case 'companySize':
          breakdown.companySize = await this.getCompanySizeSegments();
          break;
        case 'time':
          breakdown.time = this.generateHistoricalTrends(12);
          break;
      }
    }
    
    return breakdown;
  }

  private generateReportSummary(metrics: ReportMetric[]): ReportSummary {
    const totalRevenue = metrics.find(m => m.metric?.id === 'total_revenue');
    const totalOrders = metrics.find(m => m.metric?.id === 'total_orders');
    const activeUsers = metrics.find(m => m.metric?.id === 'active_users');
    
    return {
      totalMetrics: metrics.length,
      dateRange: 'Custom range selected',
      highlights: [
        totalRevenue?.data ? `Total Revenue: ${this.formatCurrency(totalRevenue.data.currentValue)}` : '',
        totalOrders?.data ? `Total Orders: ${totalOrders.data.currentValue.toLocaleString()}` : '',
        activeUsers?.data ? `Active Users: ${activeUsers.data.currentValue.toLocaleString()}` : ''
      ].filter(Boolean)
    };
  }

  // ============== Export Service ==============

  async exportToCSV(data: unknown[], filename?: string): Promise<ExportResult> {
    const csvContent = this.convertToCSV(data);
    const safeFilename = (filename || `export_${Date.now()}`).replace(/[^a-z0-9]/gi, '_');
    
    return {
      success: true,
      filename: `${safeFilename}.csv`,
      downloadUrl: `/api/analytics/export?format=csv&file=${safeFilename}`,
      recordCount: data.length,
      generatedAt: new Date(),
      format: 'csv'
    };
  }

  async exportToExcel(data: unknown[], filename?: string): Promise<ExportResult> {
    const safeFilename = (filename || `export_${Date.now()}`).replace(/[^a-z0-9]/gi, '_');
    
    return {
      success: true,
      filename: `${safeFilename}.xlsx`,
      downloadUrl: `/api/analytics/export?format=excel&file=${safeFilename}`,
      recordCount: data.length,
      generatedAt: new Date(),
      format: 'excel'
    };
  }

  async exportToPDF(config: ReportConfig, data: ReportResult): Promise<ExportResult> {
    const safeFilename = `report_${config.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
    
    return {
      success: true,
      filename: `${safeFilename}.pdf`,
      downloadUrl: `/api/analytics/export?format=pdf&file=${safeFilename}`,
      recordCount: data.metrics?.length || 0,
      generatedAt: new Date(),
      format: 'pdf'
    };
  }

  private convertToCSV(data: unknown[]): string {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0] as object);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const val = (row as Record<string, unknown>)[header];
        const str = val !== null && val !== undefined ? String(val) : '';
        return `"${str.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  // ============== Scheduled Reports ==============

  private scheduledReports: Map<string, ScheduledReportJob> = new Map();

  scheduleReport(reportId: string, config: ScheduleConfig): void {
    if (!config.enabled) {
      this.unscheduleReport(reportId);
      return;
    }
    
    // Calculate next run time
    const nextRun = this.calculateNextRun(config);
    
    this.scheduledReports.set(reportId, {
      reportId,
      config,
      nextRunAt: nextRun,
      lastStatus: 'scheduled',
      lastRunAt: undefined
    });
  }

  unscheduleReport(reportId: string): void {
    this.scheduledReports.delete(reportId);
  }

  getScheduledReports(): ScheduledReportJob[] {
    return Array.from(this.scheduledReports.values());
  }

  private calculateNextRun(config: ScheduleConfig): Date {
    const now = new Date();
    const [hours, minutes] = config.time.split(':').map(Number);
    const next = new Date(now);
    
    next.setHours(hours, minutes, 0, 0);
    
    switch (config.frequency) {
      case 'daily':
        if (next <= now) next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + ((config.dayOfWeek || 1) - next.getDay() + 7) % 7);
        if (next <= now) next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setDate(config.dayOfMonth || 1);
        if (next <= now) next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + (3 - (next.getMonth() % 3)));
        if (next <= now) next.setMonth(next.getMonth() + 3);
        break;
    }
    
    return next;
  }

  // ============== Utility Methods ==============

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  getMetricById(id: string): MetricDefinition | undefined {
    return AVAILABLE_METRICS.find(m => m.id === id);
  }

  getMetricsByCategory(category: MetricCategory): MetricDefinition[] {
    return AVAILABLE_METRICS.filter(m => m.category === category);
  }

  getAllMetrics(): MetricDefinition[] {
    return AVAILABLE_METRICS;
  }

  getWilayas(): typeof ALGERIAN_WILAYAS {
    return ALGERIAN_WILAYAS;
  }

  getSectors(): typeof INDUSTRY_SECTORS {
    return INDUSTRY_SECTORS;
  }
}

// ============== Additional Types ==============

export interface ActivityEvent {
  id: string;
  type: 'order_placed' | 'user_registered' | 'company_verified' | 'rfq_submitted' | 
        'deal_closed' | 'payment_received' | 'product_listed' | 'message_sent';
  title: string;
  company: string;
  wilayaCode: number;
  amount?: number;
  timestamp: Date;
}

export interface ReportMetric {
  metric: MetricDefinition;
  data: KPIData | null;
  timeSeries: TimeSeriesPoint[];
}

export interface DimensionBreakdown {
  wilaya?: WilayaAnalytics[];
  sector?: SectorAnalytics[];
  companySize?: CompanySizeSegment[];
  time?: Record<string, TimeSeriesPoint[]>;
}

export interface ReportResult {
  success: boolean;
  reportId: string;
  generatedAt: Date;
  processingTimeMs: number;
  metrics?: ReportMetric[];
  dimensionBreakdown?: DimensionBreakdown;
  summary?: ReportSummary;
  error?: string;
}

export interface ReportSummary {
  totalMetrics: number;
  dateRange: string;
  highlights: string[];
}

export interface ScheduledReportJob {
  reportId: string;
  config: ScheduleConfig;
  nextRunAt: Date;
  lastStatus: 'scheduled' | 'running' | 'completed' | 'failed';
  lastRunAt?: Date;
}

// ============== Export Singleton Instance ==============

export const analyticsEngine = new AnalyticsEngine();

// ============== Default Export ==============

export default AnalyticsEngine;
