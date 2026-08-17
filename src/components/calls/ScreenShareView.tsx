'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Monitor, Maximize2, Minimize2, PenTool } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ScreenShareViewProps {
  stream: MediaStream | null
  onToggleAnnotation?: () => void
  isAnnotating?: boolean
}

export default function ScreenShareView({
  stream,
  onToggleAnnotation,
  isAnnotating = false,
}: ScreenShareViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
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
      console.error('Error toggling fullscreen:', error)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900">
      {/* Screen share video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
      />

      {/* Overlay controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* Screen share indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-white text-sm">
          <Monitor className="w-4 h-4 text-blue-400" />
          <span>Screen Sharing</span>
        </div>

        {/* Annotation toggle */}
        {onToggleAnnotation && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isAnnotating ? 'default' : 'secondary'}
                  size="icon"
                  onClick={onToggleAnnotation}
                  className={`${
                    !isAnnotating 
                      ? 'bg-black/50 hover:bg-black/70 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isAnnotating ? 'Stop annotation' : 'Start annotation'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Fullscreen toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                onClick={toggleFullscreen}
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Annotation canvas overlay (when annotating) */}
      {isAnnotating && (
        <ScreenAnnotationCanvas 
          containerRef={containerRef} 
          stream={stream} 
        />
      )}

      {/* No stream placeholder */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-gray-400">
            <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Waiting for screen share...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple annotation canvas for drawing on shared screen
function ScreenAnnotationCanvas({ 
  containerRef,
  stream,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  stream: MediaStream | null
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#ff0000')
  const [brushSize, setBrushSize] = useState(3)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Set canvas size to match container
    const resizeCanvas = () => {
      canvas.width = container.offsetWidth
      canvas.height = container.offsetHeight
    }

    resizeCanvas()
    
    // Observe container resize
    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(container)

    return () => observer.disconnect()
  }, [containerRef])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="absolute inset-0 z-10 cursor-crosshair"
      />

      {/* Drawing tools */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-lg p-2 z-20">
        {/* Color picker */}
        {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ffffff'].map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              color === c ? 'border-white scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}

        {/* Brush size */}
        <input
          type="range"
          min="1"
          max="10"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-16 mx-2"
        />

        {/* Clear button */}
        <button
          onClick={clearCanvas}
          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear
        </button>
      </div>
    </>
  )
}
