'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  CheckCircle2,
  Shield,
  MessageSquareReply,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
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
import { toast } from 'sonner';
import StarRating from './StarRating';
import cn from 'classnames';

// Types
interface ReviewCardProps {
  review: {
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
  };
  /** Current user ID (for vote state) */
  currentUserId?: string;
  /** Show full comment or truncate */
  showFullComment?: boolean;
  /** Allow voting */
  allowVoting?: boolean;
  /** Allow reporting */
  allowReporting?: boolean;
  /** Callback when vote changes */
  onVoteChange?: (reviewId: string, type: string, voted: boolean) => void;
  /** Custom class name */
  className?: string;
}

// Format date to French relative format
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  
  // For older dates, use French date format
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Category labels for company reviews
const CATEGORY_LABELS: Record<string, { fr: string; ar: string }> = {
  quality: { fr: 'Qualité des produits', ar: 'الجودة' },
  communication: { fr: 'Communication', ar: 'التواصل' },
  delivery: { fr: 'Délai de livraison', ar: 'وقت التسليم' },
  value: { fr: 'Rapport qualité-prix', ar: 'القيمة مقابل المال' },
  afterSales: { fr: 'Service après-vente', ar: 'خدمة ما بعد البيع' },
};

/**
 * ReviewCard Component
 * 
 * Complete review card displaying all review information including:
 * - User info with avatar
 * - Date and star rating
 * - Title and comment (with expand/collapse)
 * - Pros/Cons lists
 * - Images grid
 * - Verified purchase badge
 * - Supplier response
 * - Voting and reporting actions
 */
export function ReviewCard({
  review,
  currentUserId,
  showFullComment = false,
  allowVoting = true,
  allowReporting = true,
  onVoteChange,
  className,
}: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(showFullComment);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState({
    helpful: review.helpfulCount,
    notHelpful: review.notHelpfulCount,
  });

  // Check if comment needs truncation
  const COMMENT_LIMIT = 300;
  const needsTruncation = (review.comment?.length || 0) > COMMENT_LIMIT;

  // Handle vote
  const handleVote = useCallback(async (type: 'helpful' | 'not_helpful') => {
    try {
      const response = await fetch(`/api/reviews/${review.id}/vote?XTransformPort=3000`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erreur lors du vote');
        return;
      }

      setUserVote(data.voted ? type : null);
      setVoteCounts(data.counts || voteCounts);
      
      if (onVoteChange) {
        onVoteChange(review.id, type, data.voted);
      }

      toast.success(data.message || (data.voted ? 'Vote enregistré !' : 'Vote retiré'));
    } catch (error) {
      toast.error('Erreur réseau. Veuillez réessayer.');
    }
  }, [review.id, onVoteChange, voteCounts]);

  // Handle report
  const handleReport = useCallback(async () => {
    try {
      const response = await fetch(`/api/reviews/${review.id}/report?XTransformPort=3000`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'other' }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erreur lors du signalement');
        return;
      }

      toast.success('Avis signalé. Merci pour votre signalement.');
    } catch (error) {
      toast.error('Erreur réseau. Veuillez réessayer.');
    }
  }, [review.id]);

  // Get initials for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={cn(
      'border border-gray-200 hover:border-gray-300 transition-colors duration-200',
      review.isFeatured && 'ring-2 ring-amber-400 ring-opacity-50',
      className
    )}>
      <CardContent className="p-4 md:p-6">
        {/* Header: User info & Rating */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {review.reviewer?.avatar && !review.isAnonymous ? (
                <AvatarImage src={review.reviewer.avatar} alt={review.reviewerName} />
              ) : null}
              <AvatarFallback className={cn(
                'text-sm font-medium',
                review.isAnonymous ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'
              )}>
                {review.isAnonymous ? (
                  <User size={18} />
                ) : (
                  getInitials(review.reviewerName)
                )}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 text-sm">
                  {review.reviewerName}
                </span>
                
                {/* Badges */}
                {review.isVerifiedPurchase && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0.5">
                    <CheckCircle2 size={12} className="mr-1" />
                    Achat vérifié
                  </Badge>
                )}
                
                {review.isFeatured && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-2 py-0.5">
                    <Star size={12} className="mr-1" />
                    Avis mis en avant
                  </Badge>
                )}

                {review.isAnonymous && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    <Shield size={12} className="mr-1" />
                    Anonyme
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDate(review.createdAt)}
              </p>
            </div>
          </div>

          {/* Rating */}
          <StarRating rating={review.rating} size="sm" readonly />
        </div>

        {/* Category ratings for company reviews */}
        {review.categoryRatings && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2">Notes par catégorie :</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(review.categoryRatings).map(([key, value]) => (
                <div key={key} className="text-center">
                  <p className="text-xs text-gray-500 mb-1">
                    {CATEGORY_LABELS[key]?.fr || key}
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-sm">{value}</span>
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        {review.title && (
          <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
        )}

        {/* Comment */}
        {review.comment && (
          <div className="mb-4">
            <p className={cn(
              'text-gray-700 leading-relaxed',
              !isExpanded && needsTruncation && 'line-clamp-3'
            )}>
              {review.comment}
            </p>
            
            {needsTruncation && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                {isExpanded ? (
                  <>
                    Lire moins <ChevronUp size={16} />
                  </>
                ) : (
                  <>
                    Lire la suite <ChevronDown size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Pros & Cons */}
        {(review.pros?.length || review.cons?.length) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {/* Pros */}
            {review.pros && review.pros.length > 0 && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1">
                  <ThumbsUp size={14} />
                  Points positifs
                </p>
                <ul className="space-y-1">
                  {review.pros.map((pro, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cons */}
            {review.cons && review.cons.length > 0 && (
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-1">
                  <ThumbsDown size={14} />
                  Points négatifs
                </p>
                <ul className="space-y-1">
                  {review.cons.map((con, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Images */}
        {review.images && review.images.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {review.images.slice(0, 5).map((image, index) => (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <button className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity cursor-pointer">
                      <Image
                        src={image}
                        alt={`Photo de l'avis ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 20vw"
                      />
                      {index === 4 && review.images.length > 5 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            +{review.images.length - 5}
                          </span>
                        </div>
                      )}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 overflow-hidden">
                    <Image
                      src={image}
                      alt={`Photo de l'avis ${index + 1}`}
                      width={1200}
                      height={800}
                      className="w-full h-auto"
                    />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>
        )}

        {/* Supplier Response */}
        {review.response && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquareReply size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Réponse du fournisseur
                </p>
                {review.respondedAt && (
                  <p className="text-xs text-blue-600 mb-2">
                    {formatDate(review.respondedAt)}
                  </p>
                )}
                <p className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">
                  {review.response}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          {/* Helpful / Not Helpful */}
          {allowVoting && (
            <div className="flex items-center gap-1">
              <Button
                variant={userVote === 'helpful' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleVote('helpful')}
                className={cn(
                  'gap-1.5 text-xs',
                  userVote === 'helpful' 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                )}
              >
                <ThumbsUp size={14} />
                Utile ({voteCounts.helpful})
              </Button>
              
              <Button
                variant={userVote === 'not_helpful' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleVote('not_helpful')}
                className={cn(
                  'gap-1.5 text-xs',
                  userVote === 'not_helpful' 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                )}
              >
                <ThumbsDown size={14} />
                Non utile ({voteCounts.notHelpful})
              </Button>

              {voteCounts.helpful > 0 && (
                <span className="text-xs text-gray-400 ml-2 hidden sm:inline">
                  {voteCounts.helpful} personne{voteCounts.helpful > 1 ? 's' : ''} ont trouvé cela utile
                </span>
              )}
            </div>
          )}

          {/* Report button */}
          {allowReporting && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  <Flag size={14} />
                  Signaler
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Signaler cet avis</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir signaler cet avis comme inapproprié ?
                    Notre équipe va l&apos;examiner et prendre les mesures nécessaires.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReport} className="bg-orange-600 hover:bg-orange-700">
                    Signaler
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ReviewCard;
