'use client'

import React from 'react'
import { 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Camera,
  Rotate3d,
  Move,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

interface ARControlsProps {
  onResetView: () => void
  onScreenshot?: () => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
  onAutoRotate?: (enabled: boolean) => void
  isAutoRotating?: boolean
  className?: string
}

export default function ARControls({
  onResetView,
  onScreenshot,
  onToggleFullscreen,
  isFullscreen = false,
  onAutoRotate,
  isAutoRotating = false,
  className = '',
}: ARControlsProps) {
  const ControlButton = ({
    onClick,
    icon: React.ReactNode,
    tooltip,
    variant = 'default',
    isActive = false,
  }: {
    onClick: () => void
    icon: React.ReactNode
    tooltip: string
    variant?: 'default' | 'active' | 'ghost'
    isActive?: boolean
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className={`
              h-9 w-9 transition-all duration-200
              ${isActive 
                ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-700">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Left controls - View manipulation */}
      <div className="flex items-center gap-1">
        <ControlButton
          onClick={onResetView}
          icon={<RotateCcw className="w-4 h-4" />}
          tooltip="Reset View"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ControlButton
          onClick={() => onAutoRotate?.(!isAutoRotating)}
          icon={<Rotate3d className="w-4 h-4" />}
          tooltip={isAutoRotating ? 'Stop Auto-Rotate' : 'Start Auto-Rotate'}
          isActive={isAutoRotating}
        />
      </div>

      {/* Center info (optional) */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Move className="w-3 h-3" />
        <span>Drag to rotate</span>
        <Separator orientation="vertical" className="h-3" />
        <ZoomIn className="w-3 h-3" />
        <span>Scroll to zoom</span>
      </div>

      {/* Right controls - Actions */}
      <div className="flex items-center gap-1">
        {onScreenshot && (
          <ControlButton
            onClick={onScreenshot}
            icon={<Camera className="w-4 h-4" />}
            tooltip="Take Screenshot"
          />
        )}

        {onToggleFullscreen && (
          <ControlButton
            onClick={onToggleFullscreen}
            icon={
              isFullscreen 
                ? <Minimize2 className="w-4 h-4" /> 
                : <Maximize2 className="w-4 h-4" />
            }
            tooltip={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          />
        )}
      </div>
    </div>
  )
}

// Compact floating controls for minimal UI
export function FloatingARControls({
  onResetView,
  onScreenshot,
  onToggleFullscreen,
  position = 'bottom-right',
}: {
  onResetView: () => void
  onScreenshot?: () => void
  onToggleFullscreen?: () => void
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}) {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  }

  return (
    <div className={`absolute ${positionClasses[position]} z-10 flex flex-col gap-2`}>
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-1.5 space-y-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onResetView}
          className="h-8 w-8 text-gray-600 hover:text-gray-900"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        {onScreenshot && (
          <>
            <Separator />
            <Button
              variant="ghost"
              size="icon"
              onClick={onScreenshot}
              className="h-8 w-8 text-gray-600 hover:text-gray-900"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </>
        )}

        {onToggleFullscreen && (
          <>
            <Separator />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              className="h-8 w-8 text-gray-600 hover:text-gray-900"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
