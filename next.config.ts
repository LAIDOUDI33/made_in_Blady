import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // =============================================================================
  // Output Configuration
  // =============================================================================
  output: "standalone",
  
  // =============================================================================
  // TypeScript Configuration
  // =============================================================================
  typescript: {
    ignoreBuildErrors: false, // Enable strict type checking for production
  },
  
  // React Strict Mode - enables additional development checks
  reactStrictMode: true,

  // =============================================================================
  // Performance Optimizations (Updated for Next.js 16 compatibility)
  // =============================================================================
  
  // NOTE: swcMinify is now default behavior in Next.js 16 - removed deprecated option
  
  // Package import optimization (moved from experimental)
  optimizePackageImports: [
    'lucide-react',
    '@radix-ui/react-icons',
    'date-fns',
    'lodash',
    'recharts',
  ],
  
  // Server packages externalization (updated location for Next.js 16)
  serverExternalPackages: [],

  // =============================================================================
  // Image Optimization
  // =============================================================================
  images: {
    // Allow images from these domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.algeriatrace.dz',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com', // S3 uploads
      },
    ],
    // Image formats to support
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Minimum cache duration in seconds (1 year)
    minimumCacheTTL: 60 * 60 * 24 * 365,
    // Disable static import optimization for dynamic images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // =============================================================================
  // Headers Configuration (Security & Caching)
  // =============================================================================
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security Headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },
          // HSTS header (added for security)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // Cache Control for API routes (no cache)
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        // Static assets with long cache
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|webp|avif|svg|woff2?)($|\\?)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // CSS and JS bundles
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // =============================================================================
  // Redirects Configuration
  // =============================================================================
  async redirects() {
    return [
      // Redirect www to non-www
      {
        source: '/www/:path*',
        destination: '/:path*',
        permanent: true,
      },
      // Redirect old paths if any
      {
        source: '/old-path/:path*',
        destination: '/new-path/:path*',
        permanent: true,
      },
    ];
  },

  // =============================================================================
  // Webpack Configuration
  // =============================================================================
  webpack: (config, { isServer }) => {
    // Optimize webpack bundle
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname + '/src',
      '@/components': __dirname + '/src/components',
      '@/lib': __dirname + '/src/lib',
      '@/app': __dirname + '/src/app',
    };

    // Split vendor chunks for better caching
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react-vendor',
              chunks: 'all',
              priority: 20,
              reuseExistingChunk: true,
            },
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: 'ui-vendor',
              chunks: 'all',
              priority: 15,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },

  // =============================================================================
  // Environment Variables (Client-side)
  // =============================================================================
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
