'use client';

/**
 * Super Admin - Edit Tenant Page
 * Full tenant configuration editor with all sections
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  RotateCcw,
  Building2,
  Palette,
  Globe,
  Settings,
  Code,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import Link from 'next/link';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  backgroundImage: string | null;
  defaultLanguage: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
  countryName: string;
  countryCode: string;
  phonePrefix: string;
  features: string;
  isActive: boolean;
  isPublic: boolean;
  planType: string;
  subscriptionEnd: string | null;
  customCSS: string | null;
  customJS: string | null;
  footerText: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function EditTenantPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Danger zone dialog
  const [dangerDialogOpen, setDangerDialogOpen] = useState(false);
  const [dangerAction, setDangerAction] = useState<'deactivate' | 'delete' | null>(null);

  // Form state (initialized from tenant)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    primaryColor: '#006233',
    secondaryColor: '#D52B1E',
    logoUrl: '',
    faviconUrl: '',
    backgroundImage: '',
    defaultLanguage: 'fr',
    currency: 'DZD',
    currencySymbol: 'د.ج',
    locale: 'fr-DZ',
    timezone: 'Africa/Algiers',
    countryName: '',
    countryCode: '',
    phonePrefix: '+213',
    isActive: true,
    isPublic: true,
    planType: 'free' as string,
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    facebookUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    footerText: '',
    customCSS: '',
    customJS: '',
    features: [] as string[],
  });

  // Fetch tenant data
  useEffect(() => {
    fetchTenant();
  }, [tenantId]);

  const fetchTenant = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/super-admin/tenants/${tenantId}`);
      if (response.ok) {
        const data: Tenant = await response.json();
        setTenant(data);
        
        // Parse features
        let features: string[] = [];
        try {
          features = JSON.parse(data.features || '[]');
        } catch {}
        
        setFormData({
          name: data.name,
          slug: data.slug,
          domain: data.domain || '',
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          logoUrl: data.logoUrl || '',
          faviconUrl: data.faviconUrl || '',
          backgroundImage: data.backgroundImage || '',
          defaultLanguage: data.defaultLanguage,
          currency: data.currency,
          currencySymbol: data.currencySymbol,
          locale: data.locale,
          timezone: data.timezone,
          countryName: data.countryName,
          countryCode: data.countryCode,
          phonePrefix: data.phonePrefix,
          isActive: data.isActive,
          isPublic: data.isPublic,
          planType: data.planType,
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          websiteUrl: data.websiteUrl || '',
          facebookUrl: data.facebookUrl || '',
          linkedinUrl: data.linkedinUrl || '',
          twitterUrl: data.twitterUrl || '',
          footerText: data.footerText || '',
          customCSS: data.customCSS || '',
          customJS: data.customJS || '',
          features,
        });
      } else {
        toast.error('Locataire non trouvé');
        router.push('/super-admin/tenants');
      }
    } catch (error) {
      console.error('Error fetching tenant:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Locataire mis à jour avec succès');
        fetchTenant(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const handleDangerAction = async () => {
    if (!dangerAction) return;

    try {
      if (dangerAction === 'deactivate') {
        const response = await fetch(`/api/super-admin/tenants/${tenantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: false }),
        });
        if (response.ok) {
          toast.success('Locataire désactivé');
        }
      } else if (dangerAction === 'delete') {
        const response = await fetch(`/api/super-admin/tenants/${tenantId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          toast.success('Locataire supprimé');
          router.push('/super-admin/tenants');
          return;
        }
      }
      
      setDangerDialogOpen(false);
      setDangerAction(null);
      fetchTenant();
    } catch (error) {
      toast.error('Erreur lors de l\'action');
    }
  };

  const toggleFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p>Locataire non trouvé</p>
        <Link href="/super-admin/tenants">
          <Button className="mt-4">Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  const availableFeatures = [
    { id: 'catalog', name: 'Catalogue Produits', icon: '📦' },
    { id: 'rfq', name: "Appels d'offres", icon: '📋' },
    { id: 'messaging', name: 'Messagerie', icon: '💬' },
    { id: 'payments', name: 'Paiements', icon: '💳' },
    { id: 'reviews', name: 'Avis & Notations', icon: '⭐' },
    { id: 'analytics', name: 'Analytiques', icon: '📊' },
    { id: 'whiteLabel', name: 'White-Label', icon: '🏷️' },
    { id: 'customDomain', name: 'Domaine personnalisé', icon: '🌐' },
    { id: 'apiAccess', name: 'Accès API', icon: '🔌' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/tenants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: formData.primaryColor }}
              >
                {formData.name.charAt(0).toUpperCase()}
              </span>
              {formData.name}
            </h1>
            <p className="text-gray-500">{formData.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={formData.isActive ? 'default' : 'secondary'}>
            {formData.isActive ? 'Actif' : 'Inactif'}
          </Badge>
          <Badge variant="outline">{formData.planType}</Badge>
        </div>
      </div>

      {/* Main Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="basic" className="gap-2">
            <Building2 className="h-4 w-4 hidden sm:inline" />
            Base
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4 hidden sm:inline" />
            Marque
          </TabsTrigger>
          <TabsTrigger value="localization" className="gap-2">
            <Globe className="h-4 w-4 hidden sm:inline" />
            Localisation
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <Settings className="h-4 w-4 hidden sm:inline" />
            Fonctions
          </TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Code className="h-4 w-4 hidden sm:inline" />
            Avancé
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
              <CardDescription>Configuration essentielle du locataire</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domaine personnalisé</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="ex: tunisiatrade.tn"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-3 pt-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <label className="text-sm">
                      {formData.isActive ? 'Actif' : 'Inactif'}
                    </label>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-3 pt-2">
                    <Switch
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                    />
                    <label className="text-sm">
                      Visible dans le marketplace public
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personnalisation visuelle</CardTitle>
              <CardDescription>Couleurs et images de marque</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                  <div className="space-y-4">
                    <Label>Images & Assets</Label>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="logoUrl" className="text-sm text-gray-500">URL du Logo</Label>
                        <Input
                          id="logoUrl"
                          value={formData.logoUrl}
                          onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="faviconUrl" className="text-sm text-gray-500">URL du Favicon</Label>
                        <Input
                          id="faviconUrl"
                          value={formData.faviconUrl}
                          onChange={(e) => setFormData(prev => ({ ...prev, faviconUrl: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="backgroundImage" className="text-sm text-gray-500">Image de fond</Label>
                        <Input
                          id="backgroundImage"
                          value={formData.backgroundImage}
                          onChange={(e) => setFormData(prev => ({ ...prev, backgroundImage: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-4">
                  <Label>Aperçu en temps réel</Label>
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    <div 
                      className="px-4 py-3 flex items-center gap-3"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="" className="w-8 h-8 object-contain bg-white rounded p-0.5" />
                      ) : (
                        <div className="w-8 h-8 bg-white/20 rounded"></div>
                      )}
                      <span className="text-white font-semibold">{formData.name || 'Nom'}</span>
                    </div>
                    
                    <div className="p-4 space-y-3 bg-white">
                      <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                      
                      <div className="flex gap-2 mt-4">
                        <div 
                          className="px-3 py-1.5 rounded text-white text-sm"
                          style={{ backgroundColor: formData.primaryColor }}
                        >
                          Principal
                        </div>
                        <div 
                          className="px-3 py-1.5 rounded text-sm border"
                          style={{ borderColor: formData.secondaryColor, color: formData.secondaryColor }}
                        >
                          Secondaire
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {formData.footerText && (
                    <div className="p-3 bg-gray-50 rounded text-xs text-gray-600 text-center">
                      {formData.footerText}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Localization Tab */}
        <TabsContent value="localization" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Localisation</CardTitle>
              <CardDescription>Paramètres régionaux et linguistiques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Pays</Label>
                  <Input
                    value={formData.countryName}
                    onChange={(e) => setFormData(prev => ({ ...prev, countryName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code pays</Label>
                  <Input
                    value={formData.countryCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value.toUpperCase() }))}
                    maxLength={2}
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Préfixe téléphonique</Label>
                  <Input
                    value={formData.phonePrefix}
                    onChange={(e) => setFormData(prev => ({ ...prev, phonePrefix: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Langue par défaut</Label>
                  <Select
                    value={formData.defaultLanguage}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, defaultLanguage: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Locale</Label>
                  <Input
                    value={formData.locale}
                    onChange={(e) => setFormData(prev => ({ ...prev, locale: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fuseau horaire</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Algiers">Africa/Algiers</SelectItem>
                      <SelectItem value="Africa/Tunis">Africa/Tunis</SelectItem>
                      <SelectItem value="Africa/Casablanca">Africa/Casablanca</SelectItem>
                      <SelectItem value="Africa/Cairo">Africa/Cairo</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <Input
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Symbole de devise</Label>
                  <Input
                    value={formData.currencySymbol}
                    onChange={(e) => setFormData(prev => ({ ...prev, currencySymbol: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Fonctionnalités activées</CardTitle>
              <CardDescription>Sélectionnez les fonctionnalités disponibles pour ce locataire</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableFeatures.map((feature) => (
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
                      onChange={() => toggleFeature(feature.id)}
                      className="mt-1 h-4 w-4 text-primary rounded"
                    />
                    <div>
                      <span className="text-lg">{feature.icon}</span>
                      <div className="font-medium">{feature.name}</div>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 Les fonctionnalités disponibles dépendent du plan. Le plan actuel est <strong>{formData.planType}</strong>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de contact</CardTitle>
              <CardDescription>Email, téléphone et réseaux sociaux</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Email de contact</Label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Site web</Label>
                  <Input
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <Input
                    value={formData.facebookUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn</Label>
                  <Input
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Twitter / X</Label>
                  <Input
                    value={formData.twitterUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, twitterUrl: e.target.value }))}
                    placeholder="https://twitter.com/..."
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Texte de pied de page</Label>
                <Textarea
                  value={formData.footerText}
                  onChange={(e) => setFormData(prev => ({ ...prev, footerText: e.target.value }))}
                  rows={2}
                  placeholder="© 2024 Votre Entreprise. Tous droits réservés."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan Tab */}
        <TabsContent value="plan" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan d&apos;abonnement</CardTitle>
              <CardDescription>Gestion du plan et de la facturation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Plan actuel</Label>
                  <Select
                    value={formData.planType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, planType: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratuit</SelectItem>
                      <SelectItem value="professional">Professionnel ($99/mois)</SelectItem>
                      <SelectItem value="enterprise">Entreprise ($299/mois)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Date de fin d&apos;abonnement</Label>
                  <Input
                    type="date"
                    value={tenant?.subscriptionEnd ? new Date(tenant.subscriptionEnd).toISOString().split('T')[0] : ''}
                    disabled
                  />
                  <p className="text-xs text-gray-500">
                    {tenant?.subscriptionEnd 
                      ? `Expire le ${new Date(tenant.subscriptionEnd).toLocaleDateString('fr-FR')}`
                      : 'Aucune date définie'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Comparaison des plans</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Fonctionnalité</th>
                        <th className="text-center py-2">Gratuit</th>
                        <th className="text-center py-2">Pro</th>
                        <th className="text-center py-2">Entreprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Utilisateurs', '100', '1,000', '∞'],
                        ['Produits', '500', '10,000', '∞'],
                        ['Catalogue', '✓', '✓', '✓'],
                        ['RFQ', '✓', '✓', '✓'],
                        ['Messagerie', '✓', '✓', '✓'],
                        ['Paiements', '', '✓', '✓'],
                        ['Analytiques', '', '✓', '✓'],
                        ['White-Label', '', '', '✓'],
                        ['Domaine perso.', '', '', '✓'],
                        ['API Access', '', '', '✓'],
                      ].map(([feature, free, pro, enterprise], i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">{feature}</td>
                          <td className="text-center py-2">{free}</td>
                          <td className="text-center py-2">{pro}</td>
                          <td className="text-center py-2">{enterprise}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Code personnalisé</CardTitle>
              <CardDescription>CSS et JavaScript personnalisés (avancé)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="customCSS">CSS Personnalisé</Label>
                <Textarea
                  id="customCSS"
                  value={formData.customCSS}
                  onChange={(e) => setFormData(prev => ({ ...prev, customCSS: e.target.value }))}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder="/* Votre CSS ici */&#10;.custom-class { color: red; }"
                />
                <p className="text-xs text-gray-500">
                  Ce CSS sera injecté après les styles principaux. Utilisez avec précaution.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customJS">JavaScript Personnalisé</Label>
                <Textarea
                  id="customJS"
                  value={formData.customJS}
                  onChange={(e) => setFormData(prev => ({ ...prev, customJS: e.target.value }))}
                  rows={6}
                  className="font-mono text-sm"
                  placeholder="// Votre JS ici&#10;console.log('Custom JS loaded');"
                />
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Attention: Le JavaScript personnalisé peut poser des risques de sécurité.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Zone de danger</CardTitle>
              <CardDescription>Actions irréversibles sur ce locataire</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium">Désactiver le locataire</p>
                  <p className="text-sm text-gray-500">
                    Le locataire sera inaccessible jusqu&apos;à sa réactivation.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setDangerAction('deactivate');
                    setDangerDialogOpen(true);
                  }}
                >
                  Désactiver
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-600">Supprimer le locataire</p>
                  <p className="text-sm text-gray-500">
                    Cette action supprimera définitivement toutes les données associées.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDangerAction('delete');
                    setDangerDialogOpen(true);
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-3 sticky bottom-4">
        <Button
          variant="outline"
          onClick={fetchTenant}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Réinitialiser
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder
            </>
          )}
        </Button>
      </div>

      {/* Danger Action Confirmation Dialog */}
      <Dialog open={dangerDialogOpen} onOpenChange={setDangerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dangerAction === 'deactivate' ? 'Désactiver le locataire' : 'Supprimer le locataire'}
            </DialogTitle>
            <DialogDescription>
              {dangerAction === 'deactivate' 
                ? `Êtes-vous sûr de vouloir désactiver "${formData.name}" ? Les utilisateurs ne pourront plus accéder à cette plateforme.`
                : `Êtes-vous sûr de vouloir SUPPRIMER "${formData.name}" ? Cette action est IRRÉVERSIBLE et supprimera toutes les données.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDangerDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant={dangerAction === 'delete' ? 'destructive' : 'default'}
              onClick={handleDangerAction}
            >
              {dangerAction === 'deactivate' ? 'Désactiver' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
