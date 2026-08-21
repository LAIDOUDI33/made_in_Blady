'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  UserPlus,
  Handshake,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Phone,
  Mail,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Target,
  Zap,
  Eye,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertCircle,
  Activity,
  Building2,
  Globe,
  Star,
  BarChart3,
  PieChart,
} from 'lucide-react'

// Types
interface DashboardStats {
  totalContacts: number
  totalLeads: number
  activeDeals: number
  pipelineValue: number
  conversionRate: number
  avgDealSize: number
}

interface LeadSource {
  name: string
  count: number
  percentage: number
  color: string
}

interface RecentActivity {
  id: string
  type: 'contact' | 'lead' | 'deal' | 'task' | 'call' | 'email' | 'meeting'
  title: string
  description: string
  timestamp: Date
  user: string
  icon: React.ElementType
}

interface ConversionMetric {
  month: string
  contacts: number
  leads: number
  deals: number
  conversionRate: number
}

// Mock Data
const dashboardStats: DashboardStats = {
  totalContacts: 1247,
  totalLeads: 384,
  activeDeals: 89,
  pipelineValue: 28500000,
  conversionRate: 23.5,
  avgDealSize: 320000,
}

const leadSources: LeadSource[] = [
  { name: 'Site Web', count: 142, percentage: 37, color: 'bg-emerald-500' },
  { name: 'Réseaux Sociaux', count: 98, percentage: 25.5, color: 'bg-blue-500' },
  { name: 'Salons/Événements', count: 67, percentage: 17.4, color: 'bg-purple-500' },
  { name: 'Recommandation', count: 45, percentage: 11.7, color: 'bg-orange-500' },
  { name: 'Appels Froids', count: 22, percentage: 5.7, color: 'bg-gray-500' },
  { name: 'Autres', count: 10, percentage: 2.6, color: 'bg-pink-500' },
]

const recentActivities: RecentActivity[] = [
  {
    id: '1',
    type: 'contact',
    title: 'Nouveau contact ajouté',
    description: 'Karim Benali - CEO de AlgerTech Solutions',
    timestamp: new Date(Date.now() - 10 * 60000),
    user: 'Amina M.',
    icon: UserPlus,
  },
  {
    id: '2',
    type: 'deal',
    title: 'Affaire avancée au stade Négociation',
    description: 'Contrat Sonatrach - Valeur: 2.5M DZD',
    timestamp: new Date(Date.now() - 25 * 60000),
    user: 'Youssef K.',
    icon: Handshake,
  },
  {
    id: '3',
    type: 'lead',
    title: 'Lead qualifié automatiquement',
    description: 'Sara Hamadi - Score: 85 (Chaud)',
    timestamp: new Date(Date.now() - 45 * 60000),
    user: 'Système',
    icon: Zap,
  },
  {
    id: '4',
    type: 'call',
    title: "Appel terminé avec Cevital",
    description: 'Discussion sur la nouvelle commande d\'équipements',
    timestamp: new Date(Date.now() - 60 * 60000),
    user: 'Mohamed B.',
    icon: Phone,
  },
  {
    id: '5',
    type: 'email',
    title: 'Email envoyé à Naftal',
    description: 'Proposition commerciale pour projet pétrolier',
    timestamp: new Date(Date.now() - 90 * 60000),
    user: 'Fatima Z.',
    icon: Mail,
  },
  {
    id: '6',
    type: 'meeting',
    title: 'Réunion planifiée avec Condor',
    description: 'Demain à 14h - Salle de conférence A',
    timestamp: new Date(Date.now() - 120 * 60000),
    user: 'Amina M.',
    icon: Calendar,
  },
  {
    id: '7',
    type: 'task',
    title: 'Tâche complétée',
    description: 'Préparer rapport mensuel CRM',
    timestamp: new Date(Date.now() - 180 * 60000),
    user: 'Youssef K.',
    icon: CheckCircle2,
  },
  {
    id: '8',
    type: 'deal',
    title: 'Affaire gagnée!',
    description: 'IFRI - Contrat distribution nationale - 850K DZD',
    timestamp: new Date(Date.now() - 240 * 60000),
    user: 'Équipe Commerciale',
    icon: Star,
  },
]

const conversionMetrics: ConversionMetric[] = [
  { month: 'Jan', contacts: 145, leads: 42, deals: 8, conversionRate: 19.0 },
  { month: 'Fév', contacts: 168, leads: 51, deals: 12, conversionRate: 23.5 },
  { month: 'Mar', contacts: 192, leads: 58, deals: 15, conversionRate: 25.9 },
  { month: 'Avr', contacts: 178, leads: 52, deals: 11, conversionRate: 21.2 },
  { month: 'Mai', contacts: 215, leads: 68, deals: 18, conversionRate: 26.5 },
  { month: 'Jun', contacts: 238, leads: 72, deals: 20, conversionRate: 27.8 },
  { month: 'Jul', contacts: 198, leads: 61, deals: 14, conversionRate: 23.0 },
  { month: 'Aoû', contacts: 245, leads: 78, deals: 22, conversionRate: 28.2 },
]

const quickActions = [
  { label: 'Ajouter Contact', icon: UserPlus, href: '/admin/crm/contacts', color: 'bg-emerald-500' },
  { label: 'Créer Lead', icon: Target, href: '/admin/crm/leads', color: 'bg-blue-500' },
  { label: 'Nouvelle Affaire', icon: Handshake, href: '/admin/crm/deals', color: 'bg-purple-500' },
  { label: 'Ajouter Tâche', icon: Plus, href: '/admin/crm/tasks', color: 'bg-orange-500' },
]

export default function CRMDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`
    return `Il y a ${Math.floor(diffMins / 1440)}j`
  }

  const getActivityIconBg = (type: string) => {
    switch (type) {
      case 'contact': return 'bg-emerald-100 text-emerald-600'
      case 'lead': return 'bg-blue-100 text-blue-600'
      case 'deal': return 'bg-purple-100 text-purple-600'
      case 'task': return 'bg-green-100 text-green-600'
      case 'call': return 'bg-orange-100 text-orange-600'
      case 'email': return 'bg-pink-100 text-pink-600'
      case 'meeting': return 'bg-indigo-100 text-indigo-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tableau de Bord CRM</h1>
                <p className="text-sm text-gray-500">AlgeriaTrade.dz - Gestion Relation Client</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          <Card className="col-span-1">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-blue-500" />
                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                  +12%
                </Badge>
              </div>
              <p className="text-2xl font-bold">{dashboardStats.totalContacts.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Contacts Totaux</p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5 text-purple-500" />
                <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                  +8%
                </Badge>
              </div>
              <p className="text-2xl font-bold">{dashboardStats.totalLeads}</p>
              <p className="text-xs text-gray-500">Leads Actifs</p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <Handshake className="h-5 w-5 text-emerald-500" />
                <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
                  +5
                </Badge>
              </div>
              <p className="text-2xl font-bold">{dashboardStats.activeDeals}</p>
              <p className="text-xs text-gray-500">Affaires Actives</p>
            </CardContent>
          </Card>

          <Card className="col-span-1 sm:col-span-2 lg:col-span-3">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div className="flex items-center gap-1 text-emerald-600">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-xs font-medium">+18.5%</span>
                </div>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(dashboardStats.pipelineValue)}</p>
              <p className="text-xs text-gray-500">Valeur du Pipeline</p>
            </CardContent>
          </Card>

          <Card className="col-span-2 lg:col-span-2">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <div className="flex items-center gap-1 text-emerald-600">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-xs font-medium">+2.3%</span>
                </div>
              </div>
              <p className="text-2xl font-bold">{dashboardStats.conversionRate}%</p>
              <p className="text-xs text-gray-500">Taux de Conversion</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Actions Rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="h-auto py-4 px-4 flex flex-col items-center gap-2 hover:bg-gray-50"
                  onClick={() => window.location.href = action.href}
                >
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Lead Sources & Conversions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Sources */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-500" />
                    Sources des Leads
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    Filtrer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leadSources.map((source, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{source.name}</span>
                        <span className="text-gray-500">{source.count} ({source.percentage}%)</span>
                      </div>
                      <Progress value={source.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
                
                {/* Visual Legend */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex flex-wrap gap-3">
                    {leadSources.map((source, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded-full ${source.color}`} />
                        <span className="text-xs text-gray-600">{source.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Métriques de Conversion
                </CardTitle>
                <CardDescription>Performance mensuelle des 8 derniers mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Mois</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-600">Contacts</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-600">Leads</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-600">Affaires</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-600">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversionMetrics.slice(-5).map((metric, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-2 px-2 font-medium">{metric.month}</td>
                          <td className="py-2 px-2 text-right">{metric.contacts}</td>
                          <td className="py-2 px-2 text-right">{metric.leads}</td>
                          <td className="py-2 px-2 text-right">{metric.deals}</td>
                          <td className="py-2 px-2 text-right">
                            <Badge 
                              variant="outline" 
                              className={`${getScoreColor(metric.conversionRate)}`}
                            >
                              {metric.conversionRate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mini Chart Visualization */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-end gap-1 h-16">
                    {conversionMetrics.map((metric, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-gradient-to-t from-violet-500 to-purple-400 rounded-t-sm transition-all hover:opacity-80"
                          style={{ height: `${(metric.deals / 25) * 100}%` }}
                          title={`${metric.month}: ${metric.deals} affaires`}
                        />
                        <span className="text-[10px] text-gray-500">{metric.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activities & Pipeline */}
          <div className="space-y-6">
            {/* Pipeline Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  Résumé Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { stage: 'Prospect', count: 24, value: 4200000, color: 'bg-gray-400' },
                    { stage: 'Qualifié', count: 18, value: 6500000, color: 'bg-blue-400' },
                    { stage: 'Proposition', count: 22, value: 8900000, color: 'bg-yellow-400' },
                    { stage: 'Négociation', count: 15, value: 5800000, color: 'bg-orange-400' },
                    { stage: 'Gagné', count: 8, value: 2600000, color: 'bg-emerald-400' },
                    { stage: 'Perdu', count: 2, value: 500000, color: 'bg-red-400' },
                  ].map((stage, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-8 rounded-full ${stage.color}`} />
                        <div>
                          <p className="text-sm font-medium">{stage.stage}</p>
                          <p className="text-xs text-gray-500">{stage.count} affaires</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(stage.value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities Feed */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Activité Récente
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Voir tout
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getActivityIconBg(activity.type)}`}>
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">{formatRelativeTime(activity.timestamp)}</span>
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-[10px] text-gray-400">{activity.user}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Leads & Deals Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Hot Leads */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-5 w-5 text-red-500" />
                  Leads Chauds
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/admin/crm/leads'}>
                  Voir tout →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Sara Hamadi', company: 'Condor Algérie', score: 92, value: 1250000, source: 'Salon' },
                  { name: 'Karim Benali', company: 'AlgerTech Solutions', score: 88, value: 980000, source: 'Web' },
                  { name: 'Nadia Cherif', company: 'Naftal', score: 85, value: 2100000, source: 'Recommandation' },
                  { name: 'Omar Boudiaf', company: 'Cevital Group', score: 81, value: 1750000, source: 'Appel' },
                  { name: 'Lina Messaoudi', company: 'IFRI', score: 78, value: 650000, source: 'Web' },
                ].map((lead, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white font-semibold text-sm">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getScoreColor(lead.score)} text-xs`}>
                          {lead.score}
                        </Badge>
                        <span className="text-sm font-semibold">{formatCurrency(lead.value)}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{lead.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Deals */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Affaires Prioritaires
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/admin/crm/deals'}>
                  Voir tout →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Projet Sonatrach Phase II', client: 'Sonatrach', stage: 'Négociation', value: 4500000, prob: 75, closeDate: '2024-02-15' },
                  { name: 'Renouvellement Cevital', client: 'Cevital Group', stage: 'Proposition', value: 2800000, prob: 60, closeDate: '2024-03-01' },
                  { name: 'Contrat Distribution IFRI', client: 'IFRI', stage: 'Gagné', value: 1650000, prob: 100, closeDate: '2024-01-20' },
                  { name: 'Équipement Naftal', client: 'Naftal', stage: 'Qualifié', value: 2100000, prob: 40, closeDate: '2024-04-10' },
                  { name: 'Partenariat Condor', client: 'Condor Algérie', stage: 'Proposition', value: 1900000, prob: 55, closeDate: '2024-03-15' },
                ].map((deal, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium truncate">{deal.name}</p>
                      <p className="text-xs text-gray-500">{deal.client}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] ${
                            deal.stage === 'Gagné' ? 'border-emerald-300 text-emerald-700' :
                            deal.stage === 'Négociation' ? 'border-orange-300 text-orange-700' :
                            deal.stage === 'Proposition' ? 'border-yellow-300 text-yellow-700' :
                            'border-blue-300 text-blue-700'
                          }`}
                        >
                          {deal.stage}
                        </Badge>
                        <span className="text-[10px] text-gray-400">{deal.prob}% prob.</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(deal.value)}</p>
                      <p className="text-[10px] text-gray-400">{deal.closeDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Tasks Preview */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Tâches à Venir
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/admin/crm/tasks'}>
                Gérer les tâches →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { task: 'Appeler Sara Hamadi', due: 'Aujourd\'hui', priority: 'high', assignee: 'Moi' },
                { task: 'Préparer proposition Cevital', due: 'Demain', priority: 'high', assignee: 'Youssef K.' },
                { task: 'Suivi email Naftal', due: 'Dans 2 jours', priority: 'medium', assignee: 'Fatima Z.' },
                { task: 'Réunion équipe commerciale', due: 'Ven 26 Jan', priority: 'medium', assignee: 'Équipe' },
                { task: 'Rapport mensuel Q1', due: 'Lun 29 Jan', priority: 'low', assignee: 'Amina M.' },
                { task: 'Mise à jour base contacts', due: 'Mar 30 Jan', priority: 'low', assignee: 'Mohamed B.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg hover:border-gray-300 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    item.priority === 'high' ? 'bg-red-500' :
                    item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.task}</p>
                    <p className="text-xs text-gray-500">{item.due} • {item.assignee}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-white">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-600" />
              <span>AlgeriaTrade.dz CRM Module</span>
            </div>
            
            <div className="flex items-center gap-6">
              <span>Dernière synchronisation: Il y a 5 min</span>
              <span>v2.1.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
