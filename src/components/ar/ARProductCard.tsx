'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  Eye,
  Box,
  Smartphone,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// ============================================
// Types
// ============================================

interface ARProductCardProps {
  productId: string
  name: string
  price?: string
  imageUrl?: string
  modelUrl?: string
  hasARModel: boolean
  category?: string
  supplier?: string
  rating?: number
  reviewCount?: number
  onARClick?: (productId: string) => void
  className?: string
}

interface QuickPreviewState {
  isHovering: boolean
  isLoading: boolean
  isLoaded: boolean
  showPreview: boolean
}

// ============================================
// Main Component
// ============================================

export function ARProductCard({
  productId,
  name,
  price,
  imageUrl,
  modelUrl,
  hasARModel,
  category,
  supplier,
  rating,
  reviewCount,
  onARClick,
  className = '',
}: ARProductCardProps) {
  const [previewState, setPreviewState] = useState<QuickPreviewState>({
    isHovering: false,
    isLoading: false,
    isLoaded: false,
    showPreview: false,
  })
  
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  // Handle hover for quick preview
  const handleMouseEnter = () => {
    if (!hasARModel || !modelUrl) return

    // Delay before showing preview
    hoverTimeoutRef.current = setTimeout(() => {
      setPreviewState(prev => ({
        ...prev,
        isHovering: true,
        showPreview: true,
        isLoading: true,
      }))
    }, 800) // Show preview after 800ms of hovering
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    
    setPreviewState({
      isHovering: false,
      isLoading: false,
      isLoaded: false,
      showPreview: false,
    })
  }

  // Load quick preview when shown
  useEffect(() => {
    if (previewState.showPreview && previewState.isLoading && modelUrl && previewContainerRef.current) {
      // Dynamic import of model-viewer for quick preview
      let mounted = true
      
      const loadPreview = async () => {
        try {
          // Import model-viewer dynamically
          const module = await import('@google/model-viewer')
          const ModelViewerElement = module.default as any
          
          if (!mounted || !previewContainerRef.current) return

          // Clear container
          previewContainerRef.current.innerHTML = ''
          
          // Create model viewer element
          const viewer = document.createElement('model-viewer') as HTMLElement
          viewer.src = modelUrl
          viewer.alt = name + " - Quick Preview"
          viewer.autoRotate = true
          viewer.cameraControls = false
          viewer.setAttribute('touch-action', 'none')
          viewer.style.width = '100%'
          viewer.style.height = '100%'
          viewer.style.pointerEvents = 'none'
          
          viewer.addEventListener('load', () => {
            if (mounted) {
              setPreviewState(prev => ({ ...prev, isLoading: false, isLoaded: true }))
            }
          })
          
          viewer.addEventListener('error', () => {
            console.warn('[ARProductCard] Quick preview load failed')
            if (mounted) {
              setPreviewState(prev => ({ ...prev, isLoading: false, isLoaded: false }))
            }
          })

          previewContainerRef.current.appendChild(viewer)
        } catch (error) {
          console.error('[ARProductCard] Failed to load preview:', error)
          if (mounted) {
            setPreviewState(prev => ({ ...prev, isLoading: false, isLoaded: false }))
          }
        }
      }

      loadPreview()

      return () => {
        mounted = false
      }
    }
  }, [previewState.showPreview, previewState.isLoading, modelUrl, name])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const handleARButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onARClick) {
      onARClick(productId)
    } else {
      // Default behavior - navigate or open modal
      window.dispatchEvent(new CustomEvent('ar:view-product', { detail: { productId } }))
    }
  }

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Product Image / Preview Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {/* Main product image */}
        <img
          src={imageUrl || '/placeholder-product.png'}
          alt={name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            previewState.showPreview ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
        />

        {/* Quick 3D Preview Overlay */}
        {hasARModel && (
          <div
            ref={previewContainerRef}
            className={`absolute inset-0 transition-opacity duration-300 ${
              previewState.showPreview ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Loading state */}
            {previewState.isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            )}
            
            {/* Failed to load state */}
            {!previewState.isLoading && !previewState.isLoaded && previewState.showPreview && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <Box className="w-12 h-12 text-gray-300" />
              </div>
            )}
          </div>
        )}

        {/* AR Badge */}
        {hasARModel && (
          <Badge 
            variant="secondary"
            className="absolute top-3 left-3 bg-emerald-500/90 text-white border-0 shadow-md z-10"
          >
            <Eye className="w-3 h-3 mr-1" />
            View in AR
          </Badge>
        )}

        {/* Category badge */}
        {category && (
          <Badge 
            variant="outline" 
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm shadow-sm z-10"
          >
            {category}
          </Badge>
        )}

        {/* Hover overlay with AR button */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
          previewState.isHovering ? 'opacity-100' : 'opacity-0'
        }`}>
          <Button
            onClick={handleARButtonClick}
            className="bg-white/95 hover:bg-white text-gray-900 shadow-xl transform hover:scale-105 transition-transform"
            size="lg"
          >
            <Smartphone className="w-5 h-5 mr-2 text-purple-600" />
            View in AR
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        {/* Supplier name */}
        {supplier && (
          <p className="text-xs text-gray-500 truncate">{supplier}</p>
        )}

        {/* Product name */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          <Link href={`/products/${productId}`} className="hover:underline">
            {name}
          </Link>
        </h3>

        {/* Price and Rating Row */}
        <div className="flex items-center justify-between pt-1">
          {/* Price */}
          {price ? (
            <span className="text-lg font-bold text-emerald-600">{price}</span>
          ) : (
            <span className="text-sm text-gray-400">Price on request</span>
          )}

          {/* Rating */}
          {rating !== undefined && reviewCount !== undefined && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>★</span>
              <span>{rating.toFixed(1)}</span>
              <span>({reviewCount})</span>
            </div>
          )}
        </div>

        {/* AR Availability Indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            {hasARModel ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-600 font-medium">AR Available</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-400">No AR Model</span>
              </>
            )}
          </div>

          {hasARModel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleARButtonClick}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// ============================================
// Compact Version for Grid Views
// ============================================

interface ARProductCardCompactProps {
  productId: string
  name: string
  price?: string
  imageUrl?: string
  hasARModel: boolean
  onClick?: (productId: string) => void
  className?: string
}

export function ARProductCardCompact({
  productId,
  name,
  price,
  imageUrl,
  hasARModel,
  onClick,
  className = '',
}: ARProductCardCompactProps) {
  return (
    <Card 
      className={`group p-3 hover:bg-gray-50 cursor-pointer transition-colors ${className}`}
      onClick={() => onClick?.(productId)}
    >
      <div className="flex items-center gap-3">
        {/* Thumbnail */}
        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={imageUrl || '/placeholder-product.png'}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {hasARModel && (
            <div className="absolute bottom-0.5 right-0.5">
              <Eye className="w-3.5 h-3.5 text-emerald-500 drop-shadow" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{name}</h4>
          {price && (
            <p className="text-sm font-semibold text-emerald-600">{price}</p>
          )}
        </div>

        {/* AR button */}
        {hasARModel && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-purple-600 hover:bg-purple-50 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.(productId)
            }}
          >
            <Smartphone className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  )
}

export default ARProductCard
