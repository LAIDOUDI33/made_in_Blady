'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { Input } from '@/components/ui/input'
import {
  Phone,
  Mail,
  Users,
  FileText,
  MessageSquare,
  CheckSquare,
  Send,
  Calendar,
  Clock,
  Plus,
  Filter,
  RefreshCw,
} from 'lucide-react'

// Types
interface Activity {
  id: string
  type: string
  subject: string
  description?: string
  direction: string
  contactName?: string
  companyName?: string
  createdAt: string
  durationMinutes?: number
  channel?: string
}

interface ActivityFeedProps {
  companyId?: string
  contactId?: string
  leadId?: string
  limit?: number
  showFilters?: boolean
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  task: <CheckSquare className="h-4 w-4" />,
  follow_up: <RefreshCw className="h-4 w-4" />,
  demo: <Send className="h-4 w-4" />,
  proposal_sent: <FileText className="h-4 w-4" />,
  quote_sent: <MessageSquare className="h-4 w-4" />,
  system: <Calendar className="h-4 w-4" />,
}

const ACTIVITY_COLORS: Record<string, string> = {
  call: 'bg-blue-100 text-blue-600',
  email: 'bg-purple-100 text-purple-600',
  meeting: 'bg-green-100 text-green-600',
  note: 'bg-gray-100 text-gray-600',
  task: 'bg-yellow-100 text-yellow-600',
  follow_up: 'bg-pink-100 text-pink-600',
  demo: 'bg-cyan-100 text-cyan-600',
  proposal_sent: 'bg-indigo-100 text-indigo-600',
  quote_sent: 'bg-emerald-100 text-emerald-600',
  system: 'bg-orange-100 text-orange-600',
}

export default function ActivityFeed({ 
  companyId, 
  contactId, 
  leadId, 
  limit = 20,
  showFilters = true 
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  
  // Log dialog state
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: 'note',
    subject: '',
    description: '',
    duration: '',
  })

  useEffect(() => {
    fetchActivities()
  }, [companyId, contactId, leadId, typeFilter, limit])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (companyId) params.append('companyId', companyId)
      if (contactId) params.append('contactId', contactId)
      if (leadId) params.append('leadId', leadId)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      params.append('pageSize', limit.toString())
      
      const response = await fetch(`/api/crm/activities?${params}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogActivity = async () => {
    try {
      if (!contactId && !companyId) return
      
      const response = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contactId || 'temp',
          companyId: companyId || '',
          type: formData.type,
          subject: formData.subject,
          description: formData.description,
          durationMinutes: formData.duration ? parseInt(formData.duration) : undefined,
          createdBy: 'current-user',
        }),
      })
      
      if (response.ok) {
        setLogDialogOpen(false)
        resetForm()
        fetchActivities()
      }
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'note',
      subject: '',
      description: '',
      duration: '',
    })
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: numeric ? date.getFullYear() !== now.getFullYear() : undefined,
    })
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const groupedActivities = activities.reduce((groups, activity) => {
      const date = new Date(activity.createdAt).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
      
      if (!groups[date]) {
        groups[date] = []
      }
      
      groups[date].push(activity)
      return groups
    }, {} as Record<string, Activity[]>)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <CardHeader className="p-0">
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
        </CardHeader>
        
        <div className="flex items-center gap-2">
          {showFilters && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="call">Calls</SelectItem>
                <SelectItem value="email">Emails</SelectItem>
                <SelectItem value="meeting">Meetings</SelectItem>
                <SelectItem value="note">Notes</SelectItem>
                <SelectItem value="task">Tasks</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Log Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Log New Activity</DialogTitle>
                <DialogDescription>Record an interaction or note</DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="activityType">Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief summary of this activity"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Details</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what happened..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                {(formData.type === 'call' || formData.type === 'meeting') && (
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="30"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    />
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setLogDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleLogActivity}
                  disabled={!formData.subject}
                >
                  Log Activity
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="ghost" size="icon" onClick={fetchActivities}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Activities List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No activities yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start logging interactions to build your timeline.
              </p>
              <Button className="mt-4" onClick={() => setLogDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Log First Activity
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {Object.entries(groupedActivities).map(([date, dayActivities]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="px-5 py-3 bg-muted/30 sticky top-0 z-10">
                    <p className="text-sm font-medium text-muted-foreground">{date}</p>
                  </div>
                  
                  {/* Activities for this day */}
                  {dayActivities.map((activity) => (
                    <div key={activity.id} className="px-5 py-4 hover:bg-muted/20 transition-colors">
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          ACTIVITY_COLORS[activity.type] || ACTIVITY_COLORS.note
                        }`}>
                          {ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.note}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{activity.subject}</p>
                              
                              {activity.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {activity.description}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="capitalize flex items-center gap-1">
                                  {activity.type.replace('_', ' ')}
                                </span>
                                
                                {activity.direction && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                                    {activity.direction}
                                  </Badge>
                                )}
                                
                                {activity.channel && (
                                  <span>via {activity.channel}</span>
                                )}
                                
                                {activity.durationMinutes && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(activity.durationMinutes)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-shrink-0 text-right">
                              <p className="text-xs text-muted-foreground">
                                {formatTimeAgo(activity.createdAt)}
                              </p>
                              
                              {activity.contactName && (
                                <p className="text-xs mt-1 max-w-[120px] truncate">
                                  {activity.contactName}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
