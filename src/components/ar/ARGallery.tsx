'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Grid3X3,
  List,
  Search,
  SlidersHorizontal,
  Eye,
  Smartphone,
  Loader2,
  Box,
  TrendingUp,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============================================
// Types
// ============================================

interface ARProduct {
  id: string
  productId: string
  name: string
  modelUrl: string
  thumbnailUrl?: string
  format: string
  category?: string
  viewsCount: number
  createdAt: string
}

interface ARGalleryProps {
  onProductSelect?: (productId: string) => void
  onARLaunch?: (productId: string) => void
  className?: string
}

type ViewMode = 'grid' | 'list'
type SortBy = 'popular' | 'recent' | 'name' | 'views'

interface FilterState {
  search: string
  category: string | null
  sortBy: SortBy
  viewMode: ViewMode
}

// ============================================
// Mock Data (would come from API)
// ============================================

const mockCategories = [
  'All Categories',
  'Furniture',
  'Electronics',
  'Machinery',
  'Textiles',
  'Construction',
  'Food & Beverage',
]

const mockProducts: ARProduct[] = [
  {
    id: '1',
    productId: 'prod-001',
    name: 'Modern Office Chair',
    modelUrl: '/ar/models/chair.glb',
    thumbnailUrl: '/ar/thumbnails/chair.png',
    format: 'GLB',
    category: 'Furniture',
    viewsCount: 1250,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    productId: 'prod-002',
    name: 'Industrial CNC Machine',
    modelUrl: '/ar/models/cnc-machine.glb',
    thumbnailUrl: '/ar/thumbnails/cnc.png',
    format: 'GLB',
    category: 'Machinery',
    viewsCount: 890,
    createdAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '3',
    productId: 'prod-003',
    name: 'Smart Display Panel',
    modelUrl: '/ar/models/display.glb',
    thumbnailUrl: '/ar/thumbnails/display.png',
    format: 'GLB',
    category: 'Electronics',
    viewsCount: 2100,
    createdAt: '2024-02-01T09:00:00Z',
  },
  {
    id: '4',
    productId: 'prod-004',
    name: 'Premium Textile Roll',
    modelUrl: '/ar/models/textile.glb',
    thumbnailUrl: '/ar/thumbnails/textile.png',
    format: 'GLB',
    category: 'Textiles',
    viewsCount: 560,
    createdAt: '2024-02-10T16:45:00Z',
  },
  {
    id: '5',
    productId: 'prod-005',
    name: 'Solar Panel System',
    modelUrl: '/ar/models/solar-panel.glb',
    thumbnailUrl: '/ar/thumbnails/solar.png',
    format: 'GLB',
    category: 'Construction',
    viewsCount: 1800,
    createdAt: '2024-02-15T11:20:00Z',
  },
  {
    id: '6',
    productId: 'prod-006',
    name: 'Commercial Refrigerator',
    modelUrl: '/ar/models/fridge.glb',
    thumbnailUrl: '/ar/thumbnails/fridge.png',
    format: 'GLB',
    category: 'Food & Beverage',
    viewsCount: 980,
    createdAt: '2024-02-18T08:15:00Z',
  },
]

// ============================================
// Main Component
// ============================================

export function ARGallery({
  onProductSelect,
  onARLaunch,
  className = '',
}: ARGalleryProps) {
  const [products, setProducts] = useState<ARProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: null,
    sortBy: 'popular',
    viewMode: 'grid',
  })

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/ar/models?enabled=true&pageSize=50')
        
        if (response.ok) {
          const result = await response.json()
          setProducts(result.data || mockProducts)
        } else {
          // Use mock data as fallback
          setProducts(mockProducts)
        }
      } catch (error) {
        console.error('[ARGallery] Fetch error:', error)
        setProducts(mockProducts)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filter and sort products
  const filteredProducts = (() => {
    let result = [...products]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (filters.category && filters.category !== 'All Categories') {
      result = result.filter(p => p.category === filters.category)
    }

    // Sort
    switch (filters.sortBy) {
      case 'popular':
        result.sort((a, b) => b.viewsCount - a.viewsCount)
        break
      case 'recent':
        result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'views':
        result.sort((a, b) => b.viewsCount - a.viewsCount)
        break
    }

    return result
  })()

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
  }

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: category === 'All Categories' ? null : category,
    }))
  }

  const handleSortChange = (sortBy: SortBy) => {
    setFilters(prev => ({ ...prev, sortBy }))
  }

  const handleViewModeToggle = () => {
    setFilters(prev => ({
      ...prev,
      viewMode: prev.viewMode === 'grid' ? 'list' : 'grid',
    }))
  }

  const handleARClick = (productId: string) => {
    onARLaunch?.(productId)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AR Showroom</h2>
          <p className="text-gray-500 mt-1">
            Explore products in augmented reality
            {!isLoading && ` • ${filteredProducts.length} models available`}
          </p>
        </div>

        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0 self-start">
          <Smartphone className="w-3 h-3 mr-1" />
          AR Enabled Products
        </Badge>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category filter */}
          <Select
            value={filters.category || 'All Categories'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full lg:w-[180px]">
              <SlidersHorizontal className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {mockCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={filters.sortBy}
            onValueChange={(v) => handleSortChange(v as SortBy)}
          >
            <SelectTrigger className="w-full lg:w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">
                <TrendingUp className="w-4 h-4 mr-2 inline" />
                Most Popular
              </SelectItem>
              <SelectItem value="recent">
                <Clock className="w-4 h-4 mr-2 inline" />
                Recently Added
              </SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
            </SelectContent>
          </Select>

          {/* View mode toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleViewModeToggle}
            title={`Switch to ${filters.viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {filters.viewMode === 'grid' ? (
              <List className="w-4 h-4" />
            ) : (
              <Grid3X3 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <div className={
          filters.viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className={`h-${filters.viewMode === 'grid' ? '[320px]' : '[120px]'} rounded-xl`} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center">
          <Box className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your filters or search terms.
          </p>
          <Button
            variant="outline"
            onClick={() => setFilters({ search: '', category: null, sortBy: 'popular', viewMode: 'grid' })}
          >
            Clear all filters
          </Button>
        </Card>
      ) : (
        /* Product Grid/List */
        <div className={
          filters.viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode={filters.viewMode}
              onSelect={() => onProductSelect?.(product.productId)}
              onARClick={() => handleARClick(product.productId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// Product Card Component
// ============================================

interface ProductCardProps {
  product: ARProduct
  viewMode: ViewMode
  onSelect: () => void
  onARClick: () => void
}

function ProductCard({ product, viewMode, onSelect, onARClick }: ProductCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={product.thumbnailUrl || '/placeholder-product.png'}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-1 right-1">
              <Eye className="w-4 h-4 text-emerald-500 drop-shadow" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
            
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className="text-xs">{product.format}</Badge>
              
              {product.category && (
                <span className="text-xs text-gray-500">{product.category}</span>
              )}

              <span className="text-xs text-gray-400">
                {product.viewsCount.toLocaleString()} views
              </span>
            </div>
          </div>

          {/* Actions */}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onARClick()
            }}
            className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
          >
            <Smartphone className="w-4 h-4 mr-1" />
            View in AR
          </Button>
        </div>
      </Card>
    )
  }

  // Grid view
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer" onClick={onSelect}>
      {/* Thumbnail */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={product.thumbnailUrl || '/placeholder-product.png'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* AR Badge */}
        <Badge className="absolute top-3 left-3 bg-emerald-500/90 text-white border-0 shadow-sm">
          <Eye className="w-3 h-3 mr-1" />
          AR
        </Badge>

        {/* Format badge */}
        <Badge variant="secondary" className="absolute top-3 right-3 bg-black/50 text-white border-0">
          {product.format}
        </Badge>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onARClick()
            }}
            className="bg-white/95 hover:bg-white text-gray-900 shadow-lg transform hover:scale-105 transition-transform"
          >
            <Smartphone className="w-5 h-5 mr-2 text-purple-600" />
            View in AR
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center justify-between text-sm text-gray-500">
          {product.category && <span>{product.category}</span>}
          <span>{product.viewsCount.toLocaleString()} views</span>
        </div>
      </div>
    </Card>
  )
}

export default ARGallery
