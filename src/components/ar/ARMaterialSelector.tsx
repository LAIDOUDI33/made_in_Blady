'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ARMaterialVariation } from '@/lib/ar/viewer-service'

interface ARMaterialSelectorProps {
  variations: ARMaterialVariation[]
  selectedId?: string | null
  onSelect: (variationId: string) => void
  className?: string
}

export default function ARMaterialSelector({
  variations,
  selectedId,
  onSelect,
  className = '',
}: ARMaterialSelectorProps) {
  if (variations.length === 0) return null

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-gray-700 mb-3">Color / Material</h4>
      
      <div className="flex flex-wrap gap-3">
        {variations.map((variation) => {
          const isSelected = selectedId === variation.id
          
          return (
            <button
              key={variation.id}
              onClick={() => onSelect(variation.id)}
              className={cn(
                'relative group flex flex-col items-center p-2 rounded-xl transition-all duration-200',
                'hover:bg-gray-50 hover:shadow-md',
                isSelected 
                  ? 'bg-indigo-50 ring-2 ring-indigo-500 shadow-md' 
                  : 'bg-white border border-gray-200'
              )}
            >
              {/* Color swatch */}
              <div
                className={cn(
                  'w-12 h-12 rounded-lg transition-transform group-hover:scale-105',
                  'border-2',
                  isSelected ? 'border-indigo-500' : 'border-gray-200'
                )}
                style={{
                  backgroundColor: variation.color.startsWith('#') || variation.color.startsWith('rgb')
                    ? variation.color
                    : undefined,
                  backgroundImage: variation.color.startsWith('#') || variation.color.startsWith('rgb')
                    ? undefined
                    : `url(${variation.color})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Texture preview overlay if texture URL exists */}
                {variation.textureUrl && (
                  <div 
                    className="w-full h-full rounded-lg opacity-30"
                    style={{
                      backgroundImage: `url(${variation.textureUrl})`,
                      backgroundSize: 'cover',
                    }}
                  />
                )}
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Name and price */}
              <span className={cn(
                'mt-1.5 text-xs font-medium max-w-[60px] truncate',
                isSelected ? 'text-indigo-700' : 'text-gray-600'
              )}>
                {variation.name}
              </span>

              {/* Price modifier if any */}
              {variation.priceModifier !== undefined && variation.priceModifier !== 0 && (
                <span className={cn(
                  'text-[10px]',
                  variation.priceModifier > 0 ? 'text-orange-600' : 'text-green-600'
                )}>
                  {variation.priceModifier > 0 ? '+' : ''}{variation.priceModifier} DZD
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Compact horizontal variant for inline use
export function MaterialSwatches({
  variations,
  selectedId,
  onSelect,
}: {
  variations: ARMaterialVariation[]
  selectedId?: string | null
  onSelect: (variationId: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      {variations.map((variation) => {
        const isSelected = selectedId === variation.id
        
        return (
          <button
            key={variation.id}
            onClick={() => onSelect(variation.id)}
            title={variation.name}
            className={cn(
              'w-8 h-8 rounded-full transition-all duration-200',
              'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
              isSelected 
                ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' 
                : 'hover:ring-2 hover:ring-gray-300'
            )}
            style={{ backgroundColor: variation.color }}
          >
            {isSelected && (
              <Check className="w-4 h-4 text-white mx-auto" />
            )}
          </button>
        )
      })}
    </div>
  )
}
