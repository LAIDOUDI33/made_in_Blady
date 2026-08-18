'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Filter,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  ArrowUpDown,
} from 'lucide-react'

// Types
interface InventoryItem {
  id: string
  externalProductId: string
  internalProductId: string
  externalSku: string
  internalSku: string
  productName: string
  quantity: number
  lastSyncedAt: Date
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR' | 'CONFLICT'
}

interface InventoryStatusProps {
  connectorId?: string
}

// Sample data for demonstration
const SAMPLE_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    externalProductId: 'MAT-001',
    internalProductId: 'prod_123',
    externalSku: 'MAT-001',
    internalSku: 'SKU-001',
    productName: 'Huile d\'olive extra vierge 5L',
    quantity: 150,
    lastSyncedAt: new Date(Date.now() - 15 * 60 * 1000),
    syncStatus: 'SYNCED',
  },
  {
    id: '2',
    externalProductId: 'MAT-002',
    internalProductId: 'prod_124',
    externalSku: 'MAT-002',
    internalSku: 'SKU-002',
    productName: 'Date Deglet Nour (1kg)',
    quantity: 500,
    lastSyncedAt: new Date(Date.now() - 30 * 60 * 1000),
    syncStatus: 'SYNCED',
  },
  {
    id: '3',
    externalProductId: 'MAT-003',
    internalProductId: 'prod_125',
    externalSku: 'MAT-003',
    internalSku: 'SKU-003',
    productName: 'Couscous grain fin (1kg)',
    quantity: 0,
    lastSyncedAt: new Date(Date.now() - 60 * 60 * 1000),
    syncStatus: 'ERROR',
  },
  {
    id: '4',
    externalProductId: 'MAT-004',
    internalProductId: 'prod_126',
    externalSku: 'MAT-004',
    internalSku: 'SKU-004',
    productName: 'Farine de blé T55 (25kg)',
    quantity: 8,
    lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    syncStatus: 'SYNCED',
  },
  {
    id: '5',
    externalProductId: null,
    internalProductId: 'prod_127',
    externalSku: '',
    internalSku: 'SKU-007',
    productName: 'Miel de thym (500g)',
    quantity: 25,
    lastSyncedAt: new Date(),
    syncStatus: 'PENDING',
  },
]

export default function InventoryStatus({ connectorId }: InventoryStatusProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>(SAMPLE_INVENTORY)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Filter inventory based on search and status
  const filteredInventory = inventory.filter(item => {
    // Status filter
    if (filterStatus !== 'all' && item.syncStatus !== filterStatus) return false
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        item.productName.toLowerCase().includes(query) ||
        item.externalSku.toLowerCase().includes(query) ||
        item.internalSku.toLowerCase().includes(query) ||
        item.externalProductId?.toLowerCase().includes(query)
      )
    }
    
    return true
  })

  // Calculate stats
  const totalProducts = inventory.length
  const syncedCount = inventory.filter(i => i.syncStatus === 'SYNCED').length
  const pendingCount = inventory.filter(i => i.syncStatus === 'PENDING').length
  const errorCount = inventory.filter(i => i.syncStatus === 'ERROR').length
  const lowStockCount = inventory.filter(i => i.quantity > 0 && i.quantity <= 10).length
  const outOfStockCount = inventory.filter(i => i.quantity === 0).length

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'CONFLICT':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">Synchronisé</Badge>
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-600">En attente</Badge>
      case 'ERROR':
        return <Badge variant="destructive">Erreur</Badge>
      case 'CONFLICT':
        return <Badge variant="outline" className="border-orange-300 text-orange-600">Conflit</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructif" className="bg-red-100 text-red-700 border-red-200">Rupture</Badge>
    } else if (quantity <= 10) {
      return <Badge variant="outline" className="border-yellow-300 text-yellow-600">Stock faible</Badge>
    } else {
      return <Badge variant="default" className="bg-blue-100 text-blue-700 border-blue-200">Disponible</Badge>
    }
  }

  const formatDateTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    
    const diffHours = Math.floor(diffMins / (1000 * 60 * 60))
    if (diffHours < 24) return `Il y a ${diffHours}h`
    
    return date.toLocaleDateString('fr-FR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Statut de l'inventaire synchronisé
          </h3>
          <p className="text-sm text-gray-500">
            Vue d'ensemble des produits synchronisés avec l'ERP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold">{totalProducts}</p>
            <p className="text-xs text-gray-500">Total produits</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold text-green-600">{syncedCount}</p>
            <p className="text-xs text-gray-500">Synchronisés</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-gray-500">En attente</p>
          </CardContent>
        </Card>

        <Card className={errorCount > 0 ? 'border-red-300 bg-red-50/30' : ''}>
          <CardContent className="pt-4 pb-3">
            <p className={`text-xl font-bold ${errorCount > 0 ? 'text-red-600' : ''}`}>{errorCount}</p>
            <p className="text-xs text-gray-500">Erreurs</p>
          </CardContent>
        </Card>

        <Card className={lowStockCount > 0 ? 'border-yellow-300 bg-yellow-50/30' : ''}>
          <CardContent className="pt-4 pb-3">
            <p className={`text-xl font-bold ${lowStockCount > 0 ? 'text-yellow-600' : ''}`}>{lowStockCount}</p>
            <p className="text-xs text-gray-500">Stock faible</p>
          </CardContent>
        </Card>

        <Card className={outOfStockCount > 0 ? 'border-red-300 bg-red-50/30' : ''}>
          <CardContent className="pt-4 pb-3">
            <p className={`text-xl font-bold ${outOfStockCount > 0 ? 'text-red-600' : ''}`}>{outOfStockCount}</p>
            <p className="text-xs text-gray-500">Rupture</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="SYNCED">Synchronisé</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="ERROR">Erreur</SelectItem>
            <SelectItem value="CONFLICT">Conflit</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Trier
        </Button>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          {filteredInventory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>SKU ERP</TableHead>
                  <TableHead>SKU Local</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead>Statut Sync</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Dernière sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow 
                    key={item.id}
                    className={item.syncStatus === 'ERROR' ? 'bg-red-50/30' : ''}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-gray-500 font-mono">{item.internalProductId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {item.externalSku || '-'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-blue-50 px-2 py-1 rounded">
                        {item.internalSku}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${
                        item.quantity === 0 ? 'text-red-600' :
                        item.quantity <= 10 ? 'text-yellow-600' :
                        'text-gray-900'
                      }`}>
                        {item.quantity.toLocaleString('fr-FR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.syncStatus)}
                        {getStatusBadge(item.syncStatus)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStockBadge(item.quantity)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDateTime(item.lastSyncedAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Aucun produit trouvé</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery || filterStatus !== 'all'
                  ? 'Aucun résultat pour ces filtres'
                  : 'Commencez par configurer une intégration ERP'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
