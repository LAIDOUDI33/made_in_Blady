'use client';

import React, { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Upload,
  Camera,
  Save,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Factory,
  Award,
  Star,
  ExternalLink
} from 'lucide-react';

// Types
interface CompanyData {
  name: string;
  slug: string;
  legalForm: string;
  rcNumber: string;
  nif: string;
  nis: string;
  website: string;
  description: string;
  logo: string | null;
  coverImage: string | null;
  yearEstablished: number | null;
  employeeCount: number | null;
  productionCapacity: string;
  exportCapability: boolean;
  verificationStatus: string;
  rating: number;
  reviewCount: number;
  responseRate: number;
  wilaya: string;
  commune: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  certifications: string[];
}

// Mock company data - in production this would come from API
const mockCompanyData: CompanyData = {
  name: 'Béton & Matériaux SARL',
  slug: 'beton-materiaux-sarl',
  legalForm: 'SARL',
  rcNumber: '16/00-123456',
  nif: '000012345678901',
  nis: '0000123456789',
  website: 'www.betonmateriaux.dz',
  description: `Béton & Matériaux SARL est un leader algérien dans la distribution de matériaux de construction depuis 2015. Nous fournissons une gamme complète de produits de qualité supérieure pour les professionnels du bâtiment et les particuliers.

Notre mission est d'accompagner tous vos projets de construction en vous garantissant des produits fiables, des prix compétitifs et un service client irréprochable.

Nous disposons d'un vaste réseau logistique couvrant l'ensemble du territoire national, avec plusieurs dépôts stratégiquement situés pour assurer des délais de livraison optimaux.`,
  logo: null,
  coverImage: null,
  yearEstablished: 2015,
  employeeCount: 85,
  productionCapacity: '5000 tonnes/mois',
  exportCapability: false,
  verificationStatus: 'VERIFIED',
  rating: 4.7,
  reviewCount: 156,
  responseRate: 94.5,
  wilaya: 'Alger',
  commune: 'Oued Smar',
  address: 'Zone Industrielle Oued Smar, Rue des Entreprises N°45',
  contactEmail: 'contact@betonmateriaux.dz',
  contactPhone: '+213 555 123 456',
  certifications: ['ISO 9001:2015', 'Certification Qualibat', 'Norme Algérienne NA 156'],
};

const legalForms = [
  'SARL (Société à Responsabilité Limitée)',
  'EURL (Entreprise Unipersonnelle à Responsabilité Limitée)',
  'SPA (Société par Actions)',
  'SNC (Société en Nom Collectif)',
  'SCS (Société en Commandite Simple)',
  'Etablissement Individual',
];

const algerianWilayas = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar', 'Blida', 'Bouira',
  'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda',
  'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', "M'sila", 'Mascara', 'Ouargla',
  'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arreridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
  'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar',
  'Ouled Djellal', 'Béni Abbès', 'In Salah', 'In Guezzam', 'Tougourt', 'Djanet', 'El M\'Ghair', 'El Menia'
];

export default function CompanyProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    slug: '',
    legalForm: '',
    rcNumber: '',
    nif: '',
    nis: '',
    website: '',
    description: '',
    logo: null,
    coverImage: null,
    yearEstablished: null,
    employeeCount: null,
    productionCapacity: '',
    exportCapability: false,
    verificationStatus: 'PENDING',
    rating: 0,
    reviewCount: 0,
    responseRate: 0,
    wilaya: '',
    commune: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    certifications: [],
  });

  // Load company data on mount
  useEffect(() => {
    const loadCompany = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCompanyData(mockCompanyData);
      } catch (error) {
        console.error('Error loading company data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompany();
  }, []);

  const updateField = (field: keyof CompanyData, value: string | number | boolean | null) => {
    setCompanyData((prev) => ({
      ...prev,
      [field]: value,
      // Auto-generate slug when name changes
      ...(field === 'name' && typeof value === 'string' ? {
        slug: value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
      } : {}),
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateField('logo', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateField('coverImage', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Saving company data:', companyData);
      alert('Profil entreprise mis à jour avec succès !');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Une erreur est survenue.');
    } finally {
      setIsSaving(false);
    }
  };

  const getVerificationBadge = () => {
    switch (companyData.verificationStatus) {
      case 'VERIFIED':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Entreprise Vérifiée
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1">
            <Clock className="h-3 w-3" /> En Cours de Vérification
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
            <XCircle className="h-3 w-3" /> Vérification Rejetée
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil Entreprise</h1>
          <p className="text-gray-600 mt-1">Gérez les informations de votre entreprise</p>
        </div>
        <div className="flex items-center gap-3">
          {getVerificationBadge()}
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Modifier' : 'Aperçu Public'}
          </Button>
        </div>
      </div>

      {!showPreview ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="basic">Informations</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="mt-6 space-y-6">
            {/* Logo & Cover Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Images de Profil</CardTitle>
                <CardDescription>Logo et image de couverture de votre entreprise</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cover Image */}
                  <div className="md:col-span-2">
                    <Label className="block mb-2">Image de Couverture</Label>
                    <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-green-400 transition-colors">
                      {companyData.coverImage ? (
                        <>
                          <img
                            src={companyData.coverImage}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                          <label htmlFor="cover-upload" className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                            <span className="bg-white text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                              <Camera className="h-4 w-4" /> Changer
                            </span>
                          </label>
                        </>
                      ) : (
                        <label htmlFor="cover-upload" className="cursor-pointer h-full flex flex-col items-center justify-center">
                          <Upload className="h-10 w-10 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Ajouter une image de couverture</span>
                          <span className="text-xs text-gray-400">1200 x 300px recommandé</span>
                        </label>
                      )}
                      <input
                        id="cover-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverUpload}
                      />
                    </div>
                  </div>

                  {/* Logo */}
                  <div>
                    <Label className="block mb-2">Logo de l&apos;Entreprise</Label>
                    <div className="relative w-40 h-40 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-green-400 transition-colors mx-auto md:mx-0">
                      {companyData.logo ? (
                        <>
                          <img
                            src={companyData.logo}
                            alt="Logo"
                            className="w-full h-full object-contain p-2"
                          />
                          <label htmlFor="logo-upload" className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                            <Camera className="h-6 w-6 text-white" />
                          </label>
                        </>
                      ) : (
                        <label htmlFor="logo-upload" className="cursor-pointer h-full flex flex-col items-center justify-center">
                          <Building2 className="h-10 w-10 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500 text-center px-2">Logo</span>
                        </label>
                      )}
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </div>
                  </div>

                  {/* Basic Info Fields */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom de l&apos;Entreprise *</Label>
                      <Input
                        id="name"
                        placeholder="Nom légal de votre entreprise"
                        value={companyData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="legalForm">Forme Juridique *</Label>
                      <Select
                        value={companyData.legalForm}
                        onValueChange={(value) => updateField('legalForm', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {legalForms.map((form) => (
                            <SelectItem key={form} value={form}>
                              {form}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rcNumber">N° RC</Label>
                        <Input
                          id="rcNumber"
                          placeholder="Registre de Commerce"
                          value={companyData.rcNumber}
                          onChange={(e) => updateField('rcNumber', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nif">NIF</Label>
                        <Input
                          id="nif"
                          placeholder="Numéro Identification Fiscale"
                          value={companyData.nif}
                          onChange={(e) => updateField('nif', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nis">NIS</Label>
                      <Input
                        id="nis"
                        placeholder="Numéro Identification Statistique"
                        value={companyData.nis}
                        onChange={(e) => updateField('nis', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
                <CardDescription>Présentez votre entreprise aux acheteurs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">À propos de votre entreprise</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre activité, vos valeurs, votre expertise..."
                    rows={8}
                    value={companyData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Une description détaillée augmente la confiance des acheteurs
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Site Web</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.votresite.dz"
                    value={companyData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Coordonnées</CardTitle>
                <CardDescription>Informations de contact visibles par les acheteurs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email de Contact *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="contact@entreprise.dz"
                          className="pl-10"
                          value={companyData.contactEmail}
                          onChange={(e) => updateField('contactEmail', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+213 XXX XXX XXX"
                          className="pl-10"
                          value={companyData.contactPhone}
                          onChange={(e) => updateField('contactPhone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="wilaya">Wilaya *</Label>
                      <Select
                        value={companyData.wilaya}
                        onValueChange={(value) => updateField('wilaya', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {algerianWilayas.map((w) => (
                            <SelectItem key={w} value={w}>
                              {w}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commune">Commune</Label>
                      <Input
                        id="commune"
                        placeholder="Commune"
                        value={companyData.commune}
                        onChange={(e) => updateField('commune', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse Complète</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="address"
                      placeholder="Votre adresse complète"
                      rows={3}
                      className="pl-10"
                      value={companyData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations Complémentaires</CardTitle>
                <CardDescription>Détails sur votre capacité et historique</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="yearEstablished">Année de Création</Label>
                      <Input
                        id="yearEstablished"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        placeholder="Ex: 2015"
                        value={companyData.yearEstablished || ''}
                        onChange={(e) => updateField('yearEstablished', e.target.value ? Number(e.target.value) : null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeeCount">Nombre d&apos;Employés</Label>
                      <Select
                        value={String(companyData.employeeCount || '')}
                        onValueChange={(value) => updateField('employeeCount', value ? Number(value) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employés</SelectItem>
                          <SelectItem value="11-50">11-50 employés</SelectItem>
                          <SelectItem value="51-200">51-200 employés</SelectItem>
                          <SelectItem value="201-500">201-500 employés</SelectItem>
                          <SelectItem value="501+">500+ employés</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="productionCapacity">Capacité de Production</Label>
                      <Input
                        id="productionCapacity"
                        placeholder="Ex: 5000 tonnes/mois"
                        value={companyData.productionCapacity}
                        onChange={(e) => updateField('productionCapacity', e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Capacité d&apos;Export</p>
                        <p className="text-xs text-gray-500">Vous exportez vers d&apos;autres pays</p>
                      </div>
                      <Switch
                        checked={companyData.exportCapability}
                        onCheckedChange={(checked) => updateField('exportCapability', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Certifications & Agréments</CardTitle>
                <CardDescription>Affichez vos certifications pour renforcer votre crédibilité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Certifications Actuelles</Label>
                  
                  {companyData.certifications.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {companyData.certifications.map((cert, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="py-1.5 px-3 text-sm gap-1"
                        >
                          <Award className="h-3 w-3" />
                          {cert}
                          <button
                            onClick={() => {
                              setCompanyData(prev => ({
                                ...prev,
                                certifications: prev.certifications.filter((_, i) => i !== index)
                              }));
                            }}
                            className="ml-1 text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg">
                      Aucune certification ajoutée
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newCertification">Ajouter une Certification</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newCertification"
                      placeholder="Ex: ISO 9001:2015"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                          e.preventDefault();
                          setCompanyData(prev => ({
                            ...prev,
                            certifications: [...prev.certifications, (e.target as HTMLInputElement).value.trim()]
                          }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById('newCertification') as HTMLInputElement;
                        if (input?.value.trim()) {
                          setCompanyData(prev => ({
                            ...prev,
                            certifications: [...prev.certifications, input.value.trim()]
                          }));
                          input.value = '';
                        }
                      }}
                    >
                      Ajouter
                    </Button>
                  </div>
                </div>

                {/* Verification Status */}
                <Separator />

                <div className={`p-4 rounded-lg ${
                  companyData.verificationStatus === 'VERIFIED' ? 'bg-green-50' :
                  companyData.verificationStatus === 'PENDING' ? 'bg-yellow-50' :
                  'bg-red-50'
                }`}>
                  <div className="flex items-start gap-3">
                    {companyData.verificationStatus === 'VERIFIED' && (
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    {companyData.verificationStatus === 'PENDING' && (
                      <Clock className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    {companyData.verificationStatus === 'REJECTED' && (
                      <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`font-semibold ${
                        companyData.verificationStatus === 'VERIFIED' ? 'text-green-800' :
                        companyData.verificationStatus === 'PENDING' ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>
                        Statut de Vérification
                      </h4>
                      <p className={`text-sm mt-1 ${
                        companyData.verificationStatus === 'VERIFIED' ? 'text-green-700' :
                        companyData.verificationStatus === 'PENDING' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {companyData.verificationStatus === 'VERIFIED' && 
                          'Félicitations ! Votre entreprise a été vérifiée. Cela renforce la confiance des acheteurs.'
                        }
                        {companyData.verificationStatus === 'PENDING' && 
                          'Votre demande de vérification est en cours de traitement. Vous serez notifié dès qu\'elle sera validée.'
                        }
                        {companyData.verificationStatus === 'REJECTED' && 
                          'Votre demande de vérification a été rejetée. Veuillez vérifier vos documents et réessayer.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* Public Preview */
        <Card>
          <CardHeader>
            <CardTitle>Aperçu du Profil Public</CardTitle>
            <CardDescription>Voici comment votre profil apparaît aux acheteurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-xl overflow-hidden">
              {/* Cover */}
              <div className="h-48 bg-gradient-to-r from-green-600 to-green-800 relative">
                {companyData.coverImage && (
                  <img src={companyData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                )}
              </div>

              <div className="p-6">
                {/* Logo and Name */}
                <div className="flex items-end gap-4 -mt-16 relative z-10 mb-4">
                  <div className="w-32 h-32 bg-white rounded-xl shadow-lg p-2 flex items-center justify-center overflow-hidden">
                    {companyData.logo ? (
                      <img src={companyData.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="h-16 w-16 text-gray-300" />
                    )}
                  </div>
                  <div className="pb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{companyData.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {getVerificationBadge()}
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{companyData.rating}</span>
                        <span className="text-gray-400">({companyData.reviewCount} avis)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Users className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                    <p className="text-sm text-gray-600">{companyData.employeeCount || '-'} employés</p>
                  </div>
                  <div className="text-center">
                    <Factory className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                    <p className="text-sm text-gray-600">{companyData.productionCapacity || '-'}</p>
                  </div>
                  <div className="text-center">
                    <MapPin className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                    <p className="text-sm text-gray-600">{companyData.wilaya}, {companyData.commune}</p>
                  </div>
                  <div className="text-center">
                    <Globe className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                    <p className="text-sm text-gray-600">
                      {companyData.exportCapability ? 'Export' : 'Local'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {companyData.description && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">À propos</h3>
                    <p className="text-gray-600 whitespace-pre-line text-sm">
                      {companyData.description}
                    </p>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{companyData.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{companyData.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{companyData.address}</span>
                  </div>
                  {companyData.website && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Globe className="h-4 w-4" />
                      <a href={companyData.website.startsWith('http') ? companyData.website : `https://${companyData.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {companyData.website} <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Certifications */}
                {companyData.certifications.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Certifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {companyData.certifications.map((cert, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          <Award className="h-3 w-3" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="mt-6 pt-6 border-t">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Contacter le Fournisseur
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {!showPreview && (
        <div className="flex justify-end sticky bottom-4 z-10">
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 px-8"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder les Modifications'}
          </Button>
        </div>
      )}
    </div>
  );
}
