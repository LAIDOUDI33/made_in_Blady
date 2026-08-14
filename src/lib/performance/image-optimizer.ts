/**
 * AlgeriaTrade.dz - Advanced Image Optimization System
 * 
 * Features:
 * - Multi-provider image optimization (Cloudinary, Imgix, Local)
 * - Responsive image generation with srcset
 * - Blur placeholder generation
 * - WebP/AVIF format detection
 * - Lazy loading with intersection observer
 * - Progressive image loading
 * - CDN integration
 */

import { ImageLoader } from 'next/image';

// ===========================================
// Configuration Types
// ===========================================

export interface ImageConfig {
  provider: 'cloudinary' | 'imgix' | 'local' | 'custom';
  cloudName?: string;
  domain?: string;
  quality?: number;
  formats?: ('webp' | 'avif' | 'original')[];
  enableBlur?: boolean;
  blurSize?: number;
  cacheMaxAge?: number;
  breakpoints?: number[];
}

export interface OptimizedImageProps {
  src: string;
  width: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  alt: string;
  className?: string;
  sizes?: string;
  blurDataURL?: string;
}

export interface ResponsiveImage {
  src: string;
  srcSet: string;
  placeholder: 'blur' | 'empty';
  blurDataURL?: string;
  width: number;
  height: number;
}

// ===========================================
// Default Configuration
// ===========================================

const DEFAULT_CONFIG: ImageConfig = {
  provider: (process.env.NEXT_PUBLIC_IMAGE_PROVIDER as ImageConfig['provider']) || 'local',
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  domain: process.env.NEXT_PUBLIC_IMAGE_DOMAIN,
  quality: parseInt(process.env.NEXT_PUBLIC_IMAGE_QUALITY || '80', 10),
  formats: ['webp', 'avif'],
  enableBlur: true,
  blurSize: 20,
  cacheMaxAge: 31536000, // 1 year in seconds
  breakpoints: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
};

// ===========================================
// Image Loaders
// ===========================================

/**
 * Cloudinary Image Loader
 * Optimizes images through Cloudinary's CDN with automatic format conversion
 */
export const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  const cloudName = DEFAULT_CONFIG.cloudName || 'algeriatrade';
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_limit,w_${width},q_${quality || DEFAULT_CONFIG.quality},f_auto/${src}`;
};

/**
 * Imgix Image Loader
 * Real-time image processing through Imgix
 */
export const imgixLoader: ImageLoader = ({ src, width, quality }) => {
  const domain = DEFAULT_CONFIG.domain || 'images.algeriatrade.dz';
  
  const params = new URLSearchParams({
    w: width.toString(),
    q: (quality || DEFAULT_CONFIG.quality).toString(),
    auto: 'format,compress',
    fit: 'max',
  });
  
  return `${domain}${src}?${params.toString()}`;
};

/**
 * Local Image Loader
 * For self-hosted images with Next.js built-in optimization
 */
export const localLoader: ImageLoader = ({ src, width, quality }) => {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || DEFAULT_CONFIG.quality}`;
};

/**
 * Custom Loader Router
 * Automatically selects the best loader based on configuration
 */
export function getImageLoader(): ImageLoader {
  switch (DEFAULT_CONFIG.provider) {
    case 'cloudinary':
      return cloudinaryLoader;
    case 'imgix':
      return imgixLoader;
    case 'local':
    default:
      return localLoader;
  }
}

// ===========================================
// Blur Placeholder Generation
// ===========================================

/**
 * Generate a low-quality blur placeholder URL for Cloudinary images
 */
export function getCloudinaryBlurURL(src: string): string {
  if (!DEFAULT_CONFIG.enableBlur) return '';
  
  const cloudName = DEFAULT_CONFIG.cloudName || 'algeriatrade';
  const size = DEFAULT_CONFIG.blurSize || 20;
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${size},e_blur:1000,q_1,f_auto/${src}`;
}

/**
 * Generate a data URI blur placeholder for local images
 */
function generateLocalBlurPlaceholder(width: number = 10, height: number = 10): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur" x="0" y="0">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="#e5e7eb" filter="url(#blur)" />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg.trim()).toString('base64')}`;
}

/**
 * Get blur data URL for an image
 */
export async function getBlurDataURL(src: string): Promise<string> {
  if (!DEFAULT_CONFIG.enableBlur) return '';
  
  try {
    if (DEFAULT_CONFIG.provider === 'cloudinary') {
      return getCloudinaryBlurURL(src);
    }
    
    return generateLocalBlurPlaceholder();
  } catch (error) {
    console.warn('Failed to generate blur placeholder:', error);
    return '';
  }
}

// ===========================================
// Responsive Image Generation
// ===========================================

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  src: string,
  sizes: number[] = DEFAULT_CONFIG.breakpoints,
  aspectRatio?: number
): string {
  const loader = getImageLoader();
  
  return sizes
    .map((size) => {
      const url = loader({ src, width: size, quality: DEFAULT_CONFIG.quality });
      return `${url} ${size}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute based on viewport
 */
export function generateSizes(
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'hero' = 'desktop'
): string {
  const sizeMap = {
    mobile: '(max-width: 640px) 100vw, (max-width: 1200px) 80vw, 640px',
    tablet: '(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 750px',
    desktop: '(max-width: 1200px) 50vw, 1200px',
    hero: '(max-width: 640px) 100vw, (max-width: 1200px) 90vw, 1920px',
  };
  
  return sizeMap[breakpoint];
}

// ===========================================
// Complete Optimized Image Component Props
// ===========================================

export interface CompleteImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  className?: string;
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  lazy?: boolean;
  fadeIn?: boolean;
  rounded?: boolean;
}

// ===========================================
// Utility Functions
// ===========================================

/**
 * Check if browser supports modern image formats
 */
export function checkImageFormatSupport(): { webp: boolean; avif: boolean } {
  if (typeof window === 'undefined') {
    return { webp: true, avif: false };
  }
  
  return {
    webp: document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp'),
    avif: false,
  };
}

/**
 * Calculate optimal image dimensions based on container
 */
export function calculateOptimalDimensions(
  containerWidth: number,
  containerHeight?: number,
  devicePixelRatio: number = 1
): { width: number; height: number } {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : devicePixelRatio;
  
  return {
    width: Math.round(containerWidth * Math.min(dpr, 2)),
    height: containerHeight ? Math.round(containerHeight * Math.min(dpr, 2)) : 0,
  };
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'high'): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  
  if (priority === 'high') {
    document.head.appendChild(link);
  } else {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => document.head.appendChild(link));
    } else {
      setTimeout(() => document.head.appendChild(link), 2000);
    }
  }
}

/**
 * Preload critical images for a page
 */
export function preloadCriticalImages(images: Array<{ src: string; priority?: 'high' | 'low' }>): void {
  images.forEach(({ src, priority = 'high' }) => {
    preloadImage(src, priority);
  });
}

// ===========================================
// Export Configuration
// ===========================================

export default DEFAULT_CONFIG;

export { DEFAULT_CONFIG };
