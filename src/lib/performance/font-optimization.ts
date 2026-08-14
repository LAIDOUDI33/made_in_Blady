/**
 * AlgeriaTrade.dz - Font Loading Optimization System
 * 
 * Features:
 * - Self-hosted font configuration
 * - Critical font inlining (subset)
 * - Font loading strategies (swap, block, optional, fallback)
 * - Variable font optimization
 * - Arabic/RTL font support
 * - Font display monitoring
 * - Preload hints for fonts
 */

// ===========================================
// Types & Configuration
// ===========================================

export interface FontConfig {
  family: string;
  source: 'local' | 'google' | 'custom';
  files: {
    woff2?: string;
    woff?: string;
    ttf?: string;
    variable?: string; // Variable font file
  };
  subsets: string[]; // e.g., ['latin', 'arabic', 'cyrillic']
  weights: number[];
  styles: ('normal' | 'italic')[];
  display: 'swap' | 'block' | 'optional' | 'fallback';
  preload: boolean;
  critical?: boolean; // Inline critical subset
}

interface FontFaceDeclaration {
  fontFamily: string;
  src: string[];
  fontWeight: string | number;
  fontStyle: string;
  fontDisplay: string;
  unicodeRange?: string;
}

// ===========================================
// Font Configurations for AlgeriaTrade
// ===========================================

export const FONT_CONFIGS: Record<string, FontConfig> = {
  // Primary font - Inter (Latin + Extended Latin)
  inter: {
    family: 'Inter',
    source: 'local',
    files: {
      variable: '/fonts/InterVariable.woff2',
      woff2: '/fonts/Inter-Regular.woff2',
      woff: '/fonts/Inter-Regular.woff',
    },
    subsets: ['latin'],
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    styles: ['normal', 'italic'],
    display: 'swap',
    preload: true,
    critical: true,
  },

  // Arabic font - Noto Sans Arabic (for RTL content)
  notoSansArabic: {
    family: 'Noto Sans Arabic',
    source: 'local',
    files: {
      woff2: '/fonts/NotoSansArabic-Regular.woff2',
      woff: '/fonts/NotoSansArabic-Regular.woff',
      variable: '/fonts/NotoSansArabic-Variable.woff2',
    },
    subsets: ['arabic'],
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    styles: ['normal'],
    display: 'swap',
    preload: false, // Only preload when viewing RTL pages
    critical: false,
  },

  // Monospace font for code/data
  jetBrainsMono: {
    family: 'JetBrains Mono',
    source: 'local',
    files: {
      woff2: '/fonts/JetBrainsMono-Regular.woff2',
      woff: '/fonts/JetBrainsMono-Regular.woff',
      variable: '/fonts/JetBrainsMono-Variable.woff2',
    },
    subsets: ['latin'],
    weights: [300, 400, 500, 600, 700],
    styles: ['normal', 'italic'],
    display: 'optional', // Not critical, can wait
    preload: false,
  },

  // Icons font (if using icon font instead of SVG)
  icons: {
    family: 'AlgeriaTrade Icons',
    source: 'custom',
    files: {
      woff2: '/fonts/icons.woff2',
    },
    subsets: [],
    weights: [400],
    styles: ['normal'],
    display: 'block', // Ensure icons are visible immediately
    preload: true,
    critical: true,
  },
};

// ===========================================
// Unicode Ranges for Subsetting
// ===========================================

const UNICODE_RANGES = {
  latin: 'U+0000-00FF, U+0131-0152, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  latinExtended: 'U+0100-024F, U+0259-01AF, U+01C0-01CF, U+1E00-1EFF',
  arabic: 'U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+10D00-10D3F, U+10E60-10E7F',
  cyrillic: 'U+0400-052F, U+1C80-1C8F, U+2DE0-2DFF, U+A640-A69F',
  numbers: 'U+0030-0039',
  punctuation: 'U+2000-206F',
};

// ===========================================
// @font-face Declaration Generator
// ===========================================

/**
 * Generate @font-face declarations for a font config
 */
export function generateFontFaceDeclarations(config: FontConfig): string[] {
  const declarations: string[] = [];

  for (const weight of config.weights) {
    for (const style of config.styles) {
      const srcParts: string[] = [];

      // Build src array with format hints (order matters for browser support)
      
      // Variable font first (if available and multiple weights requested)
      if (config.files.variable && config.weights.length > 2) {
        srcParts.push(`url("${config.files.variable}") format("woff2-variations")`);
      }

      // WOFF2 (most efficient)
      if (config.files.woff2) {
        srcParts.push(`url("${config.files.woff2}") format("woff2")`);
      }

      // WOFF (fallback)
      if (config.files.woff) {
        srcParts.push(`url("${config.files.woff}") format("woff")`);
      }

      // TTF (last resort)
      if (config.files.ttf) {
        srcParts.push(`url("${config.files.ttf}") format("truetype")`);
      }

      // Generate unicode-range if subsets specified
      let unicodeRange = '';
      if (config.subsets.length > 0) {
        const ranges = config.subsets.map(s => UNICODE_RANGES[s as keyof typeof UNICODE_RANGES]).filter(Boolean);
        if (ranges.length > 0) {
          unicodeRange = `unicode-range: ${ranges.join(', ')};\n  `;
        }
      }

      const declaration = `@font-face {
  font-family: '${config.family}';
  src: ${srcParts.join(',\n       ')};
  font-weight: ${weight};
  font-style: ${style};
  font-display: ${config.display};
  ${unicodeRange}
}`;

      declarations.push(declaration);
    }
  }

  return declarations;
}

/**
 * Generate complete CSS for all configured fonts
 */
export function generateFontCSS(fontsToInclude?: string[]): string {
  const fonts = fontsToInclude 
    ? fontsToInclude.map(f => FONT_CONFIGS[f]).filter(Boolean)
    : Object.values(FONT_CONFIGS);

  return fonts
    .map(config => generateFontFaceDeclarations(config).join('\n\n'))
    .join('\n\n');
}

// ===========================================
// Critical Font Subset Inlining
// ===========================================

/**
 * Get critical characters to inline for a page
 */
function getCriticalCharacters(pageType: 'home' | 'product' | 'dashboard' | 'checkout' | 'general'): string {
  switch (pageType) {
    case 'home':
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(){}[]|\\:";\'<>?,./~`+-=_';
    
    case 'checkout':
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$€£¥.,';
    
    case 'product':
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%$€£¥×+−÷=';
    
    case 'dashboard':
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%.,:;/-';
    
    default:
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  }
}

/**
 * Generate base64-encoded critical font subset (placeholder - would use fonttools in production)
 */
export async function generateCriticalFontSubset(
  fontName: string,
  pageType: string
): Promise<string> {
  const config = FONT_CONFIGS[fontName];
  if (!config?.critical || !config.files.woff2) return '';

  try {
    // In production, this would use a server-side API to generate actual font subsets
    // For now, we'll return empty and rely on preloaded full fonts
    console.log(`📝 Would generate critical subset for ${fontName} on ${pageType} page`);
    return '';
  } catch (error) {
    console.error('Failed to generate font subset:', error);
    return '';
  }
}

// ===========================================
// Font Loading Strategies
// ===========================================

/**
 * Font loading strategy implementations
 */

/** Strategy 1: Font Display Swap (default) - Shows fallback immediately, swaps when loaded */
export function loadFontSwap(config: FontConfig): void {
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = generateFontFaceDeclarations(config).join('\n');
  document.head.appendChild(style);
}

/** Strategy 2: Critical font loading with preload */
export function loadFontCritical(config: FontConfig): void {
  if (typeof document === 'undefined') return;

  // Step 1: Preload the font file
  if (config.preload && config.files.woff2) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = config.files.woff2;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  // Step 2: Add @font-face declarations
  loadFontSwap(config);
}

/** Strategy 3: Load font asynchronously (non-blocking) */
export function loadFontAsync(config: FontConfig): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }

    // Use requestIdleCallback to load during idle time
    const loadFont = () => {
      loadFontSwap(config);
      
      // Wait for font to actually load
      if (document.fonts) {
        document.fonts.load(`400 16px '${config.family}'`).then(() => {
          resolve();
        }).catch(() => {
          resolve(); // Resolve anyway even if font fails
        });
      } else {
        setTimeout(resolve, 1000); // Fallback timeout
      }
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(loadFont, { timeout: 2000 });
    } else {
      setTimeout(loadFont, 100);
    }
  });
}

/** Strategy 4: Load font on hover/intent (for non-critical fonts) */
export function loadFontOnDemand(
  config: FontConfig,
  triggerElement: HTMLElement
): void {
  if (typeof document === 'undefined' || !triggerElement) return;

  let loaded = false;

  const loadWhenNeeded = () => {
    if (loaded) return;
    loaded = true;
    loadFontSwap(config);
  };

  // Load on mouseenter or focus
  triggerElement.addEventListener('mouseenter', loadWhenNeeded, { once: true });
  triggerElement.addEventListener('focus', loadWhenNeeded, { once: true });
  
  // Also load after a delay (in case user doesn't interact)
  setTimeout(loadWhenNeeded, 3000);
}

// ===========================================
// RTL / Bilingual Font Support
// ===========================================

/**
 * Get appropriate fonts based on language direction
 */
export function getFontsForLocale(locale: string): { primary: string; fallback: string[] } {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  
  if (rtlLocales.includes(locale)) {
    return {
      primary: 'notoSansArabic',
      fallback: ['inter', 'sans-serif'],
    };
  }

  return {
    primary: 'inter',
    fallback: ['notoSansArabic', 'system-ui', '-apple-system', 'sans-serif'],
  };
}

/**
 * Generate CSS custom properties for current locale's fonts
 */
export function generateFontCSSVariables(locale: string = 'en'): string {
  const { primary, fallback } = getFontsForLocale(locale);
  const primaryConfig = FONT_CONFIGS[primary];

  return `
  :root {
    --font-primary: '${primaryConfig.family}', ${fallback.join(', ')};
    --font-mono: '${FONT_CONFIGS.jetBrainsMono.family}', monospace;
    --font-icons: '${FONT_CONFIGS.icons.family}';
    
    /* Font loading behavior */
    --font-display: ${primaryConfig.display};
  }

  /* Apply system font stack while custom fonts load */
  body {
    font-family: var(--font-primary);
  }

  /* Code blocks use monospace */
  code, pre, kbd, samp {
    font-family: var(--font-mono);
  }

  /* Direction-specific adjustments */
  html[dir="rtl"] body {
    font-family: '${FONT_CONFIGS.notoSansArabic.family}', var(--font-primary);
  }
`;
}

// ===========================================
// Font Performance Monitoring
// ===========================================

/**
 * Monitor font loading performance
 */
export class FontPerformanceMonitor {
  private metrics: Map<string, { startTime: number; endTime?: number; status: 'loading' | 'loaded' | 'failed' }> = new Map();

  /**
   * Start tracking a font load
   */
  startTracking(fontFamily: string): void {
    this.metrics.set(fontFamily, {
      startTime: performance.now(),
      status: 'loading',
    });
  }

  /**
   * Mark font as loaded
   */
  markLoaded(fontFamily: string): void {
    const metric = this.metrics.get(fontFamily);
    if (metric) {
      metric.endTime = performance.now();
      metric.status = 'loaded';
    }
  }

  /**
   * Mark font as failed
   */
  markFailed(fontFamily: string): void {
    const metric = this.metrics.get(fontFamily);
    if (metric) {
      metric.endTime = performance.now();
      metric.status = 'failed';
    }
  }

  /**
   * Get font load time
   */
  getLoadTime(fontFamily: string): number | null {
    const metric = this.metrics.get(fontFamily);
    if (metric?.endTime) {
      return Math.round(metric.endTime - metric.startTime);
    }
    return null;
  }

  /**
   * Check if all critical fonts are loaded
   */
  async waitForCriticalFonts(timeout: number = 3000): Promise<boolean> {
    const criticalFonts = Object.entries(FONT_CONFIGS)
      .filter(([, config]) => config.critical)
      .map(([name]) => name);

    if (!document.fonts) return true;

    try {
      await Promise.race([
        Promise.all(
          criticalFonts.map(async (font) => {
            const config = FONT_CONFIGS[font];
            this.startTracking(font);
            await document.fonts.load(`400 16px '${config.family}'`);
            this.markLoaded(font);
          })
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
      ]);

      return true;
    } catch {
      criticalFonts.forEach(font => this.markFailed(font));
      return false;
    }
  }

  /**
   * Get performance report
   */
  getReport(): Array<{
    fontFamily: string;
    loadTime: number | null;
    status: string;
  }> {
    return Array.from(this.metrics.entries()).map(([fontFamily, metric]) => ({
      fontFamily,
      loadTime: this.getLoadTime(fontFamily),
      status: metric.status,
    }));
  }
}

// Singleton instance
let fontMonitorInstance: FontPerformanceMonitor | null = null;

export function getFontMonitor(): FontPerformanceMonitor {
  if (!fontMonitorInstance && typeof window !== 'undefined') {
    fontMonitorInstance = new FontPerformanceMonitor();
  }
  return fontMonitorInstance!;
}

// ===========================================
// Initialize Fonts for Page
// ===========================================

/**
 * Initialize fonts based on page requirements
 */
export async function initializePageFonts(options: {
  pathname: string;
  locale?: string;
  waitForCritical?: boolean;
}): Promise<void> {
  if (typeof document === 'undefined') return;

  const { pathname, locale = 'en', waitForCritical = true } = options;

  // Determine which fonts are needed
  const isRTLPage = locale.startsWith('ar') || pathname.includes('/ar/');
  const fontsToLoad: Array<{ config: FontConfig; strategy: 'critical' | 'async' | 'on-demand' }> = [];

  // Always load primary font critically
  const primaryFont = isRTLPage ? FONT_CONFIGS.notoSansArabic : FONT_CONFIGS.inter;
  fontsToLoad.push({ config: primaryFont, strategy: 'critical' });

  // Load secondary font asynchronously
  const secondaryFont = isRTLPage ? FONT_CONFIGS.inter : FONT_CONFIGS.notoSansArabic;
  fontsToLoad.push({ config: secondaryFont, strategy: 'async' });

  // Load icons font critically
  fontsToLoad.push({ config: FONT_CONFIGS.icons, strategy: 'critical' });

  // Load each font with appropriate strategy
  for (const { config, strategy } of fontsToLoad) {
    switch (strategy) {
      case 'critical':
        loadFontCritical(config);
        break;
      case 'async':
        loadFontAsync(config).catch(() => {});
        break;
    }
  }

  // Optionally wait for critical fonts
  if (waitForCritical) {
    const monitor = getFontMonitor();
    const allLoaded = await monitor.waitForCriticalFonts(3000);
    
    if (allLoaded) {
      document.documentElement.classList.add('fonts-loaded');
    } else {
      document.documentElement.classList.add('fonts-timeout');
    }
  }

  // Add CSS variables for fonts
  const style = document.createElement('style');
  style.id = 'font-css-variables';
  style.textContent = generateFontCSSVariables(locale);
  document.head.appendChild(style);
}

// ===========================================
// Export All
// ===========================================

export {
  FONT_CONFIGS,
  UNICODE_RANGES,
};

export default {
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
};
