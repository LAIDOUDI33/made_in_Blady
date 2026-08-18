'use client'

import React from 'react'
import { Loader2, Box, AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ARModelLoaderProps {
  progress?: number
  status?: 'loading' | 'processing' | 'error' | 'complete'
  message?: string
  modelName?: string
}

export default function ARModelLoader({
  progress = 0,
  status = 'loading',
  message,
  modelName,
}: ARModelLoaderProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: Loader2,
          iconClass: 'animate-spin text-indigo-500',
          title: 'Loading Model',
          defaultMessage: `Preparing ${modelName || '3D model'}...`,
        }
      case 'processing':
        return {
          icon: Box,
          iconClass: 'text-blue-500 animate-pulse',
          title: 'Processing',
          defaultMessage: 'Optimizing model for viewing...',
        }
      case 'error':
        return {
          icon: AlertCircle,
          iconClass: 'text-red-500',
          title: 'Error',
          defaultMessage: 'Failed to load model',
        }
      case 'complete':
        return {
          icon: Box,
          iconClass: 'text-green-500',
          title: 'Complete',
          defaultMessage: 'Model loaded successfully!',
        }
      default:
        return {
          icon: Loader2,
          iconClass: 'animate-spin text-gray-500',
          title: 'Loading',
          defaultMessage: 'Please wait...',
        }
    }
  }

  const config = getStatusConfig()
  const IconComponent = config.icon

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-xl">
      {/* Icon */}
      <div className={`w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4`}>
        <IconComponent className={`w-8 h-8 ${config.iconClass}`} />
      </div>

      {/* Title and message */}
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{config.title}</h3>
      <p className="text-sm text-gray-500 mb-4">{message || config.defaultMessage}</p>

      {/* Progress bar */}
      {(status === 'loading' || status === 'processing') && (
        <div className="w-full max-w-xs space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-gray-400">{Math.round(progress)}%</p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          Try Again
        </button>
      )}

      {/* Complete state */}
      {status === 'complete' && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Ready to view
        </div>
      )}
    </div>
  )
}

// Compact inline loader for use within viewer
export function InlineLoader({ 
  progress, 
  size = 'md' 
}: { 
  progress?: number
  size?: 'sm' | 'md' | 'lg' 
}) {
  const sizes = {
    sm: { container: 'w-6 h-6', icon: 'w-3 h-3', text: 'text-xs' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-sm' },
    lg: { container: 'w-14 h-14', icon: 'w-7 h-7', text: 'text-base' },
  }

  const s = sizes[size]

  return (
    <div className={`${s.container} rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex flex-col items-center justify-center`}>
      <Loader2 className={`${s.icon} animate-spin text-indigo-500`} />
      {progress !== undefined && (
        <span className={`${s.text} text-gray-600 font-medium mt-1`}>{Math.round(progress)}%</span>
      )}
    </div>
  )
}
