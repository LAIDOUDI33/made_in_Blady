'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquareReply, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewCard } from './ReviewCard';
import StarRating from './StarRating';

// Types
interface CompanyReviewStats {
  company: {
    id: string;
    name: string;
    overallRating: number;
    totalReviews: number;
  };
  reviews: any[];
  stats: {
    distribution: { rating: number; count: number }[];
    categories: {
      key: string;
      label: string;
      labelAr: string;
      average: number;
      count: number;
    }[];
    responseRate: number;
    avgResponseDays: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Category labels
const CATEGORY_CONFIG = [
  { key: 'quality', label: 'Qualité des produits', icon: '🏭' },
  { key: 'communication', label: 'Communication', icon: '💬' },
  { key: 'delivery', label: 'Délai de livraison', icon: '🚚' },
  { key: 'value', label: 'Rapport qualité-prix', icon: '💰' },
  { key: 'afterSales', label: 'Service après-vente', icon: '🔧' },
];

interface CompanyReviewsProps {
  /** Company slug for API calls */
  slug: string;
  /** Whether user is supplier (can respond) */
  isSupplier?: boolean;
  /** Current user ID */
  currentUserId?: string;
  /** Callback to open review form */
  onWriteReview?: () => void;
}

/**
 * CompanyReviews Component
 * 
 * Displays company-specific review features:
 * - Category-specific ratings (radar/bars)
 * - Recent reviews list
 * - Supplier's average response time
 * - Response rate percentage
 */
export function CompanyReviews({
  slug,
  isSupplier = false,
  currentUserId,
  onWriteReview,
}: CompanyReviewsProps) {
  const [data, setData] = useState<CompanyReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch company reviews data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/companies/${slug}/reviews?XTransformPort=3000`);
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);
      
      setData(result);
    } catch (error) {
      console.error('Error fetching company reviews:', error);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const { company, reviews, stats } = data;

  return (
    <div className="space-y-8">
      {/* Company Overview Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Overall Rating */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Note globale</p>
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {company.overallRating.toFixed(1).replace('.', ',')}
            </div>
            <StarRating rating={company.overallRating} size="lg" readonly />
            <p className="text-sm text-gray-500 mt-2">
              {company.totalReviews} avis
            </p>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-32 bg-gray-200" />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 flex-1 w-full md:w-auto">
            {/* Response Rate */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">Taux de réponse</span>
              </div>
              <p className="text-2xl font-bold">{stats.responseRate}%</p>
              <Progress value={stats.responseRate} className="mt-2 h-2" />
            </div>

            {/* Avg Response Time */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Clock size={18} />
                <span className="text-sm font-medium">Temps de réponse moyen</span>
              </div>
              <p className="text-2xl font-bold">
                {stats.avgResponseDays < 1 
                  ? '< 24h'
                  : `${Math.round(stats.avgResponseDays)} jour${stats.avgResponseDays > 1 ? 's' : ''}`
                }
              </p>
              <p className="text-xs text-gray-500 mt-2">En moyenne</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Ratings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} />
            Notes par catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {CATEGORY_CONFIG.map(category => {
              const catStat = stats.categories.find(c => c.key === category.key);
              const average = catStat?.average || 0;
              const percentage = (average / 5) * 100;

              return (
                <div key={category.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span className="font-medium text-gray-700">{category.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{average.toFixed(1)}</span>
                      <StarRating rating={average} size="sm" readonly />
                    </div>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        average >= 4
                          ? 'bg-green-500'
                          : average >= 3
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {catStat && (
                    <p className="text-xs text-gray-400 text-right">
                      Basé sur {catStat.count} évaluation{catStat.count > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Avis des clients ({reviews.length})
        </h2>
        {onWriteReview && (
          <Button onClick={onWriteReview}>
            Donner un avis
          </Button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review: any) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
            />
          ))
        ) : (
          /* Empty state */
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquareReply size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun avis pour le moment
              </h3>
              <p className="text-gray-500 mb-4">
                Cette entreprise n'a pas encore reçu d'avis.
              </p>
              {onWriteReview && (
                <Button onClick={onWriteReview}>
                  Soyez le premier à donner un avis
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Supplier Response Info */}
      {isSupplier && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <MessageSquareReply size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Répondez aux avis de vos clients
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Répondre aux avis montre votre engagement envers la satisfaction client 
                  et peut améliorer votre note globale.
                </p>
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  Gérer les réponses aux avis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CompanyReviews;
