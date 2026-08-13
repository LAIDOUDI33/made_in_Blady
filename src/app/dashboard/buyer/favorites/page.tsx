'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Heart,
  Search,
  Trash2,
  MessageSquare,
  ExternalLink,
  PlusCircle,
  Package,
  Building2,
  Star,
  MapPin,
  ShoppingBag,
  Grid3X3,
  LayoutList
} from 'lucide-react';

// Mock favorite products
const mockFavoriteProducts = [
  {
    id: 'prod-001',
    name: 'Ciment Portland CEM I 42.5',
    slug: 'ciment-portland-cem-i-42-5',
    supplier: 'Cimenterie d\'Algérie - SCUM',
    supplierId: 'comp-001',
    price: 12500,
    currency: 'DZD',
    unit: 'sac (50kg)',
    image: null,
    rating: 4.8,
    reviewCount: 124,
    category: 'Matériaux Construction',
    savedAt: '2024-01-10T14:30:00',
    inStock: true,
  },
  {
    id: 'prod-002',
    name: 'Acier HA Fe E400 Ø12',
    slug: 'acier-ha-fe-e400-o12',
    supplier: 'AcierPro SARL',
    supplierId: 'comp-002',
    price: 185000,
    currency: 'DZD',
    unit: 'tonne',
    image: null,
    rating: 4.6,
    reviewCount: 89,
    category: 'Fer & Acier',
    savedAt: '2024-01-12T09:15:00',
    inStock: true,
  },
  {
    id: 'prod-003',
    name: 'Brique Creuse 12 Trous 30x20x10cm',
    slug: 'brique-creuse-12-trous',
    supplier: 'Briqueterie Moderne',
    supplierId: 'comp-003',
    price: 14,
    currency: 'DZD',
    unit: 'unité',
    image: null,
    rating: 4.5,
    reviewCount: 56,
    category: 'Matériaux Construction',
    savedAt: '2024-01-08T11:45:00',
    inStock: true,
  },
  {
    id: 'prod-004',
    name: 'Peinture Façade Premium RAL 9010 Blanc',
    slug: 'peinture-facade-premium-ral-9010',
    supplier: 'Villa Import SARL',
    supplierId: 'comp-004',
    price: 2800,
    currency: 'DZD',
    unit: 'litre',
    image: null,
    rating: 4.7,
    reviewCount: 203,
    category: 'Peintures & Enduits',
    savedAt: '2024-01-05T16:20:00',
    inStock: false,
  },
  {
    id: 'prod-005',
    name: 'Gravier Concassé 3/8',
    slug: 'gravier-concassee-3-8',
    supplier: 'Carrières du Sud',
    supplierId: 'comp-005',
    price: 4500,
    currency: 'DZD',
    unit: 'm³',
    image: null,
    rating: 4.9,
    reviewCount: 67,
    category: 'Agrégats',
    savedAt: '2024-01-03T10:00:00',
    inStock: true,
  },
  {
    id: 'prod-006',
    name: 'Câble Unipolaire H07V-U 2.5mm²',
    slug: 'cable-unipolaire-h07v-u-25mm2',
    supplier: 'ÉlectroAlgérie',
    supplierId: 'comp-006',
    price: 185,
    currency: 'DZD',
    unit: 'mètre',
    image: null,
    rating: 4.4,
    reviewCount: 145,
    category: 'Électricité',
    savedAt: '2024-01-01T14:30:00',
    inStock: true,
  },
];

// Mock favorite suppliers
const mockFavoriteSuppliers = [
  {
    id: 'comp-001',
    name: 'Cimenterie d\'Algérie - SCUM',
    slug: 'cimenterie-d-algerie-scum',
    logo: null,
    category: 'Matériaux de Construction',
    location: 'Alger (16)',
    rating: 4.8,
    reviewCount: 342,
    productsCount: 24,
    responseRate: 95,
    isVerified: true,
    lastActive: '2024-01-14T10:30:00',
    savedAt: '2024-01-10T14:30:00',
  },
  {
    id: 'comp-002',
    name: 'AcierPro SARL',
    slug: 'acierpro-sarl',
    logo: null,
    category: 'Métallurgie & Acier',
    location: 'Oran (31)',
    rating: 4.6,
    reviewCount: 189,
    productsCount: 45,
    responseRate: 88,
    isVerified: true,
    lastActive: '2024-01-13T15:20:00',
    savedAt: '2024-01-12T09:15:00',
  },
  {
    id: 'comp-003',
    name: 'Briqueterie Moderne',
    slug: 'briquerie-moderne',
    logo: null,
    category: 'Matériaux de Construction',
    location: 'Constantine (25)',
    rating: 4.5,
    reviewCount: 98,
    productsCount: 18,
    responseRate: 92,
    isVerified: true,
    lastActive: '2024-01-14T08:45:00',
    savedAt: '2024-01-08T11:45:00',
  },
  {
    id: 'comp-005',
    name: 'Carrières du Sud',
    slug: 'carrieres-du-sud',
    logo: null,
    category: 'Carrières & Granulats',
    location: 'Biskra (07)',
    rating: 4.9,
    reviewCount: 156,
    productsCount: 32,
    responseRate: 97,
    isVerified: true,
    lastActive: '2024-01-12T11:00:00',
    savedAt: '2024-01-03T10:00:00',
  },
];

type FavoriteProduct = typeof mockFavoriteProducts[0];
type FavoriteSupplier = typeof mockFavoriteSuppliers[0];
type ViewMode = 'grid' | 'list';

export default function BuyerFavoritesPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [productSearch, setProductSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Filter products
  const filteredProducts = mockFavoriteProducts.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.supplier.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filter suppliers
  const filteredSuppliers = mockFavoriteSuppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    supplier.category.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    supplier.location.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  // Handle selection for batch actions
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  // Handle remove from favorites
  const handleRemoveProduct = (id: string) => {
    console.log('Remove product:', id);
  };

  const handleRemoveSupplier = (id: string) => {
    console.log('Remove supplier:', id);
  };

  // Handle add to RFQ
  const handleAddToRFQ = () => {
    console.log('Add to RFQ:', selectedProducts);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Favoris</h1>
          <p className="text-gray-600 mt-1">
            Produits et fournisseurs sauvegardés pour un accès rapide
          </p>
        </div>
        
        {selectedProducts.length > 0 && activeTab === 'products' && (
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={handleAddToRFQ}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter à un AO ({selectedProducts.length})
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Produits ({mockFavoriteProducts.length})
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Building2 className="h-4 w-4" />
            Fournisseurs ({mockFavoriteSuppliers.length})
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4 mt-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher dans les favoris..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {filteredProducts.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <Checkbox
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span>Tout sélectionner</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products Grid/List */}
          {filteredProducts.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all duration-200">
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleSelectOne(product.id)}
                        className="bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                    
                    {/* Remove Button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 z-10 h-8 w-8 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveProduct(product.id)}
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>

                    {/* Product Image Placeholder */}
                    <Link href={`/products/${product.slug}`} className="block">
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                        <Package className="h-16 w-16 text-gray-300 group-hover:text-green-500 transition-colors" />
                        
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Badge variant="secondary" className="bg-white/90">Rupture de stock</Badge>
                          </div>
                        )}
                      </div>
                    </Link>

                    <CardContent className="p-4">
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-medium text-gray-900 line-clamp-1 hover:text-green-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <p className="text-sm text-gray-500 mt-1 truncate">{product.supplier}</p>
                      
                      <div className="flex items-center mt-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium ml-1">{product.rating}</span>
                        <span className="text-xs text-gray-400 ml-1">({product.reviewCount})</span>
                      </div>

                      <div className="mt-3 pt-3 border-t flex items-end justify-between">
                        <div>
                          <span className={`text-lg font-bold ${!product.inStock ? 'text-gray-400' : 'text-green-600'}`}>
                            {product.price.toLocaleString('fr-DZ')} DZD
                          </span>
                          <span className="text-xs text-gray-500 ml-1">/{product.unit}</span>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/dashboard/buyer/messages/new?supplier=${product.supplierId}`}>
                              <MessageSquare className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/products/${product.slug}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        Sauvegardé le {new Date(product.savedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleSelectOne(product.id)}
                        />
                        
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package className="h-8 w-8 text-gray-300" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <Link href={`/products/${product.slug}`} className="font-medium text-gray-900 hover:text-green-600">
                                {product.name}
                              </Link>
                              <p className="text-sm text-gray-500">{product.supplier}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                                <span className="text-sm">{product.rating}</span>
                                <Badge variant="outline" className="text-xs">{product.category}</Badge>
                                {!product.inStock && (
                                  <Badge variant="destructive" className="text-xs">Rupture</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-green-600">
                                {product.price.toLocaleString('fr-DZ')} DZD
                              </p>
                              <p className="text-xs text-gray-400">/{product.unit}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/dashboard/buyer/messages/new?supplier=${product.supplierId}`}>
                              <MessageSquare className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleRemoveProduct(product.id)}
                          >
                            <Heart className="h-4 w-4 fill-current" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit favori trouvé</h3>
                <p className="text-gray-500 mb-4">
                  {productSearch ? 'Essayez une autre recherche' : 'Commencez à ajouter des produits à vos favoris'}
                </p>
                {!productSearch && (
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/products">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Explorer les Produits
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4 mt-6">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Rechercher un fournisseur..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Suppliers Grid */}
          {filteredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    {/* Header with Logo and Actions */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <Building2 className="h-7 w-7 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                            {supplier.isVerified && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 h-5">
                                ✓ Vérifié
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{supplier.category}</p>
                        </div>
                      </div>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveSupplier(supplier.id)}
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    </div>

                    {/* Stats */}
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
                        <span className="text-green-600 font-medium">{supplier.responseRate}%</span>
                        <span className="text-gray-400">réponse</span>
                      </div>
                    </div>

                    {/* Last Active */}
                    <p className="text-xs text-gray-400 mb-4">
                      Dernière activité: {new Date(supplier.lastActive).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link href={`/suppliers/${supplier.slug}`}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Profil
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link href={`/dashboard/buyer/messages/new?supplier=${supplier.id}`}>
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Contacter
                        </Link>
                      </Button>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-3 text-center">
                      Suivi depuis le {new Date(supplier.savedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun fournisseur suivi</h3>
                <p className="text-gray-500 mb-4">
                  {supplierSearch ? 'Essayez une autre recherche' : 'Commencez à suivre des fournisseurs'}
                </p>
                {!supplierSearch && (
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/suppliers">
                      <Building2 className="h-4 w-4 mr-2" />
                      Découvrir les Fournisseurs
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
