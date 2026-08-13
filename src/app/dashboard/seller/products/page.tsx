'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { PlusCircle, Package, Eye, Pencil, Trash2, Copy, ToggleLeft, ToggleRight, Image as ImageIcon } from 'lucide-react';

// Mock product data - in production this would come from API
interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  price: number | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  moq: number | null;
  unit: string | null;
  status: string;
  viewCount: number;
  image: string | null;
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Ciment Portland CEM I 42.5',
    sku: 'CPT-CEM42-001',
    category: 'Matériaux de Construction',
    price: null,
    priceRangeMin: 5800,
    priceRangeMax: 6200,
    moq: 100,
    unit: 'sac de 50kg',
    status: 'active',
    viewCount: 245,
    image: '/uploads/cement.jpg',
  },
  {
    id: '2',
    name: 'Acier HA Fe E400 Ø12',
    sku: 'ACR-HA400-12',
    category: 'Matériaux de Construction',
    price: 285000,
    priceRangeMin: null,
    priceRangeMax: null,
    moq: 25,
    unit: 'tonne',
    status: 'active',
    viewCount: 189,
    image: '/uploads/steel.jpg',
  },
  {
    id: '3',
    name: 'Brique Creuse Rouge 12 trous',
    sku: 'BRI-CRE-12T',
    category: 'Matériaux de Construction',
    price: 14,
    priceRangeMin: null,
    priceRangeMax: null,
    moq: 5000,
    unit: 'unité',
    status: 'active',
    viewCount: 356,
    image: '/uploads/brick.jpg',
  },
  {
    id: '4',
    name: 'Gravier Concassé 8/16',
    sku: 'GRV-CONC-816',
    category: 'Matériaux de Construction',
    price: 4500,
    priceRangeMin: null,
    priceRangeMax: null,
    moq: 10,
    unit: 'm³',
    status: 'draft',
    viewCount: 12,
    image: null,
  },
  {
    id: '5',
    name: 'Sable de Carrière Lavé 0/4',
    sku: 'SAB-LAV-04',
    category: 'Matériaux de Construction',
    price: 3800,
    priceRangeMin: null,
    priceRangeMax: null,
    moq: 10,
    unit: 'm³',
    status: 'active',
    viewCount: 278,
    image: '/uploads/sand.jpg',
  },
  {
    id: '6',
    name: 'Poutrelle Précontrainte HP4',
    sku: 'POU-HP4-STD',
    category: 'Préfabriqués',
    price: 8500,
    priceRangeMin: null,
    priceRangeMax: null,
    moq: 50,
    unit: 'unité (4m)',
    status: 'inactive',
    viewCount: 98,
    image: '/uploads/poutrelle.jpg',
  },
];

const columns = [
  {
    key: 'image' as const,
    label: 'Image',
    render: (_: unknown, row: Product) => (
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
        {row.image ? (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        ) : (
          <ImageIcon className="h-5 w-5 text-gray-400" />
        )}
      </div>
    ),
  },
  {
    key: 'name' as const,
    label: 'Produit',
    sortable: true,
    render: (_: unknown, row: Product) => (
      <div className="min-w-[200px]">
        <p className="font-medium text-gray-900">{row.name}</p>
        {row.sku && (
          <p className="text-xs text-gray-500 mt-0.5">SKU: {row.sku}</p>
        )}
      </div>
    ),
  },
  {
    key: 'category' as const,
    label: 'Catégorie',
    render: (value: unknown) => (
      <span className="text-sm text-gray-600">{String(value)}</span>
    ),
  },
  {
    key: 'price' as const,
    label: 'Prix',
    render: (_: unknown, row: Product) => {
      if (row.price) {
        return (
          <span className="font-medium text-gray-900">
            {row.price.toLocaleString('fr-DZ')} DZD
          </span>
        );
      }
      if (row.priceRangeMin && row.priceRangeMax) {
        return (
          <span className="text-sm text-gray-700">
            {row.priceRangeMin.toLocaleString('fr-DZ')} - {row.priceRangeMax.toLocaleString('fr-DZ')} DZD
          </span>
        );
      }
      return <span className="text-gray-400">Sur demande</span>;
    },
  },
  {
    key: 'moq' as const,
    label: 'MOQ',
    render: (_: unknown, row: Product) => (
      <span className="text-sm text-gray-600">
        {row.moq ? `${row.moq} ${row.unit || ''}` : '-'}
      </span>
    ),
  },
  {
    key: 'status' as const,
    label: 'Statut',
    render: (value: unknown) => <StatusBadge status={String(value)} />,
  },
  {
    key: 'viewCount' as const,
    label: 'Vues',
    sortable: true,
    render: (value: unknown) => (
      <div className="flex items-center gap-1">
        <Eye className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-sm text-gray-600">{Number(value).toLocaleString('fr-FR')}</span>
      </div>
    ),
  },
];

export default function ProductsPage() {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<Product[]>(mockProducts);

  const handleBulkAction = async (action: string) => {
    console.log(`Bulk action: ${action} on rows:`, Array.from(selectedRows));
    // In production, call API here
    
    if (action === 'activate') {
      setProducts(prev => prev.map(p => 
        selectedRows.has(p.id) ? { ...p, status: 'active' as const } : p
      ));
    } else if (action === 'deactivate') {
      setProducts(prev => prev.map(p => 
        selectedRows.has(p.id) ? { ...p, status: 'inactive' as const } : p
      ));
    }
    
    setSelectedRows(new Set());
  };

  const getRowId = (row: Product) => row.id;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Produits</h1>
          <p className="text-gray-600 mt-1">Gérer votre catalogue produits</p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/dashboard/seller/products/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter un Produit
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Produits</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {products.filter(p => p.status === 'active').length}
                </p>
              </div>
              <ToggleRight className="h-8 w-8 text-green-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Brouillons</p>
                <p className="text-2xl font-bold text-orange-600">
                  {products.filter(p => p.status === 'draft').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vues</p>
                <p className="text-2xl font-bold text-purple-600">
                  {products.reduce((sum, p) => sum + p.viewCount, 0).toLocaleString('fr-FR')}
                </p>
              </div>
              <Eye className="h-8 w-8 text-purple-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            data={products}
            columns={columns}
            searchable={true}
            searchPlaceholder="Rechercher par nom ou SKU..."
            searchKeys={['name', 'sku']}
            selectable={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            getRowId={getRowId}
            filterable={true}
            filters={{
              key: 'status',
              label: 'Statut',
              options: [
                { value: 'active', label: 'Actif' },
                { value: 'inactive', label: 'Inactif' },
                { value: 'draft', label: 'Brouillon' },
              ],
            }}
            bulkActions={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                  <ToggleRight className="h-4 w-4 mr-1" /> Activer
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                  <ToggleLeft className="h-4 w-4 mr-1" /> Désactiver
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('delete')} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                </Button>
              </div>
            }
            actions={(row) => (
              <>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/dashboard/seller/products/${row.id}/edit`}>
                    <Eye className="mr-2 h-4 w-4" /> Voir
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/dashboard/seller/products/${row.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" /> Modifier
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Copy className="mr-2 h-4 w-4" /> Dupliquer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                </DropdownMenuItem>
              </>
            )}
            emptyMessage="Aucun produit trouvé. Commencez par ajouter votre premier produit !"
          />
        </CardContent>
      </Card>
    </div>
  );
}
