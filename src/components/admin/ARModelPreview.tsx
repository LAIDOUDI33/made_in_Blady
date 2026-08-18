'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Box, Loader2, Maximize2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import dynamic from 'next/dynamic'

// Dynamically import ARViewer to avoid SSR issues
const ARViewer = dynamic(() => import('@/components/ar/ARViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  ),
})

interface ARModelPreviewProps {
  productId: string
  modelName?: string
  showControls?: boolean
  height?: string
}

export default function ARModelPreview({
  productId,
  modelName,
  showControls = true,
  height = '400px',
}: ARModelPreviewProps) {
  const [hasError, setHasError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle fullscreen toggle
  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}
    >
      {/* Header (only in fullscreen) */}
      {isFullscreen && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{modelName || 'AR Model Preview'}</h3>
          <Button variant="outline" size="sm" onClick={handleToggleFullscreen}>
            Exit Fullscreen
          </Button>
        </div>
      )}

      {/* Viewer Container */}
      <Card className={`overflow-hidden ${!isFullscreen ? '' : 'h-[calc(100vh-80px)]'}`}>
        {!hasError ? (
          <ARViewer
            productId={productId}
            showControls={showControls}
            className="min-h-[300px]"
            onError={() => setHasError(true)}
          />
        ) : (
          <FallbackView productName={modelName || 'Model'} productId={productId} />
        )}
      </Card>

      {/* Quick actions (not in fullscreen - ARViewer has its own controls) */}
      {!isFullscreen && !hasError && (
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleFullscreen}>
            <Maximize2 className="w-4 h-4 mr-1" />
            Fullscreen
          </Button>
        </div>
      )}
    </div>
  )
}

// Fallback view when model fails to load or for placeholder
function FallbackView({ productName, productId }: { productName: string; productId: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-gray-50 to-gray-100 min-h-[300px]">
      <Box className="w-16 h-16 text-gray-300 mb-4" />
      
      <h4 className="text-lg font-medium text-gray-700 mb-2">{productName}</h4>
      
      <p className="text-sm text-gray-500 text-center max-w-md mb-6">
        Preview is not available. The model may still be processing or there was an error loading it.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry
        </Button>

        <a href={`/products/${productId}`}>
          <Button>View Product</Button>
        </a>
      </div>

      {/* Model info placeholder */}
      <div className="mt-8 w-full max-w-sm">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Format</span>
            <span className="font-medium">GLB</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
              Processing
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Optimized</span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
              Yes
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
