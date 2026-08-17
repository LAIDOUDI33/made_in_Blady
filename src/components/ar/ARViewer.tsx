'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { 
  RotateCcw, 
  Maximize2, 
  Camera, 
  Share2, 
  Loader2,
  Box,
  View,
  Ruler,
  Move3d
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ARViewerFallback from './ARViewerFallback'
import ARControls from './ARControls'
import ARMaterialSelector from './ARMaterialSelector'
import ARAnimationPlayer from './ARAnimationPlayer'
import ARShareButton from './ARShareButton'
import ARHotspot from './ARHotspot'
import type { 
  ARProductModel, 
  ARMode, 
  ARHotspot as ARHotspotType,
  ARMaterialVariation,
} from '@/lib/ar/viewer-service'
import { ThreeJSRenderer } from '@/lib/ar/threejs-renderer'

interface ARViewerProps {
  productId: string
  model?: ARProductModel
  onModelLoad?: (model: ARProductModel) => void
  onError?: (error: Error) => void
  className?: string
  showControls?: boolean
  showMaterials?: boolean
  showAnimations?: boolean
  showShare?: boolean
  enableMeasurements?: boolean
}

export default function ARViewer({
  productId,
  model: initialModel,
  onModelLoad,
  onError,
  className = '',
  showControls = true,
  showMaterials = true,
  showAnimations = true,
  showShare = true,
  enableMeasurements = false,
}: ARViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<ThreeJSRenderer | null>(null)
  
  const [model, setModel] = useState<ARProductModel | null>(initialModel || null)
  const [isLoading, setIsLoading] = useState(!initialModel)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [arMode, setArMode] = useState<ARMode>('3D_VIEWER_FALLBACK')
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
  const [activeHotspot, setActiveHotspot] = useState<ARHotspotType | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMeasurement, setShowMeasurement] = useState(false)

  // Initialize renderer
  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true

    const initRenderer = async () => {
      try {
        const renderer = new ThreeJSRenderer({
          container: containerRef.current!,
          backgroundColor: '#f8f9fa',
          showGrid: false,
          enableShadows: true,
          autoRotate: true,
          autoRotateSpeed: 1.5,
          onLoadProgress: (progress) => {
            if (mounted) setLoadProgress(progress)
          },
          onError: (error) => {
            console.error('[AR Viewer] Error:', error)
            if (mounted) {
              onError?.(error)
              setIsLoading(false)
            }
          },
          onModelLoaded: () => {
            if (mounted) {
              setIsLoaded(true)
              setIsLoading(false)
              onModelLoad?.(model!)
            }
          },
          onHotspotClick: (hotspot) => {
            if (mounted) setActiveHotspot(hotspot)
          },
        })

        await renderer.initialize()
        
        if (mounted) {
          rendererRef.current = renderer
        }
      } catch (error) {
        console.error('[AR Viewer] Init error:', error)
        if (mounted) {
          onError?.(error instanceof Error ? error : new Error('Failed to initialize'))
        }
      }
    }

    initRenderer()

    return () => {
      mounted = false
      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }
    }
  }, [])

  // Load model when available
  useEffect(() => {
    if (model && rendererRef.current && !isLoaded) {
      loadModel(model)
    }
  }, [model, isLoaded])

  // Fetch model if not provided
  useEffect(() => {
    if (!initialModel && productId) {
      fetchModel()
    }
  }, [productId, initialModel])

  const fetchModel = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/ar/models/${productId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch AR model')
      }

      const result = await response.json()
      setModel(result.data)
    } catch (error) {
      console.error('[AR Viewer] Fetch error:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to fetch model'))
      setIsLoading(false)
    }
  }

  const loadModel = useCallback(async (modelData: ARProductModel) => {
    if (!rendererRef.current) return
    
    try {
      await rendererRef.current.loadModel(modelData)
    } catch (error) {
      console.error('[AR Viewer] Load error:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to load model'))
    }
  }, [onError])

  // Control handlers
  const handleResetView = () => {
    rendererRef.current?.resetView()
  }

  const handleScreenshot = async () => {
    if (!rendererRef.current) return
    
    try {
      const blob = await rendererRef.current.takeScreenshot({
        format: 'png',
        quality: 1,
        includeWatermark: true,
        watermarkText: 'AlgeriaTrade.dz - AR Viewer',
      })
      
      // Download screenshot
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ar-model-${productId}-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[AR Viewer] Screenshot error:', error)
    }
  }

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
      console.error('[AR Viewer] Fullscreen error:', error)
    }
  }

  const handleMaterialSelect = (variationId: string) => {
    setSelectedMaterial(variationId)
    rendererRef.current?.setMaterialVariation(variationId)
  }

  const handleAnimationPlay = (animationId: string) => {
    rendererRef.current?.playAnimation(animationId)
  }

  const handleShare = async (platform: string) => {
    if (!rendererRef.current) return
    
    try {
      const blob = await rendererRef.current.takeScreenshot()
      
      switch (platform) {
        case 'download':
          handleScreenshot()
          break
        case 'link':
          // Copy current URL to clipboard
          navigator.clipboard.writeText(window.location.href)
          break
        default:
          console.log(`[AR Viewer] Share to ${platform}`)
      }
    } catch (error) {
      console.error('[AR Viewer] Share error:', error)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-gray-50 to-gray-100 min-h-[400px]">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading 3D Model</h3>
          <p className="text-sm text-gray-500 mb-4">
            Preparing your AR experience...
          </p>
          
          {/* Progress bar */}
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          
          <p className="text-xs text-gray-400 mt-2">{Math.round(loadProgress)}%</p>
        </div>
      </Card>
    )
  }

  // Fallback for when no model is available
  if (!model) {
    return <ARViewerFallback productId={productId} />
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Main viewer container */}
      <div 
        ref={containerRef}
        className="w-full h-[500px] bg-gray-100 relative"
      >
        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow">
              <Box className="w-3 h-3 mr-1" />
              {model.name}
            </Badge>
            
            <Badge variant="outline" className="ml-2 bg-white/90 backdrop-blur-sm shadow">
              <View className="w-3 h-3 mr-1" />
              {arMode.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Measurement toggle */}
            {enableMeasurements && (
              <Button
                variant={showMeasurement ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setShowMeasurement(!showMeasurement)}
                className="bg-white/90 hover:bg-white"
              >
                <Ruler className="w-4 h-4 mr-1" />
                Measure
              </Button>
            )}
            
            {/* Screenshot */}
            <Button
              variant="secondary"
              size="icon"
              onClick={handleScreenshot}
              className="bg-white/90 hover:bg-white"
            >
              <Camera className="w-4 h-4" />
            </Button>
            
            {/* Fullscreen */}
            <Button
              variant="secondary"
              size="icon"
              onClick={handleToggleFullscreen}
              className="bg-white/90 hover:bg-white"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Hotspot overlay */}
        {activeHotspot && (
          <ARHotspot
            hotspot={activeHotspot}
            onClose={() => setActiveHotspot(null)}
          />
        )}

        {/* Measurement overlay */}
        {showMeasurement && (
          <div className="absolute bottom-20 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <p className="text-xs font-medium text-gray-600 mb-2">Measurement Tool</p>
            <p className="text-xs text-gray-500">Click and drag to measure distances</p>
          </div>
        )}
      </div>

      {/* Bottom controls panel */}
      {(showControls || showMaterials || showAnimations || showShare) && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Controls row */}
          {showControls && (
            <ARControls
              onResetView={handleResetView}
              onScreenshot={handleScreenshot}
              onToggleFullscreen={handleToggleFullscreen}
              isFullscreen={isFullscreen}
            />
          )}

          {/* Material selector */}
          {showMaterials && model.materialVariations.length > 0 && (
            <ARMaterialSelector
              variations={model.materialVariations}
              selectedId={selectedMaterial}
              onSelect={handleMaterialSelect}
            />
          )}

          {/* Animation player */}
          {showAnimations && model.animations.length > 0 && (
            <ARAnimationPlayer
              animations={model.animations}
              onPlay={handleAnimationPlay}
            />
          )}

          {/* Share buttons */}
          {showShare && (
            <ARShareButton
              productName={model.name}
              onShare={handleShare}
            />
          )}
        </div>
      )}
    </Card>
  )
}
