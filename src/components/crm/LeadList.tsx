'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Building2,
  User,
  ArrowRightLeft,
  Star,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// Types
interface Lead {
  id: string
  leadNumber: string
  companyName: string
  industry?: string
  source: string
  status: string
  pipelineStage: string
  estimatedValue: number
  currency: string
  probability: number
  expectedCloseDate: string
  score: number
  engagementScore: number
  createdAt: string
}

interface LeadListProps {
  ownerId?: string
  onLeadSelect?: (lead: Lead) => void
}

export default function LeadList({ ownerId, onLeadSelect }: LeadListProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    source: 'website',
    estimatedValue: '',
    currency: 'DZD',
    expectedCloseDate: '',
    notes: '',
  })

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (ownerId) params.append('ownerId', ownerId)
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter.toUpperCase())
      if (sourceFilter !== 'all') params.append('source', sourceFilter.toUpperCase())
      params.append('page', currentPage.toString())
      params.append('pageSize', '20')
      
      const response = await fetch(`/api/crm/leads?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }, [ownerId, searchQuery, statusFilter, sourceFilter, currentPage])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const handleCreateLead = async () => {
    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: ownerId || 'default',
          source: formData.source.toUpperCase(),
          companyName: formData.companyName,
          industry: formData.industry || undefined,
          estimatedValue: parseFloat(formData.estimatedValue) || 0,
          currency: formData.currency,
          expectedCloseDate: new Date(formData.expectedCloseDate).toISOString(),
          assignedTo: ownerId || 'default',
          notes: formData.notes || undefined,
        }),
      })
      
      if (response.ok) {
        setCreateDialogOpen(false)
        resetForm()
        fetchLeads()
      }
    } catch (error) {
      console.error('Error creating lead:', error)
    }
  }

  const handleStageChange = async (leadId: string, newStage: string) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })
      
      if (response.ok) {
        fetchLeads()
      }
    } catch (error) {
      console.error('Error updating lead stage:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      companyName: '',
      industry: '',
      source: 'website',
      estimatedValue: '',
      currency: 'DZD',
      expectedCloseDate: '',
      notes: '',
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 bg-green-100'
    if (score >= 50) return 'text-yellow-600 bg-yellow-100'
    if (score >= 25) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': return 'bg-gray-100 text-gray-800'
      case 'contacted': return 'bg-blue-100 text-blue-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'proposal': return 'bg-yellow-100 text-yellow-800'
      case 'negotiation': return 'bg-orange-100 text-orange-800'
      case 'won': return 'bg-emerald-100 text-emerald-800'
      case 'lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'referral': return 'bg-emerald-100 text-emerald-800'
      case 'rfq': return 'bg-blue-100 text-blue-800'
      case 'trade_show': return 'bg-purple-100 text-purple-800'
      case 'website': return 'bg-cyan-100 text-cyan-800'
      case 'cold_call': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (value: number, currency: string = 'DZD') => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const totalValue = leads.reduce((sum, l) => sum + l.estimatedValue, 0)
  const weightedValue = leads.reduce((sum, l) => sum + (l.estimatedValue * l.probability / 100), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Leads & Prospects</h2>
          <p className="text-muted-foreground">Track and manage your sales pipeline</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>Add a new prospect to your pipeline</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., Manufacturing"
                  />
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Select value={formData.source} onValueChange={(v) => setFormData(prev => ({ ...prev, source: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="trade_show">Trade Show</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="email">Email Campaign</SelectItem>
                      <SelectItem value="rfq">RFQ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="value">Est. Value</Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="0"
                    value={formData.estimatedValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData(prev => ({ ...prev, currency: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DZD">DZD - د.ج</SelectItem>
                      <SelectItem value="EUR">EUR - €</SelectItem>
                      <SelectItem value="USD">USD - $</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="closeDate">Expected Close</Label>
                  <Input
                    id="closeDate"
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional information about this lead..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateLead}
                disabled={!formData.companyName}
              >
                Create Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weighted Value</p>
                <p className="text-2xl font-bold">{formatCurrency(weightedValue)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Leads</p>
                <p className="text-2xl font-bold">{leads.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="negotiation">Negotiation</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="trade_show">Trade Show</SelectItem>
            <SelectItem value="cold_call">Cold Call</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="rfq">RFQ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No leads found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start building your pipeline by adding a new lead.
              </p>
              <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Your First Lead
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {leads.map((lead) => (
                <div 
                  key={lead.id} 
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedLead(lead)
                    setDetailDialogOpen(true)
                    onLeadSelect?.(lead)
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{lead.companyName}</h4>
                        <Badge className={getStatusColor(lead.status)} variant="secondary">
                          {lead.status}
                        </Badge>
                        <Badge className={getSourceColor(lead.source)} variant="secondary">
                          {lead.source}
                        </Badge>
                      </div>
                      
                      {lead.industry && (
                        <p className="text-sm text-muted-foreground mb-2">{lead.industry}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Closes: {formatDate(lead.expectedCloseDate)}
                        </span>
                        <span>#{lead.leadNumber}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(lead.score)}`}>
                        {lead.score}/100
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(lead.estimatedValue, lead.currency)}</p>
                        <p className="text-xs text-muted-foreground">{lead.probability}% prob.</p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStageChange(lead.id, 'qualified') }}>
                            <TrendingUp className="mr-2 h-4 w-4" /> Qualify
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStageChange(lead.id, 'proposal') }}>
                            <Edit className="mr-2 h-4 w-4" /> Send Proposal
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation() }}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation() }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Progress bar for probability */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Pipeline Progress</span>
                      <span>{lead.probability}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${lead.probability}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Lead Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>Full information about this prospect</DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{selectedLead.companyName}</h3>
                  <p className="text-muted-foreground">{selectedLead.industry}</p>
                  <p className="text-sm text-muted-foreground mt-1">#{selectedLead.leadNumber}</p>
                </div>
                <Badge className={getStatusColor(selectedLead.status)} variant="secondary">
                  {selectedLead.status}
                </Badge>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <p className="text-2xl font-bold">{formatCurrency(selectedLead.estimatedValue, selectedLead.currency)}</p>
                    <p className="text-xs text-muted-foreground">Estimated Value</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <p className="text-2xl font-bold">{selectedLead.probability}%</p>
                    <p className="text-xs text-muted-foreground">Probability</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className={`inline-flex px-3 py-1 rounded-full text-lg font-bold ${getScoreColor(selectedLead.score)}`}>
                      {selectedLead.score}
                    </div>
                    <p className="text-xs text-muted-foreground">Lead Score</p>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Source:</span>{' '}
                  <Badge className={getSourceColor(selectedLead.source)} variant="secondary">
                    {selectedLead.source}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected Close:</span>{' '}
                  {formatDate(selectedLead.expectedCloseDate)}
                </div>
                <div>
                  <span className="text-muted-foreground">Pipeline Stage:</span>{' '}
                  {selectedLead.pipelineStage}
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>{' '}
                  {formatDate(selectedLead.createdAt)}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button size="sm" variant="outline" onClick={() => handleStageChange(selectedLead.id, 'qualified')}>
                  <TrendingUp className="mr-2 h-4 w-4" /> Qualify
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleStageChange(selectedLead.id, 'proposal')}>
                  <Edit className="mr-2 h-4 w-4" /> Proposal
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleStageChange(selectedLead.id, 'lost')}>
                  <Minus className="mr-2 h-4 w-4" /> Lost
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
