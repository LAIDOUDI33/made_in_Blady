'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { SupplierRecommendationData, RecommendationResult } from '@/lib/ai/recommendations/types';

interface RecommendedSuppliersProps {
  userId?: string;
  limit?: number;
  title?: string;
  className?: string;
}

export default function RecommendedSuppliers({
  userId,
  limit = 6,
  title = 'Fournisseurs recommandés',
  className = '',
}: RecommendedSuppliersProps) {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);
        params.set('limit', String(limit));

        const response = await fetch(`/api/ai/recommendations/suppliers?${params}`);
        const data = await response.json();

        if (data.success) {
          setRecommendations(data.data.recommendations);
        }
      } catch (error) {
        console.error('Error fetching supplier recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [userId, limit]);

  if (loading) {
    return (
      <section className={`py-6 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="h-[180px] bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className={`py-6 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-[#006233]" />
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <Badge variant="secondary" className="bg-green-50 text-[#006233] border-green-200">
            IA
          </Badge>
        </div>

        {/* Supplier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => {
            const supplier = rec.item as SupplierRecommendationData | undefined;
            if (!supplier) return null;

            return (
              <Link key={rec.id} href={`/companies/${supplier.slug}`}>
                <Card className="hover:shadow-lg transition-all duration-300 border-gray-200 h-full overflow-hidden group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Logo */}
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {supplier.logo ? (
                          <img src={supplier.logo} alt={supplier.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="h-7 w-7 text-green-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Match percentage badge */}
                        {supplier.matchPercentage && (
                          <Badge className="mb-1 bg-green-100 text-[#006233] hover:bg-green-100 text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Compatible à {supplier.matchPercentage}%
                          </Badge>
                        )}

                        {/* Company name */}
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-[#006233] transition-colors">
                          {supplier.name}
                        </h3>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          <span>{supplier.wilaya}</span>
                          {supplier.isVerified && (
                            <CheckCircle2 className="h-3 w-3 text-green-500 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium">{supplier.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({supplier.reviewCount})</span>
                      </div>

                      {/* Response rate */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Réponse {Math.round(supplier.responseRate)}%</span>
                      </div>
                    </div>

                    {/* Reason label */}
                    <p className="text-xs text-[#006233] mt-2 line-clamp-1">
                      {rec.reason}
                    </p>

                    {/* Quick contact CTA */}
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full mt-3 text-[#006233] border-[#006233]/30 hover:bg-[#006233] hover:text-white"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MessageSquare className="h-4 w-4 mr-1.5" />
                      Contacter
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
