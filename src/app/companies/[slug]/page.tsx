'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  CheckCircle,
  Star,
  MessageSquare,
  ExternalLink,
  Calendar,
  Users,
  Factory
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CompanyReviews } from '@/components/reviews';
import { ReviewForm } from '@/components/reviews';

// Types
interface CompanyData {
  id: string;
  name: string;
  slug: string;
  legalForm: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  yearEstablished?: number;
  employeeCount?: number;
  wilaya: string;
  address?: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  isVerified: boolean;
  verificationStatus: string;
  rating: number;
  reviewCount: number;
  responseRate: number;
}

/**
 * Company Profile Page
 * 
 * Displays company information and reviews with:
 * - Company header with key info
 * - Overall rating prominent display
 * - Category breakdown for company reviews
 * - Reviews list with supplier response capability
 */
export default function CompanyProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Fetch company data
  useEffect(() => {
    async function fetchCompany() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/companies?XTransformPort=3000&slug=${slug}`);
        
        if (!response.ok) throw new Error('Company not found');
        
        // For now, we'll use a mock or find company from list
        // In production, you'd have a dedicated API endpoint
        const data = await response.json();
        const foundCompany = Array.isArray(data) ? data.find((c: any) => c.slug === slug) : null;
        
        if (foundCompany) {
          setCompany(foundCompany);
        }
      } catch (error) {
        console.error('Error fetching company:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchCompany();
    }
  }, [slug]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="h-48 bg-gray-200 animate-pulse" />
        <div className="container mx-auto px-4 -mt-16">
          <div className="space-y-6">
            <Skeleton className="w-32 h-32 rounded-full" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 h-full flex items-end pb-4 relative z-10">
          <Link href="/suppliers" className="text-white/80 hover:text-white flex items-center gap-2 text-sm mb-4">
            <ArrowLeft size={16} />
            Retour aux fournisseurs
          </Link>
        </div>
      </div>

      {/* Company Header */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Logo */}
            <div className="w-32 h-32 bg-white rounded-xl shadow-md flex items-center justify-center shrink-0 border">
              {company?.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <Building2 size={64} className="text-gray-300" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {company?.name || 'Entreprise'}
                </h1>
                
                {company?.isVerified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle size={14} className="mr-1" />
                    Vérifiée
                  </Badge>
                )}

                {company?.legalForm && (
                  <Badge variant="outline">{company.legalForm}</Badge>
                )}
              </div>

              {company?.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {company.description}
                </p>
              )}

              {/* Quick info */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {company?.wilaya && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {company.wilaya}
                  </span>
                )}
                
                {company?.yearEstablished && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    Depuis {company.yearEstablished}
                  </span>
                )}

                {company?.employeeCount && (
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {company.employeeCount}+ employés
                  </span>
                )}

                {company?.rating > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    {company.rating.toFixed(1)} ({company.reviewCount} avis)
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              <Button 
                onClick={() => setIsReviewModalOpen(true)}
                disabled={reviewSubmitted}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <MessageSquare size={16} className="mr-2" />
                {reviewSubmitted ? 'Avis envoyé' : 'Donner un avis'}
              </Button>
              
              {company?.website && (
                <Button variant="outline" asChild>
                  <a href={company.website} target="_blank" rel="noopener noreferrer">
                    <Globe size={16} className="mr-2" />
                    Site web
                  </a>
                </Button>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {company?.contactEmail && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium truncate">{company.contactEmail}</p>
                </div>
              </div>
            )}

            {company?.contactPhone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="text-sm font-medium">{company.contactPhone}</p>
                </div>
              </div>
            )}

            {company?.address && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Adresse</p>
                  <p className="text-sm font-medium truncate">{company.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company Reviews Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Review Form Modal */}
        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Évaluer cette entreprise</DialogTitle>
            </DialogHeader>
            {company && (
              <ReviewForm
                targetId={company.id}
                reviewType="company"
                slug={slug}
                showCategoryRatings={true}
                onSuccess={() => {
                  setIsReviewModalOpen(false);
                  setReviewSubmitted(true);
                  window.location.reload();
                }}
                onCancel={() => setIsReviewModalOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Company Reviews Component */}
        <CompanyReviews
          slug={slug}
          currentUserId={undefined} // Would come from auth session
          onWriteReview={() => setIsReviewModalOpen(true)}
        />
      </div>
    </div>
  );
}
