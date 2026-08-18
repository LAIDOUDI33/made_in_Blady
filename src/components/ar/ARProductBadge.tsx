'use client'

import React from 'react'
import { Box, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ARViewBadge } from './ARShareButton'

interface ARProductBadgeProps {
  productId: string
  hasARModel?: boolean
  variant?: 'default' | 'compact' | 'button'
  className?: string
}

export default function ARProductBadge({
  productId,
  hasARModel = true,
  variant = 'default',
  className = '',
}: ARProductBadgeProps) {
  if (!hasARModel) {
    return null
  }

  switch (variant) {
    case 'compact':
      return (
        <Badge 
          variant="secondary" 
          className={`gap-1 bg-purple-100 text-purple-700 border-purple-200 ${className}`}
        >
          <Box className="w-3 h-3" />
          <span>3D/AR</span>
        </Badge>
      )

    case 'button':
      return (
        <Link href={`/products/${productId}?ar=true`}>
          <ARViewBadge productId={productId} className={className} />
        </Link>
      )

    case 'default':
    default:
      return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
          {/* Icon with animation */}
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-md">
              <Box className="w-4 h-4 text-white" />
            </div>
            {/* Pulse effect */}
            <div className="absolute inset-0 rounded-lg bg-indigo-400 animate-ping opacity-30" />
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800">View in 3D / AR</span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Interactive experience
            </span>
          </div>
        </div>
      )
  }
}

// Badge for product listing cards (small, inline)
export function ProductCardARBadge({ productId }: { productId: string }) {
  return (
    <Link href={`/products/${productId}?ar=true`} className="inline-block">
      <Badge 
        variant="outline" 
        className="gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:border-purple-300 cursor-pointer transition-colors"
      >
        <svg className="w-3 h-3 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        </svg>
        <span className="text-xs font-medium text-purple-700">3D View</span>
      </Badge>
    </Link>
  )
}
