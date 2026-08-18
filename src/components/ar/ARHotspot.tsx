'use client'

import React, { useState } from 'react'
import { 
  X, 
  Info, 
  Link as LinkIcon, 
  Video, 
  Image, 
  Settings,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ARHotspot as ARHotspotType } from '@/lib/ar/viewer-service'

interface ARHotspotProps {
  hotspot: ARHotspotType
  onClose: () => void
  language?: 'en' | 'fr' | 'ar'
}

const hotspotIcons = {
  INFO: Info,
  LINK: LinkIcon,
  VIDEO: Video,
  GALLERY: Image,
  CONFIGURATION: Settings,
}

const hotspotColors = {
  INFO: 'bg-blue-500',
  LINK: 'bg-green-500',
  VIDEO: 'bg-red-500',
  GALLERY: 'bg-purple-500',
  CONFIGURATION: 'bg-orange-500',
}

export default function ARHotspot({ 
  hotspot, 
  onClose, 
  language = 'en' 
}: ARHotspotProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const IconComponent = hotspotIcons[hotspot.type] || Info
  const colorClass = hotspotColors[hotspot.type] || 'bg-gray-500'

  // Get localized label
  const getLabel = () => {
    switch (language) {
      case 'ar':
        return hotspot.labelAr || hotspot.label
      case 'fr':
        return hotspot.labelFr || hotspot.label
      default:
        return hotspot.label
    }
  }

  // Render content based on type
  const renderContent = () => {
    const content = hotspot.content

    if (typeof content === 'string') {
      return <p className="text-sm text-gray-600">{content}</p>
    }

    if (typeof content === 'object' && content !== null) {
      // Handle different content types
      if ('url' in content && typeof content.url === 'string') {
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{getLabel()}</p>
            <a
              href={content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
            >
              <ExternalLink className="w-3 h-3" />
              Open Link
            </a>
          </div>
        )
      }

      if ('videoUrl' in content && typeof content.videoUrl === 'string') {
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{getLabel()}</p>
            <video
              src={content.videoUrl}
              controls
              className="w-full rounded-lg max-h-48"
            />
          </div>
        )
      }

      if ('images' in content && Array.isArray(content.images)) {
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{getLabel()}</p>
            <div className="grid grid-cols-2 gap-2">
              {(content.images as string[]).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${getLabel()} ${i + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )
      }

      if ('options' in content && Array.isArray(content.options)) {
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{getLabel()}</p>
            <div className="space-y-1">
              {(content.options as Array<{ name: string; value: string; price?: number }>).map(
                (option, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm">{option.name}</span>
                    <div className="flex items-center gap-2">
                      {option.price !== undefined && (
                        <span className="text-xs text-gray-500">+{option.price} DZD</span>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )
      }

      // Default: render as JSON for debugging
      return (
        <pre className="text-xs text-gray-500 overflow-auto max-h-40">
          {JSON.stringify(content, null, 2)}
        </pre>
      )
    }

    return null
  }

  return (
    <Card className={`absolute z-20 w-80 shadow-xl border-l-4 ${colorClass.replace('bg-', 'border-l-')} animate-in fade-in zoom-in-95 duration-200`}>
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${colorClass} rounded-lg flex items-center justify-center`}>
            <IconComponent className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{getLabel()}</h4>
            <Badge variant="outline" className="text-xs mt-0.5">
              {hotspot.type.toLowerCase().replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {renderContent()}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-3 pt-2 border-t border-gray-100 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>
    </Card>
  )
}

// Small hotspot marker for 3D scene
export function HotspotMarker({ 
  hotspot, 
  onClick,
  isActive = false,
}: { 
  hotspot: ARHotspotType
  onClick: () => void
  isActive?: boolean
}) {
  const IconComponent = hotspotIcons[hotspot.type] || Info
  const colorClass = hotspotColors[hotspot.type] || 'bg-gray-500'

  return (
    <button
      onClick={onClick}
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2
        w-10 h-10 rounded-full ${colorClass} 
        flex items-center justify-center
        shadow-lg transition-all duration-200
        hover:scale-110 active:scale-95
        ${isActive ? 'ring-4 ring-white ring-opacity-50 scale-110' : ''}
        animate-pulse
      `}
      style={{
        animationDuration: '2s',
      }}
    >
      <IconComponent className="w-5 h-5 text-white" />
      
      {/* Pulse ring */}
      <span 
        className={`absolute inset-0 rounded-full ${colorClass} opacity-30 animate-ping`}
        style={{ animationDuration: '2s' }}
      />
    </button>
  )
}
