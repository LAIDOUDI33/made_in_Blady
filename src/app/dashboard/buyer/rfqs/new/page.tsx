'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Save,
  Send,
  Eye,
  Plus,
  X,
  Upload,
  Calendar,
  MapPin,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

// Algerian Wilayas
const wilayas = [
  'Adrar (01)', 'Chlef (02)', 'Laghouat (03)', 'Oum El Bouaghi (04)',
  'Batna (05)', 'Béjaïa (06)', 'Biskra (07)', 'Béchar (08)',
  'Blida (09)', 'Bouira (10)', 'Tamanrasset (11),', 'Tébessa (12)',
  'Tlemcen (13)', 'Tiaret (14)', 'Tizi Ouzou (15)', 'Alger (16)',
  'Djelfa (17)', 'Jijel (18)', 'Sétif (19)', 'Saïda (20)',
  'Skikda (21)', 'Sidi Bel Abbès (22)', 'Annaba (23)', 'Guelma (24)',
  'Constantine (25)', 'Médéa (26)', 'Mostaganem (27)', 'M\'sila (28)',
  'Mascara (29),', 'Ouargla (30)', 'Oran (31)', 'El Bayadh (32)',
  'Illizi (33)', 'Bordj Bou Arréridj (34)', 'Boumerdès (35)', 'El Tarf (36)',
  'Tindouf (37)', 'Tissemsilt (38)', 'El Oued (39)', 'Khenchela (40)',
  'Souk Ahras (41)', 'Tipaza (42)', 'Mila (43),', 'Aïn Defla (44)',
  'Naâma (45)', 'Aïn Témouchent (46)', 'Ghardaïa (47)', 'Relizane (48)'
];

const categories = [
  'Matériaux Construction',
  'Fer & Acier',
  'Agrégats',
  'Peintures & Enduits',
  'Plomberie & Sanitaire',
  'Électricité',
  'Isolation',
  'Quincaillerie',
  'Outillage',
  'Équipements BTP',
  'Autre'
];

const units = [
  'tonnes', 'mètres', 'm²', 'm³', 'unités', 'litres', 'kilogrammes',
  'rouleaux', 'paquets', 'cartons', 'palletes', 'lots'
];

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

export default function NewRFQPage() {
  const router = useRouter();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    quantity: '',
    unit: '',
    targetPrice: '',
    currency: 'DZD',
    deliveryLocation: '',
    requiredDeliveryDate: '',
    expirationDays: '14',
    attachments: [] as Attachment[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est obligatoire';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire';
    }

    if (!formData.category) {
      newErrors.category = 'Veuillez sélectionner une catégorie';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'La quantité doit être supérieure à 0';
    }

    if (!formData.unit) {
      newErrors.unit = 'Veuillez sélectionner une unité';
    }

    if (!formData.deliveryLocation) {
      newErrors.deliveryLocation = 'Veuillez sélectionner un lieu de livraison';
    }

    if (!formData.requiredDeliveryDate) {
      newErrors.requiredDeliveryDate = 'Veuillez indiquer une date de livraison souhaitée';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save as draft
  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Saving draft:', formData);
    setIsSubmitting(false);
    router.push('/dashboard/buyer/rfqs');
  };

  // Handle publish
  const handlePublish = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Publishing RFQ:', formData);
    setIsSubmitting(false);
    router.push('/dashboard/buyer/rfqs');
  };

  // Handle file upload (mock)
  const handleFileUpload = () => {
    const newAttachment: Attachment = {
      id: Date.now().toString(),
      name: `document_${formData.attachments.length + 1}.pdf`,
      size: '2.4 MB',
      type: 'PDF'
    };
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, newAttachment]
    }));
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a.id !== id)
    }));
  };

  // Calculate expiration date based on selected days
  const getExpirationDate = () => {
    const days = parseInt(formData.expirationDays) || 14;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvel Appel d&apos;Offre</h1>
          <p className="text-gray-600 mt-1">Créez une demande de devis pour vos besoins d&apos;achat</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            Brouillon
          </Button>
          
          {/* Preview Dialog */}
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Aperçu de l&apos;Appel d&apos;Offre</DialogTitle>
                <DialogDescription>
                  Vérifiez les détails avant publication
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Titre</Label>
                  <p className="font-semibold text-lg">{formData.title || 'Non spécifié'}</p>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="text-gray-700 whitespace-pre-wrap">{formData.description || 'Non spécifiée'}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Package className="h-4 w-4" /> Quantité
                    </Label>
                    <p className="font-medium">
                      {formData.quantity || '-'} {formData.unit || ''}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" /> Prix Cible
                    </Label>
                    <p className="font-medium">
                      {formData.targetPrice ? `${parseFloat(formData.targetPrice).toLocaleString('fr-DZ')} ${formData.currency}` : 'Non spécifié'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> Livraison
                    </Label>
                    <p className="font-medium">{formData.deliveryLocation || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Date Souhaitée
                    </Label>
                    <p className="font-medium">
                      {formData.requiredDeliveryDate 
                        ? new Date(formData.requiredDeliveryDate).toLocaleDateString('fr-FR')
                        : '-'}
                    </p>
                  </div>
                </div>

                {formData.attachments.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Pièces Jointes</Label>
                      <div className="mt-2 space-y-2">
                        {formData.attachments.map(att => (
                          <Badge key={att.id} variant="outline" className="mr-2">
                            {att.name} ({att.size})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Modifier
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    handlePublish();
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publier l&apos;AO
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
            <CardDescription>Détails principaux de votre demande</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre de l&apos;appel d&apos;offre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ex: Fourniture de ciment Portland CEM I 42.5"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description détaillée <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Décrivez en détail votre besoin: quantités, spécifications techniques, normes requises, conditions particulières..."
                rows={5}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.description}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Une description détaillée aide les fournisseurs à proposer des devis plus précis.
              </p>
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie <span className="text-red-500">*</span></Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.category}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quantity & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Quantité & Budget</CardTitle>
            <CardDescription>Spécifiez vos besoins en quantité et budget indicatif</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantité <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="Ex: 500"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.quantity}
                  </p>
                )}
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label>Unité <span className="text-red-500">*</span></Label>
                <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                  <SelectTrigger className={errors.unit ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Unité" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.unit}
                  </p>
                )}
              </div>

              {/* Target Price */}
              <div className="space-y-2">
                <Label htmlFor="targetPrice">Prix Cible (optionnel)</Label>
                <div className="relative">
                  <Input
                    id="targetPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Budget estimé"
                    value={formData.targetPrice}
                    onChange={(e) => handleInputChange('targetPrice', e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    DZD
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Les fournisseurs verront que vous avez un budget cible.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle>Livraison & Délais</CardTitle>
            <CardDescription>Où et quand souhaitez-vous être livré ?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Delivery Location */}
              <div className="space-y-2">
                <Label>Lieu de livraison <span className="text-red-500">*</span></Label>
                <Select value={formData.deliveryLocation} onValueChange={(value) => handleInputChange('deliveryLocation', value)}>
                  <SelectTrigger className={errors.deliveryLocation ? 'border-red-500' : ''}>
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sélectionnez la wilaya" />
                  </SelectTrigger>
                  <SelectContent>
                    {wilayas.map((wilaya) => (
                      <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.deliveryLocation && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.deliveryLocation}
                  </p>
                )}
              </div>

              {/* Required Delivery Date */}
              <div className="space-y-2">
                <Label htmlFor="requiredDeliveryDate">
                  Date de livraison souhaitée <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="requiredDeliveryDate"
                  type="date"
                  value={formData.requiredDeliveryDate}
                  onChange={(e) => handleInputChange('requiredDeliveryDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.requiredDeliveryDate ? 'border-red-500' : ''}
                />
                {errors.requiredDeliveryDate && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.requiredDeliveryDate}
                  </p>
                )}
              </div>
            </div>

            {/* Expiration Days */}
            <div className="space-y-2">
              <Label>Date d&apos;expiration des devis</Label>
              <Select value={formData.expirationDays} onValueChange={(value) => handleInputChange('expirationDays', value)}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Durée de validité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 jours ({getExpirationDate()})</SelectItem>
                  <SelectItem value="14">14 jours ({getExpirationDate()})</SelectItem>
                  <SelectItem value="30">30 jours ({getExpirationDate()})</SelectItem>
                  <SelectItem value="60">60 jours ({getExpirationDate()})</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Les fournisseurs ne pourront plus envoyer de devis après cette date.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader>
            <CardTitle>Pièces Jointes</CardTitle>
            <CardDescription>Ajoutez des documents complémentaires (specs techniques, plans, images)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleFileUpload}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Ajouter un fichier
            </Button>

            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                {formData.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">{attachment.name}</p>
                        <p className="text-xs text-gray-500">{attachment.size}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachment(attachment.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500">
              Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG. Taille max: 10MB par fichier.
            </p>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm">
                  Votre AO sera visible par tous les fournisseurs vérifiés après publication.
                </span>
              </div>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push('/dashboard/buyer/rfqs')}
                >
                  Annuler
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder le Brouillon
                </Button>
                <Button 
                  type="button"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Publication...' : 'Publier l\'AO'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
