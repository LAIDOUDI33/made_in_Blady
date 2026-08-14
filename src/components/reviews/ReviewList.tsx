'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Filter, SortAsc, SortDesc, Image, CheckCircle2, MessageSquareReply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewCard } from './ReviewCard';
import { ReviewStats } from './ReviewStats';
import cn from 'classnames';

// Types
interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  pros?: string[];
  cons?: string[];
  images?: string[];
  isVerifiedPurchase: boolean;
  isAnonymous: boolean;
  isFeatured: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  response?: string;
  respondedAt?: string;
  reviewerName: string;
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
  categoryRatings?: Record<string, number>;
}

interface ReviewStatsData {
  averageRating: number;
  totalReviews: number;
  distribution: { rating: number; count: number }[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ReviewListProps {
  /** API endpoint for fetching reviews */
  apiUrl: string;
  /** Show stats sidebar */
  showStats?: boolean;
  /** Initial stats data (if available) */
  initialStats?: ReviewStatsData;
  /** Current user ID for voting */
  currentUserId?: string;
  /** Allow writing reviews */
  allowWriteReview?: boolean;
  /** Callback to open review form */
  onWriteReview?: () => void;
  /** Custom class name */
  className?: string;
}

// Sort options
const SORT_OPTIONS = [
  { value: 'newest', label: 'Plus récent' },
  { value: 'oldest', label: 'Plus ancien' },
  { value: 'highest', label: 'Note la plus haute' },
  { value: 'lowest', label: 'Note la plus basse' },
  { value: 'helpful', label: 'Plus utile' },
] as const;

// Filter options
interface FilterState {
  hasPhotos: boolean;
  verifiedOnly: boolean;
  withResponse: boolean;
}

const INITIAL_FILTERS: FilterState = {
  hasPhotos: false,
  verifiedOnly: false,
  withResponse: false,
};

/**
 * ReviewList Component
 * 
 * Displays a list of reviews with:
 * - Sorting options
 * - Filtering capabilities
 * - Pagination
 * - Stats summary (optional)
 * - Empty state
 * - Loading skeletons
 */
export function ReviewList({
  apiUrl,
  showStats = true,
  initialStats,
  currentUserId,
  allowWriteReview = true,
  onWriteReview,
  className,
}: ReviewListProps) {
  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStatsData | undefined>(initialStats);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort,
      });

      // Add filters
      if (filters.hasPhotos) params.append('hasPhotos', 'true');
      if (filters.verifiedOnly) params.append('verifiedOnly', 'true');
      if (filters.withResponse) params.append('withResponse', 'true');

      const response = await fetch(`${apiUrl}?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des avis');
      }

      setReviews(data.reviews);
      setPagination(data.pagination);
      
      if (!stats && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, pagination.page, pagination.limit, sort, filters, stats]);

  // Initial fetch and when dependencies change
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle vote change
  const handleVoteChange = useCallback((reviewId: string, type: string, voted: boolean) => {
    setReviews(prev =>
      prev.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            helpfulCount: type === 'helpful'
              ? review.helpfulCount + (voted ? 1 : -1)
              : review.helpfulCount,
            notHelpfulCount: type === 'not_helpful'
              ? review.notHelpfulCount + (voted ? 1 : -1)
              : review.notHelpfulCount,
          };
        }
        return review;
      })
    );
  }, []);

  // Handle filter toggle
  const handleFilterToggle = (key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSort(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Active filters count
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-4 gap-8', className)}>
      {/* Stats Sidebar */}
      {showStats && (
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            {stats ? (
              <ReviewStats
                stats={stats}
                onWriteReview={allowWriteReview ? onWriteReview : undefined}
              />
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="lg:col-span-3 space-y-6">
        {/* Header with controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Write review button */}
          {allowWriteReview && onWriteReview && (
            <Button onClick={onWriteReview} className="bg-blue-600 hover:bg-blue-700">
              Rédiger un avis
            </Button>
          )}

          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <SortAsc size={16} className="text-gray-400" />
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filters button/dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'gap-2',
                  activeFiltersCount > 0 && 'border-blue-500 text-blue-600'
                )}
              >
                <Filter size={14} />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              {/* Filter options (shown inline for simplicity) */}
              <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg p-3 z-10 min-w-[200px] hidden group-hover:block">
                <p className="text-sm font-medium mb-2">Filtrer par :</p>
                
                <label className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                  <Checkbox
                    checked={filters.hasPhotos}
                    onCheckedChange={() => handleFilterToggle('hasPhotos')}
                  />
                  <span className="text-sm flex items-center gap-1">
                    <Image size={14} /> Avec photos
                  </span>
                </label>

                <label className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                  <Checkbox
                    checked={filters.verifiedOnly}
                    onCheckedChange={() => handleFilterToggle('verifiedOnly')}
                  />
                  <span className="text-sm flex items-center gap-1">
                    <CheckCircle2 size={14} /> Achat vérifié
                  </span>
                </label>

                <label className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                  <Checkbox
                    checked={filters.withResponse}
                    onCheckedChange={() => handleFilterToggle('withResponse')}
                  />
                  <span className="text-sm flex items-center gap-1">
                    <MessageSquareReply size={14} /> Avec réponse
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Inline filters (always visible) */}
        <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filters.hasPhotos}
              onCheckedChange={() => handleFilterToggle('hasPhotos')}
            />
            <span className="text-sm flex items-center gap-1">
              <Image size={14} className="text-gray-500" /> Avec photos
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filters.verifiedOnly}
              onCheckedChange={() => handleFilterToggle('verifiedOnly')}
            />
            <span className="text-sm flex items-center gap-1">
              <CheckCircle2 size={14} className="text-gray-500" /> Achat vérifié
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filters.withResponse}
              onCheckedChange={() => handleFilterToggle('withResponse')}
            />
            <span className="text-sm flex items-center gap-1">
              <MessageSquareReply size={14} className="text-gray-500" /> Avec réponse
            </span>
          </label>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <Button variant="link" onClick={fetchReviews} className="ml-2 p-0 h-auto">
              Réessayer
            </Button>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 border rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <>
            {/* Reviews count */}
            <p className="text-sm text-gray-500">
              {pagination.total} avis{pagination.total > 1 ? 's' : ''}
              {activeFiltersCount > 0 && ` (filtres appliqués)`}
            </p>

            {/* Reviews list */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  currentUserId={currentUserId}
                  onVoteChange={handleVoteChange}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-6">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Précédent
                </Button>

                <span className="text-sm text-gray-600">
                  Page {pagination.page} sur {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <EmptyState
            hasFilters={activeFiltersCount > 0}
            onClearFilters={() => setFilters(INITIAL_FILTERS)}
            onWriteReview={allowWriteReview ? onWriteReview : undefined}
          />
        )}
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({
  hasFilters,
  onClearFilters,
  onWriteReview,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onWriteReview?: () => void;
}) {
  return (
    <div className="text-center py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {hasFilters ? 'Aucun avis ne correspond à vos filtres' : 'Aucun avis pour le moment'}
        </h3>
        
        <p className="text-gray-500 mb-6">
          {hasFilters
            ? 'Essayez de modifier vos filtres pour voir plus de résultats.'
            : 'Soyez le premier à donner votre avis ! Votre expérience aide les autres acheteurs.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {hasFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              Effacer les filtres
            </Button>
          )}
          
          {!hasFilters && onWriteReview && (
            <Button onClick={onWriteReview}>
              Rédiger un avis
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewList;
