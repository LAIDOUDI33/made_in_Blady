'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LeadScoringBadge from './LeadScoringBadge'
import {
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Building2,
  TrendingUp,
  Clock,
  User,
  MessageSquare,
  ArrowRight,
} from 'lucide-react'

// Types
interface LeadData {
  id: string
  leadNumber: string
  companyName: string
  status: string
  pipelineStage: string
  estimatedValue: number
  probability: number
  expectedCloseDate: string
  assignedTo: string
  leadScore: number
  source: string
  primaryContactName?: string
  primaryContactEmail?: string
  industry?: string
  wilaya?: string
}

interface LeadCardProps {
  lead: LeadData
  compact?: boolean
  showStage?: boolean
  onLeadClick?: (leadId: string) => void
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  NEW: { label: 'Nouveau', variant: 'outline', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  CONTACTED: { label: 'Contacté', variant: 'outline', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  QUALIFIED: { label: 'Qualifié', variant: 'default', color: 'bg-green-100 text-green-700 border-green-300' },
  PROPOSAL: { label: 'Proposition', variant: 'outline', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  NEGOTIATION: { label: 'Négociation', variant: 'secondary', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  WON: { label: 'Gagné', variant: 'default', color: 'bg-green-500 text-white border-green-600' },
  LOST: { label: 'Perdu', variant: 'destructive', color: '' },
}

const sourceConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  WEBSITE: { icon: <Building2 className="h-3 w-3" />, label: 'Site web' },
  REFERRAL: { icon: <User className="h-3 w-3" />, label: 'Recommandation' },
  TRADE_SHOW: { icon: <Calendar className="h-3 w-3" />, label: 'Salon' },
  COLD_CALL: { icon: <Phone className="h-3 w-3" />, label: 'Appel sortant' },
  EMAIL: { icon: <Mail className="h-3 w-3" />, label: 'Email' },
  SOCIAL_MEDIA: { icon: <MessageSquare className="h-3 w-3" />, label: 'Réseaux sociaux' },
  PARTNER: { icon: <TrendingUp className="h-3 w-3" />, label: 'Partenaire' },
  RFQ: { icon: <Calendar className="h-3 w-3" />, label: 'Demande de devis' },
}

export default function LeadCard({ 
  lead, 
  compact = false, 
  showStage = true, 
  onLeadClick 
}: LeadCardProps) {
  const status = statusConfig[lead.status] || statusConfig.NEW
  const source = sourceConfig[lead.source]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    })
  }

  // Calculate days until close
  const daysUntilClose = Math.ceil(
    (new Date(lead.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  if (compact) {
    return (
      <div 
        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${!showStage ? '' : 'border-b last:border-b-0'}`}
        onClick={() => onLeadClick?.(lead.id)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-medium">
                {lead.companyName.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{lead.companyName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={status.variant} className={`text-xs px-1.5 py-0 ${status.color}`}>
                  {status.label}
                </Badge>
                {showStage && (
                  <span className="text-xs text-gray-500">{formatCurrency(lead.estimatedValue)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <LeadScoringBadge score={lead.leadScore} size="sm" />
            <span className="text-xs text-gray-500 hidden sm:inline">
              {daysUntilClose > 0 ? `J-${daysUntilClose}` : daysUntilClose === 0 ? "Aujourd'hui" : `En retard de ${Math.abs(daysUntilClose)}j`}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onLeadClick?.(lead.id)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-orange-100 text-orange-700 text-sm font-medium">
                {lead.companyName.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{lead.companyName}</h3>
              <p className="text-xs text-gray-500">{lead.leadNumber}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem>Voir les détails</DropdownMenuItem>
              <DropdownMenuItem>Modifier</DropdownMenuItem>
              <DropdownMenuItem>Changer le stade</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-green-600">Convertir en client</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Marquer comme perdu</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status & Source */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={status.variant} className={status.color}>
            {status.label}
          </Badge>
          
          {source && (
            <Badge variant="outline" className="gap-1">
              {source.icon}
              {source.label}
            </Badge>
          )}

          {lead.industry && (
            <Badge variant="outline">{lead.industry}</Badge>
          )}

          {lead.wilaya && (
            <span className="text-xs text-gray-500">{lead.wilaya}</span>
          )}
        </div>

        {/* Value & Probability */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Valeur estimée</p>
            <p className="font-semibold text-sm">{formatCurrency(lead.estimatedValue)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Probabilité</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${lead.probability}%` }}
                />
              </div>
              <span className="text-sm font-medium">{lead.probability}%</span>
            </div>
          </div>
        </div>

        {/* Score & Timeline */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-3">
            <LeadScoringBadge score={lead.leadScore} />
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span className={daysUntilClose < 0 ? 'text-red-500 font-medium' : ''}>
                {daysUntilClose > 0 ? `Fermeture: ${formatDate(lead.expectedCloseDate)}` : 
                 daysUntilClose === 0 ? "Aujourd'hui" : 
                 `En retard de ${Math.abs(daysUntilClose)} jours`}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); console.log('Call', lead.id) }}>
              <Phone className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); console.log('Email', lead.id) }}>
              <Mail className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); console.log('Task', lead.id) }}>
              <Calendar className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
