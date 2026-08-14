/**
 * AlgeriaTrade.dz - Performance Optimization Module
 * 
 * Main entry point for all performance-related utilities.
 * Import from here for clean imports.
 */

// Image optimization
export {
  getImageLoader,
  cloudinaryLoader,
  imgixLoader,
  localLoader,
  getBlurDataURL,
  generateSrcSet,
  generateSizes,
  preloadImage,
  preloadCriticalImages,
  checkImageFormatSupport,
  calculateOptimalDimensions,
} from './image-optimizer';

export type {
  ImageConfig,
  OptimizedImageProps,
  ResponsiveImage,
  CompleteImageProps,
} from './image-optimizer';

// Advanced caching
export {
  getCacheManager,
  CacheManager,
  MemoryCache,
  RedisCache,
} from './advanced-cache';

export type {
  CacheConfig,
  CacheEntry,
  CacheOptions,
  CacheStats,
} from './advanced-cache';

// Code splitting
export {
  // Components
  RichTextEditor,
  DataTable,
  Charts,
  MapComponent,
  ImageGallery,
  PdfViewer,
  VideoPlayer,
  ChatWidget,
  NotificationPanel,
  SearchModal,
  AIAssistant,
  
  // Pages
  AdminPages,
  SupplierPages,
  BuyerPages,
  
  // Libraries
  DatePicker,
  SelectSearch,
  FileUpload,
  SyntaxHighlighter,
  MarkdownEditor,
  
  // Utilities
  preloadComponent,
  preloadLikelyRoutes,
  prefetchResources,
  bundleMonitor,
} from './code-splitting';

// CDN configuration
export {
  VERCEL_CDN_CONFIG,
  CLOUDFLARE_CDN_CONFIG,
  getEdgeHeaders,
  getCloudflareHeaders,
  getCloudFrontPolicy,
  buildInvalidationRequest,
  INVALIDATION_PATTERNS,
  generatePerformanceHeaders,
} from './cdn-config';

export type {
  CDNConfig,
  CacheRule,
} from './cdn-config';

// Database optimization
export {
  getDatabase,
  OptimizedPrismaClient,
} from './database-optimizer';

export type {
  DatabaseConfig,
  QueryMetrics,
} from './database-optimizer';

// Middleware & monitoring
export {
  performanceMiddleware,
  finalizeMetrics,
  withPerformanceTracking,
  getPerformanceMetrics,
  getRecentRequests,
  clearPerformanceMetrics,
  getHealthCheckData,
} from './middleware';

export type {
  PerformanceConfig,
  RequestMetrics,
} from './middleware';

// Compression configuration
export {
  performanceNextConfig,
  DEFAULT_COMPRESSION_CONFIG,
  DEFAULT_MINIFICATION_CONFIG,
  BUNDLE_OPTIMIZATION_CONFIG,
  ASSET_PIPELINE_CONFIG,
  getVercelCompressionConfig,
  getNetlifyCompressionConfig,
  getBundleRecommendations,
} from './compression-config';

export type {
  CompressionConfig,
  MinificationConfig,
  BundleOptimizationConfig,
  AssetPipelineConfig,
} from './compression-config';

// Web Vitals monitoring
export {
  getWebVitalsTracker,
  WebVitalsTracker,
} from './web-vitals';

export type {
  Metric,
  WebVitalsReport,
} from './web-vitals';

// Service Worker strategies
export {
  handleRequest,
  getStrategyForUrl,
  clearAllCaches,
  precacheResources,
  getCacheStats,
  getOfflineFallbackPage,
  getOfflineImage,
  ROUTE_STRATEGIES,
  cacheFirst,
  networkFirst,
  staleWhileRevalidate,
  networkOnly,
  cacheOnly,
  raceNetworkAndCache,
} from './sw-strategies';

export type {
  CacheStrategy,
  CacheStrategyConfig,
  RouteStrategy,
} from './sw-strategies';

// Resource hints
export {
  getHintsForPath,
  generateResourceHints,
  generateLinkHeader,
  getDynamicHintManager,
  EXTERNAL_DOMAINS,
  PAGE_HINTS,
} from './resource-hints';

export type {
  DomainConfig,
  CriticalResource,
  PageHints,
} from './resource-hints';

// Font optimization
export {
  generateFontFaceDeclarations,
  generateFontCSS,
  initializePageFonts,
  getFontsForLocale,
  generateFontCSSVariables,
  getFontMonitor,
  loadFontSwap,
  loadFontCritical,
  loadFontAsync,
  loadFontOnDemand,
  FONT_CONFIGS,
} from './font-optimization';

export type {
  FontConfig,
  FontFaceDeclaration,
} from './font-optimization';

// ISR configuration
export {
  getISRConfig,
  shouldGenerateStatic,
  getStaticPaths,
  getInvalidationManager,
  createRevalidationHandler,
  generateRevalidationConfig,
  ROUTE_ISR_CONFIGS,
  DEFAULT_INTERVALS,
} from './isr-config';

export type {
  ISRConfig,
  RouteISRConfig,
} from './isr-config';

// Performance budgets
export {
  getBudgetChecker,
  generateCIAnnotation,
  shouldBuildFail,
  ROUTE_BUDGETS,
  PerformanceBudgetChecker,
} from './budgets';

export type {
  SizeBudget,
  RouteBudget,
  BudgetReport,
  BudgetViolation,
} from './budgets';

// Default export - main instances
export { default as cache } from './advanced-cache';
export { default as database } from './database-optimizer';
