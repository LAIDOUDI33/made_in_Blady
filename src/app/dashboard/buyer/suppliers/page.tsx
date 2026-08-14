'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Search,
  Heart,
  MessageSquare,
  ExternalLink,
  Star,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  Bell,
  BellOff,
  Users,
  TrendingUp
} from 'lucide-react';

// Mock followed suppliers data - in production this would come from API
const mockSuppliers = [
  {
    id: 'comp-001',
    name: 'Cimenterie d\'Algérie - SCUM',
    slug: 'cimenterie-d-algerie-scum',
    logo: null,
    category: 'Matériaux de Construction',
    subcategories: ['Ciment', 'Liants Hydrauliques'],
    location: 'Alger (16)',
    wilayaCode: '16',
    rating: 4.8,
    reviewCount: 342,
    productsCount: 24,
    responseRate: 95,
    responseTime: '~4h',
    isVerified: true,
    isFollowed: true,
    hasNewProducts: true,
    newProductsCount: 3,
    lastActive: '2024-01-14T10:30:00',
    followDate: '2023-06-15',
    description: 'Leader algérien dans la production de ciment et matériaux de construction.',
  },
  {
    id: 'comp-002',
    name: 'AcierPro SARL',
    slug: 'acierpro-sarl',
    logo: null,
    category: 'Métallurgie & Acier',
    subcategories: ['Acier HA', 'Armatures', 'Treillis Soudés'],
    location: 'Oran (31)',
    wilayaCode: '31',
    rating: 4.6,
    reviewCount: 189,
    productsCount: 45,
    responseRate: 88,
    responseTime: '~6h',
    isVerified: true,
    isFollowed: true,
    hasNewProducts: false,
    newProductsCount: 0,
    lastActive: '2024-01-13T15:20:00',
    followDate: '2023-08-22',
    description: 'Spécialiste des produits en acier pour le BTP et l\'industrie.',
  },
  {
    id: 'comp-003',
    name: 'Briqueterie Moderne',
    slug: 'briquerie-moderne',
    logo: null,
    category: 'Matériaux de Construction',
    subcategories: ['Briques', 'Parpaings', 'Matériaux Terre Cuite'],
    location: 'Constantine (25)',
    wilayaCode: '25',
    rating: 4.5,
    reviewCount: 98,
    productsCount: 18,
    responseRate: 92,
    responseTime: '~3h',
    isVerified: true,
    isFollowed: true,
    hasNewProducts: true,
    newProductsCount: 5,
    lastActive: '2024-01-14T08:45:00',
    followDate: '2023-09-10',
    description: 'Fabricant de briques et matériaux de maçonnerie de qualité supérieure.',
  },
  {
    id: 'comp-004',
    name: 'Villa Import SARL',
    slug: 'villa-import-sarl',
    logo: null,
    category: 'Import & Distribution',
    subcategories: ['Peintures', 'Isolation', 'Quincaillerie'],
    location: 'Alger (16)',
    wilayaCode: '16',
    rating: 4.2,
    reviewCount: 67,
    productsCount: 156,
    responseRate: 72,
    responseTime: '~12h',
    isVerified: false,
    isFollowed: true,
    hasNewProducts: false,
    newProductsCount: 0,
    lastActive: '2024-01-12T14:30:00',
    followDate: '2023-11-05',
    description: 'Importateur de matériaux de construction depuis l\'Europe et la Turquie.',
  },
  {
    id: 'comp-005',
    name: 'Carrières du Sud',
    slug: 'carrieres-du-sud',
    logo: null,
    category: 'Carrières & Granulats',
    subcategories: ['Gravier', 'Sable', 'Remblais'],
    location: 'Biskra (07)',
    wilayaCode: '07',
    rating: 4.9,
    reviewCount: 156,
    productsCount: 32,
    responseRate: 97,
    responseTime: '~2h',
    isVerified: true,
    isFollowed: true,
    hasNewProducts: true,
    newProductsCount: 2,
    lastActive: '2024-01-14T09:15:00',
    followDate: '2023-07-18',
    description: 'Extraction et vente de granulats, sables et matériaux de carrière.',
  },
  {
    id: 'comp-006',
    name: 'ÉlectroAlgérie',
    slug: 'electro-algerie',
    logo: null,
    category: 'Électricité & Éclairage',
    subcategories: ['Câbles', 'Appareillage', 'Éclairage LED'],
    location: 'Blida (09)',
    wilayaCode: '09',
    rating: 4.4,
    reviewCount: 203,
    productsCount: 89,
    responseRate: 85,
    responseTime: '~5h',
    isVerified: true,
    isFollowed: true,
    hasNewProducts: false,
    newProductsCount: 0,
    lastActive: '2024-01-13T11:00:00',
    followDate: '2023-10-01',
    description: 'Distributeur de matériel électrique et solutions d\'éclairage professionnel.',
  },
];

type Supplier = typeof mockSuppliers[0];

export default function BuyerSuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [notificationsEnabled, setNotificationsEnabled] = useState<Record<string, boolean>>({
    'comp-001': true,
    'comp-002': true,
    'comp-003': true,
    'comp-005': true,
  });

  // Get unique categories and locations for filters
  const uniqueCategories = [...new Set(mockSuppliers.map(s => s.category))];
  const uniqueLocations = [...new Set(mockSuppliers.map(s => s.location))];

  // Filter suppliers
  const filteredSuppliers = mockSuppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter;
    const matchesLocation = locationFilter === 'all' || supplier.location === locationFilter;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Handle follow/unfollow
  const handleToggleFollow = (supplierId: string) => {
    console.log('Toggle follow:', supplierId);
  };

  // Handle notifications toggle
  const handleToggleNotifications = (supplierId: string) => {
    setNotificationsEnabled(prev => ({
      ...prev,
      [supplierId]: !prev[supplierId]
    }));
  };

  // Stats
  const totalSuppliers = mockSuppliers.length;
  const verifiedSuppliers = mockSuppliers.filter(s => s.isVerified).length;
  const suppliersWithNewProducts = mockSuppliers.filter(s => s.hasNewProducts).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fournisseurs Suivis</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos fournisseurs favoris et recevez leurs actualités
          </p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/suppliers">
            <Users className="h-4 w-4 mr-2" />
            Découvrir les Fournisseurs
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Fournisseurs Suivis</p>
              <p className="text-2xl font-bold text-gray-900">{totalSuppliers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Fournisseurs Vérifiés</p>
              <p className="text-2xl font-bold text-gray-900">{verifiedSuppliers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Nouveaux Produits</p>
              <p className="text-2xl font-bold text-gray-900">{suppliersWithNewProducts} fournisseurs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher un fournisseur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Wilaya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les wilayas</SelectItem>
                {uniqueLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* New Products Alert */}
      {suppliersWithNewProducts > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">
                    {suppliersWithNewProducts} fournisseur(s) ont publié de nouveaux produits
                  </p>
                  <p className="text-sm text-blue-700">
                    Consultez leurs nouveautés pour rester informé
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-100">
                Voir les Nouveautés
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
            {/* Header with gradient background */}
            <div className="h-24 bg-gradient-to-r from-green-500 to-emerald-600 relative">
              {/* Logo */}
              <div className="absolute -bottom-8 left-6 h-16 w-16 rounded-xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                {supplier.logo ? (
                  <img src={supplier.logo} alt={supplier.name} className="h-10 w-10 object-contain" />
                ) : (
                  <Building2 className="h-8 w-8 text-green-600" />
                )}
              </div>

              {/* Follow button */}
              <Button
                size="sm"
                variant="ghost"
                className={`absolute top-3 right-3 ${
                  supplier.isFollowed 
                    ? 'text-white/80 hover:text-white hover:bg-white/20' 
                    : 'bg-white/90 text-red-500 hover:bg-white'
                }`}
                onClick={() => handleToggleFollow(supplier.id)}
              >
                <Heart className={`h-4 w-4 ${supplier.isFollowed ? 'fill-current' : ''}`} />
              </Button>

              {/* New Products Badge */}
              {supplier.hasNewProducts && (
                <Badge className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 border-none">
                  +{supplier.newProductsCount} nouveaux
                </Badge>
              )}
            </div>

            <CardContent className="pt-10 pb-4">
              {/* Supplier Info */}
              <div className="mb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-1">
                      {supplier.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{supplier.category}</p>
                  </div>
                  
                  {supplier.isVerified && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 shrink-0">
                      ✓ Vérifié
                    </Badge>
                  )}
                </div>

                {supplier.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {supplier.description}
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium">{supplier.rating}</span>
                  <span className="text-gray-400">({supplier.reviewCount})</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span>{supplier.productsCount} produits</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{supplier.location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{supplier.responseTime}</span>
                </div>
              </div>

              {/* Response Rate Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Taux de réponse</span>
                  <span className="font-medium text-green-600">{supplier.responseRate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${supplier.responseRate}%` }}
                  />
                </div>
              </div>

              {/* Last Active */}
              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span>Actif il y a {getRelativeTime(supplier.lastActive)}</span>
                <span>Suivi depuis {new Date(supplier.followDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href={`/suppliers/${supplier.slug}`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Profil
                    </Link>
                  </Button>
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" asChild>
                    <Link href={`/dashboard/buyer/messages/new?supplier=${supplier.id}`}>
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Contacter
                    </Link>
                  </Button>
                </div>

                {/* Notifications Toggle */}
                <Button
                  size="sm"
                  variant="outline"
                  className={`w-full justify-start ${
                    notificationsEnabled[supplier.id] 
                      ? 'border-green-200 text-green-700 hover:bg-green-50' 
                      : 'text-gray-500'
                  }`}
                  onClick={() => handleToggleNotifications(supplier.id)}
                >
                  {notificationsEnabled[supplier.id] ? (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications activées
                    </>
                  ) : (
                    <>
                      <BellOff className="h-4 w-4 mr-2" />
                      Activer les notifications
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSuppliers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun fournisseur trouvé</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || categoryFilter !== 'all' || locationFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Commencez à suivre des fournisseurs pour voir leurs actualités ici'}
            </p>
            {!searchQuery && categoryFilter === 'all' && locationFilter === 'all' && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/suppliers">
                  <Users className="h-4 w-4 mr-2" />
                  Explorer les Fournisseurs
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to get relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "moins d'une heure";
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}j`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem`;
  return `${Math.floor(diffDays / 30)} mois`;
}
