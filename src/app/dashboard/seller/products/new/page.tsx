'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  X,
  Image as ImageIcon,
  Eye,
  Save,
  Send,
  Package,
  Tag,
  DollarSign,
  FileText,
  Images,
  Sparkles
} from 'lucide-react';

// Form data types
interface ProductFormData {
  // Step 1: Basic Info
  name: string;
  sku: string;
  shortDescription: string;
  category: string;
  subcategory: string;
  
  // Step 2: Pricing
  priceType: 'fixed' | 'range' | 'negotiable';
  price: string;
  priceRangeMin: string;
  priceRangeMax: string;
  currency: string;
  negotiablePrice: boolean;
  moq: string;
  unit: string;
  
  // Step 3: Details
  description: string;
  specifications: { key: string; value: string }[];
  leadTime: string;
  countryOfOrigin: string;
  
  // Step 4: Images
  images: ProductImage[];
}

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  file?: File;
}

const categories = [
  'Matériaux de Construction',
  'Équipements Industriels',
  'Produits Chimiques',
  'Machines & Outils',
  'Électrique & Éclairage',
  'Plomberie & Sanitaire',
  'Préfabriqués',
  'Isolation',
  'Peinture & Enduit',
  'Autre',
];

const units = [
  'unité', 'kg', 'tonne', 'mètre', 'm²', 'm³', 
  'litre', 'sac', 'palette', 'carton', 'rouleau', 'set'
];

const algerianWilayas = [
  'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Béjaïa', 
  'Tizi Ouzou', 'Sétif', 'Chlef', 'Skikda', 'Biskra', 'Tébessa', 
  'El Oued', 'Sidi Bel Abbès', 'Bordj Bou Arreridj', 'M\'sila', 'Tlemcen',
];

const steps = [
  { id: 1, title: 'Infos de base', icon: Package },
  { id: 2, title: 'Tarification', icon: DollarSign },
  { id: 3, title: 'Détails', icon: FileText },
  { id: 4, title: 'Images', icon: Images },
  { id: 5, title: 'Aperçu', icon: Eye },
];

export default function NewProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    shortDescription: '',
    category: '',
    subcategory: '',
    priceType: 'fixed',
    price: '',
    priceRangeMin: '',
    priceRangeMax: '',
    currency: 'DZD',
    negotiablePrice: false,
    moq: '',
    unit: 'unité',
    description: '',
    specifications: [],
    leadTime: '',
    countryOfOrigin: '',
    images: [],
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const updateField = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Auto-generate slug when name changes
      ...(field === 'name' ? {} : {}),
    }));
  };

  const addSpecification = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }],
    }));
  };

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) =>
        i === index ? { ...spec, [field]: value } : spec
      ),
    }));
  };

  const removeSpecification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newImage: ProductImage = {
            id: Math.random().toString(36).substr(2, 9),
            url: event.target?.result as string,
            isPrimary: formData.images.length === 0,
            file,
          };
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, newImage],
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (imageId: string) => {
    setFormData((prev) => {
      const filteredImages = prev.images.filter((img) => img.id !== imageId);
      // If removed image was primary, make first remaining image primary
      if (prev.images.find((img) => img.id === imageId)?.isPrimary && filteredImages.length > 0) {
        filteredImages[0].isPrimary = true;
      }
      return { ...prev, images: filteredImages };
    });
  };

  const setPrimaryImage = (imageId: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      })),
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.category);
      case 2:
        if (formData.priceType === 'fixed') return !!formData.price;
        if (formData.priceType === 'range') return !!(formData.priceRangeMin && formData.priceRangeMax);
        return true;
      case 3:
        return true; // Optional fields
      case 4:
        return formData.images.length > 0;
      case 5:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (action: 'draft' | 'publish') => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      console.log('Submitting product:', {
        ...formData,
        slug: generateSlug(formData.name),
        status: action === 'publish' ? 'active' : 'draft',
      });
      
      // Show success message and redirect
      alert(action === 'draft' ? 'Produit sauvegardé en brouillon !' : 'Produit publié avec succès !');
      router.push('/dashboard/seller/products');
    } catch (error) {
      console.error('Error submitting product:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Ajouter un Nouveau Produit</h1>
          <p className="text-gray-600 mt-1">Remplissez les informations pour ajouter un produit à votre catalogue</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => currentStep >= step.id && setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-2 min-w-[80px] transition-colors ${
                    currentStep >= step.id ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      currentStep === step.id
                        ? 'bg-green-600 text-white'
                        : currentStep > step.id
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      currentStep === step.id ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 min-w-[20px] ${
                      currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de Base</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="name">Nom du Produit *</Label>
                        <Input
                          id="name"
                          placeholder="Ex: Ciment Portland CEM I 42.5"
                          value={formData.name}
                          onChange={(e) => updateField('name', e.target.value)}
                        />
                        {formData.name && (
                          <p className="text-xs text-gray-500">
                            Slug: /produit/{generateSlug(formData.name)}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU (Référence)</Label>
                        <Input
                          id="sku"
                          placeholder="Ex: CPT-CEM42-001"
                          value={formData.sku}
                          onChange={(e) => updateField('sku', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Catégorie *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => updateField('category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="shortDescription">Courte Description</Label>
                        <Textarea
                          id="shortDescription"
                          placeholder="Brève description du produit (max 200 caractères)"
                          rows={3}
                          maxLength={200}
                          value={formData.shortDescription}
                          onChange={(e) => updateField('shortDescription', e.target.value)}
                        />
                        <p className="text-xs text-gray-500 text-right">
                          {formData.shortDescription.length}/200
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subcategory">Sous-catégorie</Label>
                        <Input
                          id="subcategory"
                          placeholder="Optionnel"
                          value={formData.subcategory}
                          onChange={(e) => updateField('subcategory', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Pricing */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarification</h2>
                    
                    <div className="space-y-6">
                      {/* Price Type Selection */}
                      <div className="space-y-3">
                        <Label>Type de Prix</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'fixed', label: 'Prix Fixe', desc: 'Un prix unique' },
                            { value: 'range', label: 'Fourchette', desc: 'Min - Max' },
                            { value: 'negotiable', label: 'Négociable', desc: 'Sur demande' },
                          ].map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => updateField('priceType', type.value)}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                formData.priceType === type.value
                                  ? 'border-green-600 bg-green-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <p className="font-medium text-sm">{type.label}</p>
                              <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Price Fields */}
                      {(formData.priceType === 'fixed' || formData.priceType === 'range') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.priceType === 'fixed' && (
                            <div className="space-y-2">
                              <Label htmlFor="price">Prix (DZD) *</Label>
                              <Input
                                id="price"
                                type="number"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => updateField('price', e.target.value)}
                              />
                            </div>
                          )}
                          
                          {formData.priceType === 'range' && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="priceMin">Prix Min (DZD) *</Label>
                                <Input
                                  id="priceMin"
                                  type="number"
                                  placeholder="0.00"
                                  value={formData.priceRangeMin}
                                  onChange={(e) => updateField('priceRangeMin', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="priceMax">Prix Max (DZD) *</Label>
                                <Input
                                  id="priceMax"
                                  type="number"
                                  placeholder="0.00"
                                  value={formData.priceRangeMax}
                                  onChange={(e) => updateField('priceRangeMax', e.target.value)}
                                />
                              </div>
                            </>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor="currency">Devise</Label>
                            <Select
                              value={formData.currency}
                              onValueChange={(value) => updateField('currency', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DZD">DZD - Dinar Algérien</SelectItem>
                                <SelectItem value="USD">USD - Dollar Américain</SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* MOQ and Unit */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="moq">Quantité Minimale (MOQ)</Label>
                          <Input
                            id="moq"
                            type="number"
                            placeholder="Ex: 100"
                            value={formData.moq}
                            onChange={(e) => updateField('moq', e.target.value)}
                          />
                          <p className="text-xs text-gray-500">Quantité minimale par commande</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="unit">Unité</Label>
                          <Select
                            value={formData.unit}
                            onValueChange={(value) => updateField('unit', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner l'unité" />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Negotiable Toggle */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Prix Négociable</p>
                          <p className="text-xs text-gray-500">Les acheteurs peuvent négocier le prix</p>
                        </div>
                        <Switch
                          checked={formData.negotiablePrice}
                          onCheckedChange={(checked) => updateField('negotiablePrice', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails du Produit</h2>
                    
                    <div className="space-y-6">
                      {/* Full Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Description Complète</Label>
                        <Textarea
                          id="description"
                          placeholder="Décrivez votre produit en détail..."
                          rows={8}
                          value={formData.description}
                          onChange={(e) => updateField('description', e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          Vous pouvez utiliser des sauts de ligne pour structurer votre description.
                        </p>
                      </div>

                      {/* Specifications */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Spécifications Techniques</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addSpecification}
                          >
                            + Ajouter Spécification
                          </Button>
                        </div>

                        {formData.specifications.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg">
                            Aucune spécification ajoutée
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {formData.specifications.map((spec, index) => (
                              <div key={index} className="flex gap-3 items-start">
                                <Input
                                  placeholder="Attribut (ex: Poids)"
                                  value={spec.key}
                                  onChange={(e) =>
                                    updateSpecification(index, 'key', e.target.value)
                                  }
                                  className="flex-1"
                                />
                                <Input
                                  placeholder="Valeur (ex: 50kg)"
                                  value={spec.value}
                                  onChange={(e) =>
                                    updateSpecification(index, 'value', e.target.value)
                                  }
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSpecification(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Lead Time & Origin */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="leadTime">Délai de Livraison</Label>
                          <Input
                            id="leadTime"
                            placeholder="Ex: 3-5 jours ouvrables"
                            value={formData.leadTime}
                            onChange={(e) => updateField('leadTime', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="origin">Pays d&apos;Origine</Label>
                          <Select
                            value={formData.countryOfOrigin}
                            onValueChange={(value) => updateField('countryOfOrigin', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le pays" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Algérie">🇩🇿 Algérie</SelectItem>
                              <SelectItem value="France">🇫🇷 France</SelectItem>
                              <SelectItem value="Chine">🇨🇳 Chine</SelectItem>
                              <SelectItem value="Turquie">🇹🇷 Turquie</SelectItem>
                              <SelectItem value="Espagne">🇪🇸 Espagne</SelectItem>
                              <SelectItem value="Italie">🇮🇹 Italie</SelectItem>
                              <SelectItem value="Allemagne">🇩🇪 Allemagne</SelectItem>
                              <SelectItem value="Autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Images */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Images du Produit</h2>
                    
                    <div className="space-y-6">
                      {/* Upload Area */}
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors">
                        <input
                          type="file"
                          id="image-upload"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-lg font-medium text-gray-700">
                            Glissez vos images ici ou cliquez pour parcourir
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            PNG, JPG, WEBP jusqu&apos;à 5MB par image. Maximum 10 images.
                          </p>
                        </label>
                      </div>

                      {/* Image Gallery */}
                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {formData.images.map((image) => (
                            <div
                              key={image.id}
                              className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                                image.isPrimary
                                  ? 'border-green-500 ring-2 ring-green-200'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img
                                src={image.url}
                                alt="Product"
                                className="w-full h-40 object-cover"
                              />
                              
                              {/* Overlay */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {!image.isPrimary && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPrimaryImage(image.id)}
                                  >
                                    Définir principale
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeImage(image.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Primary Badge */}
                              {image.isPrimary && (
                                <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <Sparkles className="h-3 w-3" /> Principale
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {formData.images.length === 0 && (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500">Aucune image ajoutée</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Ajoutez au moins une image pour continuer
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Preview */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Aperçu et Publication</h2>
                    
                    <div className="border rounded-xl overflow-hidden">
                      {/* Product Preview */}
                      <div className="bg-white p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Image */}
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            {formData.images.find((img) => img.isPrimary) ? (
                              <img
                                src={formData.images.find((img) => img.isPrimary)?.url}
                                alt={formData.name}
                                className="w-full h-full object-cover"
                              />
                            ) : formData.images.length > 0 ? (
                              <img
                                src={formData.images[0].url}
                                alt={formData.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-16 w-16 text-gray-300" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="space-y-4">
                            <div>
                              <Badge variant="secondary" className="mb-2">{formData.category}</Badge>
                              <h3 className="text-xl font-bold text-gray-900">{formData.name || 'Nom du produit'}</h3>
                              {formData.sku && (
                                <p className="text-sm text-gray-500 mt-1">SKU: {formData.sku}</p>
                              )}
                            </div>

                            <div>
                              {formData.priceType === 'fixed' && formData.price && (
                                <p className="text-2xl font-bold text-green-600">
                                  {Number(formData.price).toLocaleString('fr-DZ')} {formData.currency}
                                </p>
                              )}
                              {formData.priceType === 'range' && formData.priceRangeMin && formData.priceRangeMax && (
                                <p className="text-2xl font-bold text-green-600">
                                  {Number(formData.priceRangeMin).toLocaleString('fr-DZ')} -{' '}
                                  {Number(formData.priceRangeMax).toLocaleString('fr-DZ')} {formData.currency}
                                </p>
                              )}
                              {formData.priceType === 'negotiable' && (
                                <p className="text-2xl font-bold text-blue-600">Sur Demande</p>
                              )}
                              {formData.negotiablePrice && (
                                <p className="text-sm text-orange-600 mt-1">✓ Prix négociable</p>
                              )}
                            </div>

                            {formData.moq && (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Quantité Minimale:</span>{' '}
                                <span className="font-semibold">{formData.moq} {formData.unit}</span>
                              </div>
                            )}

                            {formData.shortDescription && (
                              <p className="text-gray-600 text-sm line-clamp-3">
                                {formData.shortDescription}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2 pt-2">
                              {formData.countryOfOrigin && (
                                <Badge variant="outline">Origine: {formData.countryOfOrigin}</Badge>
                              )}
                              {formData.leadTime && (
                                <Badge variant="outline">Livraison: {formData.leadTime}</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {formData.description && (
                          <div className="mt-8 pt-6 border-t">
                            <h4 className="font-semibold mb-3">Description</h4>
                            <p className="text-gray-600 whitespace-pre-wrap text-sm">
                              {formData.description}
                            </p>
                          </div>
                        )}

                        {formData.specifications.some((s) => s.key && s.value) && (
                          <div className="mt-6 pt-6 border-t">
                            <h4 className="font-semibold mb-3">Spécifications</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {formData.specifications
                                .filter((s) => s.key && s.value)
                                .map((spec, i) => (
                                  <div key={i} className="flex text-sm">
                                    <span className="font-medium text-gray-700">{spec.key}:</span>
                                    <span className="ml-2 text-gray-600">{spec.value}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Conseils
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 space-y-2">
              {currentStep === 1 && (
                <>
                  <p>• Utilisez un nom descriptif et clair</p>
                  <p>• Incluez les caractéristiques principales dans le nom</p>
                  <p>• Le SKU doit être unique pour chaque produit</p>
                </>
              )}
              {currentStep === 2 && (
                <>
                  <p>• Les prix compétitifs attirent plus d&apos;acheteurs</p>
                  <p>• Indiquez toujours la quantité minimale</p>
                  <p>• Le prix négociable augmente les contacts</p>
                </>
              )}
              {currentStep == 3 && (
                <>
                  <p>• Soyez précis dans les spécifications</p>
                  <p>• Mentionnez les certifications si disponibles</p>
                  <p>• Le délai de livraison influence les décisions</p>
                </>
              )}
              {currentStep === 4 && (
                <>
                  <p>• Utilisez des images haute qualité</p>
                  <p>• Montrez le produit sous différents angles</p>
                  <p>• La première image sera la vignette principale</p>
                </>
              )}
              {currentStep === 5 && (
                <>
                  <p>• Vérifiez toutes les informations</p>
                  <p>• Sauvez en brouillon pour modifier plus tard</p>
                  <p>• Publiez quand tout est correct</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={prevStep}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
              )}

              {currentStep < 5 ? (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={nextStep}
                >
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleSubmit('publish')}
                    disabled={isSubmitting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Publication...' : 'Publier le Produit'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSubmit('draft')}
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sauvegarde...' : 'Sauver en Brouillon'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Étape actuelle</span>
                <span className="font-medium">{currentStep}/5</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-600">Nom</span>
                <span className={`font-medium ${formData.name ? 'text-green-600' : 'text-red-500'}`}>
                  {formData.name ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Catégorie</span>
                <span className={`font-medium ${formData.category ? 'text-green-600' : 'text-red-500'}`}>
                  {formData.category ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prix</span>
                <span className={`font-medium ${(formData.priceType === 'negotiable' || formData.price || (formData.priceRangeMin && formData.priceRangeMax)) ? 'text-green-600' : 'text-red-500'}`}>
                  {(formData.priceType === 'negotiable' || formData.price || (formData.priceRangeMin && formData.priceRangeMax)) ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Images</span>
                <span className={`font-medium ${formData.images.length > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formData.images.length > 0 ? `${formData.images.length} image(s)` : '✗'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
