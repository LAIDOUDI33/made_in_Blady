'use client';

/**
 * Super Admin - New Tenant Page
 * Setup wizard for creating a new tenant from template or scratch
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Globe, 
  Palette, 
  Settings,
  Sparkles,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Link from 'next/link';

// Import templates
import { 
  getAllCountryTemplates, 
  CountryTemplate,
  getCountryTemplate 
} from '@/lib/multi-tenant/templates';

type WizardStep = 'template' | 'basic' | 'branding' | 'features' | 'admin' | 'complete';

export default function NewTenantPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('algeria');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    primaryColor: '#006233',
    secondaryColor: '#D52B1E',
    defaultLanguage: 'fr',
    currency: 'DZD',
    currencySymbol: 'د.ج',
    countryName: 'Algérie',
    countryCode: 'DZ',
    phonePrefix: '+213',
    timezone: 'Africa/Algiers',
    locale: 'fr-DZ',
    planType: 'free' as 'free' | 'professional' | 'enterprise',
    contactEmail: '',
    contactPhone: '',
    features: ['catalog', 'rfq', 'messaging'],
    // Admin user for tenant
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
  });

  const templates = getAllCountryTemplates();
  
  // Update form when template is selected
  const handleTemplateSelect = (templateId: string) => {
    const template = getCountryTemplate(templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData(prev => ({
        ...prev,
        name: template.name,
        slug: template.slug,
        primaryColor: template.primaryColor,
        secondaryColor: template.secondaryColor,
        defaultLanguage: template.language,
        currency: template.currency,
        currencySymbol: template.currencySymbol,
        countryName: template.countryFr,
        countryCode: template.countryCode,
        phonePrefix: template.phonePrefix,
        timezone: template.timezone,
        locale: `${template.language}-${template.countryCode}`,
        features: [...template.features],
      }));
    }
  };

  // Initialize with Algeria template on mount
  React.useEffect(() => {
    handleTemplateSelect('algeria');
  }, []);

  const steps: { id: WizardStep; title: string; icon: React.ElementType }[] = [
    { id: 'template', title: 'Modèle', title: 'Modèle', icon: Globe },
    { id: 'basic', title: 'Informations de base', title: 'Informations de base', icon: Building2 },
    { id: 'branding', title: 'Personnalisation', title: 'Personnalisation', icon: Palette },
    { id: 'features', title: 'Fonctionnalités', title: 'Fonctionnalités', icon: Settings },
    { id: 'admin', title: 'Administrateur', title: 'Administrateur', icon: Sparkles },
    { id: 'complete', title: 'Confirmation', title: 'Confirmation', icon: Check },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'template':
        return !!selectedTemplate;
      case 'basic':
        return formData.name && formData.slug;
      case 'branding':
        return true;
      case 'features':
        return formData.features.length > 0;
      case 'admin':
        return formData.adminEmail && formData.adminPassword && formData.adminFirstName && formData.adminLastName;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!canProceed()) return;
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/super-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Locataire créé avec succès!');
        router.push(`/super-admin/tenants/${data.id}/edit`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast.error('Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/super-admin/tenants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nouveau Locataire</h1>
          <p className="text-gray-500">Créez une nouvelle plateforme multi-locataire</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                  disabled={index > currentStepIndex}
                  className={`flex flex-col items-center gap-2 ${
                    index <= currentStepIndex ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${index < currentStepIndex 
                      ? 'bg-green-500 text-white' 
                      : index === currentStepIndex 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200 text-gray-600'}
                  `}>
                    {index < currentStepIndex ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-2
                    ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 'template' && (
        <Card>
          <CardHeader>
            <CardTitle>Choisir un modèle</CardTitle>
            <CardDescription>
              Sélectionnez un modèle préconfiguré pour un pays ou région spécifique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all hover:shadow-md
                    ${selectedTemplate === template.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{template.flagEmoji}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{template.displayName}</div>
                      <div className="text-sm text-gray-500">{template.countryFr}</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {template.currency}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {template.language.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {template.regions} {template.regionNameFr}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {template.descriptionFr}
                      </p>
                    </div>
                    {selectedTemplate === template.id && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom option */}
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  setSelectedTemplate('custom');
                  setFormData(prev => ({
                    ...prev,
                    name: '',
                    slug: '',
                    primaryColor: '#3B82F6',
                    secondaryColor: '#1E40AF',
                  }));
                }}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md
                  ${selectedTemplate === 'custom' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-dashed border-gray-300 hover:border-gray-400'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium">Personnalisé</div>
                    <div className="text-sm text-gray-500">Commencer à partir de zéro avec vos propres paramètres</div>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'basic' && (
        <Card>
          <CardHeader>
            <CardTitle>Informations de base</CardTitle>
            <CardDescription>
              Configuration essentielle du locataire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du locataire *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex: TunisiaTrade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL identifier) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  }))}
                  placeholder="ex: tunisiatrade"
                />
                <p className="text-xs text-gray-500">
                  Utilisé dans l&apos;URL: /?tenant={formData.slug || 'votre-slug'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="domain">Domaine personnalisé (optionnel)</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="ex: tunisiatrade.tn"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="planType">Plan</Label>
                <select
                  id="planType"
                  value={formData.planType}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    planType: e.target.value as 'free' | 'professional' | 'enterprise'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="free">Gratuit</option>
                  <option value="professional">Professionnel (99$/mois)</option>
                  <option value="enterprise">Entreprise (299$/mois)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="countryName">Pays *</Label>
                <Input
                  id="countryName"
                  value={formData.countryName}
                  onChange={(e) => setFormData(prev => ({ ...prev, countryName: e.target.value }))}
                  placeholder="ex: Tunisie"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="countryCode">Code pays *</Label>
                <Input
                  id="countryCode"
                  value={formData.countryCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value.toUpperCase() }))}
                  placeholder="ex: TN"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phonePrefix">Préfixe téléphonique</Label>
                <Input
                  id="phonePrefix"
                  value={formData.phonePrefix}
                  onChange={(e) => setFormData(prev => ({ ...prev, phonePrefix: e.target.value }))}
                  placeholder="ex: +216"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="Africa/Algiers">Africa/Algiers (GMT+1)</option>
                  <option value="Africa/Tunis">Africa/Tunis (GMT+1)</option>
                  <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
                  <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                  <option value="Europe/Paris">Europe/Paris (GMT+1/+2)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email de contact</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="contact@exemple.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Téléphone de contact</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="+216 XX XXX XXX"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'branding' && (
        <Card>
          <CardHeader>
            <CardTitle>Personnalisation visuelle</CardTitle>
            <CardDescription>
              Configurez les couleurs et l&apos;apparence de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Color Pickers */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Couleur principale</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-12 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Couleur secondaire</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-16 h-12 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="font-mono"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Localisation & Devise</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="language" className="text-xs text-gray-500">Langue par défaut</Label>
                      <select
                        id="language"
                        value={formData.defaultLanguage}
                        onChange={(e) => setFormData(prev => ({ ...prev, defaultLanguage: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white mt-1"
                      >
                        <option value="fr">Français</option>
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="locale" className="text-xs text-gray-500">Locale</Label>
                      <Input
                        id="locale"
                        value={formData.locale}
                        onChange={(e) => setFormData(prev => ({ ...prev, locale: e.target.value }))}
                        className="mt-1"
                        placeholder="fr-DZ"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="currency" className="text-xs text-gray-500">Devise</Label>
                      <Input
                        id="currency"
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className="mt-1"
                        placeholder="DZD"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currencySymbol" className="text-xs text-gray-500">Symbole</Label>
                      <Input
                        id="currencySymbol"
                        value={formData.currencySymbol}
                        onChange={(e) => setFormData(prev => ({ ...prev, currencySymbol: e.target.value }))}
                        className="mt-1"
                        placeholder="د.ج"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <Label>Aperçu</Label>
                <div className="border rounded-lg overflow-hidden">
                  {/* Mock header */}
                  <div 
                    className="px-4 py-3 flex items-center gap-3"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    <div className="w-8 h-8 bg-white/20 rounded"></div>
                    <span className="text-white font-semibold">{formData.name || 'Nom du locataire'}</span>
                  </div>
                  
                  {/* Mock content */}
                  <div className="p-4 space-y-3 bg-white">
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                    
                    <div className="flex gap-2 mt-4">
                      <div 
                        className="px-3 py-1.5 rounded text-white text-sm"
                        style={{ backgroundColor: formData.primaryColor }}
                      >
                        Bouton principal
                      </div>
                      <div 
                        className="px-3 py-1.5 rounded text-sm border"
                        style={{ borderColor: formData.secondaryColor, color: formData.secondaryColor }}
                      >
                        Secondaire
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                      <span className="text-gray-500">Exemple de prix: </span>
                      <span className="font-semibold">1,500.00 {formData.currencySymbol}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'features' && (
        <Card>
          <CardHeader>
            <CardTitle>Fonctionnalités activées</CardTitle>
            <CardDescription>
              Sélectionnez les fonctionnalités disponibles pour ce locataire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'catalog', name: 'Catalogue Produits', desc: 'Parcourir les produits', icon: '📦' },
                { id: 'rfq', name: "Appels d'offres", desc: 'Système RFQ', icon: '📋' },
                { id: 'messaging', name: 'Messagerie', desc: 'Chat en temps réel', icon: '💬' },
                { id: 'payments', name: 'Paiements', desc: 'Traitement des paiements', icon: '💳' },
                { id: 'reviews', name: 'Avis & Notations', desc: 'Système d\'évaluations', icon: '⭐' },
                { id: 'analytics', name: 'Analytiques', desc: 'Tableau de bord stats', icon: '📊' },
                { id: 'whiteLabel', name: 'White-Label', desc: 'Supprimer branding', icon: '🏷️' },
                { id: 'customDomain', name: 'Domaine personnalisé', desc: 'Utiliser son domaine', icon: '🌐' },
                { id: 'apiAccess', name: 'Accès API', desc: 'API REST disponible', icon: '🔌' },
              ].map((feature) => (
                <label
                  key={feature.id}
                  className={`
                    flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${formData.features.includes(feature.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          features: [...prev.features, feature.id]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          features: prev.features.filter(f => f !== feature.id)
                        }));
                      }
                    }}
                    className="mt-1 h-4 w-4 text-primary rounded"
                  />
                  <div>
                    <span className="text-lg">{feature.icon}</span>
                    <div className="font-medium">{feature.name}</div>
                    <div className="text-sm text-gray-500">{feature.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 Les fonctionnalités disponibles dépendent du plan sélectionné. 
                Le plan {formData.planType === 'free' ? 'Gratuit' : formData.planType === 'professional' ? 'Professionnel' : 'Entreprise'} 
                {' '}inclut ces fonctionnalités.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Compte administrateur</CardTitle>
            <CardDescription>
              Créez le compte administrateur pour ce locataire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="adminFirstName">Prénom *</Label>
                <Input
                  id="adminFirstName"
                  value={formData.adminFirstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminFirstName: e.target.value }))}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminLastName">Nom *</Label>
                <Input
                  id="adminLastName"
                  value={formData.adminLastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminLastName: e.target.value }))}
                  placeholder="Dupont"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email administrateur *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                  placeholder="admin@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Mot de passe *</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                  placeholder="••••••••"
                  minLength={8}
                />
                <p className="text-xs text-gray-500">Minimum 8 caractères</p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700">
                ⚠️ Cet utilisateur aura les droits d&apos;administrateur sur le locataire &quot;{formData.name}&quot;. 
                Il pourra gérer les utilisateurs, les entreprises et les paramètres de cette plateforme.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
            <CardDescription>
              Vérifiez les informations avant de créer le locataire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Informations générales</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Nom:</dt>
                    <dd className="font-medium">{formData.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Slug:</dt>
                    <dd className="font-medium font-mono">{formData.slug}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Domaine:</dt>
                    <dd className="font-medium">{formData.domain || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Pays:</dt>
                    <dd className="font-medium">{formData.countryName} ({formData.countryCode})</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Langue:</dt>
                    <dd className="font-medium uppercase">{formData.defaultLanguage}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Devise:</dt>
                    <dd className="font-medium">{formData.currency} ({formData.currencySymbol})</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Plan:</dt>
                    <dd><Badge>{formData.planType}</Badge></dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Apparence</h3>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div 
                    className="w-12 h-12 rounded-lg"
                    style={{ backgroundColor: formData.primaryColor }}
                  ></div>
                  <div 
                    className="w-12 h-12 rounded-lg"
                    style={{ backgroundColor: formData.secondaryColor }}
                  ></div>
                  <div className="text-sm">
                    <div>Couleurs principales</div>
                    <div className="font-mono text-xs text-gray-500">
                      {formData.primaryColor} / {formData.secondaryColor}
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold pt-2">Fonctionnalités ({formData.features.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map(f => (
                    <Badge key={f} variant="secondary">{f}</Badge>
                  ))}
                </div>

                <h3 className="font-semibold pt-2">Administrateur</h3>
                <div className="text-sm">
                  <p>{formData.adminFirstName} {formData.adminLastName}</p>
                  <p className="text-gray-500">{formData.adminEmail}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 'template' ? () => router.push('/super-admin/tenants') : prevStep}
          disabled={currentStep === 'complete'}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentStep === 'template' ? 'Annuler' : 'Retour'}
        </Button>

        {currentStep !== 'complete' ? (
          <Button onClick={nextStep} disabled={!canProceed()}>
            Suivant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Création en cours...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Créer le locataire
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
