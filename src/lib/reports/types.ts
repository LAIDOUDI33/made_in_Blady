// ============================================
// Advanced Reporting System - Type Definitions
// AlgeriaTrade.dz B2B Platform
// ============================================

/**
 * Available report types for the platform
 * Each type corresponds to a specific data analysis domain
 */
export type ReportType = 
  | 'sales_overview'        // Complete sales performance overview
  | 'product_performance'   // Individual product metrics and rankings
  | 'supplier_analytics'    // Supplier performance and activity
  | 'buyer_behavior'       // Buyer patterns and preferences
  | 'rfq_analysis'         // Request for Quotation statistics
  | 'revenue_by_category'  // Revenue breakdown by product category
  | 'geographic_distribution' // Sales distribution by region/wilaya
  | 'payment_methods'      // Payment method usage analytics
  | 'user_growth'          // User registration and growth trends
  | 'inventory_status'     // Product inventory levels and alerts
  | 'custom';              // User-defined custom reports

/**
 * Supported export formats for reports
 */
export type ReportFormat = 'pdf' | 'csv' | 'excel' | 'json' | 'html';

/**
 * Predefined time periods for report generation
 */
export type ReportPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/**
 * Report configuration interface
 * Defines all parameters needed to generate a report
 */
export interface ReportConfig {
  /** Type of report to generate */
  type: ReportType;
  
  /** Output format for the report */
  format: ReportFormat;
  
  /** Time period for data aggregation */
  period: ReportPeriod;
  
  /** Custom date range (required when period is 'custom') */
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  /** Optional filters to narrow down data */
  filters?: ReportFilters;
  
  /** Field to group data by */
  groupBy?: string;
  
  /** Field to sort results by */
  sortBy?: string;
  
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  
  /** Maximum number of records to include */
  limit?: number;
  
  /** Include chart configurations in output */
  includeCharts?: boolean;
  
  /** Include raw data table in output */
  includeRawData?: boolean;
}

/**
 * Report filters interface
 * Allows fine-grained data filtering
 */
export interface ReportFilters {
  /** Filter by product categories */
  categories?: string[];
  
  /** Filter by Algerian wilayas (provinces) */
  wilayas?: string[];
  
  /** Filter by supplier IDs or names */
  suppliers?: string[];
  
  /** Filter by buyer IDs or names */
  buyers?: string[];
  
  /** Filter by price range */
  priceRange?: { min: number; max: number };
  
  /** Filter by order/status values */
  status?: string[];
  
  /** Filter by payment methods */
  paymentMethod?: string[];
  
  /** Filter by product tags */
  tags?: string[];
}

/**
 * Report result interface
 * Represents a generated report with all its metadata
 */
export interface ReportResult {
  /** Unique identifier for this report instance */
  id: string;
  
  /** Configuration used to generate this report */
  config: ReportConfig;
  
  /** Timestamp when report was generated */
  generatedAt: Date;
  
  /** ID of user who requested the report */
  generatedBy: string;
  
  /** Current processing status */
  status: 'completed' | 'failed' | 'processing';
  
  /** URL to download the report file */
  downloadUrl?: string;
  
  /** When the report download expires */
  expiresAt: Date;
  
  /** Metadata about the generated report */
  metadata: {
    /** Total number of records in the report */
    recordCount: number;
    
    /** File size in bytes (for exported files) */
    fileSize?: number;
    
    /** Time taken to generate in milliseconds */
    processingTimeMs: number;
  };
  
  /** The actual report data */
  data: ReportData;
}

/**
 * Report data interface
 * Contains the structured data for a report
 */
export interface ReportData {
  /** Key-value summary metrics */
  summary: Record<string, number | string>;
  
  /** Chart configurations for visualization */
  charts: ChartConfig[];
  
  /** Tabular data */
  table: {
    headers: string[];
    rows: any[][];
  };
  
  /** AI-generated insights from the data */
  insights: string[];
}

/**
 * Chart configuration interface
 * Defines how to render charts in reports
 */
export interface ChartConfig {
  /** Type of visualization */
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'funnel' | 'radar' | 'treemap';
  
  /** Chart title (in French for Algeria market) */
  title: string;
  
  /** Data points for the chart */
  data: any[];
  
  /** Additional chart options */
  options?: Record<string, any>;
}

/**
 * Report template interface
 * Predefined report configurations for quick generation
 */
export interface ReportTemplate {
  /** Unique template identifier */
  id: string;
  
  /** Display name (French) */
  name: string;
  
  /** Template description */
  description: string;
  
  /** Default report type */
  type: ReportType;
  
  /** Default time period */
  period: ReportPeriod;
  
  /** Available export formats */
  formats: ReportFormat[];
  
  /** Icon emoji for UI display */
  icon: string;
  
  /** Template category for grouping */
  category: 'sales' | 'products' | 'users' | 'financial' | 'operations';
  
  /** Estimated generation time in ms */
  estimatedTimeMs?: number;
}

/**
 * Scheduled report configuration
 * For automated periodic report generation
 */
export interface ScheduledReport {
  id: string;
  name: string;
  config: ReportConfig;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    hour: number; // 0-23
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
  };
  recipients: string[]; // Email addresses
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt: Date;
  createdAt: Date;
  createdBy: string;
}

/**
 * Report history entry
 * Tracks previously generated reports
 */
export interface ReportHistoryEntry {
  id: string;
  reportId: string;
  config: ReportConfig;
  status: ReportResult['status'];
  generatedAt: Date;
  generatedBy: string;
  expiresAt: Date;
  downloadUrl?: string;
  metadata: ReportResult['metadata'];
}

/**
 * Algerian Wilaya codes and names reference
 * Used for geographic reporting
 */
export const ALGERIAN_WILAYAS: Record<number, string> = {
  1: 'Adrar', 2: 'Chlef', 3: 'Laghouat', 4: 'Oum El Bouaghi',
  5: 'Batna', 6: 'Béjaïa', 7: 'Biskra', 8: 'Béchar', 9: 'Blida',
  10: 'Bouira', 11: 'Tamanrasset', 12: 'Tébessa', 13: 'Tlemcen',
  14: 'Tiaret', 15: 'Tizi Ouzou', 16: 'Alger', 17: 'Djelfa',
  18: 'Jijel', 19: 'Sétif', 20: 'Saïda', 21: 'Skikda',
  22: 'Sidi Bel Abbès', 23: 'Annaba', 24: 'Guelma', 25: 'Constantine',
  26: 'Médéa', 27: 'Mostaganem', 28: "M'Sila", 29: 'Mascara',
  30: 'Ouargla', 31: 'Oran', 32: 'El Bayadh', 33: 'Illizi',
  34: 'Bordj Bou Arréridj', 35: 'Boumerdès', 36: 'El Tarf', 37: 'Tindouf',
  38: 'Tissemsilt', 39: 'El Oued', 40: 'Khenchela', 41: 'Souk Ahras',
  42: 'Tipaza', 43: 'Mila', 44: 'Aïn Defla', 45: 'Naâma',
  46: 'Aïn Témouchent', 47: 'Ghardaïa', 48: 'Relizane',
  49: 'El M\'Ghair', 50: 'El Meniaa', 51: 'Ouled Djellal',
  52: 'Bordj Badji Mokhtar', 53: 'Béni Abbès', 54: 'Timimoun',
  55: 'Tougourt', 56: 'Djanet', 57: 'In Salah', 58: 'In Guezzam'
};

/**
 * Default report templates available in the system
 */
export const DEFAULT_REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'monthly-sales',
    name: 'Rapport de Ventes Mensuel',
    description: "Vue d'ensemble complète des ventes avec tendances et performances",
    type: 'sales_overview',
    period: 'month',
    formats: ['pdf', 'excel', 'csv'],
    icon: '📈',
    category: 'sales',
    estimatedTimeMs: 3000,
  },
  {
    id: 'product-performance',
    name: 'Performance des Produits',
    description: 'Analyse détaillée des produits les plus performants',
    type: 'product_performance',
    period: 'quarter',
    formats: ['pdf', 'excel'],
    icon: '🏆',
    category: 'products',
    estimatedTimeMs: 5000,
  },
  {
    id: 'geographic-analysis',
    name: 'Analyse Géographique',
    description: 'Répartition des ventes par wilaya et région',
    type: 'geographic_distribution',
    period: 'quarter',
    formats: ['pdf', 'html', 'excel'],
    icon: '🗺️',
    category: 'sales',
    estimatedTimeMs: 4000,
  },
  {
    id: 'rfq-summary',
    name: "Synthèse des Appels d'Offres",
    description: 'Statistiques sur les demandes de devis RFQ',
    type: 'rfq_analysis',
    period: 'month',
    formats: ['csv', 'excel', 'pdf'],
    icon: '📋',
    category: 'operations',
    estimatedTimeMs: 2500,
  },
  {
    id: 'user-growth',
    name: 'Croissance des Utilisateurs',
    description: "Évolution des inscriptions et de l'activité utilisateur",
    type: 'user_growth',
    period: 'year',
    formats: ['pdf', 'json'],
    icon: '👥',
    category: 'users',
    estimatedTimeMs: 2000,
  },
  {
    id: 'revenue-by-category',
    name: 'Revenus par Catégorie',
    description: "Chiffre d'affaires par catégorie de produits",
    type: 'revenue_by_category',
    period: 'quarter',
    formats: ['pdf', 'excel', 'html'],
    icon: '💰',
    category: 'financial',
    estimatedTimeMs: 3500,
  },
  {
    id: 'payment-methods-report',
    name: 'Analyse des Paiements',
    description: 'Statistiques d\'utilisation des modes de paiement',
    type: 'payment_methods',
    period: 'month',
    formats: ['pdf', 'csv'],
    icon: '💳',
    category: 'financial',
    estimatedTimeMs: 2000,
  },
  {
    id: 'supplier-analytics',
    name: 'Analyse des Fournisseurs',
    description: 'Performance et activité des fournisseurs',
    type: 'supplier_analytics',
    period: 'quarter',
    formats: ['pdf', 'excel'],
    icon: '🏭',
    category: 'products',
    estimatedTimeMs: 4500,
  },
  {
    id: 'buyer-behavior',
    name: 'Comportement des Acheteurs',
    description: 'Patterns d\'achat et préférences des acheteurs',
    type: 'buyer_behavior',
    period: 'quarter',
    formats: ['pdf', 'json'],
    icon: '🛒',
    category: 'users',
    estimatedTimeMs: 4000,
  },
  {
    id: 'inventory-status',
    name: 'État des Stocks',
    description: 'Niveaux d\'inventaire et alertes de réapprovisionnement',
    type: 'inventory_status',
    period: 'today',
    formats: ['excel', 'csv', 'pdf'],
    icon: '📦',
    category: 'operations',
    estimatedTimeMs: 1500,
  },
];
