'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewList, ReviewForm } from '@/components/reviews';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Product Reviews Page
 * 
 * Dedicated page for viewing all product reviews with full filters
 * and expanded review form.
 */
export default function ProductReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<{
    id: string;
    name: string;
    slug: string;
    images: Array<{ url: string; alt?: string }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Fetch product info
  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${slug}?XTransformPort=3000`);
        const data = await response.json();
        
        if (data.success) {
          setProduct({
            id: data.data.id,
            name: data.data.name,
            slug: data.data.slug,
            images: data.data.images || [],
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft size={16} />
              Retour au produit
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : product ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <MessageSquare size={28} className="text-blue-600" />
                Avis sur : {product.name}
              </h1>
              <p className="text-gray-500">
                Lisez et partagez vos expériences avec ce produit
              </p>
            </>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Review Form Modal */}
        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rédiger un avis</DialogTitle>
            </DialogHeader>
            {product && (
              <ReviewForm
                targetId={product.id}
                reviewType="product"
                slug={slug}
                onSuccess={() => {
                  setIsReviewModalOpen(false);
                  setReviewSubmitted(true);
                  // Refresh the page to show new review
                  window.location.reload();
                }}
                onCancel={() => setIsReviewModalOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Full Review List */}
        <ReviewList
          apiUrl={`/api/products/${slug}/reviews?XTransformPort=3000`}
          showStats={true}
          allowWriteReview={!reviewSubmitted}
          onWriteReview={() => setIsReviewModalOpen(true)}
        />

        {/* Community Guidelines */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <Star size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Charte des avis
                </h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Soyez honnête et objectif dans votre évaluation</li>
                  <li>Partagez votre expérience réelle avec le produit</li>
                  <li>Évitez le langage offensant ou inapproprié</li>
                  <li>Ne pas inclure d&apos;informations personnelles</li>
                  <li>Les photos doivent être pertinentes et claires</li>
                </ul>
                <Link
                  href="/charte-communautaire"
                  className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Lire la charte complète →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
