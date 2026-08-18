'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  Building2,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'

// Types
interface Deal {
  id: string
  dealNumber: string
  title: string
  value: number
  currency: string
  stage: string
  probability: number
  expectedCloseDate: string
  contactName?: string
  companyName?: string
  createdAt: string
  lossReason?: string
}

interface DealCardProps {
  deal: Deal
  compact?: boolean
  onStageChange?: (dealId: string, newStage: string) => void
  onView?: (deal: Deal) => void
}

export default function DealCard({ deal, compact = false, onStageChange, onView }: DealCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: deal.currency || 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'lead':
      case 'new':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'qualified':
      case 'contacted':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'proposal':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'negotiation':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'closed_won':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'closed_lost':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'closed_won':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'closed_lost':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  const isWon = deal.stage === 'closed_won' || deal.stage === 'won'
  const isLost = deal.stage === 'closed_lost' || deal.stage === 'lost'

  if (compact) {
    return (
      <Card className={`hover:shadow-md transition-all cursor-pointer ${isWon ? 'border-l-4 border-l-green-500' : isLost ? 'border-l-4 border-l-red-500 opacity-75' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{deal.title}</h4>
              {deal.contactName && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3" /> {deal.contactName}
                </p>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <Badge className={getStageColor(deal.stage)} variant="secondary">
                {deal.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              
              {!isWon && !isLost && (
                <span className="text-sm font-semibold">{formatCurrency(deal.value)}</span>
              )}
            </div>
          </div>
          
          {/* Progress bar */}
          {!isWon && !isLost && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all"
                  style={{ width: `${deal.probability}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Full card view
  return (
    <Card className={`hover:shadow-lg transition-all ${isWon ? 'border-l-4 border-l-green-500 bg-green-50/30' : isLost ? 'border-l-4 border-l-red-500 opacity-75 bg-red-50/30' : ''}`}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getStageIcon(deal.stage)}
              <h3 className="font-semibold text-lg truncate">{deal.title}</h3>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {deal.companyName && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {deal.companyName}
                </span>
              )}
              {deal.contactName && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {deal.contactName}
                </span>
              )}
              <span className="text-xs">#{deal.dealNumber}</span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(deal)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStageChange?.(deal.id, 'qualified')}>
                Move to Qualified
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStageChange?.(deal.id, 'proposal')}>
                Send Proposal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStageChange?.(deal.id, 'negotiation')}>
                Start Negotiation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-green-600"
                onClick={() => onStageChange?.(deal.id, 'closed_won')}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Won
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => onStageChange?.(deal.id, 'closed_lost')}
              >
                <XCircle className="mr-2 h-4 w-4" /> Mark as Lost
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Value & Probability */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Value</p>
            <p className="text-xl font-bold">{formatCurrency(deal.value)}</p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Probability</p>
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-bold">{deal.probability}%</p>
              {!isWon && !isLost && (
                <TrendingUp className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {!isWon && !isLost && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Pipeline Progress</span>
              <span>{deal.probability}% to close</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  deal.probability >= 70 ? 'bg-green-500' :
                  deal.probability >= 40 ? 'bg-yellow-500' :
                  deal.probability >= 20 ? 'bg-orange-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(deal.probability, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Close: {formatDate(deal.expectedCloseDate)}</span>
          </div>
          
          <Badge className={getStageColor(deal.stage)} variant="secondary">
            {deal.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>

        {/* Loss Reason */}
        {isLost && deal.lossReason && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Loss Reason</p>
                <p className="text-sm text-red-700">{deal.lossReason}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
