'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LeadCard from './LeadCard'
import {
  Plus,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Download,
  Settings,
} from 'lucide-react'

// Types
interface PipelineStage {
  id: string
  name: string
  nameAr: string
  nameFr: string
  order: number
  color: string
  probability: number
}

interface PipelineData {
  id: string
  name: string
  stages: PipelineStage[]
}

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
}

interface PipelineViewProps {
  companyId?: string
  userId?: string
}

// Default pipeline stages for AlgeriaTrade
const defaultPipeline: PipelineData = {
  id: 'default',
  name: 'Pipeline de Ventes B2B',
  stages: [
    { id: 'new', name: 'Nouveau', nameAr: 'جديد', nameFr: 'Nouveau', order: 0, color: '#94a3b8', probability: 10 },
    { id: 'contacted', name: 'Contacté', nameAr: 'تم التواصل', nameFr: 'Contacté', order: 1, color: '#60a5fa', probability: 20 },
    { id: 'qualified', name: 'Qualifié', nameAr: 'مؤهل', nameFr: 'Qualifié', order: 2, color: '#34d399', probability: 35 },
    { id: 'proposal', name: 'Proposition', nameAr: 'اقتراح', nameFr: 'Proposition', order: 3, color: '#fbbf24', probability: 50 },
    { id: 'negotiation', name: 'Négociation', nameAr: 'تفاوض', nameFr: 'Négociation', order: 4, color: '#fb923c', probability: 70 },
    { id: 'won', name: 'Gagné', nameAr: 'فاز', nameFr: 'Gagné', order: 5, color: '#22c55e', probability: 100 },
    { id: 'lost', name: 'Perdu', nameAr: 'خسر', nameFr: 'Perdu', order: 6, color: '#ef4444', probability: 0 },
  ],
}

// Sample leads data
const sampleLeads: LeadData[] = [
  { id: '1', leadNumber: 'LED-001', companyName: 'SARL Technologie Algerienne', status: 'QUALIFIED', pipelineStage: 'qualified', estimatedValue: 2500000, probability: 35, expectedCloseDate: '2024-03-15', assignedTo: 'user1', leadScore: 72, source: 'WEBSITE' },
  { id: '2', leadNumber: 'LED-002', companyName: 'EURL Industrie Moderne', status: 'NEGOTIATION', pipelineStage: 'negotiation', estimatedValue: 5000000, probability: 70, expectedCloseDate: '2024-02-28', assignedTo: 'user1', leadScore: 85, source: 'REFERRAL' },
  { id: '3', leadNumber: 'LED-003', companyName: 'SPA Distribution Plus', status: 'NEW', pipelineStage: 'new', estimatedValue: 1200000, probability: 10, expectedCloseDate: '2024-04-30', assignedTo: 'user2', leadScore: 45, source: 'TRADE_SHOW' },
  { id: '4', leadNumber: 'LED-004', companyName: 'Sarl Agro Solutions', status: 'CONTACTED', pipelineStage: 'contacted', estimatedValue: 1800000, probability: 20, expectedCloseDate: '2024-04-15', assignedTo: 'user1', leadScore: 58, source: 'EMAIL' },
  { id: '5', leadNumber: 'LED-005', companyName: 'EURL Textile Excellence', status: 'PROPOSAL', pipelineStage: 'proposal', estimatedValue: 3200000, probability: 50, expectedCloseDate: '2024-03-20', assignedTo: 'user2', leadScore: 68, source: 'COLD_CALL' },
]

export default function PipelineView({ companyId, userId }: PipelineViewProps) {
  const [pipeline] = useState<PipelineData>(defaultPipeline)
  const [leads, setLeads] = useState<LeadData[]>(sampleLeads)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal')

  // Group leads by stage
  const leadsByStage = pipeline.stages.map(stage => ({
    ...stage,
    leads: leads.filter(lead => lead.pipelineStage === stage.id),
  }))

  // Calculate totals
  const totalValue = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0)
  const weightedValue = leads.reduce((sum, lead) => sum + (lead.estimatedValue * lead.probability / 100), 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{pipeline.name}</h2>
          <Badge variant="outline" className="font-normal">
            {leads.length} prospects
          </Badge>
          <Badge variant="secondary" className="font-normal bg-green-100 text-green-800 border-green-200">
            {formatCurrency(weightedValue)} pondéré
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Exporter
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" /> Configurer
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Nouveau prospect
          </Button>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {pipeline.stages.filter(s => !['won', 'lost'].includes(s.id)).map(stage => {
          const stageLeads = leads.filter(l => l.pipelineStage === stage.id)
          const stageValue = stageLeads.reduce((sum, l) => sum + l.estimatedValue, 0)
          
          return (
            <Card 
              key={stage.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${selectedStage === stage.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm font-medium truncate">{stage.nameFr}</span>
                </div>
                <p className="text-xl font-bold">{stageLeads.length}</p>
                <p className="text-xs text-gray-500">{formatCurrency(stageValue)}</p>
              </CardContent>
            </Card>
          )
        })}
        
        {/* Won/Lost summary */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Gagnés</span>
            </div>
            <p className="text-xl font-bold text-green-700">
              {leads.filter(l => l.pipelineStage === 'won').length}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-medium">Perdus</span>
            </div>
            <p className="text-xl font-bold text-red-700">
              {leads.filter(l => l.pipelineStage === 'lost').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Horizontal Pipeline View */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {leadsByStage.map((stage) => (
            <div
              key={stage.id}
              className={`w-72 flex-shrink-0 rounded-lg border ${
                selectedStage && selectedStage !== stage.id ? 'opacity-50' : ''
              }`}
              style={{ 
                borderTopWidth: '4px',
                borderTopColor: stage.color,
              }}
            >
              {/* Stage Header */}
              <div className="p-3 border-b bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{stage.nameFr}</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {stage.leads.length}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ajouter un prospect</DropdownMenuItem>
                      <DropdownMenuItem>Modifier le stade</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Configuration</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(stage.leads.reduce((sum, l) => sum + l.estimatedValue, 0))}
                </p>
              </div>

              {/* Stage Leads */}
              <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                {stage.leads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} compact showStage={false} />
                ))}
                
                {stage.leads.length === 0 && (
                  <div className="py-8 text-center text-sm text-gray-400">
                    Aucun prospect dans ce stade
                  </div>
                )}
                
                {/* Add lead button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => console.log('Add lead to', stage.id)}
                >
                  <Plus className="mr-1 h-3 w-3" /> Ajouter
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visualisation de l&apos;entonnoir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-4">
            {pipeline.stages
              .filter(s => !['won', 'lost'].includes(s.id))
              .map((stage, index) => {
                const stageLeads = leads.filter(l => l.pipelineStage === stage.id).length
                const maxLeads = Math.max(...pipeline.stages.map(s => leads.filter(l => l.pipelineStage === s.id).length), 1)
                const widthPercent = Math.max((stageLeads / maxLeads) * 100, 10)
                
                return (
                  <div key={stage.id} className="w-full max-w-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{stage.nameFr}</span>
                      <span className="text-sm text-gray-500">{stageLeads} ({Math.round(widthPercent)}%)</span>
                    </div>
                    <div 
                      className="h-10 rounded flex items-center justify-center text-white font-medium transition-all"
                      style={{ 
                        width: `${widthPercent}%`,
                        marginLeft: `${(100 - widthPercent) / 2}%`,
                        backgroundColor: stage.color,
                      }}
                    >
                      {stageLeads > 0 && `${formatCurrency(
                        leads.filter(l => l.pipelineStage === stage.id).reduce((sum, l) => sum + l.estimatedValue, 0)
                      )}`}
                    </div>
                    
                    {/* Arrow between stages */}
                    {index < pipeline.stages.filter(s => !['won', 'lost'].includes(s.id)).length - 1 && (
                      <div className="flex justify-center py-1">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                )
              })}
            
            {/* Final conversion */}
            <div className="w-full max-w-lg mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {leads.filter(l => l.pipelineStage === 'won').length}
                  </p>
                  <p className="text-sm text-gray-500">Convertis</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {leads.length > 0 ? Math.round((leads.filter(l => l.pipelineStage === 'won').length / leads.length) * 100) : 0}%
                  </p>
                  <p className="text-sm text-gray-500">Taux de conversion</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  )
}
