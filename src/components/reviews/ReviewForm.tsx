'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Star, Upload, X, Plus, AlertCircle, CheckCircle2, Eye, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
interface ReviewFormProps {
  /** Product or Company ID */
  targetId: string;
  /** Type of review: 'product' or 'company' */
  reviewType: 'product' | 'company';
  /** Slug for API calls (product slug or company slug) */
  slug: string;
  /** Whether user has verified purchase */
  isVerifiedPurchase?: boolean;
  /** Callback on successful submission */
  onSuccess?: () => void;
  /** Cancel callback */
  onCancel?: () => void;
  /** Show company category ratings */
  showCategoryRatings?: boolean;
}

// Category definitions for company reviews
const REVIEW_CATEGORIES = [
  { key: 'quality', label: 'Qualité des produits', labelAr: 'الجودة' },
  { key: 'communication', label: 'Communication', labelAr: 'التواصل' },
  { key: 'delivery', label: 'Délai de livraison', labelAr: 'وقت التسليم' },
  { key: 'value', label: 'Rapport qualité-prix', labelAr: 'القيمة مقابل المال' },
  { key: 'afterSales', label: 'Service après-vente', labelAr: 'خدمة ما بعد البيع' },
];

// Form state interface
interface FormData {
  rating: number;
  title: string;
  comment: string;
  pros: string[];
  cons: string[];
  images: File[];
  imagePreviews: string[];
  isAnonymous: boolean;
  categoryRatings: Record<string, number>;
}

const INITIAL_FORM_DATA: FormData = {
  rating: 0,
  title: '',
  comment: '',
  pros: [],
  cons: [],
  images: [],
  imagePreviews: [],
  isAnonymous: false,
  categoryRatings: {},
};

/**
 * ReviewForm Component
 * 
 * Multi-step form for submitting product/company reviews:
 * 1. Select rating (required)
 * 2. Write review (title + comment)
 * 3. Add pros/cons (optional)
 * 4. Upload photos (optional)
 * 5. Anonymity toggle
 * 6. Preview & submit
 */
export function ReviewForm({
  targetId,
  reviewType,
  slug,
  isVerifiedPurchase = false,
  onSuccess,
  onCancel,
  showCategoryRatings = false,
}: ReviewFormProps) {
  // Form state
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps definition
  const steps = [
    { title: 'Note', description: 'Donnez votre note globale' },
    ...(showCategoryRatings ? [{ title: 'Catégories', description: 'Évaluez chaque aspect' }] : []),
    { title: 'Avis', description: 'Rédigez votre avis' },
    { title: 'Détails', description: 'Points positifs et négatifs' },
    { title: 'Photos', description: 'Ajoutez des photos (optionnel)' },
    { title: 'Confirmation', description: 'Vérifiez et publiez' },
  ];

  // Update field helper
  const updateField = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Add pro/con item
  const addItem = useCallback((type: 'pros' | 'cons', value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], value.trim()],
    }));
  }, []);

  // Remove pro/con item
  const removeItem = useCallback((type: 'pros' | 'cons', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (formData.images.length + files.length > 5) {
      toast.error('Maximum 5 photos autorisées');
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image valide`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} dépasse la limite de 5MB`);
        return false;
      }
      return true;
    });

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles],
      imagePreviews: [...prev.imagePreviews, ...newPreviews],
    }));

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [formData.images.length]);

  // Remove image
  const removeImage = useCallback((index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      const newPreviews = prev.imagePreviews.filter((_, i) => i !== index);
      
      // Revoke object URL to prevent memory leak
      URL.revokeObjectURL(prev.imagePreviews[index]);
      
      return { ...prev, images: newImages, imagePreviews: newPreviews };
    });
  }, []);

  // Validate current step
  const validateStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0 && !showCategoryRatings) {
      // Rating step
      if (formData.rating === 0) {
        newErrors.rating = 'Veuillez sélectionner une note';
      }
    }

    if ((currentStep === 1 && !showCategoryRatings) || (currentStep === 2 && showCategoryRatings)) {
      // Comment step
      if (!formData.comment.trim()) {
        newErrors.comment = 'Le commentaire est requis';
      } else if (formData.comment.trim().length < 10) {
        newErrors.comment = 'Le commentaire doit contenir au moins 10 caractères';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, formData.rating, formData.comment, showCategoryRatings]);

  // Next step
  const nextStep = useCallback(() => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  }, [validateStep, steps.length]);

  // Previous step
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  // Submit review
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    
    try {
      // Upload images first if any
      let imageUrls: string[] = [];
      if (formData.images.length > 0) {
        const uploadPromises = formData.images.map(async (file) => {
          const uploadData = new FormData();
          uploadData.append('file', file);
          
          const response = await fetch('/api/upload?XTransformPort=3000', {
            method: 'POST',
            body: uploadData,
          });
          
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Upload failed');
          return data.url;
        });
        
        imageUrls = await Promise.all(uploadPromises);
      }

      // Prepare payload
      const payload: Record<string, any> = {
        rating: formData.rating,
        title: formData.title || undefined,
        comment: formData.comment,
        pros: formData.pros.length > 0 ? formData.pros : undefined,
        cons: formData.cons.length > 0 ? formData.cons : undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        isAnonymous: formData.isAnonymous,
      };

      // Add category ratings for company reviews
      if (showCategoryRatings && Object.keys(formData.categoryRatings).length > 0) {
        payload.categoryRatings = formData.categoryRatings;
      }

      // Submit to appropriate API
      const apiUrl = reviewType === 'product'
        ? `/api/products/${slug}/reviews?XTransformPort=3000`
        : `/api/companies/${slug}/reviews?XTransformPort=3000`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la soumission');
      }

      toast.success('Avis publié avec succès ! Merci pour votre contribution.');
      onSuccess?.();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, reviewType, slug, showCategoryRatings, onSuccess]);

  // Render step content
  const renderStepContent = () => {
    switch (steps[currentStep]?.title) {
      case 'Note':
        return (
          <div className="space-y-6 text-center py-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Comment évaluez-vous ce produit ?</h3>
              <p className="text-gray-500">Cliquez sur les étoiles pour donner votre note</p>
            </div>
            
            <div className="flex justify-center">
              <StarRating
                rating={formData.rating}
                onRatingChange={(rating) => updateField('rating', rating)}
                size="xl"
                readonly={false}
              />
            </div>

            {isVerifiedPurchase && (
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-full text-sm">
                <CheckCircle2 size={16} />
                Achat vérifié - Vous avez acheté ce produit
              </div>
            )}

            {errors.rating && (
              <p className="text-red-500 text-sm flex items-center justify-center gap-1">
                <AlertCircle size={16} />
                {errors.rating}
              </p>
            )}

            {/* Quick rating buttons */}
            <div className="flex justify-center gap-2 pt-4">
              {[1, 2, 3, 4, 5].map(value => (
                <Button
                  key={value}
                  variant={formData.rating === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateField('rating', value)}
                  className={cn(
                    formData.rating === value && 'bg-amber-500 hover:bg-amber-600'
                  )}
                >
                  {value}★
                </Button>
              ))}
            </div>
          </div>
        );

      case 'Catégories':
        return (
          <div className="space-y-6 py-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Évaluation détaillée</h3>
              <p className="text-gray-500">Notez chaque aspect du service</p>
            </div>

            <div className="space-y-4">
              {REVIEW_CATEGORIES.map(category => (
                <div key={category.key} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">{category.label}</Label>
                    <span className="font-semibold text-lg">
                      {formData.categoryRatings[category.key] || '-'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            categoryRatings: {
                              ...prev.categoryRatings,
                              [category.key]: value,
                            },
                          }));
                        }}
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                          formData.categoryRatings[category.key] >= value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                    <span>Mauvais</span>
                    <span>Excellent</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Avis':
        return (
          <div className="space-y-4 py-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Votre avis</h3>
              <p className="text-gray-500 text-sm">
                Partagez votre expérience avec d&apos;autres acheteurs
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre (optionnel)</Label>
              <Input
                id="title"
                placeholder="Résumez votre avis en quelques mots"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-gray-400 text-right">
                {formData.title.length}/100
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">
                Commentaire <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="comment"
                placeholder="Décrivez votre expérience en détail..."
                value={formData.comment}
                onChange={(e) => updateField('comment', e.target.value)}
                rows={6}
                maxLength={5000}
                className={cn(errors.comment && 'border-red-500')}
              />
              <div className="flex justify-between text-xs">
                <p className={cn(errors.comment ? 'text-red-500' : 'text-gray-400')}>
                  {errors.comment || `Minimum 10 caractères`}
                </p>
                <p className="text-gray-400">{formData.comment.length}/5000</p>
              </div>
            </div>
          </div>
        );

      case 'Détails':
        return (
          <div className="space-y-6 py-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Points forts et faiblesses</h3>
              <p className="text-gray-500 text-sm">
                Aidez les autres acheteurs avec vos observations (optionnel)
              </p>
            </div>

            {/* Pros */}
            <div className="space-y-2">
              <Label className="text-green-700 font-medium flex items-center gap-1">
                <Plus size={16} /> Points positifs
              </Label>
              <ProConList
                items={formData.pros}
                onAdd={(value) => addItem('pros', value)}
                onRemove={(index) => removeItem('pros', index)}
                placeholder="Ex: Bonne qualité"
                color="green"
              />
            </div>

            {/* Cons */}
            <div className="space-y-2">
              <Label className="text-red-700 font-medium flex items-center gap-1">
                <X size={16} /> Points négatifs
              </Label>
              <ProConList
                items={formData.cons}
                onAdd={(value) => addItem('cons', value)}
                onRemove={(index) => removeItem('cons', index)}
                placeholder="Ex: Livraison lente"
                color="red"
              />
            </div>
          </div>
        );

      case 'Photos':
        return (
          <div className="space-y-4 py-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Photos</h3>
              <p className="text-gray-500 text-sm">
                Ajoutez des photos du produit (jusqu'à 5)
              </p>
            </div>

            {/* Image grid */}
            {formData.imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                {formData.imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                  >
                    <img
                      src={preview}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {formData.imagePreviews.length < 5 && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={24} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Cliquez ou glissez des images ici
                    </span>
                    <span className="text-xs text-gray-400">
                      JPG, PNG, WebP • Max 5MB • Max 5 photos
                    </span>
                  </div>
                </Button>
              </div>
            )}
          </div>
        );

      case 'Confirmation':
        return (
          <div className="space-y-6 py-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Vérifiez votre avis</h3>
              <p className="text-gray-500 text-sm">
                Confirmez que tout est correct avant publication
              </p>
            </div>

            {/* Preview card */}
            <Card className="bg-gray-50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {formData.isAnonymous ? 'Anonyme' : 'Vous'}
                  </AvatarFallback>
                  <div>
                    <p className="font-medium">{formData.isAnonymous ? 'Anonyme' : 'Vous'}</p>
                    <StarRating rating={formData.rating} size="sm" readonly />
                  </div>
                </div>

                {formData.title && (
                  <h4 className="font-semibold">{formData.title}</h4>
                )}

                <p className="text-gray-700 whitespace-pre-wrap">
                  {formData.comment}
                </p>

                {(formData.pros.length > 0 || formData.cons.length > 0) && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {formData.pros.length > 0 && (
                      <div className="text-green-600">
                        <strong>+</strong> {formData.pros.join(', ')}
                      </div>
                    )}
                    {formData.cons.length > 0 && (
                      <div className="text-red-600">
                        <strong>-</strong> {formData.cons.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {formData.imagePreviews.length > 0 && (
                  <div className="flex gap-2">
                    {formData.imagePreviews.slice(0, 3).map((preview, index) => (
                      <img
                        key={index}
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ))}
                    {formData.imagePreviews.length > 3 && (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-500">
                        +{formData.imagePreviews.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Anonymity toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="anonymous" className="font-medium">
                  Publier anonymement
                </Label>
                <p className="text-sm text-gray-500">
                  Votre nom ne sera pas affiché publiquement
                </p>
              </div>
              <Switch
                id="anonymous"
                checked={formData.isAnonymous}
                onCheckedChange={(checked) => updateField('isAnonymous', checked)}
              />
            </div>

            {/* Terms acknowledgment */}
            <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg">
              <p>
                En publiant cet avis, vous acceptez nos{' '}
                <a href="/conditions-utilisation" className="underline text-blue-600">
                  conditions d&apos;utilisation
                </a>{' '}
                et notre{' '}
                <a href="/charte-communautaire" className="underline text-blue-600">
                  charte communautaire
                </a>
                . Les avis faux ou offensants seront supprimés.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Rédiger un avis</CardTitle>
        <CardDescription>
          Partagez votre expérience avec la communauté AlgeriaTrade
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6 px-4">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <button
                type="button"
                onClick={() => index < currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
                className={cn(
                  'flex flex-col items-center',
                  index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    index < currentStep
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {index < currentStep ? <CheckCircle2 size={16} /> : index + 1}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
              </button>
              
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2',
                    index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <div>
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Annuler
              </Button>
            )}
            {currentStep > 0 && (
              <Button variant="outline" onClick={prevStep} className="ml-2">
                Précédent
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <>
                {currentStep === steps.length - 2 ? (
                  <Button onClick={() => setShowPreview(true)} variant="outline">
                    <Eye size={16} className="mr-2" />
                    Aperçu
                  </Button>
                ) : null}
                <Button onClick={nextStep}>
                  Suivant
                </Button>
              </>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                    <Send size={16} className="mr-2" />
                    {isSubmitting ? 'Publication...' : 'Publier mon avis'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la publication</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir publier cet avis ? Il sera visible par tous les utilisateurs.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Modifier</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                      Publier
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>

      {/* Preview dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu de votre avis</DialogTitle>
            <DialogDescription>
              Voici à quoi ressemblera votre avis une fois publié
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {/* This would use ReviewCard in production */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium">
                    V
                  </div>
                  <div>
                    <p className="font-medium">{formData.isAnonymous ? 'Anonyme' : 'Vous'}</p>
                    <StarRating rating={formData.rating} size="sm" readonly />
                  </div>
                </div>
                {formData.title && <h4 className="font-semibold">{formData.title}</h4>}
                <p className="text-gray-700">{formData.comment}</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Modifier
            </Button>
            <Button onClick={() => {
              setShowPreview(false);
              setCurrentStep(steps.length - 1);
            }}>
              Continuer vers publication
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Sub-component for pro/con list input
function ProConList({
  items,
  onAdd,
  onRemove,
  placeholder,
  color,
}: {
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  color: 'green' | 'red';
}) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        onAdd(inputValue);
        setInputValue('');
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Items list */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={index}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                color === 'green'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="hover:bg-black/10 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
          maxLength={100}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            if (inputValue.trim()) {
              onAdd(inputValue);
              setInputValue('');
            }
          }}
          disabled={!inputValue.trim()}
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
}

// Avatar fallback component
function AvatarFallback({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${className}`}>
      {children}
    </div>
  );
}

export default ReviewForm;
