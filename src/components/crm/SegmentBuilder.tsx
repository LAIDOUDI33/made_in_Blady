'use client'

import React, { useState } from 'react'
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
import {
  Plus,
  Trash2,
  Users,
  Filter,
  Save,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

// Types
interface SegmentFilter {
  id: string
  field: string
  operator: string
  value: string
}

interface Segment {
  id: string
  name: string
  description?: string
  filters: SegmentFilter[]
  contactCount?: number
}

const AVAILABLE_FIELDS = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'company', label: 'Company' },
  { value: 'position', label: 'Position / Job Title' },
  { value: 'city', label: 'City' },
  { value: 'status', label: 'Status' },
  { value: 'tags', label: 'Tags' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'lastContactedAt', label: 'Last Contacted' },
]

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'isEmpty', label: 'Is Empty' },
  { value: 'isNotEmpty', label: 'Is Not Empty' },
]

interface SegmentBuilderProps {
  ownerId?: string
  onSegmentCreate?: (segment: Omit<Segment, 'id'>) => void
}

export default function SegmentBuilder({ ownerId, onSegmentCreate }: SegmentBuilderProps) {
  const [segments, setSegments] = useState<Segment[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  
  // New segment form state
  const [newSegmentName, setNewSegmentName] = useState('')
  const [newSegmentDesc, setNewSegmentDesc] = useState('')
  const [filters, setFilters] = useState<SegmentFilter[]>([
    { id: '1', field: '', operator: '', value: '' }
  ])

  const addFilter = () => {
    setFilters([
      ...filters,
      { id: Date.now().toString(), field: '', operator: '', value: '' }
    ])
  }

  const removeFilter = (id: string) => {
    if (filters.length > 1) {
      setFilters(filters.filter(f => f.id !== id))
    }
  }

  const updateFilter = (id: string, key: keyof SegmentFilter, value: string) => {
    setFilters(filters.map(f => 
      f.id === id ? { ...f, [key]: value } : f
    ))
  }

  const handleSaveSegment = async () => {
    if (!newSegmentName.trim()) return
    
    const validFilters = filters.filter(f => f.field && f.operator)
    
    if (validFilters.length === 0) return
    
    const newSegment: Omit<Segment, 'id'> = {
      name: newSegmentName,
      description: newSegmentDesc || undefined,
      filters: validFilters,
    }
    
    onSegmentCreate?.(newSegment)
    
    // Also add to local state for display
    setSegments([...segments, { ...newSegment, id: Date.now().toString() }])
    
    // Reset form
    setNewSegmentName('')
    setNewSegmentDesc('')
    setFilters([{ id: '1', field: '', operator: '', value: '' }])
    setCreateDialogOpen(false)
  }

  const getFieldLabel = (fieldValue: string) => {
    return AVAILABLE_FIELDS.find(f => f.value === fieldValue)?.label || fieldValue
  }

  const getOperatorLabel = (opValue: string) => {
    return OPERATORS.find(o => o.value === opValue)?.label || opValue
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Customer Segments</h3>
          <p className="text-sm text-muted-foreground">Build targeted contact groups</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> New Segment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Customer Segment</DialogTitle>
              <DialogDescription>
                Define filters to create a targeted contact segment
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="segName">Segment Name *</Label>
                  <Input
                    id="segName"
                    placeholder="e.g., VIP Customers in Algiers"
                    value={newSegmentName}
                    onChange={(e) => setNewSegmentName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="segDesc">Description</Label>
                  <Input
                    id="segDesc"
                    placeholder="What is this segment for?"
                    value={newSegmentDesc}
                    onChange={(e) => setNewSegmentDesc(e.target.value)}
                  />
                </div>
              </div>

              {/* Filters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Filters ({filters.length})</Label>
                  <Button variant="outline" size="sm" onClick={addFilter}>
                    <Plus className="mr-2 h-4 w-4" /> Add Filter
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {filters.map((filter, index) => (
                    <div key={filter.id} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium mt-0.5">
                        {index + 1}
                      </span>
                      
                      <div className="flex-1 grid grid-cols-12 gap-2 items-start">
                        {/* Field Select */}
                        <Select 
                          value={filter.field} 
                          onValueChange={(v) => updateFilter(filter.id, 'field', v)}
                        >
                          <SelectTrigger className="col-span-4">
                            <SelectValue placeholder="Field" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_FIELDS.map(field => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Operator Select */}
                        <Select 
                          value={filter.operator} 
                          onValueChange={(v) => updateFilter(filter.id, 'operator', v)}
                          disabled={!filter.field}
                        >
                          <SelectTrigger className="col-span-4">
                            <SelectValue placeholder="Condition" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map(op => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Value Input */}
                        <Input
                          placeholder="Value..."
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                          disabled={!filter.operator || ['isEmpty', 'isNotEmpty'].includes(filter.operator)}
                          className="col-span-3"
                        />
                        
                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="col-span-1 h-9 w-9 flex-shrink-0"
                          onClick={() => removeFilter(filter.id)}
                          disabled={filters.length <= 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSegment}
                disabled={!newSegmentName.trim() || !filters.some(f => f.field && f.operator)}
              >
                <Save className="mr-2 h-4 w-4" /> Create Segment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Segments List */}
      {segments.length > 0 ? (
        <div className="grid gap-4">
          {segments.map((segment) => (
            <Card key={segment.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">{segment.name}</h4>
                    {segment.description && (
                      <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {segment.filters.map((filter) => (
                        <Badge key={filter.id} variant="secondary" className="text-xs">
                          {getFieldLabel(filter.field)}{' '}
                          {getOperatorLabel(filter.operator)}{' '}
                          {filter.value && `"${filter.value}"`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Users className="mr-1 h-3 w-3" />
                      {segment.contactCount || '-'} contacts
                    </Badge>
                    
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 font-medium">No segments yet</h3>
            <p className="mt-2 text-sm text-muted-foreground mb-4">
              Create your first customer segment to organize your contacts.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Segment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
