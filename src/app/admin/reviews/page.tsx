'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Eye,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Star,
  Package,
  Building2,
  Clock,
  Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Types
interface AdminReview {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  status: string;
  isVerifiedPurchase: boolean;
  isAnonymous: boolean;
  helpfulCount: int;
  notHelpfulCount: int;
  response?: string;
  reportedAt?: string;
  reportReason?: string;
  createdAt: string;
  reviewerName: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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

interface AdminStats {
  byStatus: Record<string, number>;
  totalFlagged: number;
}

/**
 * Admin Reviews Moderation Page
 * 
 * Admin interface for managing reviews:
 * - Review queue with filters
 * - Bulk approve/reject actions
 * - Reported reviews priority
 * - Response management
 */
export default function AdminReviewsPage() {
  // State
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [stats, setStats] = useState<AdminStats>({ byStatus: {}, totalFlagged: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Dialogs
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'hide' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/reviews?${params}&XTransformPort=3000`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setReviews(data.reviews || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Erreur lors du chargement des avis');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle bulk action
  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/reviews?XTransformPort=3000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewIds: selectedIds,
          action: bulkAction,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast.success(data.message);
      setSelectedIds([]);
      setIsBulkActionOpen(false);
      fetchReviews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle single review action
  const handleReviewAction = async (reviewId: string, action: string) => {
    try {
      const response = await fetch('/api/admin/reviews?XTransformPort=3000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewIds: [reviewId], action }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast.success(data.message);
      fetchReviews();
      setIsDetailOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedReview) return;

    try {
      const response = await fetch(
        `/api/admin/reviews?reviewId=${selectedReview.id}&XTransformPort=3000`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast.success(data.message);
      setIsDeleteOpen(false);
      setSelectedReview(null);
      fetchReviews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    }
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  // Toggle all selection
  const toggleSelectAll = () => {
    if (selectedIds.length === reviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reviews.map(r => r.id));
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status badge config
  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      published: { label: 'Publié', className: 'bg-green-100 text-green-700' },
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700' },
      rejected: { label: 'Rejeté', className: 'bg-red-100 text-red-700' },
      hidden: { label: 'Masqué', className: 'bg-gray-100 text-gray-700' },
      flagged: { label: 'Signalé', className: 'bg-orange-100 text-orange-700' },
    };

    const config = configs[status] || { label: status, className: '' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield size={28} className="text-blue-600" />
            Modération des Avis
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez et modérez les avis des utilisateurs
          </p>
        </div>

        {selectedIds.length > 0 && (
          <DropdownMenu open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Actions ({selectedIds.length})
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setBulkAction('approve'); }}>
                <CheckCircle2 size={16} className="mr-2 text-green-600" />
                Approuver
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setBulkAction('reject'); }}>
                <XCircle size={16} className="mr-2 text-red-600" />
                Rejeter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setBulkAction('hide'); }}>
                <Eye size={16} className="mr-2 text-gray-600" />
                Masquer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 size={16} className="mr-2 text-red-600" />
                    Supprimer
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer les avis sélectionnés ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. {selectedIds.length} avis seront définitivement supprimés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleBulkAction()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold">{stats.byStatus['published'] || 0}</p>
            <p className="text-xs text-gray-500">Publiés</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold">{stats.byStatus['pending'] || 0}</p>
            <p className="text-xs text-gray-500">En attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-orange-600">{stats.totalFlagged}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Flag size={12} /> Signalés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-red-600">{stats.byStatus['rejected'] || 0}</p>
            <p className="text-xs text-gray-500">Rejetés</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold">{stats.byStatus['hidden'] || 0}</p>
            <p className="text-xs text-gray-500">Masqués</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher un avis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="published">Publiés</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
                <SelectItem value="hidden">Masqués</SelectItem>
                <SelectItem value="flagged">Signalés</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="product">Produits</SelectItem>
                <SelectItem value="company">Entreprises</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === reviews.length && reviews.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Avis</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Cible</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow 
                    key={review.id}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      review.reportedAt ? 'bg-orange-50/50' : ''
                    } ${selectedIds.includes(review.id) ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      setSelectedReview(review);
                      setIsDetailOpen(true);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(review.id)}
                        onCheckedChange={() => toggleSelection(review.id)}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="max-w-xs">
                        {review.title && (
                          <p className="font-medium truncate">{review.title}</p>
                        )}
                        {review.comment && (
                          <p className="text-sm text-gray-500 truncate">
                            {review.comment}
                          </p>
                        )}
                        
                        {review.reportedAt && (
                          <Badge variant="secondary" className="mt-1 bg-orange-100 text-orange-700 border-orange-200 text-xs">
                            <Flag size={10} className="mr-1" />
                            Signalé
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{review.reviewerName}</p>
                        <p className="text-xs text-gray-500">{review.reviewer.email}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {review.product ? (
                          <Package size={14} className="text-blue-500" />
                        ) : (
                          <Building2 size={14} className="text-indigo-500" />
                        )}
                        <span className="text-sm max-w-[120px] truncate block">
                          {review.product?.name || review.company?.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span className="font-medium">{review.rating}</span>
                      </div>
                    </TableCell>

                    <TableCell>{getStatusBadge(review.status)}</TableCell>

                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedReview(review);
                            setIsDetailOpen(true);
                          }}>
                            <Eye size={16} className="mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          
                          {review.status === 'flagged' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleReviewAction(review.id, 'approve')}>
                                <CheckCircle2 size={16} className="mr-2 text-green-600" />
                                Approuver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReviewAction(review.id, 'reject')}>
                                <XCircle size={16} className="mr-2 text-red-600" />
                                Rejeter
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator />

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 size={16} className="mr-2 text-red-600" />
                                Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => {
                                    setSelectedReview(review);
                                    handleDelete();
                                  }}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            /* Empty state */
            <div className="py-12 text-center">
              <Shield size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun avis trouvé
              </h3>
              <p className="text-gray-500">
                Essayez de modifier vos filtres ou paramètres de recherche.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!isLoading && reviews.length > 0 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            <ChevronLeft size={16} className="mr-1" />
            Précédent
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Suivant
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l&apos;avis</DialogTitle>
            <DialogDescription>
              Avis du {formatDate(selectedReview?.createdAt || '')}
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-6 mt-4">
              {/* Status & Rating */}
              <div className="flex flex-wrap items-center gap-4">
                {getStatusBadge(selectedReview.status)}
                
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={
                        i < selectedReview.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                </div>

                {selectedReview.isVerifiedPurchase && (
                  <Badge variant="secondary" className="bg-green-50 text-green-600 border-green-200">
                    <CheckCircle2 size={12} className="mr-1" />
                    Achat vérifié
                  </Badge>
                )}

                {selectedReview.isAnonymous && (
                  <Badge variant="outline">Anonyme</Badge>
                )}
              </div>

              {/* Reviewer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Auteur</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium">
                    {selectedReview.reviewer.firstName[0]}{selectedReview.reviewer.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium">{selectedReview.reviewerName}</p>
                    <p className="text-sm text-gray-500">{selectedReview.reviewer.email}</p>
                  </div>
                </div>
              </div>

              {/* Target Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Cible de l&apos;avis</h4>
                <Link
                  href={
                    selectedReview.product
                      ? `/products/${selectedReview.product.slug}`
                      : `/companies/${selectedReview.company?.slug}`
                  }
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  {selectedReview.product ? (
                    <Package size={18} />
                  ) : (
                    <Building2 size={18} />
                  )}
                  {selectedReview.product?.name || selectedReview.company?.name}
                </Link>
              </div>

              {/* Content */}
              <div>
                {selectedReview.title && (
                  <h3 className="text-xl font-semibold mb-2">{selectedReview.title}</h3>
                )}
                {selectedReview.comment && (
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedReview.comment}
                  </p>
                )}
              </div>

              {/* Report Info */}
              {selectedReview.reportReason && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                    <Flag size={16} />
                    Raison du signalement
                  </h4>
                  <pre className="text-sm text-orange-700 whitespace-pre-wrap">
                    {JSON.stringify(JSON.parse(selectedReview.reportReason), null, 2)}
                  </pre>
                </div>
              )}

              {/* Response */}
              {selectedReview.response && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Réponse du fournisseur</h4>
                  <p className="text-sm text-blue-700 whitespace-pre-wrap">
                    {selectedReview.response}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 pt-4 border-t text-sm text-gray-500">
                <span>{selectedReview.helpfulCount} votes utiles</span>
                <span>{selectedReview.notHelpfulCount} votes non utiles</span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedReview.status === 'flagged' && (
                  <>
                    <Button
                      onClick={() => handleReviewAction(selectedReview.id, 'approve')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 size={16} className="mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReviewAction(selectedReview.id, 'reject')}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle size={16} className="mr-2" />
                      Rejeter
                    </Button>
                  </>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => handleReviewAction(selectedReview.id, 'hide')}
                >
                  <Eye size={16} className="mr-2" />
                  Masquer
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 ml-auto"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. L&apos;avis sera définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation */}
      <AlertDialog open={!!bulkAction} onOpenChange={(open) => !open && setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'approve' && 'Approuver les avis sélectionnés ?'}
              {bulkAction === 'reject' && 'Rejeter les avis sélectionnés ?'}
              {bulkAction === 'hide' && 'Masquer les avis sélectionnés ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedIds.length} avis seront affectés par cette action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              disabled={isProcessing}
              className={
                bulkAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : bulkAction === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : ''
              }
            >
              {isProcessing ? 'Traitement...' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
