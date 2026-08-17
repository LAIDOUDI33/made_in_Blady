'use client'

import React from 'react'
import { Wifi, WifiOff, Signal, SignalLow, SignalMedium } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | null

interface CallQualityIndicatorProps {
  quality: ConnectionQuality
  showLabel?: boolean
  className?: string
}

const qualityConfig = {
  excellent: {
    icon: Wifi,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Excellent',
    description: 'Strong connection - HD video and audio',
    dots: [true, true, true, true],
  },
  good: {
    icon: Signal,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Good',
    description: 'Good connection - clear audio/video',
    dots: [true, true, true, false],
  },
  fair: {
    icon: SignalMedium,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Fair',
    description: 'Fair connection - some quality reduction',
    dots: [true, true, false, false],
  },
  poor: {
    icon: SignalLow,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Poor',
    description: 'Poor connection - call may be affected',
    dots: [true, false, false, false],
  },
}

export default function CallQualityIndicator({
  quality,
  showLabel = false,
  className = '',
}: CallQualityIndicatorProps) {
  if (!quality) return null

  const config = qualityConfig[quality]
  const IconComponent = config.icon

  // Simple indicator (just icon)
  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor} border ${config.borderColor} ${className}`}>
              <IconComponent className={`w-4 h-4 ${config.color}`} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Full indicator with label and signal bars
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${config.bgColor} ${config.borderColor} gap-2 py-1.5`}
          >
            <IconComponent className={`w-4 h-4 ${config.color}`} />
            
            {/* Signal strength bars */}
            <div className="flex items-end gap-0.5 h-3">
              {config.dots.map((active, index) => (
                <div
                  key={index}
                  className={`w-1 rounded-sm transition-colors ${
                    active ? config.color : 'text-gray-600'
                  }`}
                  style={{
                    height: `${(index + 1) * 25}%`,
                  }}
                />
              ))}
            </div>
            
            <span className={`text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Network status bar variant
export function NetworkStatusBar({
  quality,
  stats,
}: {
  quality: ConnectionQuality
  stats?: {
    packetsLost?: number
    jitter?: number
    roundTripTime?: number
  }
}) {
  if (!quality) return null

  const config = qualityConfig[quality]
  const IconComponent = config.icon

  return (
    <div className={`px-3 py-2 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconComponent className={`w-4 h-4 ${config.color}`} />
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
        
        {stats && (
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            {stats.packetsLost !== undefined && (
              <span>Lost: {stats.packetsLost}</span>
            )}
            {stats.jitter !== undefined && (
              <span>Jitter: {stats.jitter.toFixed(0)}ms</span>
            )}
            {stats.roundTripTime !== undefined && (
              <span>RTT: {stats.roundTripTime.toFixed(0)}ms</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
