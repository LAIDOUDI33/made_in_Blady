'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { 
  RotateCcw, 
  Maximize2, 
  Camera, 
  Play,
  Pause,
  Loader2,
  Box,
  Move3d,
  ZoomIn,
  ZoomOut,
  Rotate3d
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { ARScene } from '@/lib/ar/three-scene'
import type { ARProductModel, Vector3, ARMaterialVariation, ARAnimation } from '@/lib/ar/viewer-service'

// ============================================
// Types
// ============================================

interface ModelViewerProps {
  model: ARProductModel | null
  modelUrl?: string
  onModelLoad?: () => void
  onError?: (error: Error) => void
  className?: string
  showControls?: boolean
  showMaterials?: boolean
  showAnimations?: boolean
  enableMeasurements?: boolean
  height?: string
}

interface ViewerState {
  isInitialized: boolean
  isLoading: boolean
  loadProgress: number
  isLoaded: boolean
  autoRotate: boolean
  selectedMaterial: string | null
  currentAnimation: string | null
}

// ============================================
// Main Component
// ============================================

export function ModelViewer({
  model: initialModel,
  modelUrl: directModelUrl,
  onModelLoad,
  onError,
  className = '',
  showControls = true,
  showMaterials = true,
  showAnimations = true,
  enableMeasurements = false,
  height = '450px',
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<ARScene | null>(null)
  
  const [viewerState, setViewerState] = useState<ViewerState>({
    isInitialized: false,
    isLoading: !!directModelUrl || !initialModel,
    loadProgress: 0,
    isLoaded: false,
    autoRotate: true,
    selectedMaterial: null,
    currentAnimation: null,
  })

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true

    const initScene = async () => {
      try {
        const scene = new ARScene(containerRef.current!, {
          backgroundColor: '#f8f9fa',
          showGrid: false,
          enableShadows: true,
          autoRotate: true,
          autoRotateSpeed: 1.5,
          onLoadProgress: (progress) => {
            if (mounted) {
              setViewerState(prev => ({ ...prev, loadProgress: progress }))
            }
          },
          onModelLoaded: () => {
            if (mounted) {
              setViewerState(prev => ({
                ...prev,
                isLoaded: true,
                isLoading: false,
                loadProgress: 100,
              }))
              onModelLoad?.()
            }
          },
          onError: (error) => {
            console.error('[ModelViewer] Error:', error)
            if (mounted) {
              onError?.(error)
              setViewerState(prev => ({ ...prev, isLoading: false }))
            }
          },
        })

        await scene.initialize()
        
        if (mounted) {
          sceneRef.current = scene
          setViewerState(prev => ({ ...prev, isInitialized: true }))
        }

        // Load model if URL provided directly
        if (directModelUrl && mounted) {
          await scene.loadModel(directModelUrl)
        }
      } catch (error) {
        console.error('[ModelViewer] Init error:', error)
        if (mounted) {
          onError?.(error instanceof Error ? error : new Error('Failed to initialize'))
        }
      }
    }

    initScene()

    return () => {
      mounted = false
      if (sceneRef.current) {
        sceneRef.current.dispose()
        sceneRef.current = null
      }
    }
  }, [])

  // Load model when initialModel changes
  useEffect(() => {
    if (initialModel && sceneRef.current && viewerState.isInitialized && !viewerState.isLoaded) {
      loadModel(initialModel)
    }
  }, [initialModel, viewerState.isInitialized])

  const loadModel = useCallback(async (modelData: ARProductModel) => {
    if (!sceneRef.current) return

    try {
      setViewerState(prev => ({ ...prev, isLoading: true, loadProgress: 0 }))
      await sceneRef.current.loadModel(modelData.modelUrl)
    } catch (error) {
      console.error('[ModelViewer] Load error:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to load model'))
    }
  }, [onError])

  // Control handlers
  const handleResetView = () => {
    sceneRef.current?.resetView()
  }

  const handleScreenshot = async () => {
    if (!sceneRef.current) return
    
    try {
      const dataUrl = sceneRef.current.takeScreenshot({
        format: 'png',
        quality: 1,
        includeWatermark: true,
        watermarkText: 'AlgeriaTrade.dz - 3D Viewer',
      })
      
      // Download screenshot
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `model-viewer-${Date.now()}.png`
      link.click()
    } catch (error) {
      console.error('[ModelViewer] Screenshot error:', error)
    }
  }

  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('[ModelViewer] Fullscreen error:', error)
    }
  }

  const handleToggleAutoRotate = () => {
    const newState = !viewerState.autoRotate
    setViewerState(prev => ({ ...prev, autoRotate: newState }))
    sceneRef.current?.enableAutoRotate(newState)
  }

  const handleZoomIn = () => {
    // This would require camera manipulation in ARScene
    console.log('[ModelViewer] Zoom in')
  }

  const handleZoomOut = () => {
    console.log('[ModelViewer] Zoom out')
  }

  const handleMaterialSelect = (variationId: string) => {
    setViewerState(prev => ({ ...prev, selectedMaterial: variationId }))
    // Material variation would be handled by ARScene
  }

  const handleAnimationPlay = (animationId: string) => {
    setViewerState(prev => ({ 
      ...prev, 
      currentAnimation: prev.currentAnimation === animationId ? null : animationId 
    }))
  }

  // Loading state
  if (viewerState.isLoading) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div 
          className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
          style={{ minHeight: height }}
        >
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading 3D Model</h3>
          <p className="text-sm text-gray-500 mb-4">Preparing your preview...</p>
          
          {/* Progress bar */}
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${viewerState.loadProgress}%` }}
            />
          </div>
          
          <p className="text-xs text-gray-400 mt-2">{Math.round(viewerState.loadProgress)}%</p>
        </div>
      </Card>
    )
  }

  // No model state
  if (!initialModel && !directModelUrl) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div 
          className="flex flex-col items-center justify-center bg-gray-50"
          style={{ minHeight: height }}
        >
          <Box className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Model Selected</h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Select a product with a 3D model to view it here.
          </p>
        </div>
      </Card>
    )
  }

  const currentModel = initialModel

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Main viewer container */}
      <div 
        ref={containerRef}
        className="relative bg-gray-100"
        style={{ height }}
      >
        {/* Top bar overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto">
            {currentModel && (
              <>
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow">
                  <Box className="w-3 h-3 mr-1" />
                  {currentModel.name}
                </Badge>
                
                <Badge variant="outline" className="ml-2 bg-white/90 backdrop-blur-sm shadow">
                  {currentModel.format.toUpperCase()}
                  {currentModel.optimizedForMobile && ' • Optimized'}
                </Badge>

                {currentModel.polygonCount > 0 && (
                  <Badge variant="outline" className="ml-2 bg-white/90 backdrop-blur-sm shadow">
                    ~{currentModel.polygonCount.toLocaleString()} polys
                  </Badge>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Screenshot */}
            <Button
              variant="secondary"
              size="icon"
              onClick={handleScreenshot}
              className="bg-white/90 hover:bg-white"
              title="Take screenshot"
            >
              <Camera className="w-4 h-4" />
            </Button>
            
            {/* Fullscreen */}
            <Button
              variant="secondary"
              size="icon"
              onClick={handleToggleFullscreen}
              className="bg-white/90 hover:bg-white"
              title="Toggle fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom controls panel */}
      {(showControls || showMaterials || showAnimations) && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* View controls row */}
          {showControls && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
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
                
                <Separator orientation="vertical" className="h-6 mx-1" />
                
                <Button
                  variant={viewerState.autoRotate ? 'default' : 'ghost'}
                  size="icon"
                  onClick={handleToggleAutoRotate}
                  title={viewerState.autoRotate ? 'Stop rotation' : 'Start rotation'}
                >
                  {viewerState.autoRotate ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetView}
                  title="Reset view"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleScreenshot}
              >
                <Camera className="w-4 h-4 mr-1" />
                Screenshot
              </Button>
            </div>
          )}

          {/* Material selector */}
          {showMaterials && currentModel?.materialVariations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Materials</p>
              <div className="flex items-center gap-2 flex-wrap">
                {currentModel.materialVariations.map((variation: ARMaterialVariation) => (
                  <button
                    key={variation.id}
                    onClick={() => handleMaterialSelect(variation.id)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      viewerState.selectedMaterial === variation.id
                        ? 'border-emerald-500 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: variation.color }}
                    title={variation.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Animation player */}
          {showAnimations && currentModel?.animations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Animations</p>
              <div className="flex items-center gap-2 flex-wrap">
                {currentModel.animations.map((animation: ARAnimation) => (
                  <Button
                    key={animation.id}
                    variant={viewerState.currentAnimation === animation.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleAnimationPlay(animation.id)}
                    className="text-xs"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {animation.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default ModelViewer
