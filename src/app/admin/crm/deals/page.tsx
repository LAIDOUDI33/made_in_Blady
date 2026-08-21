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
  Handshake,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Star,
  Building2,
  ArrowUpDown,
  LayoutGrid,
  List,
  GripVertical,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  Target,
  BarChart3,
  ChevronRight,
  MoveRight,
} from 'lucide-react'

// Types
type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

interface Deal {
  id: string
  name: string
  client: string
  contactName: string
  email: string
  phone: string
  stage: DealStage
  value: number
  currency: string
  probability: number
  expectedCloseDate: Date
  actualCloseDate: Date | null
  createdAt: Date
  assignedTo: string
  products: string[]
  notes: string
  source: string
}

// Stage Configuration
const stages: { id: DealStage; label: string; color: string; bgColor: string; icon: React.ElementType }[] = [
  { id: 'lead', label: 'Prospect', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Target },
  { id: 'qualified', label: 'Qualifié', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Users },
  { id: 'proposal', label: 'Proposition', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: FileText },
  { id: 'negotiation', label: 'Négociation', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: Handshake },
  { id: 'won', label: 'Gagné', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle2 },
  { id: 'lost', label: 'Perdu', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
]

function FileText(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

// Mock Data - 22 Deals
const mockDeals: Deal[] = [
  // Won Deals
  {
    id: 'D001',
    name: 'Contrat Distribution IFRI',
    client: 'IFRI',
    contactName: 'Lina Messaoudi',
    email: 'l.messaoudi@ifri.dz',
    phone: '+213 771 567 890',
    stage: 'won',
    value: 1650000,
    currency: 'DZD',
    probability: 100,
    expectedCloseDate: new Date('2024-01-15'),
    actualCloseDate: new Date('2024-01-18'),
    createdAt: new Date('2023-10-05'),
    assignedTo: 'Amina M.',
    products: ['CRM Enterprise', 'Formation'],
    notes: 'Contrat signé pour distribution nationale. Livraison Q1.',
    source: 'Salon Alger',
  },
  {
    id: 'D002',
    name: 'Maintenance Annuelle SIM',
    client: 'SIM (Société Industrielle des Matériaux)',
    contactName: 'Kamel Messaoud',
    email: 'k.messaoud@sim.dz',
    phone: '+213 49 234 111',
    stage: 'won',
    value: 850000,
    currency: 'DZD',
    probability: 100,
    expectedCloseDate: new Date('2024-01-20'),
    actualCloseDate: new Date('2024-01-22'),
    createdAt: new Date('2023-11-12'),
    assignedTo: 'Omar F.',
    products: ['Support Premium'],
    notes: 'Renouvellement automatique du contrat maintenance.',
    source: 'Client existant',
  },
  {
    id: 'D003',
    name: 'Module Qualité Nedromy',
    client: 'Nedromy Pharma',
    contactName: 'Samira Hadji',
    email: 's.hadji@nedromy.dz',
    phone: '+213 48 444 555',
    stage: 'won',
    value: 420000,
    currency: 'DZD',
    probability: 100,
    expectedCloseDate: new Date('2024-01-25'),
    actualCloseDate: new Date('2024-01-26'),
    createdAt: new Date('2023-12-01'),
    assignedTo: 'Karim T.',
    products: ['Module Qualité'],
    notes: 'Vente rapide suite démo personnalisée.',
    source: 'LinkedIn',
  },

  // Negotiation Stage
  {
    id: 'D004',
    name: 'Projet Sonatrach Phase II',
    client: 'Sonatrach',
    contactName: 'Youssef Amrani',
    email: 'y.amrani@sonatrach.dz',
    phone: '+213 661 678 901',
    stage: 'negotiation',
    value: 4500000,
    currency: 'DZD',
    probability: 75,
    expectedCloseDate: new Date('2024-02-15'),
    actualCloseDate: null,
    createdAt: new Date('2023-09-20'),
    assignedTo: 'Moi',
    products: ['ERP Complet', 'Intégration SAP', 'Formation 50 utilisateurs'],
    notes: 'Négociation finale sur les conditions de paiement. Décision attendue par le comité exécutif.',
    source: 'Appel d\'offres',
  },
  {
    id: 'D005',
    name: 'Renouvellement Cevital',
    client: 'Cevital Group',
    contactName: 'Omar Boudiaf',
    email: 'o.boudiaf@cevital.dz',
    phone: '+213 555 456 789',
    stage: 'negotiation',
    value: 2800000,
    currency: 'DZD',
    probability: 70,
    expectedCloseDate: new Date('2024-03-01'),
    actualCloseDate: null,
    createdAt: new Date('2023-08-15'),
    assignedTo: 'Mohamed B.',
    products: ['CRM Pro', 'Support Prioritaire'],
    notes: 'Discussion sur l\'extension à 3 nouvelles usines. Prix en négociation.',
    source: 'Client existant',
  },
  {
    id: 'D006',
    name: 'Équipement Naftal Logistique',
    client: 'Naftal',
    contactName: 'Nadia Cherif',
    email: 'n.cherif@naftal.dz',
    phone: '+213 661 345 678',
    stage: 'negotiation',
    value: 2100000,
    currency: 'DZD',
    probability: 65,
    expectedCloseDate: new Date('2024-03-15'),
    actualCloseDate: null,
    createdAt: new Date('2023-10-28'),
    assignedTo: 'Amina M.',
    products: ['Logistique Suite', 'GPS Tracking'],
    notes: 'Besoin urgent exprimé. Validation budgétaire en cours.',
    source: 'Recommandation Cevital',
  },
  {
    id: 'D007',
    name: 'Digitalisation BIM Bank',
    client: 'BIM Bank',
    contactName: 'Abdelkrim Bensalah',
    email: 'a.bensalah@bim-dz.dz',
    phone: '+213 555 666 777',
    stage: 'negotiation',
    value: 1750000,
    currency: 'DZD',
    probability: 60,
    expectedCloseDate: new Date('2024-04-01'),
    actualCloseDate: null,
    createdAt: new Date('2023-11-10'),
    assignedTo: 'Youssef K.',
    products: ['Banking Module', 'Sécurité Renforcée'],
    notes: 'Co-vente avec Microsoft Algeria. Partage revenus à finaliser.',
    source: 'Partenaire Microsoft',
  },

  // Proposal Stage
  {
    id: 'D008',
    name: 'Partenariat Condor Algérie',
    client: 'Condor Algérie',
    contactName: 'Sara Hamadi',
    email: 's.hamadi@condor.dz',
    phone: '+213 555 234 567',
    stage: 'proposal',
    value: 1900000,
    currency: 'DZD',
    probability: 55,
    expectedCloseDate: new Date('2024-03-15'),
    actualCloseDate: null,
    createdAt: new Date('2023-12-01'),
    assignedTo: 'Moi',
    products: ['ERP Production', 'Gestion Stock', 'E-commerce'],
    notes: 'Proposition envoyée le 10 janvier. Réunion de suivi prévue le 25.',
    source: 'Salon Sétif',
  },
  {
    id: 'D009',
    name: 'Solution CRM Air Algérie',
    client: 'Air Algérie',
    contactName: 'Mohamed Kaci',
    email: 'm.kaci@airalgerie.dz',
    phone: '+213 21 987 654',
    stage: 'proposal',
    value: 1350000,
    currency: 'DZD',
    probability: 50,
    expectedCloseDate: new Date('2024-04-15'),
    actualCloseDate: null,
    createdat: new Date('2023-12-15'),
    assignedTo: 'Fatima Z.',
    products: ['CRM Aviation', 'Gestion Réservations'],
    notes: 'Proposition technique validée. En attente approvisionnement budget.',
    source: 'Salon International',
  },
  {
    id: 'D010',
    name: 'Export Biopharm Afrique',
    client: 'Biopharm',
    contactName: 'Imane Zitouni',
    email: 'i.zitouni@biopharm.dz',
    phone: '+213 31 789 666',
    stage: 'proposal',
    value: 980000,
    currency: 'DZD',
    probability: 45,
    expectedCloseDate: new Date('2024-05-01'),
    actualCloseDate: null,
    createdAt: new Date('2024-01-02'),
    assignedTo: 'Nadia C.',
    products: ['Export Module', 'Multi-devises'],
    notes: 'Proposition pour expansion marché africain (Nigeria, Sénégal).',
    source: 'Pharmagora Salon',
  },
  {
    id: 'D011',
    name: 'ORASC Santé Publique',
    client: 'ORASC',
    contactName: 'Meriem Attiyah',
    email: 'm.attiyah@orasc.dz',
    phone: '+213 41 123 000',
    stage: 'proposal',
    value: 720000,
    currency: 'DZD',
    probability: 40,
    expectedCloseDate: new Date('2024-03-30'),
    actualCloseDate: null,
    createdAt: new Date('2024-01-09'),
    assignedTo: 'Lina D.',
    products: ['Gestion Stocks Médicaments', 'Traçabilité'],
    notes: 'Réponse à appel d\'offres santé publique. Délai court.',
    source: 'Appel d\'offres',
  },
  {
    id: 'D012',
    name: 'Extension USITOR Skikda',
    client: 'USITOR',
    contactName: 'Sid Ahmed Ferhat',
    email: 'sa.ferhat@usitor.dz',
    phone: '+213 33 678 555',
    stage: 'proposal',
    value: 650000,
    currency: 'DZD',
    probability: 48,
    expectedCloseDate: new Date('2024-04-20'),
    actualCloseDate: null,
    createdAt: new Date('2023-12-20'),
    assignedTo: 'Rachid M.',
    products: ['Booking Engine', 'Gestion Clients'],
    notes: 'Préparation saison estivale. Besoin avant juin.',
    source: 'Client existant',
  },

  // Qualified Stage
  {
    id: 'D013',
    name: 'Projet ETEEB Solaire',
    client: 'ETEEB',
    contactName: 'Reda Berrahma',
    email: 'r.berrahma@eteeb.dz',
    phone: '+213 49 890 777',
    stage: 'qualified',
    value: 520000,
    currency: 'DZD',
    probability: 35,
    expectedCloseDate: new Date('2024-06-01'),
    actualCloseDate: null,
    createdAt: new Date('2024-01-16'),
    assignedTo: 'Non assigné',
    products: ['Monitoring Énergie', 'Reporting'],
    notes: 'Startup prometteuse dans énergie renouvelable. Budget limité mais fort potentiel.',
    source: 'Web',
  },
  {
    id: 'D014',
    name: 'Réseau PME GEMA M\'sila',
    client: 'GEMA',
    contactName: 'Tarek Boukerma',
    email: 't.boukerma@gema.dz',
    phone: '+213 29 456 333',
    stage: 'qualified',
    value: 450000,
    currency: 'DZD',
    probability: 30,
    expectedCloseDate: new Date('2024-07-01'),
    actualCloseDate: null,
    createdAt: new Date('2024-01-06'),
    assignedTo: 'Dalia K.',
    products: ['CRM Basic Pack x20'],
    notes: 'Offre groupée pour réseau de PMEs. Volume intéressant si conclusion.',
    source: 'Cold Call',
  },
  {
    id: 'D015',
    name: 'Modernisation ENG Granulats',
    client: 'ENG',
    contactName: 'Rachid Mokrani',
    email: 'r.mokrani@eng.dz',
    phone: '+213 29 333 444',
    stage: 'qualified',
    value: 750000,
    currency: 'DZD',
    probability: 32,
    expectedCloseDate: new Date('2024-06-15'),
    actualCloseDate: null,
    createdAt: new Date('2023-12-20'),
    assignedTo: 'Sami R.',
    products: ['ERP Construction', 'Gestion Projets'],
    notes: 'Entreprise publique. Processus décision long. Intérêt confirmé par DG Adjoint.',
    source: 'Cold Call',
  },
  {
    id: 'D016',
    name: 'Canal Algérie Média',
    client: 'Canal Algérie',
    contactName: 'Wassila Kerdjouj',
    email: 'w.kerdjouj@canal-algerie.dz',
    phone: '+213 23 345 222',
    stage: 'qualified',
    value: 280000,
    currency: 'DZD',
    probability: 28,
    expectedCloseDate: new Date('2024-08-01'),
    actualCloseDate: null,
    createdAt: new Date('2024-01-19'),
    assignedTo: 'Non assigné',
    products: ['Gestion Contenu', 'Planning'],
    notes: 'Contact récent via réseaux sociaux. Opportunité collaboration média.',
    source: 'Social Media',
  },

  // Lead Stage
  {
    id: 'D017',
    name: 'Proméo Cosmétique Nouveau',
    client: 'Proméo',
    contactName: 'Leila Benmehidi',
    email: 'l.benmehidi@promeo.dz',
    phone: '+213 33 123 100',
    stage: 'lead',
    value: 150000,
    currency: 'DZD',
    probability: 15,
    expectedCloseDate: new Date('2024-09-01'),
    actualCloseDate: null,
    createdAt: new Date('2024-01-18'),
    assignedTo: 'Non assigné',
    products: ['E-commerce', 'Gestion Stocks'],
    notes: 'Nouvelle marque cosmétique locale. Budget limité mais croissance rapide.',
    source: 'Web',
  },
  {
    id: 'D018',
    name: 'Syrte Pharmaceuticals CRM',
    client: 'Syrte Pharmaceuticals',
    contactName: 'Mourad Medelmine',
    email: 'm.medelmine@syrte.dz',
    phone: '+213 29 012 999',
    stage: 'lead',
    value: 220000,
    currency: 'DZD',
    probability: 18,
    expectedCloseDate: new Date('2024-08-15'),
    actualCloseDate: null,
    createdAt: new Date('2024-01-17'),
    assignedTo: 'Non assigné',
    products: ['CRM Basic'],
    notes: 'Startup pharma innovante. Besoin basique identifié lors échange initial.',
    source: 'Social Media',
  },
  {
    id: 'D019',
    name: 'Cooperativa Agro Solution',
    client: 'Cooperativa Agro',
    contactName: 'Nabil Guendouz',
    email: 'n.guendouz@cooperativa.dz',
    phone: '+213 29 888 999',
    stage: 'lead',
    value: 180000,
    currency: 'DZD',
    probability: 12,
    expectedCloseDate: new Date('2024-10-01'),
    actualCloseDate: null,
    createdAt: new Date('2023-12-15'),
    assignedTo: 'Rachid M.',
    products: ['Gestion Coopérative', 'Comptabilité'],
    notes: 'Budget insuffisant actuellement. Peut-être réactiver après récolte.',
    source: 'Cold Call',
  },

  // Lost Deals
  {
    id: 'D020',
    name: 'Celtal Ciment Digitalisation',
    client: 'Celtal',
    contactName: 'Salima Cheriet',
    email: 's.cherif@celtal.dz',
    phone: '+213 43 901 888',
    stage: 'lost',
    value: 1200000,
    currency: 'DZD',
    probability: 0,
    expectedCloseDate: new Date('2024-01-31'),
    actualCloseDate: new Date('2024-01-15'),
    createdAt: new Date('2023-06-10'),
    assignedTo: 'Karim T.',
    products: ['ERP Industriel', 'Maintenance'],
    notes: 'Perdue au profit de concurrent international. Fusion possible avec Lafarge a changé les priorités.',
    source: 'Salon BTP',
  },
  {
    id: 'D021',
    name: 'Setifis Textile Modernisation',
    client: 'Setifis',
    contactName: 'Dalia Bouazza',
    email: 'd.bouazza@setifis.dz',
    phone: '+213 36 777 888',
    stage: 'lost',
    value: 550000,
    currency: 'DZD',
    probability: 0,
    expectedCloseDate: new Date('2023-12-15'),
    actualCloseDate: new Date('2023-11-30'),
    createdAt: new Date('2023-07-22'),
    assignedTo: 'Samia H.',
    products: ['Production Suite'],
    notes: 'Difficultés financières de l\'entreprise. Projet mis en attente indéfinie.',
    source: 'Cold Call',
  },
  {
    id: 'D022',
    name: 'Algérie Télécom Innovation Lab',
    client: 'Algérie Télécom',
    contactName: 'Amina Belkacem',
    email: 'a.belkacem@algerie-telecom.dz',
    phone: '+213 555 111 222',
    stage: 'lost',
    value: 2100000,
    currency: 'DZD',
    probability: 0,
    expectedCloseDate: new Date('2024-02-28'),
    actualCloseDate: new Date('2024-01-10'),
    createdAt: new Date('2023-09-15'),
    assignedTo: 'Youssef K.',
    products: ['Innovation Platform', 'R&D Tools'],
    notes: 'Processus décision complexe. Reporté à 2025. Garder le contact.',
    source: 'Partenariat potentiel',
  },
]

export default function DealsPage() {
  const [deals] = useState<Deal[]>(mockDeals)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          deal.name.toLowerCase().includes(query) ||
          deal.client.toLowerCase().includes(query) ||
          deal.contactName.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      if (stageFilter !== 'all' && deal.stage !== stageFilter) return false

      return true
    })
  }, [deals, searchQuery, stageFilter])

  // Group by stage for Kanban view
  const dealsByStage = useMemo(() => {
    const grouped: Record<DealStage, Deal[]> = {
      lead: [],
      qualified: [],
      proposal: [],
      negotiation: [],
      won: [],
      lost: [],
    }
    
    filteredDeals.forEach(deal => {
      grouped[deal.stage].push(deal)
    })
    
    return grouped
  }, [filteredDeals])

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

  const getStageBadge = (stage: DealStage) => {
    const config = stages.find(s => s.id === stage)
    if (!config) return <Badge>{stage}</Badge>
    return (
      <Badge className={`${config.bgColor} ${config.color} border-current`}>
        <config.icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getProbabilityColor = (prob: number) => {
    if (prob >= 75) return 'text-emerald-600 bg-emerald-50'
    if (prob >= 50) return 'text-blue-600 bg-blue-50'
    if (prob >= 25) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  // Calculate stats
  const stats = {
    totalDeals: filteredDeals.length,
    totalValue: filteredDeals.reduce((sum, d) => sum + d.value, 0),
    weightedValue: filteredDeads.reduce((sum, d) => sum + (d.value * d.probability / 100), 0),
    wonValue: filteredDeals.filter(d => d.stage === 'won').reduce((sum, d) => sum + d.value, 0),
    avgDealSize: Math.round(filteredDeals.reduce((sum, d) => sum + d.value, 0) / filteredDeals.length || 0),
    wonCount: filteredDeals.filter(d => d.stage === 'won').length,
    lostCount: filteredDeals.filter(d => d.stage === 'lost').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Handshake className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pipeline des Affaires</h1>
                <p className="text-sm text-gray-500">{stats.totalDeals} affaires • Valeur pondérée: {formatCurrency(stats.weightedValue)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8"
                >
                  <List className="h-4 w-4 mr-1" />
                  Tableau
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="h-8"
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Kanban
                </Button>
              </div>

              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Affaire
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
                <Handshake className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-2xl font-bold">{stats.totalDeals}</p>
              <p className="text-xs text-gray-500">Total Affaires</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <DollarSign className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-xl font-bold">{formatCurrency(stats.totalValue)}</p>
              <p className="text-xs text-gray-500">Valeur Totale</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(stats.weightedValue)}</p>
              <p className="text-xs text-gray-500">Valeur Pondérée</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-xl font-bold text-green-700">{formatCurrency(stats.wonValue)}</p>
              <p className="text-xs text-gray-500">Affaires Gagnées ({stats.wonCount})</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-xl font-bold">{formatCurrency(stats.avgDealSize)}</p>
              <p className="text-xs text-gray-500">Taille Moyenne</p>
            </CardContent>
          </Card>
        </div>

        {/* Stage Summary */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {stages.map(stage => {
                const stageDeals = filteredDeals.filter(d => d.stage === stage.id)
                const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0)
                
                return (
                  <button
                    key={stage.id}
                    className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                      stageFilter === stage.id 
                        ? `${stage.bgColor} border-current` 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setStageFilter(stageFilter === stage.id ? 'all' : stage.id)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <stage.icon className={`h-4 w-4 ${stage.color}`} />
                      <span className={`font-medium text-sm ${stage.color}`}>{stage.label}</span>
                    </div>
                    <p className="text-lg font-bold">{stageDeals.length}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(stageValue)}</p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une affaire..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrer par stade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les stades</SelectItem>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content based on view mode */}
        {viewMode === 'table' ? (
          /* TABLE VIEW */
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affaire</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Stade</TableHead>
                      <TableHead>Valeur</TableHead>
                      <TableHead>Probabilité</TableHead>
                      <TableHead>Clôture Prévue</TableHead>
                      <TableHead>Assigné à</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeals.map((deal) => (
                      <TableRow 
                        key={deal.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedDeal(deal)
                          setShowDetailModal(true)
                        }}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{deal.name}</p>
                            <p className="text-xs text-gray-500">{deal.products.slice(0, 2).join(', ')}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{deal.client}</p>
                            <p className="text-xs text-gray-500">{deal.contactName}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStageBadge(deal.stage)}</TableCell>
                        <TableCell>
                          <span className="font-semibold">{formatCurrency(deal.value)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={deal.probability} className="w-16 h-2" />
                            <span className={`text-sm font-medium px-2 py-0.5 rounded ${getProbabilityColor(deal.probability)}`}>
                              {deal.probability}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm">{formatDate(deal.expectedCloseDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm ${deal.assignedTo === 'Non assigné' ? 'text-gray-400 italic' : ''}`}>
                            {deal.assignedTo}
                          </span>
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
                                setSelectedDeal(deal)
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
                              <DropdownMenuItem className="text-blue-600">
                                <MoveRight className="mr-2 h-4 w-4" />
                                Avancer le stade
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-emerald-600">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Marquer gagnée
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <XCircle className="mr-2 h-4 w-4" />
                                Marquer perdue
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}

                    {filteredDeals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <Handshake className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">Aucune affaire trouvée</p>
                          <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres ou créez une nouvelle affaire</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* KANBAN VIEW */
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {stages.map(stage => {
                const stageDeals = dealsByStage[stage.id]
                const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0)

                return (
                  <div key={stage.id} className={`w-[320px] flex-shrink-0`}>
                    <div className={`${stage.bgColor} rounded-t-lg p-3 border border-b-0`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <stage.icon className={`h-5 w-5 ${stage.color}`} />
                          <span className={`font-semibold ${stage.color}`}>{stage.label}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {stageDeals.length}
                        </Badge>
                      </div>
                      <p className={`text-sm mt-1 ${stage.color} opacity-75`}>
                        {formatCurrency(stageValue)}
                      </p>
                    </div>

                    <div className="border border-t-0 rounded-b-lg bg-gray-50 min-h-[400px] p-3 space-y-3 max-h-[600px] overflow-y-auto">
                      {stageDeals.map(deal => (
                        <Card 
                          key={deal.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            setSelectedDeal(deal)
                            setShowDetailModal(true)
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <p className="font-medium text-sm line-clamp-2">{deal.name}</p>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedDeal(deal)
                                      setShowDetailModal(true)
                                    }}>
                                      <Eye className="mr-2 h-3.5 w-3.5" />
                                      Voir
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-blue-600">
                                      <MoveRight className="mr-2 h-3.5 w-3.5" />
                                      Avancer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <p className="text-xs text-gray-500">{deal.client}</p>

                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-green-600">{formatCurrency(deal.value)}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${getProbabilityColor(deal.probability)}`}>
                                  {deal.probability}%
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(deal.expectedCloseDate)}
                                </div>
                                <span className="truncate max-w-[100px]">{deal.assignedTo}</span>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {deal.products.slice(0, 2).map(product => (
                                  <Badge key={product} variant="outline" className="text-[10px] px-1.5 py-0">
                                    {product}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {stageDeals.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <stage.icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Aucune affaire</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Deal Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedDeal && getStageBadge(selectedDeal.stage)}
              <span className="truncate">{selectedDeal?.name || 'Détails de l\'affaire'}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedDeal && (
            <div className="space-y-6 mt-4">
              {/* Value & Probability */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedDeal.value)}</p>
                    <p className="text-xs text-gray-500">Valeur Affaire</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedDeal.probability}%</p>
                    <p className="text-xs text-gray-500">Probabilité</p>
                    <Progress value={selectedDeal.probability} className="mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xl font-bold text-purple-600">
                      {formatCurrency(selectedDeal.value * selectedDeal.probability / 100)}
                    </p>
                    <p className="text-xs text-gray-500">Valeur Pondérée</p>
                  </CardContent>
                </Card>
              </div>

              {/* Client Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Informations Client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Entreprise:</span>
                        <span className="text-sm font-medium">{selectedDeal.client}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Contact:</span>
                        <span className="text-sm font-medium">{selectedDeal.contactName}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Email:</span>
                        <span className="text-sm font-medium text-blue-600 truncate">{selectedDeal.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Tél:</span>
                        <span className="text-sm font-medium">{selectedDeal.phone}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dates & Assignment */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Créé le:</span>
                      <span className="text-sm font-medium">{formatDate(selectedDeal.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Clôture prévue:</span>
                      <span className="text-sm font-medium">{formatDate(selectedDeal.expectedCloseDate)}</span>
                    </div>
                    {selectedDeal.actualCloseDate && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-500">Clôturé le:</span>
                        <span className="text-sm font-medium">{formatDate(selectedDeal.actualCloseDate)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Assigné à:</span>
                      <span className="text-sm font-medium">{selectedDeal.assignedTo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Source:</span>
                      <span className="text-sm font-medium">{selectedDeal.source}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Products */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Produits / Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedDeal.products.map(product => (
                      <Badge key={product} variant="secondary" className="py-1.5">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{selectedDeal.notes}</p>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm">
                  <Phone className="mr-2 h-4 w-4" />
                  Appeler
                </Button>
                <Button size="sm" variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button size="sm" variant="outline" className="text-blue-600 border-blue-200">
                  <MoveRight className="mr-2 h-4 w-4" />
                  Avancer Stade
                </Button>
                {selectedDeal.stage !== 'won' && (
                  <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marquer Gagnée
                  </Button>
                )}
                {selectedDeal.stage !== 'lost' && (
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200">
                    <XCircle className="mr-2 h-4 w-4" />
                    Marquer Perdue
                  </Button>
                )}
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
              <Handshake className="w-4 h-4 text-purple-600" />
              <span>AlgeriaTrade.dz - Pipeline des Affaires</span>
            </div>
            
            <div className="flex items-center gap-6">
              <span>Taux conversion: {stats.totalDeals > 0 ? Math.round((stats.wonCount / (stats.wonCount + stats.lostCount)) * 100) : 0}%</span>
              <span>Valeur gagnée: {formatCurrency(stats.wonValue)}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
