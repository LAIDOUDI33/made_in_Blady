'use client'

import React, { useState, useEffect } from 'react'
import { 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Eye,
  Download,
  Filter,
  RefreshCw,
  FileText,
  MessageSquare,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
interface DPAgreement {
  id: string
  agreementNumber: string
  buyerName: string
  buyerCompany: string
  sellerName: string
  sellerCompany: string
  principal: number
  interestRate: number
  monthlyPayment: number
  remainingBalance: number
  totalPayments: number
  paidPayments: number
  status: 'ACTIVE' | 'PAID' | 'DEFAULTED' | 'EARLY_SETTLED' | 'PENDING'
  nextDueDate: string
  startDate: string
  endDate: string
  durationMonths: number
  bankPartner: string
  isOverdue: boolean
  daysOverdue?: number
}

// Mock Data - 18 active DPA agreements
const mockAgreements: DPAgreement[] = [
  {
    id: '1',
    agreementNumber: 'DPA-2024-001',
    buyerName: 'Ahmed Benali',
    buyerCompany: 'TechnoDz Sarl',
    sellerName: 'Karim Hadj',
    sellerCompany: 'HardwarePro Algeria',
    principal: 2500000,
    interestRate: 8.5,
    monthlyPayment: 218750,
    remainingBalance: 1750000,
    totalPayments: 12,
    paidPayments: 4,
    status: 'ACTIVE',
    nextDueDate: '2025-02-15',
    startDate: '2024-10-15',
    endDate: '2025-09-15',
    durationMonths: 12,
    bankPartner: 'BNA',
    isOverdue: false
  },
  {
    id: '2',
    agreementNumber: 'DPA-2024-002',
    buyerName: 'Fatima Zerhouni',
    buyerCompany: 'ModeStyle Algérie',
    sellerName: 'Yacine Boudiaf',
    sellerCompany: 'TextileExport',
    principal: 1800000,
    interestRate: 7.75,
    monthlyPayment: 152500,
    remainingBalance: 1220000,
    totalPayments: 12,
    paidPayments: 4,
    status: 'ACTIVE',
    nextDueDate: '2025-02-20',
    startDate: '2024-10-20',
    endDate: '2025-09-20',
    durationMonths: 12,
    bankPartner: 'BEA',
    isOverdue: false
  },
  {
    id: '3',
    agreementNumber: 'DPA-2024-003',
    buyerName: 'Mohamed Amine',
    buyerCompany: 'AgroPlus DZ',
    sellerName: 'Sara Mellal',
    sellerCompany: 'FarmEquipment Co.',
    principal: 5500000,
    interestRate: 9.25,
    monthlyPayment: 486111,
    remainingBalance: 4375000,
    totalPayments: 12,
    paidPayments: 2,
    status: 'ACTIVE',
    nextDueDate: '2025-01-05',
    startDate: '2024-11-05',
    endDate: '2025-10-05',
    durationMonths: 12,
    bankPartner: 'BDL',
    isOverdue: true,
    daysOverdue: 15
  },
  {
    id: '4',
    agreementNumber: 'DPA-2024-004',
    buyerName: 'Nadia Bouazza',
    buyerCompany: 'PharmaDist Algerie',
    sellerName: 'Omar Kaci',
    sellerCompany: 'MedSupply Intl',
    principal: 4200000,
    interestRate: 8.0,
    monthlyPayment: 366667,
    remainingBalance: 2940000,
    totalPayments: 12,
    paidPayments: 4,
    status: 'ACTIVE',
    nextDueDate: '2025-02-10',
    startDate: '2024-10-10',
    endDate: '2025-09-10',
    durationMonths: 12,
    bankPartner: 'CPA',
    isOverdue: false
  },
  {
    id: '5',
    agreementNumber: 'DPA-2024-005',
    buyerName: 'Rachid Hamadi',
    buyerCompany: 'AutoParts DZ',
    sellerName: 'Leila Mansouri',
    sellerCompany: 'EuroAuto Parts',
    principal: 1200000,
    interestRate: 7.5,
    monthlyPayment: 103333,
    remainingBalance: 930000,
    totalPayments: 12,
    paidPayments: 3,
    status: 'ACTIVE',
    nextDueDate: '2025-02-25',
    startDate: '2024-11-25',
    endDate: '2025-10-25',
    durationMonths: 12,
    bankPartner: 'BNA',
    isOverdue: false
  },
  {
    id: '6',
    agreementNumber: 'DPA-2024-006',
    buyerName: 'Samira Khelifi',
    buyerCompany: 'BeautyZone',
    sellerName: 'Tarek Beghloul',
    sellerCompany: 'CosmoTrade',
    principal: 850000,
    interestRate: 8.25,
    monthlyPayment: 74583,
    remainingBalance: 596666,
    totalPayments: 12,
    paidPayments: 4,
    status: 'ACTIVE',
    nextDueDate: '2025-03-01',
    startDate: '2024-11-01',
    endDate: '2025-10-01',
    durationMonths: 12,
    bankPartner: 'BEA',
    isOverdue: false
  },
  {
    id: '7',
    agreementNumber: 'DPA-2024-007',
    buyerName: 'Kamel Djellouli',
    buyerCompany: 'ElectroDz',
    sellerName: 'Nora Belmokhtar',
    sellerCompany: 'TechComponents SA',
    principal: 3200000,
    interestRate: 9.0,
    monthlyPayment: 282222,
    remainingBalance: 2256000,
    totalPayments: 12,
    paidPayments: 3,
    status: 'DEFAULTED',
    nextDueDate: '2024-12-15',
    startDate: '2024-09-15',
    endDate: '2025-08-15',
    durationMonths: 12,
    bankPartner: 'BDL',
    isOverdue: true,
    daysOverdue: 46
  },
  {
    id: '8',
    agreementNumber: 'DPA-2024-008',
    buyerName: 'Amina Toubal',
    buyerCompany: 'HomeDecor Plus',
    sellerName: 'Farid Meziane',
    sellerCompany: 'FurnitureExport',
    principal: 1500000,
    interestRate: 7.85,
    monthlyPayment: 129792,
    remainingBalance: 0,
    totalPayments: 12,
    paidPayments: 12,
    status: 'PAID',
    nextDueDate: '-',
    startDate: '2024-02-01',
    endDate: '2025-01-01',
    durationMonths: 12,
    bankPartner: 'CPA',
    isOverdue: false
  },
  {
    id: '9',
    agreementNumber: 'DPA-2024-009',
    buyerName: 'Youssef Brahimi',
    buyerCompany: 'SportGear DZ',
    sellerName: 'Ines Rahmani',
    supplierCompany: 'AthleticSupplies',
    principal: 680000,
    interestRate: 8.0,
    monthlyPayment: 59333,
    remainingBalance: 476000,
    totalPayments: 12,
    paidPayments: 4,
    status: 'ACTIVE',
    nextDueDate: '2025-02-18',
    startDate: '2024-10-18',
    endDate: '2025-09-18',
    durationMonths: 12,
    bankPartner: 'BNA',
    isOverdue: false
  },
  {
    id: '10',
    agreementNumber: 'DPA-2024-010',
    buyerName: 'Lina Messaoudi',
    buyerCompany: 'BookWorld Algeria',
    sellerName: 'Mourad Medelci',
    sellerCompany: 'EduPublish Intl',
    principal: 450000,
    interestRate: 7.25,
    monthlyPayment: 38542,
    remainingBalance: 231250,
    totalPayments: 12,
    paidPayments: 6,
    status: 'EARLY_SETTLED',
    nextDueDate: '-',
    startDate: '2024-06-01',
    endDate: '2025-05-01',
    durationMonths: 12,
    bankPartner: 'BEA',
    isOverdue: false
  },
  {
    id: '11',
    agreementNumber: 'DPA-2024-011',
    buyerName: 'Omar Fettouhi',
    buyerCompany: 'BuildMat Pro',
    sellerName: 'Salima Ait Ali',
    sellerCompany: 'ConstructionSupply',
    principal: 4800000,
    interestRate: 9.5,
    monthlyPayment: 426667,
    remainingBalance: 3840000,
    totalPayments: 12,
    paidPayments: 2,
    status: 'ACTIVE',
    nextDueDate: '2025-02-08',
    startDate: '2024-11-08',
    endDate: '2025-10-08',
    durationMonths: 12,
    bankPartner: 'BDL',
    isOverdue: false
  },
  {
    id: '12',
    agreementNumber: 'DPA-2024-012',
    buyerName: 'Hafsa Amrani',
    buyerCompany: 'FoodService DZ',
    sellerName: 'Reda Benhammou',
    sellerCompany: 'RestaurantEquip',
    principal: 2100000,
    interestRate: 8.35,
    monthlyPayment: 184583,
    remainingBalance: 1477000,
    totalPayments: 12,
    paidPayments: 4,
    status: 'ACTIVE',
    nextDueDate: '2025-02-22',
    startDate: '2024-10-22',
    endDate: '2025-09-22',
    durationMonths: 12,
    bankPartner: 'CPA',
    isOverdue: false
  },
  {
    id: '13',
    agreementNumber: 'DPA-2024-013',
    buyerName: 'Bilal Charef',
    buyerCompany: 'IT Solutions DZ',
    sellerName: 'Amira Bouteflika',
    sellerCompany: 'SoftwareHub',
    principal: 1650000,
    interestRate: 7.65,
    monthlyPayment: 141458,
    remainingBalance: 1130000,
    totalPayments: 12,
    paidPayments: 4,
    status: 'ACTIVE',
    nextDueDate: '2025-02-12',
    startDate: '2024-10-12',
    endDate: '2025-09-12',
    durationMonths: 12,
    bankPartner: 'BNA',
    isOverdue: false
  },
  {
    id: '14',
    agreementNumber: 'DPA-2024-014',
    buyerName: 'Meriem Kaced',
    buyerCompany: 'GreenGarden DZ',
    sellerName: 'Nabil Ouldali',
    sellerCompany: 'AgriTech Supply',
    principal: 920000,
    interestRate: 8.1,
    monthlyPayment: 80067,
    remainingBalance: 720600,
    totalPayments: 12,
    paidPayments: 3,
    status: 'ACTIVE',
    nextDueDate: '2025-01-28',
    startDate: '2024-10-28',
    endDate: '2025-09-28',
    durationMonths: 12,
    bankPartner: 'BEA',
    isOverdue: true,
    daysOverdue: 8
  },
  {
    id: '15',
    agreementNumber: 'DPA-2024-015',
    buyerName: 'Abdelkrim Haddad',
    buyerCompany: 'MetalWorks Co',
    sellerName: 'Dalila Bensaid',
    sellerCompany: 'SteelImport',
    principal: 3800000,
    interestRate: 9.15,
    monthlyPayment: 334861,
    remainingBalance: 3014000,
    totalPayments: 12,
    paidPayments: 2,
    status: 'ACTIVE',
    nextDueDate: '2025-02-05',
    startDate: '2024-11-05',
    endDate: '2025-10-05',
    durationMonths: 12,
    bankPartner: 'BDL',
    isOverdue: false
  },
  {
    id: '16',
    agreementNumber: 'DPA-2024-016',
    buyerName: 'Nourhane Sadki',
    buyerCompany: 'FashionHub DZ',
    sellerName: 'Karim Mebarki',
    sellerCompany: 'TextilePremium',
    principal: 1350000,
    interestRate: 7.95,
    monthlyPayment: 116875,
    remainingBalance: 1050000,
    totalPayments: 12,
    paidPayments: 3,
    status: 'ACTIVE',
    nextDueDate: '2025-03-05',
    startDate: '2024-12-05',
    endDate: '2025-11-05',
    durationMonths: 12,
    bankPartner: 'CPA',
    isOverdue: false
  },
  {
    id: '17',
    agreementNumber: 'DPA-2024-017',
    buyerName: 'Imene Boudjelida',
    buyerCompany: 'CleanPro Services',
    sellerName: 'Yacine Sadi',
    sellerCompany: 'JanitorialSupply',
    principal: 520000,
    interestRate: 7.4,
    monthlyPayment: 44233,
    remainingBalance: 354000,
    totalPayments: 12,
    paidPayments: 4,
    status: 'ACTIVE',
    nextDueDate: '2025-02-28',
    startDate: '2024-10-28',
    endDate: '2025-09-28',
    durationMonths: 12,
    bankPartner: 'BNA',
    isOverdue: false
  },
  {
    id: '18',
    agreementNumber: 'DPA-2024-018',
    buyerName: 'Tarek Boussaid',
    buyerCompany: 'SecurityFirst DZ',
    sellerName: 'Wassila Laifa',
    sellerCompany: 'SecuritySystems',
    principal: 2750000,
    interestRate: 8.75,
    monthlyPayment: 242708,
    remainingBalance: 1942000,
    totalPayments: 12,
    paidPayments: 3,
    status: 'ACTIVE',
    nextDueDate: '2025-02-15',
    startDate: '2024-11-15',
    endDate: '2025-10-15',
    durationMonths: 12,
    bankPartner: 'BEA',
    isOverdue: false
  }
]

export default function InstallmentsAdminPage() {
  const [agreements, setAgreements] = useState<DPAgreement[]>(mockAgreements)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedBank, setSelectedBank] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Random subtle update simulation
      setAgreements(prev => prev.map(agreement => ({
        ...agreement,
        // Simulate occasional status changes for demo
      })))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  // Calculate stats
  const activePlans = agreements.filter(a => a.status === 'ACTIVE').length
  const monthlyRevenue = agreements
    .filter(a => a.status === 'ACTIVE')
    .reduce((sum, a) => sum + a.monthlyPayment, 0)
  const avgPlanValue = Math.round(
    agreements.reduce((sum, a) => sum + a.principal, 0) / agreements.length
  )
  const defaultRate = (
    (agreements.filter(a => a.status === 'DEFAULTED').length / agreements.length) * 100
  ).toFixed(1)
  const overdueCount = agreements.filter(a => a.isOverdue).length

  // Pipeline by duration (simulated distribution)
  const pipelineByDuration = [
    { label: '3 Months', count: 3, value: 16.7, color: 'bg-emerald-500' },
    { label: '6 Months', count: 5, value: 27.8, color: 'bg-blue-500' },
    { label: '12 Months', count: 8, value: 44.4, color: 'bg-purple-500' },
    { label: '24 Months', count: 2, value: 11.1, color: 'bg-orange-500' }
  ]

  // Bank partner breakdown
  const bankBreakdown = [
    { name: 'BNA', fullName: 'Banque Nationale d\'Algérie', count: 5, volume: 8940000, color: 'bg-red-600' },
    { name: 'BEA', fullName: 'Banque Extérieure d\'Algérie', count: 5, volume: 6820000, color: 'bg-green-600' },
    { name: 'BDL', fullName: 'Banque de Développement Local', count: 4, volume: 18350000, color: 'bg-blue-600' },
    { name: 'CPA', fullName: 'Crédit Populaire d\'Algérie', count: 4, volume: 9070000, color: 'bg-yellow-600' }
  ]

  // Filter agreements
  const filteredAgreements = agreements.filter(agreement => {
    if (selectedStatus !== 'all' && agreement.status !== selectedStatus) return false
    if (selectedBank !== 'all' && agreement.bankPartner !== selectedBank) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        agreement.agreementNumber.toLowerCase().includes(query) ||
        agreement.buyerName.toLowerCase().includes(query) ||
        agreement.buyerCompany.toLowerCase().includes(query) ||
        agreement.sellerName.toLowerCase().includes(query) ||
        agreement.sellerCompany.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getStatusBadge = (status: DPAgreement['status'], isOverdue: boolean) => {
    if (isOverdue && status === 'ACTIVE') {
      return <Badge className="bg-red-100 text-red-700 border-red-200 animate-pulse">OVERDUE</Badge>
    }
    
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
      case 'PAID':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Paid</Badge>
      case 'DEFAULTED':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Defaulted</Badge>
      case 'EARLY_SETTLED':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Early Settled</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    if (dateStr === '-') return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            DPA Installment Plans
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage deferred payment agreements and installment plans
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <CreditCard className="mr-2 h-4 w-4" />
            New Agreement
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Plans</p>
                <p className="text-2xl font-bold mt-1">{activePlans}</p>
                <p className="text-xs text-gray-500 mt-1">of {agreements.length} total</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(monthlyRevenue)}</p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12.5% vs last month
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Plan Value</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(avgPlanValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Principal amount</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={overdueCount > 0 ? 'border-red-200 bg-red-50/30' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Default Rate</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{defaultRate}%</p>
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {overdueCount} overdue payments
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Agreements Table */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                Active Agreements
                {overdueCount > 0 && (
                  <Badge className="bg-red-100 text-red-700 ml-2">
                    {overdueCount} Overdue
                  </Badge>
                )}
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search agreements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm border rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-sm border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PAID">Paid</option>
                <option value="DEFAULTED">Defaulted</option>
                <option value="EARLY_SETTLED">Early Settled</option>
                <option value="PENDING">Pending</option>
              </select>

              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="text-sm border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="all">All Banks</option>
                <option value="BNA">BNA</option>
                <option value="BEA">BEA</option>
                <option value="BDL">BDL</option>
                <option value="CPA">CPA</option>
              </select>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Monthly</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgreements.slice(0, 10).map((agreement) => (
                    <TableRow 
                      key={agreement.id} 
                      className={agreement.isOverdue ? 'bg-red-50/50' : ''}
                    >
                      <TableCell>
                        <span className="font-mono text-xs">{agreement.agreementNumber}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{agreement.buyerName}</p>
                          <p className="text-xs text-gray-500">{agreement.buyerCompany}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{agreement.sellerName}</p>
                          <p className="text-xs text-gray-500">{agreement.sellerCompany}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(agreement.principal)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(agreement.monthlyPayment)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${agreement.isOverdue ? 'text-red-600' : ''}`}>
                          {formatCurrency(agreement.remainingBalance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(agreement.status, agreement.isOverdue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className={`text-sm ${agreement.isOverdue ? 'text-red-600 font-medium' : ''}`}>
                            {formatDate(agreement.nextDueDate)}
                          </span>
                          {agreement.isOverdue && agreement.daysOverdue && (
                            <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                              +{agreement.daysOverdue}d
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={`/admin/installments/${agreement.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              View Documents
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Communication Log
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredAgreements.length > 10 && (
              <div className="mt-4 pt-4 border-t text-center">
                <Button variant="outline" size="sm">
                  View All {filteredAgreements.length} Agreements
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Pipeline by Duration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-500" />
                Plans by Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pipelineByDuration.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-gray-500">{item.count} plans ({item.value}%)</span>
                  </div>
                  <Progress value={item.value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Bank Partner Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                Bank Partners
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bankBreakdown.map((bank) => (
                <div key={bank.name} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-10 h-10 rounded-lg ${bank.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {bank.name}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{bank.fullName}</p>
                    <p className="text-xs text-gray-500">{bank.count} active agreements</p>
                    <p className="text-sm font-semibold text-gray-700 mt-1">
                      {formatCurrency(bank.volume)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Contact Overdue Buyers ({overdueCount})
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Process Today's Payments
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <XCircle className="mr-2 h-4 w-4" />
                Review Defaulted Accounts
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Generate Monthly Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
