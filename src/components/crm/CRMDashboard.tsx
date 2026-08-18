'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import PipelineView from './PipelineView'
import LeadCard from './LeadCard'
import TaskList from './TaskList'
import InteractionTimeline from './InteractionTimeline'
import KanbanBoard from './KanbanBoard'
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Target,
  BarChart3,
  RefreshCw,
  Download,
  Plus,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react'

// Types
interface CRMStats {
  totalContacts: number
  totalLeads: number
  activeLeads: number
  wonLeads: number
  lostLeads: number
  conversionRate: number
  totalPipelineValue: number
  weightedPipelineValue: number
  tasksDueToday: number
  overdueTasks: number
  interactionsThisWeek: number
  leadsBySource: Record<string, number>
  leadsByStage: Record<string, number>
}

interface DashboardProps {
  companyId?: string
  userId?: string
}

export default function CRMDashboard({ companyId, userId }: DashboardProps) {
  const [stats, setStats] = useState<CRMStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('30d')

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (companyId) params.append('companyId', companyId)
      if (userId) params.append('userId', userId)
      
      const response = await fetch(`/api/crm/dashboard/stats?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching CRM stats:', error)
    } finally {
      setLoading(false)
    }
  }, [companyId, userId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-DZ').format(value)
  }

  // Sample data for demonstration
  const sampleLeads = [
    {
      id: '1',
      leadNumber: 'LED-20240115-0001',
      companyName: 'SARL Technologie Algerienne',
      status: 'QUALIFIED' as const,
      pipelineStage: 'QUALIFIED',
      estimatedValue: 2500000,
      probability: 35,
      expectedCloseDate: '2024-03-15',
      assignedTo: 'user1',
      leadScore: 72,
      source: 'WEBSITE',
    },
    {
      id: '2',
      leadNumber: 'LED-20240116-0002',
      companyName: 'EURL Industrie Moderne',
      status: 'NEGOTIATION' as const,
      pipelineStage: 'NEGOTIATION',
      estimatedValue: 5000000,
      probability: 70,
      expectedCloseDate: '2024-02-28',
      assignedTo: 'user1',
      leadScore: 85,
      source: 'REFERRAL',
    },
    {
      id: '3',
      leadNumber: 'LED-20240117-0003',
      companyName: 'SPA Distribution Plus',
      status: 'NEW' as const,
      pipelineStage: 'NEW',
      estimatedValue: 1200000,
      probability: 10,
      expectedCloseDate: '2024-04-30',
      assignedTo: 'user2',
      leadScore: 45,
      source: 'TRADE_SHOW',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
          <p className="text-gray-500 mt-1">Gestion de la relation client et des prospects</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats?.totalContacts || 0}</p>
                <p className="text-xs text-gray-500">Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats?.totalLeads || 0}</p>
                <p className="text-xs text-gray-500">Prospects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats?.wonLeads || 0}</p>
                <p className="text-xs text-gray-500">Gagnés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats?.conversionRate || 0}%</p>
                <p className="text-xs text-gray-500">Conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold">{formatCurrency(stats?.totalPipelineValue || 0)}</p>
                <p className="text-xs text-gray-500">Pipeline</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${(stats?.overdueTasks || 0) > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats?.overdueTasks || 0}</p>
                <p className="text-xs text-gray-500">En retard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Leads */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Prospects récents</span>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Nouveau
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {sampleLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} compact />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions & Stats */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Actions rapides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-auto py-3 flex flex-col gap-1">
                      <UserPlus className="h-5 w-5" />
                      <span className="text-xs">Nouveau prospect</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 flex flex-col gap-1">
                      <Users className="h-5 w-5" />
                      <span className="text-xs">Nouveau contact</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 flex flex-col gap-1">
                      <Phone className="h-5 w-5" />
                      <span className="text-xs">Appeler</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 flex flex-col gap-1">
                      <Mail className="h-5 w-5" />
                      <span className="text-xs">Envoyer email</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 flex flex-col gap-1">
                      <Calendar className="h-5 w-5" />
                      <span className="text-xs">Réunion</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 flex flex-col gap-1">
                      <Target className="h-5 w-5" />
                      <span className="text-xs">Tâche</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Leads by Source */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Prospects par source</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats?.leadsBySource || {}).map(([source, count]) => (
                      <div key={source} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(count / (stats?.totalLeads || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                    {!stats?.leadsBySource || Object.keys(stats.leadsBySource).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">Aucune donnée disponible</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="mt-6">
          <PipelineView companyId={companyId} userId={userId} />
        </TabsContent>

        {/* Kanban Tab */}
        <TabsContent value="kanban" className="mt-6">
          <KanbanBoard companyId={companyId} userId={userId} />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-6">
          <TaskList userId={userId} />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <InteractionTimeline companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
