'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Star, 
  MessageSquareReply, 
  Edit, 
  Trash2, 
  ExternalLink,
  Package,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import StarRating from '@/components/reviews/StarRating';
import { toast } from 'sonner';

// Types
interface UserReview {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  status: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
  };
  company?: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * My Reviews Page (User Dashboard)
 * 
 * User's review history with:
 * - All reviews list
 * - Edit pending reviews
 * - Track which reviews got responses
 * - Filter by type/status
 */
export default function MyReviewsPage() {
  const params = useParams();
  const role = params.role as string;

  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  // Dialog states
  const [selectedReview, setSelectedReview] = useState<UserReview | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch user's reviews
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, you'd have a dedicated endpoint like /api/user/reviews
      // For now, we'll simulate by fetching all and filtering client-side
      const response = await fetch('/api/admin/reviews?XTransformPort=3000');
      const data = await response.json();
      
      if (response.ok) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Erreur lors du chargement des avis');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle delete review
  const handleDelete = async () => {
    if (!selectedReview) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reviews/${selectedReview.id}?XTransformPort=3000`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      toast.success('Avis supprimé avec succès');
      setReviews(prev => prev.filter(r => r.id !== selectedReview.id));
      setIsDeleteOpen(false);
      setSelectedReview(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Status badge config
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700">Publié</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">En attente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Rejeté</Badge>;
      case 'hidden':
        return <Badge variant="secondary">Masqué</Badge>;
      case 'flagged':
        return <Badge className="bg-orange-100 text-orange-700">Signalé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Can edit check (within 24h)
  const canEdit = (review: UserReview): boolean => {
    const createdAt = new Date(review.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24 && review.status === 'published';
  };

  // Filtered reviews
  const filteredReviews = reviews.filter(review => {
    if (filterStatus !== 'all' && review.status !== filterStatus) return false;
    if (filterType === 'product' && !review.product) return false;
    if (filterType === 'company' && !review.company) return false;
    return true;
  });

  // Stats
  const stats = {
    total: reviews.length,
    published: reviews.filter(r => r.status === 'published').length,
    withResponse: reviews.filter(r => r.response).length,
    avgRating: reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes Avis</h1>
        <p className="text-gray-500 mt-1">
          Gérez et suivez tous vos avis publiés
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquareReply size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500">Total avis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-xs text-gray-500">Publiés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                <p className="text-xs text-gray-500">Note moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Eye size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.withResponse}</p>
                <p className="text-xs text-gray-500">Avec réponse</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600">Filtrer:</span>
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="published">Publiés</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="rejected">Rejetés</SelectItem>
            <SelectItem value="flagged">Signalés</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="product">Produits</SelectItem>
            <SelectItem value="company">Entreprises</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Review Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4">
                      {/* Type Icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                        review.product ? 'bg-blue-50' : 'bg-indigo-50'
                      }`}>
                        {review.product ? (
                          <Package size={24} className="text-blue-600" />
                        ) : (
                          <Building2 size={24} className="text-indigo-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Target Name */}
                        <Link
                          href={
                            review.product
                              ? `/products/${review.product.slug}`
                              : `/companies/${review.company?.slug}`
                          }
                          className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {review.product?.name || review.company?.name}
                          <ExternalLink size={14} className="inline ml-1" />
                        </Link>

                        {/* Rating & Date */}
                        <div className="flex items-center gap-3 mt-1">
                          <StarRating rating={review.rating} size="sm" readonly />
                          <span className="text-sm text-gray-400">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>

                        {/* Title & Comment Preview */}
                        {review.title && (
                          <h4 className="font-medium mt-2">{review.title}</h4>
                        )}
                        
                        {review.comment && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {review.comment}
                          </p>
                        )}

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          {getStatusBadge(review.status)}
                          
                          {review.isVerifiedPurchase && (
                            <Badge variant="secondary" className="bg-green-50 text-green-600 border-green-200">
                              <CheckCircle2 size={12} className="mr-1" />
                              Achat vérifié
                            </Badge>
                          )}

                          {review.response && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200">
                              <MessageSquareReply size={12} className="mr-1" />
                              Répondu
                            </Badge>
                          )}

                          {canEdit(review) && (
                            <Badge variant="outline" className="border-amber-300 text-amber-600">
                              <Clock size={12} className="mr-1" />
                              Éditable
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReview(review);
                        setIsDetailOpen(true);
                      }}
                    >
                      <Eye size={16} className="mr-1" />
                      Voir
                    </Button>

                    {canEdit(review) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/products/${review.product?.slug}/reviews`}>
                          <Edit size={16} className="mr-1" />
                          Modifier
                        </Link>
                      </Button>
                    )}

                    <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setSelectedReview(review)}
                        >
                          <Trash2 size={16} className="mr-1" />
                          Supprimer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Votre avis sera définitivement supprimé.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isDeleting ? 'Suppression...' : 'Supprimer'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty state */
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquareReply size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {reviews.length === 0 ? 'Aucun avis pour le moment' : 'Aucun avis ne correspond aux filtres'}
            </h3>
            <p className="text-gray-500 mb-4">
              {reviews.length === 0
                ? 'Commencez à donner votre avis sur les produits et entreprises.'
                : 'Essayez de modifier vos filtres.'}
            </p>
            {reviews.length === 0 && (
              <Button asChild>
                <Link href="/products">Parcourir les produits</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l&apos;avis</DialogTitle>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4 mt-4">
              {/* Target Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {selectedReview.product ? (
                  <Package size={20} className="text-blue-600" />
                ) : (
                  <Building2 size={20} className="text-indigo-600" />
                )}
                <div>
                  <p className="font-medium">
                    {selectedReview.product?.name || selectedReview.company?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedReview.product ? 'Produit' : 'Entreprise'}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <StarRating rating={selectedReview.rating} size="lg" readonly />
                <span className="text-sm text-gray-500">
                  {formatDate(selectedReview.createdAt)}
                </span>
              </div>

              {/* Title */}
              {selectedReview.title && (
                <h3 className="text-xl font-semibold">{selectedReview.title}</h3>
              )}

              {/* Comment */}
              {selectedReview.comment && (
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedReview.comment}
                </p>
              )}

              {/* Response */}
              {selectedReview.response && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    Réponse du fournisseur
                  </p>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">
                    {selectedReview.response}
                  </p>
                  {selectedReview.respondedAt && (
                    <p className="text-xs text-blue-600 mt-2">
                      Réponse le {formatDate(selectedReview.respondedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 pt-4 border-t text-sm text-gray-500">
                <span>{selectedReview.helpfulCount} personnes ont trouvé cela utile</span>
                <span>{selectedReview.notHelpfulCount} n&apos;ont pas trouvé cela utile</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
