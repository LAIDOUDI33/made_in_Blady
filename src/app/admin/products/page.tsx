'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  Package,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  AlertTriangle,
  Image as ImageIcon,
  Tag,
  Building2,
  Eye as ViewIcon,
  Calendar
} from 'lucide-react';

// Types
type ProductStatus = 'active' | 'draft' | 'reported' | 'suspended' | 'pending_review';

interface ProductData {
  id: string;
  name: string;
  slug: string;
  image?: string;
  companyName: string;
  companyId: string;
  category: string;
  price?: number | null;
  currency: string;
  status: ProductStatus;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  reportedAt?: string;
  reportReason?: string;
}

// Sample data
const sampleProducts: ProductData[] = [
  {
    id: '1',
    name: 'Serveur Dell PowerEdge R740',
    slug: 'serveur-dell-poweredge-r740',
    image: '/images/products/server.jpg',
    companyName: 'SARL Technologie Algerienne',
    companyId: '1',
    category: 'Informatique & IT',
    price: 450000,
    currency: 'DZD',
    status: 'active',
    viewCount: 234,
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-08-15T14:20:00Z',
  },
  {
    id: '2',
    name: 'Câble Ethernet Cat6 10m',
    slug: 'cable-ethernet-cat6-10m',
    companyName: 'EURL Industrie Moderne',
    companyId: '2',
    category: 'Réseaux & Télécoms',
    price: 2500,
    currency: 'DZD',
    status: 'active',
    viewCount: 567,
    createdAt: '2024-02-15T09:45:00Z',
    updatedAt: '2024-07-22T11:10:00Z',
  },
  {
    id: '3',
    name: 'Composants électroniques suspects',
    slug: 'composants-electroniques-suspects',
    image: '/images/products/electronics.jpg',
    companyName: 'Utilisateur inconnu',
    companyId: '99',
    category: 'Électronique',
    price: null,
    currency: 'DZD',
    status: 'reported',
    viewCount: 89,
    createdAt: '2024-03-10T16:00:00Z',
    updatedAt: '2024-08-12T09:30:00Z',
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reportReason: 'Description trompeuse et prix anormalement bas',
  },
  {
    id: '4',
    name: 'Meuble de bureau professionnel',
    slug: 'meuble-bureau-professionnel',
    companyName: 'Sarl Agro Solutions',
    companyId: '4',
    category: 'Mobilier de bureau',
    price: 85000,
    currency: 'DZD',
    status: 'draft',
    viewCount: 12,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    name: 'Logiciel ERP Enterprise',
    slug: 'logiciel-erp-enterprise',
    image: '/images/products/software.jpg',
    companyName: 'SARL Technologie Algerienne',
    companyId: '1',
    category: 'Logiciels',
    price: 2500000,
    currency: 'DZD',
    status: 'active',
    viewCount: 445,
    createdAt: '2024-04-05T11:20:00Z',
    updatedAt: '2024-08-18T16:45:00Z',
  },
  {
    id: '6',
    name: 'Produit contrefait signalé',
    slug: 'produit-contrefait-signale',
    companyName: 'Vendeur suspect',
    companyId: '88',
    category: 'Mode & Textile',
    price: 5000,
    currency: 'DZD',
    status: 'reported',
    viewCount: 156,
    createdAt: '2024-05-12T14:30:00Z',
    updatedAt: '2024-08-17T10:15:00Z',
    reportedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    reportReason: 'Suspicion de contrefaçon - images volées',
  },
];

const statusConfig: Record<ProductStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string; icon: React.ReactNode }> = {
  active: { 
    label: 'Actif', 
    variant: 'default', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  draft: { 
    label: 'Brouillon', 
    variant: 'secondary', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: null
  },
  reported: { 
    label: 'Signalé', 
    variant: 'destructive', 
    color: '',
    icon: <AlertTriangle className="h-3 w-3" />
  },
  suspended: { 
    label: 'Suspendu', 
    variant: 'outline', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="h-3 w-3" />
  },
  pending_review: { 
    label: 'En révision', 
    variant: 'outline', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <AlertTriangle className="h-3 w-3" />
  },
};

export default function ProductsModerationPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductData[]>(sampleProducts);
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get('status') || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'suspend' | 'delete'>('approve');
  const [selectedProductForAction, setSelectedProductForAction] = useState<ProductData | null>(null);

  // Apply filters using useMemo
  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Tab filter (status)
    if (activeTab !== 'all') {
      result = result.filter(p => p.status === activeTab);
    }
    
    // Category filter
    if (categoryFilter !== 'ALL') {
      result = result.filter(p => p.category === categoryFilter);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.companyName.toLowerCase().includes(query)
      );
    }

    // Sort: reported first, then by date
    result.sort((a, b) => {
      if (a.status === 'reported' && b.status !== 'reported') return -1;
      if (a.status !== 'reported' && b.status === 'reported') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [products, activeTab, searchQuery, categoryFilter]);

  // Stats
  const activeCount = products.filter(p => p.status === 'active').length;
  const draftCount = products.filter(p => p.status === 'draft').length;
  const reportedCount = products.filter(p => p.status === 'reported').length;

  // Handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectedProducts(checked ? filteredProducts.map(p => p.id) : []);
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts(prev =>
      checked ? [...prev, productId] : prev.filter(id => id !== productId)
    );
  };

  const handleActionClick = (product: ProductData, action: 'approve' | 'suspend' | 'delete') => {
    setSelectedProductForAction(product);
    setActionType(action);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedProductForAction) return;

    setProducts(prev => prev.map(p => {
      if (p.id === selectedProductForAction.id) {
        switch (actionType) {
          case 'approve':
            return { ...p, status: 'active' as const };
          case 'suspend':
            return { ...p, status: 'suspended' as const };
          case 'delete':
            return p; // Would be removed in real implementation
          default:
            return p;
        }
      }
      return p;
    }));

    setConfirmDialogOpen(false);
    setSelectedProductForAction(null);
  };

  const handleBulkApprove = () => {
    setProducts(prev => prev.map(p =>
      selectedProducts.includes(p.id) ? { ...p, status: 'active' as const } : p
    ));
    setSelectedProducts([]);
  };

  const handleBulkSuspend = () => {
    setProducts(prev => prev.map(p =>
      selectedProducts.includes(p.id) ? { ...p, status: 'suspended' as const } : p
    ));
    setSelectedProducts([]);
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return '-';
    return `${(price / 1000).toFixed(price >= 1000 ? 0 : 2)}K DZD`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const categories = ['ALL', ...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Produits</h1>
          <p className="text-gray-500 mt-1">Modérez et gérez tous les produits</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-gray-500">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{draftCount}</p>
                <p className="text-xs text-gray-500">Brouillons</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={reportedCount > 0 ? 'border-red-300 bg-red-50/30' : ''}>
          <CardContent className="pt-6">
            <div className={`flex items-center gap-3`}>
              <div className={`p-2 rounded-lg ${reportedCount > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reportedCount}</p>
                <p className="text-xs text-gray-500">Signalés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" className="gap-1">
              Tous ({products.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1">
              Actifs ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="draft" className="gap-1">
              Brouillons ({draftCount})
            </TabsTrigger>
            <TabsTrigger value="reported" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5 hidden sm:inline" /> Signalés ({reportedCount})
            </TabsTrigger>
            <TabsTrigger value="suspended" className="gap-1">
              Suspendus
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <Tag className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'ALL' ? 'Toutes les catégories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mt-4">
            <span className="text-sm font-medium text-green-800">
              {selectedProducts.length} produit(s) sélectionné(s)
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Button size="sm" onClick={handleBulkApprove}>
                <CheckCircle2 className="mr-1 h-3 w-3" /> Approuver
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkSuspend} className="text-red-600 hover:bg-red-50">
                <XCircle className="mr-1 h-3 w-3" /> Suspendre
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedProducts([])}>
                Effacer
              </Button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead className="hidden md:table-cell">Entreprise</TableHead>
                      <TableHead className="hidden lg:table-cell">Catégorie</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden md:table-cell">Vues</TableHead>
                      <TableHead className="hidden lg:table-cell">Date</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const status = statusConfig[product.status];
                      
                      return (
                        <TableRow 
                          key={product.id}
                          className={
                            product.status === 'reported' 
                              ? 'bg-red-50/30 hover:bg-red-50/50' 
                              : product.status === 'suspended'
                                ? 'opacity-60'
                                : ''
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                {product.image ? (
                                  <img 
                                    src={product.image} 
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate max-w-[180px]">
                                  {product.name}
                                </p>
                                {product.reportedAt && (
                                  <Badge variant="destructive" className="text-xs mt-0.5">
                                    Signalé
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1 text-sm">
                              <Building2 className="h-3.5 w-3.5 text-gray-400" />
                              <span className="truncate max-w-[120px]">{product.companyName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {formatPrice(product.price)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={status.variant}
                              className={`gap-1 ${status.color}`}
                            >
                              {status.icon}
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <ViewIcon className="h-3.5 w-3.5" />
                              {product.viewCount.toLocaleString('fr-FR')}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-sm text-gray-600">
                              {formatDate(product.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4" /> Voir le produit
                                </DropdownMenuItem>
                                
                                {product.status === 'reported' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-green-600 focus:text-green-600"
                                      onClick={() => handleActionClick(product, 'approve')}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approuver
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-red-600 focus:text-red-600"
                                      onClick={() => handleActionClick(product, 'suspend')}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" /> Suspendre
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {(product.status === 'active' || product.status === 'draft') && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-yellow-700 focus:text-yellow-700"
                                      onClick={() => handleActionClick(product, 'suspend')}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" /> Suspendre
                                    </DropdownMenuItem>
                                  </>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="cursor-pointer text-red-600 focus:text-red-600"
                                  onClick={() => handleActionClick(product, 'delete')}
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-1">Aucun produit trouvé</h3>
                  <p className="text-sm text-gray-500">Essayez de modifier vos filtres</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={
          actionType === 'approve' 
            ? 'Approuver le produit'
            : actionType === 'suspend'
              ? 'Suspendre le produit'
              : 'Supprimer le produit'
        }
        description={
          actionType === 'approve'
            ? `Êtes-vous sûr de vouloir approuver "${selectedProductForAction?.name}" ? Le produit sera visible pour tous les utilisateurs.`
            : actionType === 'suspend'
              ? `Êtes-vous sûr de vouloir suspendre "${selectedProductForAction?.name}" ? Le produit ne sera plus visible.`
              : `Êtes-vous sûr de vouloir supprimer définitivement "${selectedProductForAction?.name}" ? Cette action est irréversible.`
        }
        confirmText={
          actionType === 'approve' 
            ? 'Approuver'
            : actionType === 'suspend'
              ? 'Suspendre'
              : 'Supprimer'
        }
        variant={actionType === 'approve' ? 'default' : 'destructive'}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
