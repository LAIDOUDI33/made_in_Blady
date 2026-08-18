'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'

// Types
interface LeadScoringBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showIcon?: boolean
}

interface ScoreConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
  description: string
}

// Score configuration based on ranges
const getScoreConfig = (score: number): ScoreConfig => {
  if (score >= 80) {
    return {
      label: 'Excellent',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
      icon: <TrendingUp className="h-3 w-3" />,
      description: 'Prospect très qualifié - Forte probabilité de conversion',
    }
  } else if (score >= 60) {
    return {
      label: 'Bon',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300',
      icon: <TrendingUp className="h-3 w-3" />,
      description: 'Bon prospect - Suivi régulier recommandé',
    }
  } else if (score >= 40) {
    return {
      label: 'Moyen',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300',
      icon: <Minus className="h-3 w-3" />,
      description: 'Potentiel moyen - Nécessite qualification supplémentaire',
    }
  } else if (score >= 20) {
    return {
      label: 'Faible',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-300',
      icon: <TrendingDown className="h-3 w-3" />,
      description: 'Faible potentiel - Qualification ou nurturing nécessaire',
    }
  } else {
    return {
      label: 'Très faible',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      icon: <TrendingDown className="h-3 w-3" />,
      description: 'Très faible potentiel - Réévaluation ou archivage',
    }
  }
}

// Size configurations
const sizeConfig = {
  sm: {
    badge: 'px-1.5 py-0 text-xs',
    score: 'text-xs font-semibold',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'px-2.5 py-1 text-sm',
    score: 'text-sm font-bold',
    icon: 'h-4 w-4',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base',
    score: 'text-lg font-bold',
    icon: 'h-5 w-5',
  },
}

export default function LeadScoringBadge({ 
  score, 
  size = 'md', 
  showLabel = false, 
  showIcon = true 
}: LeadScoringBadgeProps) {
  const config = getScoreConfig(score)
  const sizes = sizeConfig[size]

  // Calculate circle progress for visual representation
  const circumference = 2 * Math.PI * 16
  const strokeDashoffset = circumference - (score / 100) * circumference

  // Inline badge content to avoid "component created during render" error
  const badgeContent = (
    <Badge 
      variant="outline" 
      className={`${sizes.badge} ${config.bgColor} ${config.color} ${config.borderColor} gap-1.5 font-medium`}
    >
      {/* Circular progress indicator */}
      <div className={`relative ${sizes.icon === 'h-4 w-4' ? 'w-5 h-5' : 'w-6 h-6'}`}>
        <svg 
          className="w-full h-full transform -rotate-90" 
          viewBox="0 0 36 36"
        >
          {/* Background circle */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="opacity-20"
          />
          {/* Progress circle */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        
        {/* Icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          {showIcon && config.icon}
        </div>
      </div>

      {/* Score value */}
      <span className={sizes.score}>{score}</span>
      
      {/* Optional label */}
      {showLabel && (
        <span className="hidden sm:inline">{config.label}</span>
      )}
    </Badge>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex cursor-help">
            {badgeContent}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Score du prospect</span>
              <span className={`font-bold ${config.color}`}>{score}/100</span>
            </div>
            
            <p className="text-xs text-gray-600">{config.description}</p>
            
            {/* Score breakdown */}
            <div className="pt-2 border-t space-y-1">
              <p className="text-xs font-medium text-gray-700">Composantes du score:</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex justify-between">
                  <span>Engagement</span>
                  <span>{Math.min(Math.round(score * 0.4), 40)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ajustement</span>
                  <span>{Math.min(Math.round(score * 0.25), 25)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Urgence</span>
                  <span>{Math.min(Math.round(score * 0.2), 20)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Budget</span>
                  <span>{Math.min(Math.round(score * 0.15), 15)}</span>
                </div>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Alternative simpler version without tooltip
export function SimpleScoreBadge({ 
  score, 
  size = 'sm' 
}: Omit<LeadScoringBadgeProps, 'showLabel' | 'showIcon'>) {
  const config = getScoreConfig(score)
  const sizes = sizeConfig[size]

  return (
    <Badge 
      variant="outline" 
      className={`${sizes.badge} ${config.bgColor} ${config.color} ${config.borderColor} font-medium`}
    >
      <span className={sizes.score}>{score}</span>
    </Badge>
  )
}

// Score bar component for detailed views
export function ScoreBar({ 
  score, 
  showLabels = true,
  height = 'h-2'
}: { 
  score: number
  showLabels?: boolean
  height?: string
}) {
  const config = getScoreConfig(score)
  
  // Determine gradient based on score
  let gradientColor = 'from-red-500 to-red-400'
  if (score >= 80) gradientColor = 'from-green-500 to-green-400'
  else if (score >= 60) gradientColor = 'from-blue-500 to-blue-400'
  else if (score >= 40) gradientColor = 'from-yellow-500 to-yellow-400'
  else if (score >= 20) gradientColor = 'from-orange-500 to-orange-400'

  return (
    <div className="space-y-1">
      {showLabels && (
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Score</span>
          <span className={`font-medium ${config.color}`}>{score}/100 - {config.label}</span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${height}`}>
        <div 
          className={`h-full bg-gradient-to-r ${gradientColor} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.max(score, 5)}%` }}
        />
      </div>
      
      {/* Score markers */}
      {showLabels && (
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      )}
    </div>
  )
}
