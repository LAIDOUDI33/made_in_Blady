'use client'

import React from 'react'
import { Box, Image, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface ARViewerFallbackProps {
  productId: string
  className?: string
}

export default function ARViewerFallback({ productId, className = '' }: ARViewerFallbackProps) {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-gray-50 to-gray-100 min-h-[400px]">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
          <Box className="w-10 h-10 text-indigo-500" />
        </div>

        {/* Message */}
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          AR Model Not Available
        </h3>
        
        <p className="text-gray-500 text-center max-w-md mb-6">
          This product doesn&apos;t have a 3D model available for augmented reality viewing yet.
          Check back later or contact the supplier for more information.
        </p>

        {/* Options */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Link href={`/products/${productId}`}>
            <Button variant="default">
              View Product Details
            </Button>
          </Link>
        </div>

        {/* Info box */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-md">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">About AR Viewing</p>
              <p className="text-xs text-amber-700 mt-1">
                Augmented Reality requires a 3D model of the product. 
                Suppliers can upload GLTF/GLB files to enable this feature.
              </p>
            </div>
          </div>
        </div>

        {/* Browser support info */}
        <div className="mt-4 p-3 bg-gray-100 rounded-lg max-w-md">
          <p className="text-xs text-gray-500 text-center">
            Supported browsers: Chrome (Android), Safari (iOS), Edge with WebXR. 
            Falls back to 3D viewer on other browsers.
          </p>
        </div>
      </div>
    </Card>
  )
}

// Alternative fallback showing product image instead
export function ImageFallback({ 
  imageUrl, 
  productName,
  className = '' 
}: { 
  imageUrl?: string
  productName: string
  className?: string 
}) {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-gray-50 to-gray-100 min-h-[400px]">
        {imageUrl ? (
          <div className="relative mb-6">
            <img
              src={imageUrl}
              alt={productName}
              className="w-64 h-64 object-contain rounded-lg shadow-lg"
            />
            <div className="absolute -bottom-2 -right-2 bg-gray-900 text-white px-3 py-1 rounded-full text-sm">
              2D View Only
            </div>
          </div>
        ) : (
          <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-6">
            <Image className="w-16 h-16 text-gray-400" />
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-800 mb-2">{productName}</h3>
        
        <p className="text-gray-500 text-center max-w-md mb-4">
          3D/AR view is not available for this product.
          You can view the standard product images and details.
        </p>

        <Link href={`/products/${productId}`}>
          <Button>View Full Details</Button>
        </Link>
      </div>
    </Card>
  )
}
