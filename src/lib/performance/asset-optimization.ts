/**
 * AlgeriaTrade.dz - Phase 6 Asset Optimization
 * 
 * Configuration and utilities for optimizing static assets:
 * - Video thumbnail generation
 * - Image optimization (exhibition banners, product galleries)
 * - Font subsetting for Arabic support
 * - Lazy loading strategies
 * 
 * Optimisation des assets pour la Phase 6
 */

// ===========================================
// VIDEO THUMBNAIL CONFIGURATION
// ===========================================

export interface VideoThumbnailConfig {
  /** Output format */
  format: 'webp' | 'jpeg' | 'avif';
  /** Thumbnail width in pixels */
  width: number;
  /** Thumbnail height in pixels (auto if 0) */
  height: number;
  /** JPEG/WebP quality (1-100) */
  quality: number;
  /** Timestamp in seconds to capture (or % of video) */
  screenshotTime: string | number;
  /** Whether to generate multiple sizes */
  generateSizes: ThumbnailSize[];
}

export interface ThumbnailSize {
  name: string;
  width: number;
  height: number;
  suffix: string;
}

/**
 * Video thumbnail generation configuration
 * Configuration de génération de miniatures vidéo
 */
export const videoThumbnailConfig: VideoThumbnailConfig = {
  format: 'webp',
  width: 640,
  height: 360,
  quality: 80,
  screenshotTime: '00:00:03', // 3 seconds into video
  generateSizes: [
    { name: 'xs', width: 160, height: 90, suffix: '-xs' },
    { name: 'sm', width: 320, height: 180, suffix: '-sm' },
    { name: 'md', width: 640, height: 360, suffix: '-md' },
    { name: 'lg', width: 1280, height: 720, suffix: '-lg' },
  ],
};

/**
 * Video poster image settings
 * Paramètres de l'image d'affiche vidéo
 */
export const videoPosterConfig = {
  format: 'jpeg' as const,
  quality: 85,
  width: 1920,
  height: 1080,
  blurPlaceholder: {
    width: 20,
    quality: 30,
    format: 'webp' as const,
  },
};

/**
 * Generate video thumbnail URL
 * Générer l'URL de la miniature vidéo
 */
export function getVideoThumbnailUrl(
  videoId: string,
  size: 'xs' | 'sm' | 'md' | 'lg' = 'md'
): string {
  const sizeConfig = videoThumbnailConfig.generateSizes.find((s) => s.name === size);
  return `/api/videos/${videoId}/thumbnail${sizeConfig?.suffix || ''}.${videoThumbnailConfig.format}`;
}

/**
 * Get video source set for responsive display
 * Obtenir le srcset vidéo pour l'affichage responsive
 */
export function getVideoSrcSet(videoId: string): string {
  return videoThumbnailConfig.generateSizes
    .map(
      (size) =>
        `${getVideoThumbnailUrl(videoId, size.name as any)} ${size.width}w`
    )
    .join(', ');
}

/**
 * Get video sizes attribute
 * Obtenir l'attribut sizes vidéo
 */
export function getVideoSizes(): string {
  return '(max-width: 320px) 160px, (max-width: 640px) 320px, (max-width: 1280px) 640px, 1280px';
}

// ===========================================
// IMAGE OPTIMIZATION CONFIGURATION
// ===========================================

export interface ImageOptimizationConfig {
  /** Supported formats by priority */
  formats: Array<'avif' | 'webp' | 'jpeg'>;
  /** Default quality per format */
  quality: {
    avif: number;
    webp: number;
    jpeg: number;
  };
  /** Device breakpoints */
  deviceSizes: number[];
  /** Image sizes for different use cases */
  presets: Record<string, ImagePreset>;
}

export interface ImagePreset {
  name: string;
  widths: number[];
  sizes: string;
  aspectRatio?: number;
}

/**
 * Exhibition banner optimization config
 * Configuration d'optimisation des bannières d'exposition
 */
export const exhibitionBannerConfig: ImagePreset = {
  name: 'exhibition-banner',
  widths: [400, 800, 1200, 1600, 2000],
  sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px',
  aspectRatio: 21 / 9,
};

/**
 * Product gallery optimization config
 * Configuration d'optimisation des galeries de produits
 */
export const productGalleryConfig: ImagePreset = {
  name: 'product-gallery',
  widths: [300, 450, 600, 800, 1200],
  sizes: '(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 33vw',
};

/**
 * Supplier logo config
 * Configuration du logo fournisseur
 */
export const supplierLogoConfig: ImagePreset = {
  name: 'supplier-logo',
  widths: [80, 160, 240, 320],
  sizes: '80px',
};

/**
 * Certification badge config
 * Configuration du badge de certification
 */
export const certificationBadgeConfig: ImagePreset = {
  name: 'certification-badge',
  widths: [60, 120],
  sizes: '60px',
};

/**
 * Main image optimization configuration
 * Configuration principale d'optimisation d'images
 */
export const imageOptimizationConfig: ImageOptimizationConfig = {
  formats: ['avif', 'webp', 'jpeg'],
  quality: {
    avif: 65,
    webp: 75,
    jpeg: 80,
  },
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  presets: {
    'exhibition-banner': exhibitionBannerConfig,
    'product-gallery': productGalleryConfig,
    'supplier-logo': supplierLogoConfig,
    'certification-badge': certificationBadgeConfig,
    'hero-image': {
      name: 'hero-image',
      widths: [800, 1200, 1600, 2000],
      sizes: '100vw',
      aspectRatio: 16 / 9,
    },
    'thumbnail': {
      name: 'thumbnail',
      widths: [150, 300, 450],
      sizes: '(max-width: 480px) 100vw, 300px',
    },
    'avatar': {
      name: 'avatar',
      widths: [64, 128, 256],
      sizes: '64px',
    },
  },
};

/**
 * Get optimized image URL
 * Obtenir l'URL de l'image optimisée
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options?: {
    width?: number;
    quality?: number;
    format?: 'avif' | 'webp' | 'jpeg';
  }
): string {
  const params = new URLSearchParams();
  
  if (options?.width) params.set('w', options.width.toString());
  if (options?.quality) params.set('q', options.quality.toString());
  if (options?.format) params.set('f', options.format);

  const queryString = params.toString();
  return `/api/image?url=${encodeURIComponent(originalUrl)}${queryString ? `&${queryString}` : ''}`;
}

/**
 * Generate responsive srcset for images
 * Générer le srcset responsive pour les images
 */
export function getImageSrcSet(
  originalUrl: string,
  presetName: string
): string {
  const preset = imageOptimizationConfig.presets[presetName];
  if (!preset) {
    console.warn(`Image preset "${presetName}" not found`);
    return originalUrl;
  }

  return preset.widths
    .map((width) => `${getOptimizedImageUrl(originalUrl, { width })} ${width}w`)
    .join(', ');
}

/**
 * Get blur placeholder data URL
 * Obtenir l'URL de données de placeholder flou
 */
export async function generateBlurPlaceholder(
  imageUrl: string,
  width: number = 20,
  quality: number = 30
): Promise<string> {
  // This would typically call an image processing API
  // For now, return a base64 encoded minimal placeholder
  return `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}" viewBox="0 0 ${width} ${width}">
      <rect fill="#f3f4f6" width="100%" height="100%"/>
      <rect fill="#e5e7eb" x="10%" y="20%" width="80%" height="60%" rx="4"/>
    </svg>`
  )}`;
}

// ===========================================
// FONT SUBSETTING FOR ARABIC SUPPORT
// ===========================================

export interface FontSubsetConfig {
  /** Font family name */
  family: string;
  /** Source font file path or URL */
  source: string;
  /** Unicode ranges to include */
  unicodeRanges: string[];
  /** Output file name pattern */
  outputPattern: string;
  /** Display strategy */
  display: 'swap' | 'block' | 'fallback' | 'optional' | 'auto';
  /** Weight variants to subset */
  weights: number[];
  /** Whether this is a critical font (loaded early) */
  critical: boolean;
}

/**
 * Arabic character ranges for subsetting
 * Plages de caractères arabes pour le sous-ensemble
 */
export const ARABIC_UNICODE_RANGES = [
  // Arabic basic range
  'U+0600-06FF',
  // Arabic Supplement
  'U+0750-077F',
  // Arabic Extended-A
  'U+08A0-08FF',
  // Arabic Presentation Forms-A
  'U+FB50-FDFF',
  // Arabic Presentation Forms-B
  'U+FE70-FEFF',
  // Arabic Mathematical Alphabetic Symbols
  'U+1EE00-1EEFF',
  // Numbers (Arabic-Indic)
  'U+0660-06FF',
  // Common punctuation used with Arabic
  'U+0020-002F', 'U+003A-0040', 'U+2000-206F', 
];

/**
 * French/Latin extended ranges (for accented characters)
 * Plages étendues françaises/latines (caractères accentués)
 */
export const FRENCH_UNICODE_RANGES = [
  // Latin Basic
  'U+0000-007F',
  // Latin-1 Supplement (French accents)
  'U+0080-00FF',
  // Latin Extended-A
  'U+0100-017F',
  // Latin Extended Additional
  'U+1E00-1EFF',
  // Spacing Modifier Letters
  'U+02B0-02FF',
  // General Punctuation
  'U+2000-206F',
];

/**
 * Common CJK ranges (for potential Chinese suppliers)
 * Plages CJK courantes
 */
export const CJK_UNICODE_RANGES = [
  'U+4E00-9FFF',   // CJK Unified Ideographs
  'U+3400-4DBF',   // CJK Extension A
];

/**
 * Font subsetting configurations
 * Configurations de sous-ensemble de polices
 */
export const fontSubsetConfigs: FontSubsetConfig[] = [
  {
    family: 'Noto Sans Arabic',
    source: '/fonts/NotoSansArabic-VariableFont_wght.ttf',
    unicodeRanges: ARABIC_UNICODE_RANGES,
    outputPattern: 'noto-sans-arabic-{weight}-subset.{ext}',
    display: 'swap',
    weights: [300, 400, 500, 600, 700],
    critical: true,
  },
  {
    family: 'Noto Sans',
    source: '/fonts/NotoSans-VariableFont_wght.ttf',
    unicodeRanges: [...FRENCH_UNICODE_RANGES, ...ARABIC_UNICODE_RANGES.slice(0, 2)],
    outputPattern: 'noto-sans-{weight}-subset.{ext}',
    display: 'swap',
    weights: [300, 400, 500, 600, 700],
    critical: true,
  },
  {
    family: 'Inter',
    source: '/fonts/InterVariable.woff2',
    unicodeRanges: FRENCH_UNICODE_RANGES,
    outputPattern: 'inter-{weight}-subset.{ext}',
    display: 'swap',
    weights: [400, 500, 600, 700],
    critical: true,
  },
  {
    family: 'Noto Naskh Arabic',
    source: '/fonts/NotoNaskhArabic-Regular.ttf',
    unicodeRanges: ARABIC_UNICODE_RANGES,
    outputPattern: 'noto-naskh-{weight}-subset.{ext}',
    display: 'swap',
    weights: [400, 500, 600, 700],
    critical: false,
  },
];

/**
 * Calculate estimated font subset size
 * Calculer la taille estimée du sous-ensemble de police
 */
export function estimateSubsetSize(
  originalSizeKB: number,
  rangeCount: number,
  isVariable: boolean
): number {
  // Rough estimation: each unicode range is ~5-15% of full font
  const averageRangePercent = 0.08;
  const variableMultiplier = isVariable ? 1.5 : 1;
  
  const subsetPercent = Math.min(1, rangeCount * averageRangePercent);
  return Math.round(originalSizeKB * subsetPercent * variableMultiplier);
}

/**
 * Generate @font-face declarations for subset fonts
 * Générer les déclarations @font-face pour les polices sous-ensembles
 */
export function generateFontFaceDeclarations(
  config: FontSubsetConfig,
  baseUrl: string = '/fonts'
): string {
  return config.weights
    .map(
      (weight) => `
@font-face {
  font-family: '${config.family}';
  font-style: normal;
  font-weight: ${weight};
  font-display: ${config.display};
  src: url('${baseUrl}/${config.outputPattern
    .replace('{weight}', weight.toString())
    .replace('{ext}', 'woff2')}') format('woff2'),
       url('${baseUrl}/${config.outputPattern
    .replace('{weight}', weight.toString())
    .replace('{ext}', 'woff')}') format('woff');
}`
    )
    .join('\n');
}

/**
 * Get preconnect hints for font CDNs
 * Obtenir les indices de préconnexion pour les CDN de polices
 */
export function getFontPreconnects(): Array<{ href: string; crossOrigin?: string }> {
  return [
    { href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  ];
}

// ===========================================
// LAZY LOADING STRATEGY
// ===========================================

export interface LazyLoadConfig {
  /** Root margin for Intersection Observer */
  rootMargin: string;
  /** Threshold for triggering load */
  threshold: number;
  /** Whether to use native lazy loading as fallback */
  useNativeFallback: boolean;
  /** Placeholder configuration */
  placeholder: {
    color: string;
    blurAmount: string;
    svgPattern?: string;
  };
}

/**
 * Product gallery lazy loading config
 * Configuration de chargement différé pour la galerie de produits
 */
export const productGalleryLazyConfig: LazyLoadConfig = {
  rootMargin: '200px',
  threshold: 0.01,
  useNativeFallback: true,
  placeholder: {
    color: '#f3f4f6',
    blurAmount: '10px',
  },
};

/**
 * Exhibition images lazy loading config
 * Configuration de chargement différé pour les images d'exposition
 */
export const exhibitionLazyConfig: LazyLoadConfig = {
  rootMargin: '100px',
  threshold: 0.1,
  useNativeFallback: true,
  placeholder: {
    color: '#e5e7eb',
    blurAmount: '8px',
  },
};

/**
 * Video lazy loading config
 * Configuration de chargement différé pour les vidéos
 */
export const videoLazyConfig: LazyLoadConfig = {
  rootMargin: '300px',
  threshold: 0,
  useNativeFallback: false, // Videos need custom handling
  placeholder: {
    color: '#1f2937',
    blurAmount: '5px',
    svgPattern: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect fill="#374151" width="16" height="9"/><polygon fill="#9CA3AF" points="6,2.5 11,4.5 6,6.5"/></svg>`,
  },
};

/**
 * Priority loading configurations (above the fold)
 * Configurations de chargement prioritaire (au-dessus du pli)
 */
export const priorityLoadConfig = {
  heroImages: ['eager', 300] as [string, number], // [fetchpriority, timeout]
  productThumbnails: ['high', 200] as [string, number],
  logos: ['high', 100] as [string, number],
  criticalFonts: ['block', 0] as [string, number],
};

/**
 * Create Intersection Observer options
 * Créer les options de l'Intersection Observer
 */
export function createIntersectionObserverOptions(
  config: LazyLoadConfig
): IntersectionObserverInit {
  return {
    rootMargin: config.rootMargin,
    threshold: config.threshold,
  };
}

/**
 * Generate placeholder SVG data URL
 * Générer l'URL de données SVG de l'espace réservé
 */
export function generatePlaceholderSVG(
  width: number,
  height: number,
  config: LazyLoadConfig['placeholder']
): string {
  const svg = config.svgPattern || `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect fill="${config.color}" width="${width}" height="${height}"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Determine loading strategy based on element position
 * Déterminer la stratégie de chargement basée sur la position de l'élément
 */
export function getLoadingStrategy(
  elementIndex: number,
  totalElements: number,
  viewportFold: number = 4
): 'eager' | 'lazy' | 'very-lazy' {
  if (elementIndex < viewportFold) return 'eager';
  if (elementIndex < totalElements / 2) return 'lazy';
  return 'very-lazy';
}

/**
 * Generate loading attributes for HTML elements
 * Générer les attributs de chargement pour les éléments HTML
 */
export function getLoadingAttributes(
  strategy: 'eager' | 'lazy' | 'very-lazy'
): { loading: string; fetchpriority?: string; decoding?: string } {
  switch (strategy) {
    case 'eager':
      return {
        loading: 'eager',
        fetchpriority: 'high',
        decoding: 'sync',
      };
    case 'lazy':
      return {
        loading: 'lazy',
        fetchpriority: 'auto',
        decoding: 'async',
      };
    case 'very-lazy':
      return {
        loading: 'lazy',
        fetchpriority: 'low',
        decoding: 'async',
      };
  }
}

// ===========================================
// ASSET BUDGET & MONITORING
// ===========================================

export interface AssetBudget {
  type: 'image' | 'video' | 'font' | 'script' | 'stylesheet';
  maxSizeKB: number;
  warningThreshold: number; // percentage of max
  description: string;
}

/**
 * Asset budgets for different types
 * Budgets pour différents types d'assets
 */
export const assetBudgets: AssetBudget[] = [
  {
    type: 'image',
    maxSizeKB: 200,
    warningThreshold: 0.8,
    description: 'Product gallery images',
  },
  {
    type: 'image',
    maxSizeKB: 500,
    warningThreshold: 0.85,
    description: 'Exhibition banner images',
  },
  {
    type: 'video',
    maxSizeKB: 50,
    warningThreshold: 0.9,
    description: 'Video thumbnails',
  },
  {
    type: 'font',
    maxSizeKB: 50,
    warningThreshold: 0.85,
    description: 'Subset fonts (per weight)',
  },
  {
    type: 'font',
    maxSizeKB: 100,
    warningThreshold: 0.9,
    description: 'Full fonts (critical only)',
  },
];

/**
 * Check if asset is within budget
 * Vérifier si l'asset est dans le budget
 */
export function checkAssetBudget(
  assetType: AssetBudget['type'],
  sizeKB: number,
  specificDescription?: string
): { withinBudget: boolean; budget: AssetBudget; usage: number } {
  const budget = assetBudgets.find(
    (b) => b.type === assetType && (specificDescription ? b.description.includes(specificDescription.split(' ')[0]) : true)
  ) || assetBudgets.find((b) => b.type === assetType)!;

  const usage = sizeKB / budget.maxSizeKB;

  return {
    withinBudget: usage <= 1,
    budget,
    usage,
  };
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  video: {
    thumbnail: videoThumbnailConfig,
    poster: videoPosterConfig,
    getThumbnailUrl: getVideoThumbnailUrl,
    getSrcSet: getVideoSrcSet,
    getSizes: getVideoSizes,
  },
  image: {
    config: imageOptimizationConfig,
    presets: imageOptimizationConfig.presets,
    getOptimizedUrl: getOptimizedImageUrl,
    getSrcSet: getImageSrcSet,
    generateBlurPlaceholder,
  },
  font: {
    subsets: fontSubsetConfigs,
    arabicRanges: ARABIC_UNICODE_RANGES,
    frenchRanges: FRENCH_UNICODE_RANGES,
    estimateSize: estimateSubsetSize,
    generateFontFace: generateFontFaceDeclarations,
    getPreconnects: getFontPreconnects,
  },
  lazyLoading: {
    productGallery: productGalleryLazyConfig,
    exhibition: exhibitionLazyConfig,
    video: videoLazyConfig,
    priority: priorityLoadConfig,
    createObserverOptions: createIntersectionObserverOptions,
    generatePlaceholder: generatePlaceholderSVG,
    getStrategy: getLoadingStrategy,
    getAttributes: getLoadingAttributes,
  },
  budgets: assetBudgets,
  checkBudget: checkAssetBudget,
};
