'use client';

import React, { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import cn from 'classnames';

// Size variants
const SIZE_VARIANTS = {
  sm: { star: 16, gap: 2 },
  md: { star: 20, gap: 3 },
  lg: { star: 28, gap: 4 },
  xl: { star: 36, gap: 5 },
};

interface StarRatingProps {
  /** Current rating value (1-5, supports half like 4.5) */
  rating?: number;
  /** Called when user clicks a star (for input mode) */
  onRatingChange?: (rating: number) => void;
  /** Total number of reviews to display */
  totalReviews?: number;
  /** Size variant: sm, md, lg, xl */
  size?: keyof typeof SIZE_VARIANTS;
  /** Display mode or interactive mode */
  readonly?: boolean;
  /** Show rating text (e.g., "4.5 sur 5") */
  showValue?: boolean;
  /** Custom class name */
  className?: string;
  /** ID for accessibility */
  id?: string;
}

/**
 * StarRating Component
 * 
 * Interactive star rating input with display mode.
 * Supports half-stars for display and click-to-rate for input.
 * French decimal format: "4,5 sur 5"
 */
export function StarRating({
  rating = 0,
  onRatingChange,
  totalReviews,
  size = 'md',
  readonly = true,
  showValue = false,
  className,
  id,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
  const config = SIZE_VARIANTS[size];
  const displayRating = hoverRating ?? rating;

  // Generate stars array with fill state
  const getStars = useCallback(() => {
    const stars = [];
    const fullStars = Math.floor(displayRating);
    const hasHalfStar = displayRating % 1 >= 0.25 && displayRating % 1 <= 0.75;
    
    for (let i = 1; i <= 5; i++) {
      let fillState: 'full' | 'half' | 'empty' = 'empty';
      
      if (i <= fullStars) {
        fillState = 'full';
      } else if (i === fullStars + 1 && hasHalfStar) {
        fillState = 'half';
      }
      
      stars.push({
        value: i,
        fillState,
      });
    }
    
    return stars;
  }, [displayRating]);

  const handleStarClick = (starValue: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue: number | null) => {
    if (!readonly) {
      setHoverRating(starValue);
    }
  };

  // Format rating with French decimal comma
  const formatRating = (value: number): string => {
    return value.toString().replace('.', ',');
  };

  return (
    <div 
      className={cn('inline-flex items-center', className)}
      role={readonly ? 'img' : 'slider'}
      aria-label={readonly ? `Note : ${formatRating(rating)} sur 5` : 'Sélectionnez une note'}
      aria-valuenow={rating}
      aria-valuemin={1}
      aria-valuemax={5}
      id={id}
    >
      <div 
        className="flex items-center"
        style={{ gap: `${config.gap}px` }}
      >
        {getStars().map((star) => (
          <button
            key={star.value}
            type="button"
            onClick={() => handleStarClick(star.value)}
            onMouseEnter={() => handleStarHover(star.value)}
            onMouseLeave={() => handleStarHover(null)}
            disabled={readonly}
            className={cn(
              'relative focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 rounded-sm transition-transform',
              !readonly && 'hover:scale-110 cursor-pointer',
              readonly && 'cursor-default'
            )}
            aria-label={`${star.value} étoile${star.value > 1 ? 's' : ''}`}
          >
            <Star
              size={config.star}
              className={cn(
                'transition-colors duration-150',
                star.fillState === 'full' && 'text-amber-400 fill-amber-400',
                star.fillState === 'half' && 'text-amber-400',
                star.fillState === 'empty' && 'text-gray-300'
              )}
              strokeWidth={1.5}
            />
            {/* Half star overlay */}
            {star.fillState === 'half' && (
              <div 
                className="absolute inset-0 overflow-hidden w-1/2"
                aria-hidden="true"
              >
                <Star
                  size={config.star}
                  className="text-amber-400 fill-amber-400"
                  strokeWidth={1.5}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Rating value and count */}
      {(showValue || totalReviews !== undefined) && (
        <span className="ml-2 text-sm text-gray-600">
          {showValue && (
            <span className="font-medium text-gray-900">
              {formatRating(rating)}<span className="text-gray-500"> sur 5</span>
            </span>
          )}
          {totalReviews !== undefined && showValue && (
            <span className="mx-1">•</span>
          )}
          {totalReviews !== undefined && (
            <span className="text-gray-500">
              {totalReviews === 0 
                ? 'Aucun avis' 
                : totalReviews === 1 
                  ? '1 avis'
                  : `${totalReviews.toLocaleString('fr-FR')} avis`
              }
            </span>
          )}
        </span>
      )}
    </div>
  );
}

// Compact display variant (just stars, no interaction)
export function StarRatingDisplay({ 
  rating = 0, 
  size = 'sm',
  className 
}: Omit<StarRatingProps, 'onRatingChange' | 'readonly'>) {
  return (
    <StarRating 
      rating={rating} 
      size={size} 
      readonly 
      className={className} 
    />
  );
}

// Large display for product/company headers
export function StarRatingLarge({ 
  rating = 0, 
  totalReviews,
  className 
}: Omit<StarRatingProps, 'onRatingChange' | 'readonly' | 'size'>) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-4xl font-bold text-gray-900">
          {rating.toFixed(1).replace('.', ',')}
        </span>
        <StarRating rating={rating} size="xl" readonly />
      </div>
      {totalReviews !== undefined && (
        <p className="text-sm text-gray-500">
          Basé sur {totalReviews} avis
        </p>
      )}
    </div>
  );
}

export default StarRating;
