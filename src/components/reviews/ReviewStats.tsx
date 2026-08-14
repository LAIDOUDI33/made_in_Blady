'use client';

import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StarRating from './StarRating';

// Types
interface RatingDistribution {
  rating: number;
  count: number;
}

interface ReviewStatsData {
  averageRating: number;
  totalReviews: number;
  distribution: RatingDistribution[];
}

interface ReviewStatsProps {
  stats: ReviewStatsData;
  onWriteReview?: () => void;
  className?: string;
}

/**
 * ReviewStats Component
 * 
 * Displays review statistics including:
 * - Overall average rating (big number)
 * - Total reviews count
 * - Rating distribution bar chart
 * - "Write a review" CTA button
 */
export function ReviewStats({ stats, onWriteReview, className }: ReviewStatsProps) {
  const { averageRating, totalReviews, distribution } = stats;

  // Calculate percentage for each rating
  const getPercentage = (count: number): number => {
    return totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
  };

  // Format rating with French decimal comma
  const formatRating = (value: number): string => {
    return value.toFixed(1).replace('.', ',');
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="text-center">
          {/* Big average rating */}
          <div className="mb-2">
            <span className="text-5xl font-bold text-gray-900">
              {formatRating(averageRating)}
            </span>
          </div>

          {/* Stars */}
          <StarRating rating={averageRating} size="lg" readonly />

          {/* Total count */}
          <p className="text-sm text-gray-500 mt-2">
            {totalReviews === 0
              ? 'Aucun avis'
              : totalReviews === 1
                ? '1 avis'
                : `${totalReviews.toLocaleString('fr-FR')} avis`}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        {/* Distribution bars */}
        {totalReviews > 0 && (
          <div className="space-y-3 mt-4">
            {[5, 4, 3, 2, 1].map((rating) => {
              const distItem = distribution.find(d => d.rating === rating);
              const count = distItem?.count || 0;
              const percentage = getPercentage(count);

              return (
                <button
                  key={rating}
                  className="flex items-center gap-2 w-full group hover:bg-gray-50 rounded px-1 py-0.5 transition-colors cursor-pointer"
                  aria-label={`${rating} étoiles: ${count} avis (${percentage}%)`}
                >
                  {/* Star + label */}
                  <span className="flex items-center gap-1 w-16 text-sm text-gray-600 shrink-0 justify-end">
                    <span>{rating}</span>
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                  </span>

                  {/* Progress bar */}
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        rating >= 4
                          ? 'bg-green-500'
                          : rating >= 3
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                    
                    {/* Count tooltip on hover */}
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {count}
                    </span>
                  </div>

                  {/* Percentage */}
                  <span className="w-10 text-xs text-gray-500 text-right shrink-0">
                    {percentage}%
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* CTA Button */}
        {onWriteReview && (
          <Button
            onClick={onWriteReview}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <MessageSquare size={18} className="mr-2" />
            Rédiger un avis
          </Button>
        )}

        {/* Community guidelines link */}
        <p className="text-xs text-gray-400 text-center mt-4">
          En publiant un avis, vous acceptez notre{' '}
          <a href="/charte-communautaire" className="underline hover:text-gray-600">
            charte communautaire
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

// Compact variant for inline use
export function ReviewStatsCompact({ stats }: { stats: ReviewStatsData }) {
  const formatRating = (value: number): string => {
    return value.toFixed(1).replace('.', ',');
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xl font-semibold">{formatRating(stats.averageRating)}</span>
      <StarRating rating={stats.averageRating} size="sm" readonly />
      <span className="text-sm text-gray-500">({stats.totalReviews})</span>
    </div>
  );
}

export default ReviewStats;
