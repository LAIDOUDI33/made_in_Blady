'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react'

// Types
interface ReportData {
  period: string
  metrics: {
    totalContacts: number
    newContactsThisPeriod: number
    totalLeads: number
    newLeadsThisPeriod: number
    activeLeads: number
    wonLeads: number
    lostLeads: number
    conversionRate: number
    totalPipelineValue: number
    weightedPipelineValue: number
    revenueThisPeriod: number
    tasksDueToday: number
    overdueTasks: number
    activitiesThisWeek: number
  }
}

interface CRMReportsProps {
  ownerId?: string
}

export default function CRMReports({ ownerId }: CRMReportsProps) {
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [period, setPeriod] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (ownerId) {
      fetchReport()
    }
  }, [ownerId, period])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (ownerId) params.append('ownerId', ownerId)
      params.append('type', 'report')
      params.append('period', period)
      
      const response = await fetch(`/api/crm/analytics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data.data)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-DZ').format(value)
  }

  // Sample chart data for visualization
  const monthlyRevenue = [
    { month: 'Jan', value: 1250000 },
    { month: 'Feb', value: 1580000 },
    { month: 'Mar', value: 1890000 },
    { month: 'Apr', value: 2150000 },
    { month: 'May', value: 1980000 },
    { month: 'Jun', value: 2450000 },
  ]

  const leadsBySource = [
    { source: 'Website', count: 45, color: '#3b82f6' },
    { source: 'Referral', count: 28, color: '#22c55e' },
    { source: 'Trade Show', count: 18, color: '#a855f7' },
    { source: 'Cold Call', count: 12, color: '#94a3b8' },
    { source: 'Email', count: 22, color: '#ec4899' },
    { source: 'RFQ', count: 35, color: '#06b6d4' },
  ]

  const stageConversion = [
    { stage: 'New', count: 100, rate: 100 },
    { stage: 'Contacted', count: 75, rate: 75 },
    { stage: 'Qualified', count: 52, rate: 52 },
    { stage: 'Proposal', count: 35, rate: 35 },
    { stage: 'Negotiation', count: 22, rate: 22 },
    { stage: 'Won', count: 15, rate: 15 },
  ]

  const maxSourceCount = Math.max(...leadsBySource.map(s => s.count))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">CRM Reports & Analytics</h2>
          <p className="text-muted-foreground">Performance insights and metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchReport} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{reportData ? formatNumber(reportData.metrics.totalContacts) : '-'}</p>
                    <p className="text-xs text-muted-foreground">Total Contacts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-100 text-green-600">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{reportData ? formatNumber(reportData.metrics.totalLeads) : '-'}</p>
                    <p className="text-xs text-muted-foreground">Total Leads</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{reportData ? formatNumber(reportData.metrics.wonLeads) : '-'}</p>
                    <p className="text-xs text-muted-foreground">Deals Won</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${reportData && reportData.metrics.conversionRate >= 20 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{reportData ? `${reportData.metrics.conversionRate}%` : '-'}</p>
                    <p className="text-xs text-muted-foreground">Conversion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue & Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Revenue This Period</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {reportData && reportData.metrics.revenueThisPeriod > 0 ? (
                      <>
                        <TrendingUp className="mr-1 h-3 w-3" /> +12.5%
                      </>
                    ) : null}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {reportData ? formatCurrency(reportData.metrics.revenueThisPeriod) : '-'}
                </p>
                
                {/* Simple bar chart representation */}
                <div className="mt-4 space-y-2">
                  {monthlyRevenue.slice(-6).map((item) => (
                    <div key={item.month} className="flex items-center gap-2">
                      <span className="w-10 text-xs text-muted-foreground">{item.month}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full"
                          style={{ 
                            width: `${(item.value / Math.max(...monthlyRevenue.map(m => m.value))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="w-20 text-xs text-right font-medium">
                        {(item.value / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pipeline Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Pipeline Value</span>
                  <span className="font-semibold">
                    {reportData ? formatCurrency(reportData.metrics.totalPipelineValue) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Weighted Value</span>
                  <span className="font-semibold text-primary">
                    {reportData ? formatCurrency(reportData.metrics.weightedPipelineValue) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Leads</span>
                  <span className="font-semibold">
                    {reportData ? formatNumber(reportData.metrics.activeLeads) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Lost Deals</span>
                  <span className="font-semibold text-red-500">
                    {reportData ? formatNumber(reportData.metrics.lostLeads) : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads by Source */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Leads by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leadsBySource.map((source) => (
                    <div key={source.source} className="flex items-center gap-3">
                      <span className="w-24 text-sm truncate">{source.source}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${(source.count / maxSourceCount) * 100}%`,
                            backgroundColor: source.color,
                          }}
                        />
                      </div>
                      <span className="w-10 text-sm font-medium text-right">{source.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stage Conversion Funnel */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pipeline Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stageConversion.map((stage, index) => (
                    <div key={stage.stage} className="flex items-center gap-3">
                      <span className="w-24 text-sm">{stage.stage}</span>
                      <div className="flex-1 relative h-8 bg-gray-100 rounded overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                          style={{ width: `${stage.rate}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-white mix-blend-difference">
                            {stage.count}
                          </span>
                        </div>
                      </div>
                      <span className="w-12 text-sm text-muted-foreground text-right">
                        {stage.rate}%
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Overall Win Rate</span>
                    <span className="font-semibold text-green-600">
                      {reportData ? `${reportData.metrics.conversionRate}%` : '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversion Tab */}
        <TabsContent value="conversion" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-primary">
                  {reportData ? `${reportData.metrics.conversionRate}%` : '-'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Overall Conversion Rate</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-green-600">
                  {reportData ? formatNumber(reportData.metrics.wonLeads) : '-'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Deals Won</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-orange-600">
                  {reportData ? formatNumber(reportData.metrics.activeLeads) : '-'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Active Opportunities</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversion Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Strong Lead Sources</p>
                    <p className="text-sm text-green-700 mt-1">
                      RFQ and Referral leads have the highest conversion rates. Focus your efforts on these channels.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Optimization Opportunity</p>
                    <p className="text-sm text-blue-700 mt-1">
                      The Qualified to Proposal stage shows the biggest drop-off. Consider adding more touchpoints in this phase.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Follow-up Needed</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      You have {reportData?.metrics.overdueTasks || 0} overdue tasks that need attention.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{reportData?.metrics.activitiesThisWeek || '-'}</p>
                <p className="text-xs text-muted-foreground mt-1">Activities This Week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{reportData?.metrics.tasksDueToday || '-'}</p>
                <p className="text-xs text-muted-foreground mt-1">Tasks Due Today</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-red-500">{reportData?.metrics.overdueTasks || '-'}</p>
                <p className="text-xs text-muted-foreground mt-1">Overdue Tasks</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-green-600">{reportData?.metrics.newContactsThisPeriod || '-'}</p>
                <p className="text-xs text-muted-foreground mt-1">New Contacts</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Contact leads within 24 hours of their initial inquiry for best results.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Aim for at least 5 touch points before asking for a decision.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Schedule follow-up meetings after successful demos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Review and update lead scores weekly based on engagement.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
