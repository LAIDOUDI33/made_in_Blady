/**
 * AlgeriaTrade.dz - Compression & Optimization Configuration
 * 
 * Features:
 * - Brotli & Gzip compression configuration
 * - Minification settings
 * - Bundle optimization
 * - Asset optimization pipeline
 */

// ===========================================
// Next.js Configuration for Performance
// ===========================================

/** next.config.ts additions for performance */
export const performanceNextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,

  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // Image optimization
  images: {
    // Use modern image formats
    formats: ['image/avif', 'image/webp'],
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Image sizes for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Minimum cache TTL for optimized images
    minimumCacheTTL: 60,
    
    // Disable static imports for remote images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    // Custom image loader (if using CDN)
    loader: process.env.IMAGE_LOADER as 'default' | 'imgix' | 'cloudinary' | 'custom' || 'default',
    
    // Remote image patterns (for external sources)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.algeriatrade.dz',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com', // S3/CloudFront
      },
    ],
  },

  // Experimental features
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    
    // Enable CSS optimization
    cssChunking: 'strict',
  },

  // Headers for all responses
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          
          // Compression hints
          {
            key: 'Accept-Encoding',
            value: 'gzip, deflate, br',
          },
        ],
      },
      
      // Static assets - aggressive caching
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // Images caching
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      
      // Fonts - very long cache
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },

  // Redirects for SEO and legacy URLs
  async redirects() {
    return [
      // Force HTTPS in production
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: ':path*',
              has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
              permanent: true,
              destination: 'https://algeriatrade.dz/:path*',
            },
          ]
        : []),
      
      // Legacy URL redirects
      {
        source: '/product/:id',
        permanent: true,
        destination: '/products/:id',
      },
      {
        source: '/supplier/:id',
        permanent: true,
        destination: '/suppliers/:id',
      },
    ];
  },
};

// ===========================================
// Compression Configuration
// ===========================================

export interface CompressionConfig {
  brotli: {
    enabled: boolean;
    quality: number; // 0-11
    mode: number; // 0 = generic, 1 = text, 2 = font
  };
  gzip: {
    enabled: boolean;
    level: number; // 1-9
    threshold: number; // Bytes before compressing
  };
  
  // File types to compress
  mimeTypes: string[];
  
  // File types to skip
  skipTypes: string[];
}

export const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
  brotli: {
    enabled: true,
    quality: 6, // Good balance between speed and compression
    mode: 0, // Generic compression
  },
  gzip: {
    enabled: true,
    level: 6,
    threshold: 1024, // Don't compress files smaller than 1KB
  },
  
  mimeTypes: [
    'text/html',
    'text/css',
    'text/javascript',
    'text/xml',
    'text/plain',
    'application/javascript',
    'application/json',
    'application/xml',
    'application/xhtml+xml',
    'application/rss+xml',
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2',
    'image/svg+xml',
  ],
  
  skipTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'audio/mpeg',
    'application/gzip',
    'application/x-gzip',
    'application/brotli',
    'application/wasm',
  ],
};

/**
 * Generate Vercel-specific compression config
 */
export function getVercelCompressionConfig() {
  return {
    headers: [
      {
        source: '/(.*)\\.(js|css|html|json|xml|svg|ttf|woff2?)$',
        headers: [
          {
            key: 'Content-Encoding',
            value: 'br',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
    ],
  };
}

/**
 * Generate Netlify-specific compression config
 */
export function getNetlifyCompressionConfig() {
  return `# Netlify _headers file for compression

/*
  Content-Encoding: br
  Vary: Accept-Encoding

/*.js
  Content-Encoding: br
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Content-Encoding: br
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Content-Encoding: br
  Cache-Control: public, max-age=0, must-revalidate`;
}

// ===========================================
// Minification Settings
// ===========================================

export interface MinificationConfig {
  html: {
    removeComments: boolean;
    collapseWhitespace: boolean;
    removeEmptyAttributes: boolean;
    minifyCSS: boolean;
    minifyJS: boolean;
  };
  css: {
    removeComments: boolean;
    removeEmptyRules: boolean;
    mergeMediaQueries: boolean;
    shortenHexColors: boolean;
  };
  js: {
    mangle: boolean;
    compress: {
      drop_console: boolean;
      drop_debugger: boolean;
      pure_funcs?: string[];
    };
  };
}

export const DEFAULT_MINIFICATION_CONFIG: MinificationConfig = {
  html: {
    removeComments: true,
    collapseWhitespace: true,
    removeEmptyAttributes: true,
    minifyCSS: true,
    minifyJS: true,
  },
  css: {
    removeComments: true,
    removeEmptyRules: true,
    mergeMediaQueries: false, // Can break some CSS
    shortenHexColors: true,
  },
  js: {
    mangle: true,
    compress: {
      drop_console: process.env.NODE_ENV === 'production',
      drop_debugger: true,
      pure_funcs: ['console.log'], // Remove console.log in production
    },
  },
};

// ===========================================
// Bundle Analysis & Optimization
// ===========================================

export interface BundleOptimizationConfig {
  // Packages to exclude from bundle (use CDN)
  externals: string[];
  
  // Packages to use ES modules version
  esmPackages: string[];
  
  // Aliases for shorter import paths
  aliases: Record<string, string>;
}

export const BUNDLE_OPTIMIZATION_CONFIG: BundleOptimizationConfig = {
  externals: [],
  esmPackages: [
    'react',
    'react-dom',
    'lodash',
    'date-fns',
  ],
  aliases: {
    '@': './src',
    '@/components': './src/components',
    '@/lib': './src/lib',
    '@/utils': './src/utils',
    '@/hooks': './src/hooks',
    '@/types': './src/types',
    '@/styles': './src/styles',
  },
};

/**
 * Analyze bundle size recommendations
 */
export function getBundleRecommendations(bundleSize: number): string[] {
  const recommendations: string[] = [];
  
  if (bundleSize > 500000) { // > 500KB
    recommendations.push('Bundle is large (>500KB). Consider code splitting.');
    recommendations.push('Use dynamic imports for route-level components.');
  }
  
  if (bundleSize > 1000000) { // > 1MB
    recommendations.push('Bundle is very large (>1MB). Critical optimizations needed:');
    recommendations.push('- Implement tree shaking for unused exports');
    recommendations.push('- Move heavy libraries to CDN');
    recommendations.push('- Use React.lazy() for non-critical components');
  }
  
  return recommendations;
}

// ===========================================
// Asset Pipeline Configuration
// ===========================================

export interface AssetPipelineConfig {
  images: {
    quality: number;
    progressive: boolean;
    convertFormats: ('webp' | 'avif')[];
    lazyLoad: boolean;
    placeholderBlur: boolean;
  };
  fonts: {
    subset: boolean; // Only load used characters
    display: 'swap' | 'block' | 'optional';
    preload: string[];
  };
  icons: {
    format: 'svg' | 'ico' | 'png';
    sizes: number[];
    inlineBelow: number; // Inline SVG icons below this size
  };
}

export const ASSET_PIPELINE_CONFIG: AssetPipelineConfig = {
  images: {
    quality: 80,
    progressive: true,
    convertFormats: ['webp', 'avif'],
    lazyLoad: true,
    placeholderBlur: true,
  },
  fonts: {
    subset: true,
    display: 'swap',
    preload: ['/fonts/inter-var-latin.woff2'],
  },
  icons: {
    format: 'svg',
    sizes: [16, 24, 32, 48, 64, 96, 128, 192, 256],
    inlineBelow: 1024, // Inline SVGs under 1KB
  },
};

// ===========================================
// Export All Configurations
// ===========================================

export {
  performanceNextConfig,
  DEFAULT_COMPRESSION_CONFIG,
  DEFAULT_MINIFICATION_CONFIG,
  BUNDLE_OPTIMIZATION_CONFIG,
  ASSET_PIPELINE_CONFIG,
};

export default {
  performanceNextConfig,
  compression: DEFAULT_COMPRESSION_CONFIG,
  minification: DEFAULT_MINIFICATION_CONFIG,
  bundle: BUNDLE_OPTIMIZATION_CONFIG,
  assets: ASSET_PIPELINE_CONFIG,
};
