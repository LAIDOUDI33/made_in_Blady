'use client'

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { 
  Box,
  Camera,
  Share2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Move3d,
  ZoomIn,
  ZoomOut,
  Loader2,
  X,
  Info,
  Smartphone,
  Monitor,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import ARPlacementGuide from './ARPlacementGuide'
import type { Vector3 } from '@/lib/ar/viewer-service'
import { arConfig, detectARCapabilities } from '@/lib/ar/config'

// Dynamic import for model-viewer (only loads on client)
const ModelViewerElement = dynamic(
  () => import('@google/model-viewer').then((mod) => mod.default as any),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
)

// ============================================
// Types
// ============================================

interface ARShowroomProps {
  productId: string
  modelUrl?: string
  usdzUrl?: string
  productName?: string
  productPrice?: string
  thumbnailUrl?: string
  onModelLoad?: () => void
  onError?: (error: Error) => void
  className?: string
}

interface ModelTransform {
  scale: number
  rotationX: number
  rotationY: number
  rotationZ: number
}

// ============================================
// Main Component
// ============================================

export function ARShowroom({
  productId,
  modelUrl: initialModelUrl,
  usdzUrl: initialUsdzUrl,
  productName = 'Product',
  productPrice,
  thumbnailUrl,
  onModelLoad,
  onError,
  className = '',
}: ARShowroomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const modelViewerRef = useRef<any>(null)
  
  // State
  const [modelUrl, setModelUrl] = useState<string | null>(initialModelUrl || null)
  const [usdzUrl] = useState<string | null>(initialUsdzUrl || null)
  const [isLoading, setIsLoading] = useState(!initialModelUrl)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [arMode, setArMode] = useState<'3d' | 'ar'>('3d')
  
  // Transform state
  const [transform, setTransform] = useState<ModelTransform>({
    scale: 1,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
  })
  
  // Capabilities
  const [capabilities, setCapabilities] = useState<{
    webXRSupported: boolean
    recommendedViewer: string
  } | null>(null)

  // Fetch model if not provided
  useEffect(() => {
    if (!initialModelUrl && productId) {
      fetchModel()
    }
    
    // Detect capabilities
    detectARCapabilities().then(setCapabilities).catch(console.error)
  }, [productId, initialModelUrl])

  const fetchModel = async () => {
    try {
      const response = await fetch(`/api/ar/models/${productId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch AR model')
      }

      const result = await response.json()
      if (result.data?.modelUrl) {
        setModelUrl(result.data.modelUrl)
      }
    } catch (error) {
      console.error('[ARShowroom] Fetch error:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to fetch model'))
      setIsLoading(false)
    }
  }

  // Event handlers for model-viewer
  const handleModelLoad = useCallback(() => {
    setIsLoaded(true)
    setIsLoading(false)
    onModelLoad?.()
  }, [onModelLoad])

  const handleError = useCallback((event: any) => {
    console.error('[ARShowroom] Model error:', event)
    onError?.(new Error('Failed to load 3D model'))
    setIsLoading(false)
  }, [onError])

  // Control handlers
  const handleScaleChange = useCallback((value: number[]) => {
    const scale = value[0]
    setTransform(prev => ({ ...prev, scale }))
    if (modelViewerRef.current) {
      modelViewerRef.current.scale = `${scale} ${scale} ${scale}`
    }
  }, [])

  const handleRotationChange = useCallback((axis: 'rotationX' | 'rotationY' | 'rotationZ', value: number[]) => {
    setTransform(prev => ({ ...prev, [axis]: value[0] }))
  }, [])

  const handleResetView = useCallback(() => {
    setTransform({ scale: 1, rotationX: 0, rotationY: 0, rotationZ: 0 })
    if (modelViewerRef.current) {
      modelViewerRef.current.cameraOrbit = 'auto auto auto'
      modelViewerRef.current.scale = '1 1 1'
    }
  }, [])

  const handleZoomIn = useCallback(() => {
    if (modelViewerRef.current) {
      // Get current orbit and zoom in
      modelViewerRef.current.zoom(-0.5)
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (modelViewerRef.current) {
      modelViewerRef.current.zoom(0.5)
    }
  }, [])

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
      console.error('[ARShowroom] Fullscreen error:', error)
    }
  }

  const handleScreenshot = async () => {
    if (modelViewerRef.current) {
      try {
        const dataUrl = modelViewerRef.current.toDataURL('image/png', 1.0)
        
        // Download screenshot
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = `algeriatrade-ar-${productName}-${Date.now()}.png`
        link.click()
      } catch (error) {
        console.error('[ARShowroom] Screenshot error:', error)
      }
    }
  }

  const handleShare = async (platform: string) => {
    if (modelViewerRef.current) {
      try {
        const dataUrl = modelViewerRef.current.toDataURL('image/png', 0.8)
        
        switch (platform) {
          case 'download':
            handleScreenshot()
            break
          case 'clipboard':
            await navigator.clipboard.writeText(window.location.href)
            break
          default:
            console.log(`[ARShowroom] Share to ${platform}`)
        }
      } catch (error) {
        console.error('[ARShowroom] Share error:', error)
      }
    }
  }

  const handleEnterAR = () => {
    if (modelViewerRef.current && capabilities?.webXRSupported) {
      setArMode('ar')
      modelViewerRef.current.activateAR().catch((err: any) => {
        console.error('[ARShowroom] AR activation failed:', err)
        setArMode('3d')
      })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-gray-50 to-gray-100 min-h-[500px]">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading 3D Model</h3>
          <p className="text-sm text-gray-500 mb-4">Preparing your AR experience...</p>
          
          {/* Progress indicator */}
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
          
          <p className="text-xs text-gray-400 mt-2">AlgeriaTrade.dz AR Showroom</p>
        </div>
      </Card>
    )
  }

  // No model state
  if (!modelUrl) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 min-h-[400px]">
          <Box className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No 3D Model Available</h3>
          <p className="text-sm text-gray-500 text-center max-w-md mb-4">
            This product doesn&apos;t have a 3D model yet. Check back later or contact the seller.
          </p>
          <Badge variant="outline" className="text-gray-400">
            Coming Soon
          </Badge>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Main viewer container */}
      <div 
        ref={containerRef}
        className="relative w-full h-[550px] bg-gradient-to-br from-gray-100 to-gray-50"
      >
        {/* Model Viewer */}
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          </div>
        }>
          <model-viewer
            ref={modelViewerRef as any}
            src={modelUrl}
            ios-src={usdzUrl || undefined}
            alt={`${productName} - 3D AR Preview`}
            auto-rotate
            camera-controls
            touch-action="pan-y"
            shadow-intensity="1"
            exposure="auto"
            interaction-prompt="when-focused"
            interaction-policy="allow-when-focused"
            ar={capabilities?.webXRSupported}
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            ar-placement="floor"
            style={{ width: '100%', height: '100%' }}
            onLoad={handleModelLoad}
            onError={handleError}
          />
        </Suspense>

        {/* Top bar overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-md border-0">
              <Eye className="w-3 h-3 mr-1 text-emerald-600" />
              AR Preview
            </Badge>
            
            {productName && (
              <Badge variant="outline" className="bg-white/90 backdrop-blur-sm shadow-md">
                {productName}
              </Badge>
            )}

            {productPrice && (
              <Badge className="bg-emerald-600/90 backdrop-blur-sm shadow-md border-0">
                {productPrice}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* AR button */}
            {capabilities?.webXRSupported && (
              <Button
                size="sm"
                onClick={handleEnterAR}
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
              >
                <Smartphone className="w-4 h-4 mr-1" />
                View in AR
              </Button>
            )}
            
            {/* Screenshot */}
            <Button
              variant="secondary"
              size="icon"
              onClick={handleScreenshot}
              className="bg-white/90 hover:bg-white shadow-md"
            >
              <Camera className="w-4 h-4" />
            </Button>
            
            {/* Fullscreen */}
            <Button
              variant="secondary"
              size="icon"
              onClick={handleToggleFullscreen}
              className="bg-white/90 hover:bg-white shadow-md"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            {/* Help/Guide */}
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setShowGuide(true)}
              className="bg-white/90 hover:bg-white shadow-md"
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bottom controls panel */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 pointer-events-auto">
            <div className="flex items-center justify-between gap-6">
              {/* View controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetView}
                  title="Reset view"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {/* Scale control */}
              <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                <Move3d className="w-4 h-4 text-gray-500" />
                <Slider
                  value={[transform.scale]}
                  onValueChange={handleScaleChange}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 w-10">{transform.scale.toFixed(1)}x</span>
              </div>

              {/* Share buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('download')}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Save
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('link')}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Placement Guide Modal */}
      {showGuide && (
        <ARPlacementGuide onClose={() => setShowGuide(false)} />
      )}
    </Card>
  )
}

export default ARShowroom
