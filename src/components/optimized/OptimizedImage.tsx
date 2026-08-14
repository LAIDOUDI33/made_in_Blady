'use client';

/**
 * AlgeriaTrade.dz - Optimized Image Component
 * 
 * Features:
 * - Automatic blur placeholder generation
 * - Lazy loading with intersection observer
 * - Progressive loading animation
 * - Responsive srcset generation
 * - Error handling with fallback
 * - WebP/AVIF format support
 */

import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import Image from 'next/image';
import {
  getImageLoader,
  getBlurDataURL,
  generateSrcSet,
  generateSizes,
  checkImageFormatSupport,
} from '@/lib/performance/image-optimizer';

interface OptimizedImageProps {
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
  placeholder?: 'blur' | 'empty' | 'skeleton';
  blurDataURL?: string;
  lazy?: boolean;
  fadeIn?: boolean;
  rounded?: boolean;
  aspectRatio?: number;
  fallbackSrc?: string;
}

const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      width = 800,
      height = 600,
      fill = false,
      priority = false,
      quality = 80,
      className = '',
      sizes,
      objectFit = 'cover',
      onLoad,
      onError,
      placeholder = 'blur',
      blurDataURL: initialBlurURL,
      lazy = !priority,
      fadeIn = true,
      rounded = false,
      aspectRatio,
      fallbackSrc = '/images/placeholder.jpg',
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [blurDataURL, setBlurDataURL] = useState<string | undefined>(initialBlurURL);
    const [isInView, setIsInView] = useState(!lazy || priority);
    const imgRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Generate blur URL if not provided
    useEffect(() => {
      if (placeholder === 'blur' && !blurDataURL) {
        getBlurDataURL(src).then(setBlurDataURL);
      }
    }, [src, placeholder, blurDataURL]);

    // Intersection Observer for lazy loading
    useEffect(() => {
      if (!lazy || isInView) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        },
        {
          rootMargin: '200px', // Start loading before visible
          threshold: 0.01,
        }
      );

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }

      return () => {
        observerRef.current?.disconnect();
      };
    }, [lazy, isInView]);

    // Handle load event
    const handleLoad = useCallback(() => {
      setIsLoading(false);
      onLoad?.();
    }, [onLoad]);

    // Handle error event
    const handleError = useCallback(() => {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }, [onError]);

    // Build class names
    const containerClassName = [
      'optimized-image-container',
      rounded ? 'rounded-lg overflow-hidden' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const imageClassName = [
      'optimized-image',
      `object-${objectFit}`,
      fadeIn && !isLoading ? 'fade-in' : '',
      isLoading ? 'loading' : '',
    ]
      .filter(Boolean)
      .join(' ');

    // Show skeleton/placeholder while loading
    const renderPlaceholder = () => {
      switch (placeholder) {
        case 'skeleton':
          return <div className="image-skeleton animate-pulse bg-gray-200 dark:bg-gray-700" />;
        case 'blur':
          return (
            <div className="image-blur-placeholder absolute inset-0">
              {blurDataURL && (
                <Image
                  src={blurDataURL}
                  alt=""
                  fill
                  className="blur-xl scale-110"
                  unoptimized
                />
              )}
            </div>
          );
        default:
          return null;
      }
    };

    // Show error state
    if (hasError) {
      return (
        <div
          ref={imgRef as React.RefObject<HTMLDivElement>}
          className={containerClassName}
          style={!fill ? { width, height, aspectRatio } : undefined}
        >
          <Image
            src={fallbackSrc}
            alt={`${alt} (failed to load)`}
            fill={fill}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            className={imageClassName}
            loader={getImageLoader()}
            priority={priority}
          />
        </div>
      );
    }

    // Main render
    return (
      <div
        ref={imgRef as React.RefObject<HTMLDivElement>}
        className={containerClassName}
        style={
          !fill
            ? {
                position: 'relative',
                width,
                height,
                aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
              }
            : { position: 'relative', ...{ aspectRatio: aspectRatio ? `${aspectRatio}` : undefined } }
        }
      >
        {/* Placeholder */}
        {(isLoading || !isInView) && renderPlaceholder()}

        {/* Actual Image */}
        {isInView && (
          <Image
            ref={ref as React.RefObject<HTMLImageElement>}
            src={src}
            alt={alt}
            fill={fill}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            quality={quality}
            sizes={sizes || generateSizes('desktop')}
            className={imageClassName}
            loader={getImageLoader()}
            priority={priority}
            placeholder={placeholder === 'blur' ? 'blur' : undefined}
            blurDataURL={blurDataURL}
            onLoadingComplete={handleLoad}
            onError={handleError}
          />
        )}

        {/* Styles */}
        <style jsx>{`
          .optimized-image-container {
            display: block;
            position: relative;
            overflow: hidden;
          }

          .optimized-image {
            transition: opacity 0.3s ease-in-out;
            opacity: 1;
          }

          .optimized-image.loading {
            opacity: 0;
          }

          .optimized-image.fade-in {
            animation: fadeIn 0.3s ease-in-out forwards;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .image-skeleton {
            position: absolute;
            inset: 0;
            z-index: 1;
          }

          .image-blur-placeholder {
            z-index: 1;
            pointer-events: none;
          }

          /* Loading shimmer effect */
          .image-skeleton::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.2),
              transparent
            );
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;

// ===========================================
// Pre-built Variants
// ===========================================

/** Product thumbnail for listings */
export function ProductThumbnail({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={300}
      height={300}
      sizes="(max-width: 640px) 50vw, (max-width: 1200px) 25vw, 300px"
      rounded
      placeholder="blur"
    />
  );
}

/** Hero banner image */
export function HeroBanner({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={600}
      sizes="100vw"
      priority
      placeholder="blur"
      fadeIn={false}
    />
  );
}

/** User avatar */
export function UserAvatar({
  src,
  alt,
  size = 40,
}: {
  src: string;
  alt: string;
  size?: number;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      rounded
      placeholder="empty"
      className="rounded-full"
    />
  );
}

/** Gallery image for product details */
export function GalleryImage({
  src,
  alt,
  onClick,
}: {
  src: string;
  alt: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="cursor-pointer focus:outline-none">
      <OptimizedImage
        src={src}
        alt={alt}
        width={800}
        height={800}
        sizes="(max-width: 640px) 100vw, (max-width: 1200px) 60vw, 800px"
        rounded
        placeholder="blur"
      />
    </button>
  );
}
