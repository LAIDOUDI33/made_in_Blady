/**
 * Analytics Dashboard Widget Library
 * Bibliothèque de widgets pour le tableau de bord analytique
 * 
 * @module lib/analytics/widgets
 * @description Reusable chart components and analytics widgets for
 * the AlgeriaTrade B2B marketplace dashboard. Includes sales trends,
 * top products, user activity, revenue metrics, and export functionality.
 */

// ============================================
// Types & Interfaces
// ============================================

/**
 * Date range for analytics queries
 */
export interface DateRange {
  start: Date;
  end: Date;
  label?: string;
}

/**
 * Predefined date range options
 */
export type PresetDateRange = 
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

/**
 * Chart data point
 */
export interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint extends DataPoint {
  date: Date;
}

/**
 * Widget configuration
 */
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  titleAr?: string;
  titleFr: string;
  description?: string;
  descriptionAr?: string;
  descriptionFr?: string;
  
  // Display options
  height?: number;
  width?: 'full' | 'half' | 'quarter';
  refreshInterval?: number; // in seconds, 0 = manual
  
  // Data configuration
  dataSource: string;
  dataParams?: Record<string, any>;
  
  // Chart specific options
  chartOptions?: ChartOptions;
  
  // Export options
  allowExport?: boolean;
  exportFormats?: ExportFormat[];
}

/**
 * Supported widget types
 */
export type WidgetType =
  | 'kpi_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'doughnut_chart'
  | 'area_chart'
  | 'table'
  | 'list'
  | 'heatmap'
  | 'funnel'
  | 'gauge'
  | 'metric_comparison';

/**
 * Chart rendering options
 */
export interface ChartOptions {
  // Axes
  showXAxis?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  
  // Grid
  showGrid?: boolean;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  
  // Colors
  colorScheme?: string[];
  primaryColor?: string;
  
  // Interaction
  interactive?: boolean;
  showTooltips?: boolean;
  showDataLabels?: boolean;
  
  // Stacking
  stacked?: boolean;
  normalized?: boolean;
  
  // Animation
  animate?: boolean;
  
  // Specific options
  curveType?: 'linear' | 'monotone' | 'step' | 'natural';
  barStyle?: 'vertical' | 'horizontal';
  donutThickness?: number;
}

/**
 * Export format types
 */
export type ExportFormat = 'csv' | 'json' | 'pdf' | 'png' | 'xlsx';

/**
 * KPI Card data
 */
export interface KPICardData {
  value: number | string;
  previousValue?: number | string;
  change?: number; // percentage change
  changeDirection?: 'up' | 'down' | 'neutral';
  trend?: Array<{ date: Date; value: number }>;
  unit?: string;
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  target?: number;
  targetLabel?: string;
}

/**
 * Analytics dashboard data
 */
export interface DashboardData {
  kpis: Record<string, KPICardData>;
  charts: Record<string, ChartData>;
  tables: Record<string, TableData>;
  lastUpdated: Date;
  dateRange: DateRange;
}

/**
 * Chart data structure
 */
export interface ChartData {
  type: WidgetType;
  labels: string[];
  datasets: ChartDataset[];
}

/**
 * Chart dataset
 */
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

/**
 * Table data structure
 */
export interface TableData {
  headers: TableColumn[];
  rows: TableRow[];
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
  };
}

/**
 * Table column definition
 */
export interface TableColumn {
  key: string;
  label: string;
  labelAr?: string;
  labelFr: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'badge' | 'link';
  sortable?: boolean;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Table row
 */
export interface TableRow {
  id: string;
  [key: string]: any;
}

// ============================================
// Predefined Date Ranges
// ============================================

export function getPresetDateRanges(): { value: PresetDateRange; label: string; labelAr: string }[] {
  return [
    { value: 'today', label: "Aujourd'hui", labelAr: 'اليوم' },
    { value: 'yesterday', label: 'Hier', labelAr: 'أمس' },
    { value: 'last_7_days', label: '7 derniers jours', labelAr: 'آخر 7 أيام' },
    { value: 'last_30_days', label: '30 derniers jours', labelAr: 'آخر 30 يوم' },
    { value: 'last_90_days', label: '90 derniers jours', labelAr: 'آخر 90 يوم' },
    { value: 'this_month', label: 'Ce mois', labelAr: 'هذا الشهر' },
    { value: 'last_month', label: 'Mois dernier', labelAr: 'الشهر الماضي' },
    { value: 'this_quarter', label: 'Ce trimestre', labelAr: 'هذا الربع' },
    { value: 'this_year', label: 'Cette année', labelAr: 'هذه السنة' },
    { value: 'custom', label: 'Personnalisé', labelAr: 'مخصص' },
  ];
}

export function getDateRangeForPreset(preset: PresetDateRange, customStart?: Date, customEnd?: Date): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today':
      return { start: today, end: now };
    
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    }
    
    case 'last_7_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      return { start, end: now };
    }
    
    case 'last_30_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      return { start, end: now };
    }
    
    case 'last_90_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 90);
      return { start, end: now };
    }
    
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start, end: now };
    }
    
    case 'last_month': {
      const end = new Date(today.getFullYear(), today.getMonth(), 1);
      const start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      return { start, end };
    }
    
    case 'this_quarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), quarter * 3, 1);
      return { start, end: now };
    }
    
    case 'this_year': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { start, end: now };
    }
    
    case 'custom':
      if (customStart && customEnd) {
        return { start: customStart, end: customEnd };
      }
      return { start: today, end: now };
    
    default:
      return { start: today, end: now };
  }
}

// ============================================
// Default Widget Configurations
// ============================================

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  // KPI Cards
  {
    id: 'total_revenue',
    type: 'kpi_card',
    title: 'Total Revenue',
    titleFr: 'Chiffre d\'affaires',
    titleAr: 'إجمالي الإيرادات',
    dataSource: 'analytics.revenue',
    width: 'quarter',
    allowExport: false,
  },
  {
    id: 'total_orders',
    type: 'kpi_card',
    title: 'Total Orders',
    titleFr: 'Total des commandes',
    titleAr: 'إجمالي الطلبات',
    dataSource: 'analytics.orders',
    width: 'quarter',
    allowExport: false,
  },
  {
    id: 'active_users',
    type: 'kpi_card',
    title: 'Active Users',
    titleFr: 'Utilisateurs actifs',
    titleAr: 'المستخدمون النشطون',
    dataSource: 'analytics.users.active',
    width: 'quarter',
    allowExport: false,
  },
  {
    id: 'conversion_rate',
    type: 'kpi_card',
    title: 'Conversion Rate',
    titleFr: 'Taux de conversion',
    titleAr: 'معدل التحويل',
    dataSource: 'analytics.conversion',
    width: 'quarter',
    format: 'percentage',
    allowExport: false,
  },

  // Charts
  {
    id: 'sales_trend',
    type: 'line_chart',
    title: 'Sales Trend',
    titleFr: 'Tendance des ventes',
    titleAr: 'اتجاه المبيعات',
    dataSource: 'analytics.sales.trend',
    width: 'half',
    height: 300,
    chartOptions: {
      showGrid: true,
      showLegend: true,
      interactive: true,
      showTooltips: true,
      curveType: 'monotone',
    },
    allowExport: true,
    exportFormats: ['csv', 'json', 'png', 'pdf'],
  },
  {
    id: 'revenue_by_category',
    type: 'bar_chart',
    title: 'Revenue by Category',
    titleFr: 'Chiffre d\'affaires par catégorie',
    titleAr: 'الإيرادات حسب الفئة',
    dataSource: 'analytics.revenue.category',
    width: 'half',
    height: 300,
    chartOptions: {
      showGrid: true,
      showLegend: false,
      interactive: true,
      barStyle: 'horizontal',
    },
    allowExport: true,
    exportFormats: ['csv', 'json', 'png'],
  },
  {
    id: 'orders_by_status',
    type: 'doughnut_chart',
    title: 'Orders by Status',
    titleFr: 'Commandes par statut',
    titleAr: 'الطلبات حسب الحالة',
    dataSource: 'analytics.orders.status',
    width: 'quarter',
    height: 250,
    chartOptions: {
      showLegend: true,
      legendPosition: 'bottom',
      donutThickness: 0.7,
    },
    allowExport: true,
    exportFormats: ['csv', 'json', 'png'],
  },
  {
    id: 'top_products',
    type: 'bar_chart',
    title: 'Top Products',
    titleFr: 'Produits populaires',
    titleAr: 'المنتجات الأكثر مبيعًا',
    dataSource: 'analytics.products.top',
    width: 'half',
    height: 300,
    chartOptions: {
      showGrid: true,
      showLegend: false,
      interactive: true,
      barStyle: 'vertical',
    },
    allowExport: true,
    exportFormats: ['csv', 'json', 'xlsx'],
  },

  // Tables
  {
    id: 'recent_orders',
    type: 'table',
    title: 'Recent Orders',
    titleFr: 'Commandes récentes',
    titleAr: 'الطلبات الأخيرة',
    dataSource: 'orders.recent',
    width: 'full',
    allowExport: true,
    exportFormats: ['csv', 'xlsx', 'pdf'],
  },
  {
    id: 'top_suppliers',
    type: 'table',
    title: 'Top Suppliers',
    titleFr: 'Meilleurs fournisseurs',
    titleAr: 'أفضل الموردين',
    dataSource: 'suppliers.top',
    width: 'half',
    allowExport: true,
    exportFormats: ['csv', 'xlsx'],
  },
];

// ============================================
// Data Formatting Utilities
// ============================================

/**
 * Format number with locale-specific formatting
 */
export function formatNumber(
  value: number,
  locale: 'fr' | 'ar' = 'fr',
  options?: Intl.NumberFormatOptions
): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2,
    ...options,
  };
  
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', defaultOptions).format(value);
}

/**
 * Format currency in DZD
 */
export function formatCurrencyDZD(
  value: number,
  locale: 'fr' | 'ar' = 'fr'
): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format duration in human-readable form
 */
export function formatDuration(seconds: number, language: 'fr' | 'ar' = 'fr'): string {
  if (seconds < 60) {
    return language === 'ar' ? `${seconds}ث` : `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return language === 'ar' ? `${minutes}د` : `${minutes}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (language === 'ar') {
    return remainingMinutes > 0 ? `${hours}س ${remainingMinutes}د` : `${hours}س`;
  }
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

/**
 * Compact number formatting (e.g., 1.2K, 3.5M)
 */
export function formatCompactNumber(value: number, locale: 'fr' | 'ar' = 'fr'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * Get trend indicator with direction
 */
export function getTrendIndicator(
  currentValue: number,
  previousValue: number,
  language: 'fr' | 'ar' = 'fr'
): { direction: 'up' | 'down' | 'neutral'; percentage: number; label: string } {
  if (previousValue === 0) {
    return { direction: 'neutral', percentage: 0, label: '-' };
  }
  
  const percentage = ((currentValue - previousValue) / previousValue) * 100;
  const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
  
  let label: string;
  if (language === 'ar') {
    label = direction === 'up' ? `↑ ${Math.abs(percentage).toFixed(1)}%` :
           direction === 'down' ? `↓ ${Math.abs(percentage).toFixed(1)}%` : '- ';
  } else {
    label = direction === 'up' ? `+${percentage.toFixed(1)}%` :
           direction === 'down' ? `${percentage.toFixed(1)}%` : '0%';
  }
  
  return { direction, percentage, label };
}

// ============================================
// Color Palettes
// ============================================

export const COLOR_PALETTES = {
  default: [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ],
  business: [
    '#2563eb', // royal blue
    '#059669', // green
    '#d97706', // orange
    '#dc2626', // red
    '#7c3aed', // purple
    '#db2777', // pink
    '#0891b2', // teal
    '#65a30d', // olive
  ],
  warm: [
    '#f97316', // orange
    '#ef4444', // red
    '#eab308', // yellow
    '#f43f5e', // rose
    '#fb923c', // light orange
    '#facc15', // light yellow
    '#fb7185', // light rose
    '#fdba74', // lighter orange
  ],
  cool: [
    '#3b82f6', // blue
    '#06b6d4', // cyan
    '#8b5cf6', // violet
    '#10b981', // emerald
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#a78bfa', // light violet
    '#34d399', // light emerald
  ],
  monochrome: [
    '#18181b', // zinc-900
    '#52525b', // zinc-600
    '#71717a', // zinc-500
    '#a1a1aa', // zinc-400
    '#d4d4d8', // zinc-300
    '#e4e4e7', // zinc-200
    '#f4f4f5', // zinc-100
    '#fafafa', // zinc-50
  ],
};

/**
 * Generate colors for a dataset
 */
export function generateColors(count: number, palette: keyof typeof COLOR_PALETTES = 'default'): string[] {
  const colors = COLOR_PALETTES[palette];
  const result: string[] = [];
  
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  
  return result;
}

/**
 * Generate colors with opacity for backgrounds
 */
export function generateBackgroundColors(
  count: number,
  baseColors?: string[],
  opacity: number = 0.2
): string[] {
  const colors = baseColors || generateColors(count);
  
  return colors.map(color => {
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  });
}

// ============================================
// Export Utilities
// ============================================

/**
 * Export data to CSV format
 */
export function exportToCSV(data: TableData | ChartData, filename?: string): string {
  let csv = '';
  
  if ('headers' in data) {
    // Table data
    csv = data.headers.map(h => h.labelFr || h.label).join(',') + '\n';
    csv += data.rows.map(row =>
      data.headers.map(h => {
        const value = row[h.key];
        // Escape and quote if necessary
        const str = String(value ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    ).join('\n');
  } else {
    // Chart data
    csv = 'Label,' + data.datasets.map(d => d.label).join(',') + '\n';
    for (let i = 0; i < data.labels.length; i++) {
      const row = [data.labels[i]];
      for (const dataset of data.datasets) {
        row.push(String(dataset.data[i] ?? ''));
      }
      csv += row.join(',') + '\n';
    }
  }
  
  downloadFile(csv, filename || 'export.csv', 'text/csv');
  return csv;
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data: any, filename?: string): string {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename || 'export.json', 'application/json');
  return json;
}

/**
 * Trigger file download in browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined') return;
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// Analytics Dashboard Manager Class
// ============================================

/**
 * Analytics Dashboard Manager
 * Manages widget configurations, data fetching, and exports
 */
export class AnalyticsDashboardManager {
  private static instance: AnalyticsDashboardManager;
  private widgets: Map<string, WidgetConfig> = new Map();
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Initialize with default widgets
    DEFAULT_WIDGETS.forEach(widget => {
      this.widgets.set(widget.id, widget);
    });
  }

  static getInstance(): AnalyticsDashboardManager {
    if (!AnalyticsDashboardManager.instance) {
      AnalyticsDashboardManager.instance = new AnalyticsDashboardManager();
    }
    return AnalyticsDashboardManager.instance;
  }

  /**
   * Get all available widgets
   */
  getWidgets(): WidgetConfig[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Get a specific widget by ID
   */
  getWidget(id: string): WidgetConfig | undefined {
    return this.widgets.get(id);
  }

  /**
   * Add a custom widget
   */
  addWidget(config: WidgetConfig): void {
    this.widgets.set(config.id, config);
  }

  /**
   * Remove a widget
   */
  removeWidget(id: string): boolean {
    return this.widgets.delete(id);
  }

  /**
   * Update widget configuration
   */
  updateWidget(id: string, updates: Partial<WidgetConfig>): boolean {
    const existing = this.widgets.get(id);
    if (!existing) return false;

    this.widgets.set(id, { ...existing, ...updates });
    return true;
  }

  /**
   * Fetch widget data
   */
  async fetchWidgetData(
    widgetId: string,
    dateRange: DateRange,
    params?: Record<string, any>
  ): Promise<any> {
    const widget = this.widgets.get(widgetId);
    if (!widget) {
      throw new Error(`Widget not found: ${widgetId}`);
    }

    const cacheKey = `${widgetId}_${dateRange.start.getTime()}_${dateRange.end.getTime()}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    // In production, fetch from API
    console.log(`[Analytics] Fetching data for widget ${widgetId}`, {
      dataSource: widget.dataSource,
      dateRange,
      params: { ...widget.dataParams, ...params },
    });

    // Simulate API call
    const data = await this.mockFetchData(widget, dateRange);

    // Cache result
    this.cache.set(cacheKey, { data, expiry: Date.now() + this.CACHE_TTL });

    return data;
  }

  /**
   * Export widget data
   */
  async exportWidgetData(
    widgetId: string,
    format: ExportFormat,
    dateRange: DateRange
  ): Promise<void> {
    const data = await this.fetchWidgetData(widgetId, dateRange);
    const widget = this.widgets.get(widgetId);
    
    const filename = `${widget?.title || widgetId}_${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'csv':
        exportToCSV(data, `${filename}.csv`);
        break;
      case 'json':
        exportToJSON(data, `${filename}.json`);
        break;
      case 'pdf':
        // Would use PDF generation library
        console.log('[Analytics] PDF export not implemented');
        break;
      case 'png':
        // Would use canvas/screenshot library
        console.log('[Analytics] PNG export not implemented');
        break;
      case 'xlsx':
        // Would use Excel library
        console.log('[Analytics] XLSX export not implemented');
        break;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Mock data fetcher for development
   */
  private async mockFetchData(widget: WidgetConfig, dateRange: DateRange): Promise<any> {
    // Return mock data based on widget type
    switch (widget.type) {
      case 'kpi_card':
        return this.mockKPIData(widget.id);
      
      case 'line_chart':
      case 'area_chart':
        return this.mockTimeSeriesData(dateRange);
      
      case 'bar_chart':
        return this.mockBarChartData(widget.id);
      
      case 'pie_chart':
      case 'doughnut_chart':
        return this.mockPieChartData(widget.id);
      
      case 'table':
        return this.mockTableData(widget.id);
      
      default:
        return {};
    }
  }

  private mockKPIData(widgetId: string): KPICardData {
    const mocks: Record<string, KPICardData> = {
      total_revenue: {
        value: 2450000,
        previousValue: 2100000,
        change: 16.67,
        changeDirection: 'up',
        prefix: '',
        suffix: ' DZD',
        format: 'currency',
        trend: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
          value: 50000 + Math.random() * 50000,
        })),
      },
      total_orders: {
        value: 1247,
        previousValue: 1123,
        change: 11.04,
        changeDirection: 'up',
        format: 'number',
      },
      active_users: {
        value: 8934,
        previousValue: 8201,
        change: 8.94,
        changeDirection: 'up',
        format: 'number',
      },
      conversion_rate: {
        value: 3.24,
        previousValue: 2.98,
        change: 8.72,
        changeDirection: 'up',
        suffix: '%',
        format: 'percentage',
      },
    };

    return mocks[widgetId] || { value: 0, format: 'number' as const };
  }

  private mockTimeSeriesData(dateRange: DateRange): ChartData {
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (24 * 60 * 60 * 1000));
    const labels: string[] = [];
    const revenueData: number[] = [];
    const ordersData: number[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
      revenueData.push(Math.round(50000 + Math.random() * 50000));
      ordersData.push(Math.round(30 + Math.random() * 50));
    }

    return {
      type: 'line_chart',
      labels,
      datasets: [
        {
          label: 'Chiffre d\'affaires (DZD)',
          data: revenueData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Commandes',
          data: ordersData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }

  private mockBarChartData(widgetId: string): ChartData {
    if (widgetId === 'top_products') {
      return {
        type: 'bar_chart',
        labels: ['Acier Construction', 'Huile Olive', 'Textile Coton', 'Dates Deglet', 'Produits Chimiques'],
        datasets: [{
          label: 'Ventes',
          data: [450, 380, 290, 250, 210],
          backgroundColor: generateBackgroundColors(5),
          borderColor: generateColors(5),
          borderWidth: 1,
        }],
      };
    }

    return {
      type: 'bar_chart',
      labels: ['Construction', 'Agroalimentaire', 'Textile', 'Électronique', 'Chimie', 'Pharmacie'],
      datasets: [{
        label: 'Revenus (K DZD)',
        data: [850, 620, 480, 390, 310, 280],
        backgroundColor: generateBackgroundColors(6),
        borderColor: generateColors(6),
        borderWidth: 1,
      }],
    };
  }

  private mockPieChartData(widgetId: string): ChartData {
    return {
      type: 'doughnut_chart',
      labels: ['Confirmée', 'En cours', 'Expédiée', 'Livrée', 'Annulée'],
      datasets: [{
        label: 'Commandes',
        data: [245, 189, 156, 523, 34],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#22c55e', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff',
      }],
    };
  }

  private mockTableData(widgetId: string): TableData {
    if (widgetId === 'recent_orders') {
      return {
        headers: [
          { key: 'orderNumber', label: 'N° Commande', labelFr: 'N° Commande', type: 'text' },
          { key: 'customer', label: 'Client', labelFr: 'Client', type: 'text' },
          { key: 'amount', label: 'Montant', labelFr: 'Montant', type: 'currency' },
          { key: 'status', label: 'Statut', labelFr: 'Statut', type: 'badge' },
          { key: 'date', label: 'Date', labelFr: 'Date', type: 'date' },
        ],
        rows: Array.from({ length: 10 }, (_, i) => ({
          id: `order-${i}`,
          orderNumber: `ORD-${String(1000 + i).padStart(6, '0')}`,
          customer: `Client ${i + 1}`,
          amount: Math.round(10000 + Math.random() * 90000),
          status: ['confirmée', 'en cours', 'expédiée', 'livrée'][i % 4],
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        })),
        pagination: { total: 100, page: 1, pageSize: 10 },
      };
    }

    return {
      headers: [],
      rows: [],
    };
  }
}

// ============================================
// Exports
// ============================================

export const analyticsManager = AnalyticsDashboardManager.getInstance();

export default AnalyticsDashboardManager;
