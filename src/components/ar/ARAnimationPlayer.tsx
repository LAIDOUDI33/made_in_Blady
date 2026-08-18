'use client'

import React, { useState } from 'react'
import { Play, Pause, RotateCcw, Box, Move, Expand, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ARAnimation } from '@/lib/ar/viewer-service'

interface ARAnimationPlayerProps {
  animations: ARAnimation[]
  onPlay: (animationId: string) => void
  currentAnimationId?: string | null
  isPlaying?: boolean
  className?: string
}

const animationIcons = {
  ROTATE: RotateCcw,
  SCALE: Box,
  MOVE: Move,
  SEQUENCE: Sparkles,
  EXPLODED_VIEW: Expand,
}

export default function ARAnimationPlayer({
  animations,
  onPlay,
  currentAnimationId,
  isPlaying = false,
  className = '',
}: ARAnimationPlayerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentAnimationId || null)

  if (animations.length === 0) return null

  const handlePlay = (animationId: string) => {
    if (isPlaying && selectedId === animationId) {
      // Currently playing this animation - would stop it
      // For now, just log
      console.log('[AR Animation] Would stop:', animationId)
    } else {
      setSelectedId(animationId)
      onPlay(animationId)
    }
  }

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-gray-700 mb-3">Animations</h4>
      
      <div className="flex flex-wrap gap-2">
        {animations.map((animation) => {
          const IconComponent = animationIcons[animation.type] || Play
          const isSelected = selectedId === animation.id
          const isActive = currentAnimationId === animation.id

          return (
            <button
              key={animation.id}
              onClick={() => handlePlay(animation.id)}
              className={cn(
                'group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                'border hover:shadow-sm',
                isActive && isPlaying
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : isSelected
                    ? 'bg-gray-100 border-gray-300 text-gray-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {/* Icon */}
              <div className={cn(
                'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                isActive && isPlaying
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
              )}>
                {isActive && isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <IconComponent className="w-4 h-4" />
                )}
              </div>

              {/* Info */}
              <div className="text-left">
                <p className={cn(
                  'text-sm font-medium leading-tight',
                  isActive && isPlaying ? 'text-indigo-700' : 'text-gray-700'
                )}>
                  {animation.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-gray-400">
                    {animation.duration}s
                  </span>
                  {animation.autoplay && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full">
                      Auto
                    </span>
                  )}
                </div>
              </div>

              {/* Playing indicator */}
              {isActive && isPlaying && (
                <div className="ml-auto flex gap-0.5">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-indigo-500 rounded-full animate-pulse"
                      style={{
                        height: `${8 + Math.random() * 8}px`,
                        animationDelay: `${i * 150}ms`,
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Animation type legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-400">
        {Object.entries(animationIcons).map(([type, Icon]) => (
          <div key={type} className="flex items-center gap-1">
            <Icon className="w-3 h-3" />
            <span>{type.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Compact player for minimal UI
export function CompactAnimationPlayer({
  animations,
  onPlay,
  isPlaying,
}: {
  animations: ARAnimation[]
  onPlay: (animationId: string) => void
  isPlaying?: boolean
}) {
  if (animations.length === 0) return null

  // Find auto-play or first animation
  const defaultAnimation = animations.find(a => a.autoplay) || animations[0]

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onPlay(defaultAnimation.id)}
      className="gap-2"
    >
      {isPlaying ? (
        <>
          <Pause className="w-3 h-3" />
          Playing...
        </>
      ) : (
        <>
          <Play className="w-3 h-3" />
          {defaultAnimation.name}
        </>
      )}
    </Button>
  )
}
