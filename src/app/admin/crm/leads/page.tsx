'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Target,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  Zap,
  Flame,
  Sun,
  Snowflake,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Eye,
  Edit,
  Star,
  UserPlus,
  Globe,
  MessageSquare,
  Building2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Download,
} from 'lucide-react'

// Types
interface Lead {
  id: string
  contactName: string
  company: string
  email: string
  phone: string
  source: 'web' | 'social' | 'event' | 'referral' | 'cold_call' | 'partner'
  score: number
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  priority: 'high' | 'medium' | 'low'
  estimatedValue: number
  createdAt: Date
  lastActivity: Date | null
  assignedTo: string
  notes: string
  conversionProbability: number
}

// Mock Data - 18 Leads
const mockLeads: Lead[] = [
  {
    id: '1',
    contactName: 'Sara Hamadi',
    company: 'Condor Algérie',
    email: 's.hamadi@condor.dz',
    phone: '+213 555 234 567',
    source: 'event',
    score: 92,
    status: 'qualified',
    priority: 'high',
    estimatedValue: 1250000,
    createdAt: new Date('2024-01-05'),
    lastActivity: new Date('2024-01-19'),
    assignedTo: 'Moi',
    notes: 'Intérêt fort pour solution ERP complète. Décision finale prévue fin janvier.',
    conversionProbability: 85,
  },
  {
    id: '2',
    contactName: 'Karim Benali',
    company: 'AlgerTech Solutions',
    email: 'k.benali@algertech.dz',
    phone: '+213 555 123 456',
    source: 'web',
    score: 88,
    status: 'contacted',
    priority: 'high',
    estimatedValue: 980000,
    createdAt: new Date('2024-01-08'),
    lastActivity: new Date('2024-01-18'),
    assignedTo: 'Youssef K.',
    notes: 'Demande de démo reçue via formulaire web. Très réactif.',
    conversionProbability: 75,
  },
  {
    id: '3',
    contactName: 'Nadia Cherif',
    company: 'Naftal',
    email: 'n.cherif@naftal.dz',
    phone: '+213 661 345 678',
    source: 'referral',
    score: 85,
    status: 'qualified',
    priority: 'high',
    estimatedValue: 2100000,
    createdAt: new Date('2024-01-03'),
    lastActivity: new Date('2024-01-17'),
    assignedTo: 'Amina M.',
    notes: 'Recommandé par Cevital. Projet logistique urgent Q1.',
    conversionProbability: 80,
  },
  {
    id: '4',
    contactName: 'Omar Boudiaf',
    company: 'Cevital Group',
    email: 'o.boudiaf@cevital.dz',
    phone: '+213 555 456 789',
    source: 'cold_call',
    score: 81,
    status: 'contacted',
    priority: 'high',
    estimatedValue: 1750000,
    createdAt: new Date('2023-12-28'),
    lastActivity: new Date('2024-01-16'),
    assignedTo: 'Mohamed B.',
    notes: 'Renouvellement contrat existant. Négociation en cours.',
    conversionProbability: 70,
  },
  {
    id: '5',
    contactName: 'Lina Messaoudi',
    company: 'IFRI',
    email: 'l.messaoudi@ifri.dz',
    phone: '+213 771 567 890',
    source: 'web',
    score: 78,
    status: 'new',
    priority: 'medium',
    estimatedValue: 650000,
    createdAt: new Date('2024-01-12'),
    lastActivity: null,
    assignedTo: 'Fatima Z.',
    notes: 'Téléchargement brochure CRM. Premier contact à faire.',
    conversionProbability: 55,
  },
  {
    id: '6',
    contactName: 'Youssef Amrani',
    company: 'Sonatrach',
    email: 'y.amrani@sonatrach.dz',
    phone: '+213 661 678 901',
    source: 'referral',
    score: 76,
    status: 'qualified',
    priority: 'high',
    estimatedValue: 4500000,
    createdAt: new Date('2023-12-15'),
    lastActivity: new Date('2024-01-15'),
    assignedTo: 'Moi',
    notes: 'Projet digitalisation majeur. Appel d\'offres imminent.',
    conversionProbability: 72,
  },
  {
    id: '7',
    contactName: 'Samira Hadji',
    company: 'Nedromy Pharma',
    email: 's.hadji@nedromy.dz',
    phone: '+213 48 444 555',
    source: 'social',
    score: 68,
    status: 'contacted',
    priority: 'medium',
    estimatedValue: 420000,
    createdAt: new Date('2024-01-10'),
    lastActivity: new Date('2024-01-14'),
    assignedTo: 'Karim T.',
    notes: 'Contact LinkedIn. Intérêt pour module qualité.',
    conversionProbability: 50,
  },
  {
    id: '8',
    contactName: 'Abdelkrim Bensalah',
    company: 'BIM Bank',
    email: 'a.bensalah@bim-dz.dz',
    phone: '+213 555 666 777',
    source: 'partner',
    score: 65,
    status: 'new',
    priority: 'medium',
    estimatedValue: 890000,
    createdAt: new Date('2024-01-15'),
    lastActivity: null,
    assignedTo: 'Non assigné',
    notes: 'Partenaire Microsoft Algeria. Opportunité co-vente.',
    conversionProbability: 60,
  },
  {
    id: '9',
    contactName: 'Meriem Attiyah',
    company: 'ORASC',
    email: 'm.attiyah@orasc.dz',
    phone: '+213 41 123 000',
    source: 'referral',
    score: 62,
    status: 'contacted',
    priority: 'medium',
    estimatedValue: 380000,
    createdAt: new Date('2024-01-09'),
    lastActivity: new Date('2024-01-13'),
    assignedTo: 'Lina D.',
    notes: 'Appel d\'offres santé publique. Délai court.',
    conversionProbability: 48,
  },
  {
    id: '10',
    contactName: 'Reda Berrahma',
    company: 'ETEEB',
    email: 'r.berrahma@eteeb.dz',
    phone: '+213 49 890 777',
    source: 'web',
    score: 58,
    status: 'new',
    priority: 'low',
    estimatedValue: 520000,
    createdAt: new Date('2024-01-16'),
    lastActivity: null,
    assignedTo: 'Non assigné',
    notes: 'Demande info projet solaire. Startup prometteuse.',
    conversionProbability: 42,
  },
  {
    id: '11',
    contactName: 'Mourad Medelmine',
    company: 'Syrte Pharmaceuticals',
    email: 'm.medelmine@syrte.dz',
    phone: '+213 29 012 999',
    source: 'social',
    score: 54,
    status: 'new',
    priority: 'low',
    estimatedValue: 280000,
    createdAt: new Date('2024-01-17'),
    lastActivity: null,
    assignedTo: 'Non assigné',
    notes: 'Startup pharma. Besoin CRM basique.',
    conversionProbability: 38,
  },
  {
    id: '12',
    contactName: 'Rachid Mokrani',
    company: 'ENG',
    email: 'r.mokrani@eng.dz',
    phone: '+213 29 333 444',
    source: 'cold_call',
    score: 45,
    status: 'contacted',
    priority: 'low',
    estimatedValue: 750000,
    createdat: new Date('2023-12-20'),
    lastActivity: new Date('2024-01-05'),
    assignedTo: 'Sami R.',
    notes: 'Premier contact froid. Intérêt modéré. Relance nécessaire.',
    conversionProbability: 25,
  },
  {
    id: '13',
    contactName: 'Imane Zitouni',
    company: 'Biopharm',
    email: 'i.zitouni@biopharm.dz',
    phone: '+213 31 789 666',
    source: 'event',
    score: 71,
    status: 'qualified',
    priority: 'medium',
    estimatedValue: 580000,
    createdAt: new Date('2024-01-02'),
    lastActivity: new Date('2024-01-17'),
    assignedTo: 'Nadia C.',
    notes: 'Salon Pharmagora Alger. Projet export Afrique.',
    conversionProbability: 65,
  },
  {
    id: '14',
    contactName: 'Leila Benmehidi',
    company: 'Proméo',
    email: 'l.benmehidi@promeo.dz',
    phone: '+213 33 123 100',
    source: 'web',
    score: 41,
    status: 'new',
    priority: 'low',
    estimatedValue: 150000,
    createdAt: new Date('2024-01-18'),
    lastActivity: null,
    assignedTo: 'Non assigné',
    notes: 'Nouvelle marque cosmétique locale. Budget limité.',
    conversionProbability: 30,
  },
  {
    id: '15',
    contactName: 'Kamel Messaoud',
    company: 'SIM',
    email: 'k.messaoud@sim.dz',
    phone: '+213 49 234 111',
    source: 'partner',
    score: 73,
    status: 'contacted',
    priority: 'medium',
    estimatedValue: 1100000,
    createdAt: new Date('2023-12-22'),
    lastActivity: new Date('2024-01-12'),
    assignedTo: 'Omar F.',
    notes: 'Partenaire historique. Extension maintenance.',
    conversionProbability: 62,
  },
  {
    id: '16',
    contactName: 'Tarek Boukerma',
    company: 'GEMA',
    email: 't.boukerma@gema.dz',
    phone: '+213 29 456 333',
    source: 'referral',
    score: 49,
    status: 'contacted',
    priority: 'low',
    estimatedValue: 320000,
    createdAt: new Date('2024-01-06'),
    lastActivity: new Date('2024-01-10'),
    assignedTo: 'Dalia K.',
    notes: 'Réseau PME. Potentiel volume si offre groupée.',
    conversionProbability: 35,
  },
  {
    id: '17',
    contactName: 'Nabil Guendouz',
    company: 'Cooperativa Agro',
    email: 'n.guendouz@cooperativa.dz',
    phone: '+213 29 888 999',
    source: 'cold_call',
    score: 36,
    status: 'lost',
    priority: 'low',
    estimatedValue: 180000,
    createdAt: new Date('2023-11-15'),
    lastActivity: new Date('2023-12-20'),
    assignedTo: 'Rachid M.',
    notes: 'Budget insuffissant. Peut-être réactiver plus tard.',
    conversionProbability: 10,
  },
  {
    id: '18',
    contactName: 'Wassila Kerdjouj',
    company: 'Canal Algérie',
    email: 'w.kerdjouj@canal-algerie.dz',
    phone: '+213 23 345 222',
    source: 'social',
    score: 59,
    status: 'new',
    priority: 'low',
    estimatedValue: 250000,
    createdAt: new Date('2024-01-19'),
    lastActivity: null,
    assignedTo: 'Non assigné',
    notes: 'Contact média. Collaboration possible.',
    conversionProbability: 40,
  },
]

const sources = [
  { value: 'all', label: 'Toutes les sources' },
  { value: 'web', label: 'Site Web' },
  { value: 'social', label: 'Réseaux Sociaux' },
  { value: 'event', label: 'Événements' },
  { value: 'referral', label: 'Recommandation' },
  { value: 'cold_call', label: 'Appels Froids' },
  { value: 'partner', label: 'Partenaires' },
]

export default function LeadsPage() {
  const [leads] = useState<Lead[]>(mockLeads)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [temperatureFilter, setTemperatureFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Filter and search
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          lead.contactName.toLowerCase().includes(query) ||
          lead.company.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false

      // Source filter
      if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false

      // Priority filter
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) return false

      // Temperature filter (based on score)
      if (temperatureFilter !== 'all') {
        if (temperatureFilter === 'hot' && lead.score < 75) return false
        if (temperatureFilter === 'warm' && (lead.score < 50 || lead.score >= 75)) return false
        if (temperatureFilter === 'cold' && lead.score >= 50) return false
      }

      return true
    })
  }, [leads, searchQuery, statusFilter, sourceFilter, priorityFilter, temperatureFilter])

  // Sort by score descending
  const sortedLeads = [...filteredLeads].sort((a, b) => b.score - a.score)

  // Paginate
  const totalPages = Math.ceil(sortedLeads.length / pageSize)
  const paginatedLeads = sortedLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return '[&>div]:bg-emerald-500'
    if (score >= 60) return '[&>div]:bg-blue-500'
    if (score >= 40) return '[&>div]:bg-yellow-500'
    return '[&>div]:bg-red-500'
  }

  const getTemperatureIcon = (score: number) => {
    if (score >= 75) return <Flame className="h-4 w-4 text-red-500" />
    if (score >= 50) return <Sun className="h-4 w-4 text-yellow-500" />
    return <Snowflake className="h-4 w-4 text-blue-400" />
  }

  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Nouveau</Badge>
      case 'contacted':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Contacté</Badge>
      case 'qualified':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Qualifié</Badge>
      case 'converted':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Converti</Badge>
      case 'lost':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Perdu</Badge>
    }
  }

  const getPriorityBadge = (priority: Lead['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Haute</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 flex items-center gap-1"><Clock className="h-3 w-3" /> Moyenne</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Basse</Badge>
    }
  }

  const getSourceIcon = (source: Lead['source']) => {
    switch (source) {
      case 'web': return <Globe className="h-4 w-4 text-blue-500" />
      case 'social': return <MessageSquare className="h-4 w-4 text-pink-500" />
      case 'event': return <Calendar className="h-4 w-4 text-purple-500" />
      case 'referral': return <Star className="h-4 w-4 text-yellow-500" />
      case 'cold_call': return <Phone className="h-4 w-4 text-gray-500" />
      case 'partner': return <Building2 className="h-4 w-4 text-emerald-500" />
    }
  }

  const getSourceLabel = (source: Lead['source']) => {
    const labels: Record<Lead['source'], string> = {
      web: 'Site Web',
      social: 'Réseaux Sociaux',
      event: 'Événement',
      referral: 'Recommandation',
      cold_call: 'Appel Froid',
      partner: 'Partenaire',
    }
    return labels[source]
  }

  const handleStatusChange = (leadId: string, newStatus: Lead['status']) => {
    alert(`Lead ${leadId} → ${newStatus}`)
  }

  // Stats calculations
  const stats = {
    total: filteredLeads.length,
    hot: filteredLeads.filter(l => l.score >= 75).length,
    warm: filteredLeads.filter(l => l.score >= 50 && l.score < 75).length,
    cold: filteredLeads.filter(l => l.score < 50).length,
    totalValue: filteredLeads.reduce((sum, l) => sum + l.estimatedValue, 0),
    avgConversion: Math.round(filteredLeads.reduce((sum, l) => sum + l.conversionProbability, 0) / filteredLeads.length || 0),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestion des Leads</h1>
                <p className="text-sm text-gray-500">{stats.total} leads • Valeur totale: {formatCurrency(stats.totalValue)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Lead
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <Target className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Leads</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <Flame className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.hot}</p>
              <p className="text-xs text-gray-500">Chauds (≥75)</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <Sun className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.warm}</p>
              <p className="text-xs text-gray-500">Tièdes (50-74)</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <Snowflake className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.cold}</p>
              <p className="text-xs text-gray-500">Froids (&lt;50)</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{stats.avgConversion}%</p>
              <p className="text-xs text-gray-500">Conv. Moyenne</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, entreprise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="new">Nouveau</SelectItem>
                  <SelectItem value="contacted">Contacté</SelectItem>
                  <SelectItem value="qualified">Qualifié</SelectItem>
                  <SelectItem value="converted">Converti</SelectItem>
                  <SelectItem value="lost">Perdu</SelectItem>
                </SelectContent>
              </Select>

              {/* Temperature Filter */}
              <Select value={temperatureFilter} onValueChange={setTemperatureFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Température" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes températures</SelectItem>
                  <SelectItem value="hot">🔥 Chaud (≥75)</SelectItem>
                  <SelectItem value="warm">☀️ Tiède (50-74)</SelectItem>
                  <SelectItem value="cold">❄️ Froid (&lt;50)</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes priorités</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source Filter Row */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500 mr-2">Source:</span>
                {sources.map(source => (
                  <Button
                    key={source.value}
                    variant={sourceFilter === source.value ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setSourceFilter(source.value)}
                  >
                    {source.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact / Entreprise</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="min-w-[140px]">Score</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Valeur Est.</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Assigné à</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLeads.map((lead) => (
                    <TableRow 
                      key={lead.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        lead.priority === 'high' ? 'border-l-4 border-l-red-400' : ''
                      }`}
                      onClick={() => {
                        setSelectedLead(lead)
                        setShowDetailModal(true)
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                              lead.score >= 75 ? 'bg-gradient-to-br from-red-400 to-orange-400' :
                              lead.score >= 50 ? 'bg-gradient-to-br from-yellow-400 to-orange-300' :
                              'bg-gradient-to-br from-blue-400 to-cyan-400'
                            }`}
                          >
                            {lead.contactName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{lead.contactName}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {lead.company}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getSourceIcon(lead.source)}
                          <span className="text-sm">{getSourceLabel(lead.source)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5 min-w-[140px]">
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-lg ${getScoreColor(lead.score).split(' ')[0]}`}>
                              {lead.score}
                            </span>
                            <div className="flex items-center gap-1">
                              {getTemperatureIcon(lead.score)}
                              <span className="text-xs text-gray-500">
                                {lead.score >= 75 ? 'Chaud' : lead.score >= 50 ? 'Tiède' : 'Froid'}
                              </span>
                            </div>
                          </div>
                          <Progress 
                            value={lead.score} 
                            className={`h-2 ${getScoreProgressColor(lead.score)}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-sm">{formatCurrency(lead.estimatedValue)}</span>
                      </TableCell>
                      <TableCell>{getPriorityBadge(lead.priority)}</TableCell>
                      <TableCell>
                        <span className={`text-sm ${lead.assignedTo === 'Non assigné' ? 'text-gray-400 italic' : ''}`}>
                          {lead.assignedTo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">{formatDate(lead.createdAt)}</span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedLead(lead)
                              setShowDetailModal(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-blue-600"
                              onClick={() => handleStatusChange(lead.id, 'qualified')}
                            >
                              <Zap className="mr-2 h-4 w-4" />
                              Qualifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-emerald-600"
                              onClick={() => handleStatusChange(lead.id, 'converted')}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Convertir en affaire
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleStatusChange(lead.id, 'lost')}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Marquer perdu
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {paginatedLeads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <Target className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">Aucun lead trouvé</p>
                        <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres ou ajoutez un nouveau lead</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Afficher:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-500">
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, sortedLeads.length)} sur {sortedLeads.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Lead Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedLead ? (
                <>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                    selectedLead.score >= 75 ? 'bg-gradient-to-br from-red-400 to-orange-400' :
                    selectedLead.score >= 50 ? 'bg-gradient-to-br from-yellow-400 to-orange-300' :
                    'bg-gradient-to-br from-blue-400 to-cyan-400'
                  }`}>
                    {selectedLead.contactName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p>{selectedLead.contactName}</p>
                    <p className="text-sm font-normal text-gray-500">{selectedLead.company}</p>
                  </div>
                </>
              ) : (
                'Détails du Lead'
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6 mt-4">
              {/* Score & Value Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className={selectedLead.score >= 75 ? 'border-red-200 bg-red-50/30' : ''}>
                  <CardContent className="pt-4 text-center">
                    <p className="text-3xl font-bold text-red-600">{selectedLead.score}</p>
                    <p className="text-xs text-gray-500">Score Lead</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {getTemperatureIcon(selectedLead.score)}
                      <span className="text-xs">
                        {selectedLead.score >= 75 ? 'Chaud' : selectedLead.score >= 50 ? 'Tiède' : 'Froid'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedLead.estimatedValue)}</p>
                    <p className="text-xs text-gray-500">Valeur Estimée</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedLead.conversionProbability}%</p>
                    <p className="text-xs text-gray-500">Probabilité Conv.</p>
                  </CardContent>
                </Card>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Email:</span>
                    <span className="text-sm font-medium text-blue-600">{selectedLead.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Tél:</span>
                    <span className="text-sm font-medium">{selectedLead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Entreprise:</span>
                    <span className="text-sm font-medium">{selectedLead.company}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Créé le:</span>
                    <span className="text-sm font-medium">{formatDate(selectedLead.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Assigné à:</span>
                    <span className="text-sm font-medium">{selectedLead.assignedTo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Dernière activité:</span>
                    <span className="text-sm font-medium">
                      {selectedLead.lastActivity ? formatDate(selectedLead.lastActivity) : 'Jamais'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">Statut:</span>
                {getStatusBadge(selectedLead.status)}
                <span className="text-sm font-medium ml-3">Priorité:</span>
                {getPriorityBadge(selectedLead.priority)}
                <span className="text-sm font-medium ml-3">Source:</span>
                <div className="flex items-center gap-1">
                  {getSourceIcon(selectedLead.source)}
                  <span className="text-sm">{getSourceLabel(selectedLead.source)}</span>
                </div>
              </div>

              {/* Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notes & Activités</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{selectedLead.notes}</p>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm">
                  <Phone className="mr-2 h-4 w-4" />
                  Appeler
                </Button>
                <Button size="sm" variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => handleStatusChange(selectedLead.id, 'qualified')}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Qualifier
                </Button>
                <Button 
                  size="sm"
                  className="text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                  onClick={() => handleStatusChange(selectedLead.id, 'converted')}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Convertir en Affaire
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleStatusChange(selectedLead.id, 'lost')}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Marquer Perdu
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-white">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-600" />
              <span>AlgeriaTrade.dz - Gestion des Leads</span>
            </div>
            
            <div className="flex items-center gap-6">
              <span>Taux conversion moyen: {stats.avgConversion}%</span>
              <span>Valeur pipeline: {formatCurrency(stats.totalValue)}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
