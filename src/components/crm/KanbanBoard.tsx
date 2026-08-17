'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LeadCard from './LeadCard'
import LeadScoringBadge from './LeadScoringBadge'
import {
  Plus,
  MoreHorizontal,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Columns,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react'

// Types
interface KanbanColumn {
  id: string
  name: string
  nameFr: string
  color: string
  probability: number
}

interface KanbanLead {
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

interface KanbanBoardProps {
  companyId?: string
  userId?: string
}

// Default columns for AlgeriaTrade B2B sales process
const defaultColumns: KanbanColumn[] = [
  { id: 'new', name: 'New', nameFr: 'Nouveau', color: '#94a3b8', probability: 10 },
  { id: 'contacted', name: 'Contacted', nameFr: 'Contacté', color: '#60a5fa', probability: 20 },
  { id: 'qualified', name: 'Qualified', nameFr: 'Qualifié', color: '#34d399', probability: 35 },
  { id: 'proposal', name: 'Proposal', nameFr: 'Proposition', color: '#fbbf24', probability: 50 },
  { id: 'negotiation', name: 'Negotiation', nameFr: 'Négociation', color: '#fb923c', probability: 70 },
  { id: 'won', name: 'Won', nameFr: 'Gagné', color: '#22c55e', probability: 100 },
  { id: 'lost', name: 'Lost', nameFr: 'Perdu', color: '#ef4444', probability: 0 },
]

// Sample leads data
const sampleLeads: KanbanLead[] = [
  { id: '1', leadNumber: 'LED-001', companyName: 'SARL Technologie Algerienne', status: 'QUALIFIED', pipelineStage: 'qualified', estimatedValue: 2500000, probability: 35, expectedCloseDate: '2024-03-15', assignedTo: 'user1', leadScore: 72, source: 'WEBSITE' },
  { id: '2', leadNumber: 'LED-002', companyName: 'EURL Industrie Moderne', status: 'NEGOTIATION', pipelineStage: 'negotiation', estimatedValue: 5000000, probability: 70, expectedCloseDate: '2024-02-28', assignedTo: 'user1', leadScore: 85, source: 'REFERRAL' },
  { id: '3', leadNumber: 'LED-003', companyName: 'SPA Distribution Plus', status: 'NEW', pipelineStage: 'new', estimatedValue: 1200000, probability: 10, expectedCloseDate: '2024-04-30', assignedTo: 'user2', leadScore: 45, source: 'TRADE_SHOW' },
  { id: '4', leadNumber: 'LED-004', companyName: 'Sarl Agro Solutions', status: 'CONTACTED', pipelineStage: 'contacted', estimatedValue: 1800000, probability: 20, expectedCloseDate: '2024-04-15', assignedTo: 'user1', leadScore: 58, source: 'EMAIL' },
  { id: '5', leadNumber: 'LED-005', companyName: 'EURL Textile Excellence', status: 'PROPOSAL', pipelineStage: 'proposal', estimatedValue: 3200000, probability: 50, expectedCloseDate: '2024-03-20', assignedTo: 'user2', leadScore: 68, source: 'COLD_CALL' },
  { id: '6', leadNumber: 'LED-006', companyName: 'SARL Construction Moderne', status: 'WON', pipelineStage: 'won', estimatedValue: 4500000, probability: 100, expectedCloseDate: '2024-01-30', assignedTo: 'user1', leadScore: 95, source: 'PARTNER' },
  { id: '7', leadNumber: 'LED-007', companyName: 'EURL Services Pro', status: 'LOST', pipelineStage: 'lost', estimatedValue: 800000, probability: 0, expectedCloseDate: '2024-02-15', assignedTo: 'user2', leadScore: 25, source: 'WEBSITE' },
]

export default function KanbanBoard({ companyId, userId }: KanbanBoardProps) {
  const [columns] = useState<KanbanColumn[]>(defaultColumns)
  const [leads, setLeads] = useState<KanbanLead[]>(sampleLeads)
  const [draggedLead, setDraggedLead] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // Group leads by column
  const getLeadsForColumn = (columnId: string) => {
    return leads.filter(lead => lead.pipelineStage === columnId)
  }

  // Calculate column stats
  const getColumnStats = (columnId: string) => {
    const columnLeads = getLeadsForColumn(columnId)
    const totalValue = columnLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0)
    const avgScore = columnLeads.length > 0 
      ? Math.round(columnLeads.reduce((sum, lead) => sum + lead.leadScore, 0) / columnLeads.length)
      : 0
    
    return { count: columnLeads.length, totalValue, avgScore }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLead(leadId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', leadId)
    
    // Add dragging class to element
    const target = e.currentTarget as HTMLElement
    target.classList.add('opacity-50')
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedLead(null)
    setDragOverColumn(null)
    
    const target = e.currentTarget as HTMLElement
    target.classList.remove('opacity-50')
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    
    if (!draggedLead) return

    // Update lead's stage
    setLeads(prev => prev.map(lead =>
      lead.id === draggedLead
        ? { 
            ...lead, 
            pipelineStage: targetColumnId,
            status: getStatusFromStage(targetColumnId),
            probability: columns.find(c => c.id === targetColumnId)?.probability || 0
          }
        : lead
    ))

    setDraggedLead(null)
    setDragOverColumn(null)

    // In production, call API to update lead stage
    console.log(`Moved lead ${draggedLead} to ${targetColumnId}`)
  }

  const getStatusFromStage = (stage: string): string => {
    switch (stage) {
      case 'new': return 'NEW'
      case 'contacted': return 'CONTACTED'
      case 'qualified': return 'QUALIFIED'
      case 'proposal': return 'PROPOSAL'
      case 'negotiation': return 'NEGOTIATION'
      case 'won': return 'WON'
      case 'lost': return 'LOST'
      default: return 'NEW'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Calculate overall stats
  const totalPipelineValue = leads
    .filter(l => !['won', 'lost'].includes(l.pipelineStage))
    .reduce((sum, l) => sum + l.estimatedValue, 0)
  
  const weightedPipelineValue = leads
    .filter(l => !['won', 'lost'].includes(l.pipelineStage))
    .reduce((sum, l) => sum + (l.estimatedValue * l.probability / 100), 0)

  const wonCount = leads.filter(l => l.pipelineStage === 'won').length
  const lostCount = leads.filter(l => l.pipelineStage === 'lost').length
  const activeCount = leads.filter(l => !['won', 'lost'].includes(l.pipelineStage)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Vue Kanban</h2>
          
          {/* Stats summary */}
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="outline">{activeCount} actifs</Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
              {wonCount} gagnés
            </Badge>
            <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
              {lostCount} perdus
            </Badge>
            <span className="text-gray-500">
              Pipeline: {formatCurrency(totalPipelineValue)} ({formatCurrency(weightedPipelineValue)} pondéré)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" /> Filtrer
          </Button>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Nouveau prospect
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => {
            const stats = getColumnStats(column.id)
            const columnLeads = getLeadsForColumn(column.id)
            const isDropTarget = dragOverColumn === column.id
            
            return (
              <div
                key={column.id}
                className={`w-80 flex-shrink-0 rounded-xl border transition-all ${
                  isDropTarget ? 'border-blue-400 bg-blue-50/50 ring-2 ring-blue-200' : 'border-gray-200 bg-white'
                } ${
                  ['won', 'lost'].includes(column.id) ? 'opacity-75' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div 
                  className="p-3 rounded-t-xl"
                  style={{ backgroundColor: `${column.color}15` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <span className="font-semibold text-sm">{column.nameFr}</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          column.id === 'won' ? 'bg-green-100 text-green-700' :
                          column.id === 'lost' ? 'bg-red-100 text-red-700' : ''
                        }`}
                      >
                        {stats.count}
                      </Badge>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
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

                  {/* Column Stats */}
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{formatCurrency(stats.totalValue)}</span>
                    <div className="flex items-center gap-1">
                      <span>Score moyen:</span>
                      <LeadScoringBadge score={stats.avgScore} size="sm" showLabel={false} showIcon={false} />
                    </div>
                  </div>
                </div>

                {/* Column Content */}
                <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-350px)] overflow-y-auto">
                  {columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-3">
                          {/* Drag Handle */}
                          <div className="flex items-start justify-between mb-2">
                            <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                            <LeadScoringBadge score={lead.leadScore} size="sm" showLabel={false} />
                          </div>

                          {/* Company Name */}
                          <h4 className="font-medium text-sm truncate mb-1">
                            {lead.companyName}
                          </h4>

                          {/* Value & Probability */}
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>{formatCurrency(lead.estimatedValue)}</span>
                            <span>{lead.probability}%</span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${lead.probability}%`,
                                backgroundColor: column.color
                              }}
                            />
                          </div>

                          {/* Meta */}
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                            <span>{lead.leadNumber}</span>
                            <span>{new Date(lead.expectedCloseDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}

                  {/* Empty state */}
                  {columnLeads.length === 0 && (
                    <div className="py-8 text-center text-sm text-gray-400">
                      <p>Aucun prospect</p>
                      <p className="text-xs mt-1">Glissez-déposez ici</p>
                    </div>
                  )}

                  {/* Add button */}
                  {!['won', 'lost'].includes(column.id) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed mt-2"
                      onClick={() => console.log('Add to', column.id)}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Ajouter
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-4">
        <GripVertical className="h-4 w-4" />
        <span>Glissez-déposez les cartes pour déplacer les prospects entre les stades</span>
      </div>
    </div>
  )
}
