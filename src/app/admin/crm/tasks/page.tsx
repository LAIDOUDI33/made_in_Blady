'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  CheckSquare,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Clock,
  AlertTriangle,
  UserPlus,
  Users,
  Target,
  Handshake,
  FileText,
  MessageSquare,
  Star,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Circle,
  CheckCircle2,
  ListTodo,
  ArrowUpRight,
  Bell,
  RefreshCw,
  BarChart3,
} from 'lucide-react'

// Types
type TaskPriority = 'high' | 'medium' | 'low'
type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'overdue'
type TaskType = 'call' | 'email' | 'meeting' | 'follow_up' | 'task' | 'other'

interface Task {
  id: string
  title: string
  description: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  dueDate: Date
  completedAt: Date | null
  assignee: string
  relatedTo: {
    type: 'contact' | 'lead' | 'deal' | null
    name: string
    id: string
  }
  createdAt: Date
  updatedAt: Date
  reminder: boolean
}

// Mock Data - 18 Tasks
const mockTasks: Task[] = [
  // High Priority - Overdue / Due Soon
  {
    id: 'T001',
    title: 'Appeler Sara Hamadi - Condor',
    description: 'Suivi proposition ERP envoyée le 10 janvier. Confirmer réunion de présentation.',
    type: 'call',
    priority: 'high',
    status: 'todo',
    dueDate: new Date('2024-01-19'),
    completedAt: null,
    assignee: 'Moi',
    relatedTo: { type: 'deal', name: 'Partenariat Condor Algérie', id: 'D008' },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-18'),
    reminder: true,
  },
  {
    id: 'T002',
    title: 'Préparer proposition Cevital renouvellement',
    description: 'Rédiger la proposition technique et financière pour extension à 3 usines. Inclure les modules demandés.',
    type: 'task',
    priority: 'high',
    status: 'in_progress',
    dueDate: new Date('2024-01-20'),
    completedAt: null,
    assignee: 'Youssef K.',
    relatedTo: { type: 'deal', name: 'Renouvellement Cevital', id: 'D005' },
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-18'),
    reminder: true,
  },
  {
    id: 'T003',
    title: 'Réunion comité Sonatrach - Phase II',
    description: 'Présentation finale du projet digitalisation devant le comité exécutif. Apporter tous les documents validés.',
    type: 'meeting',
    priority: 'high',
    status: 'todo',
    dueDate: new Date('2024-01-22'),
    completedAt: null,
    assignee: 'Moi',
    relatedTo: { type: 'deal', name: 'Projet Sonatrach Phase II', id: 'D004' },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-17'),
    reminder: true,
  },
  {
    id: 'T004',
    title: 'Envoyer devis Naftal Logistique',
    description: 'Finaliser et envoyer le devis pour la suite logistique. Budget validé par Nadia Cherif.',
    type: 'email',
    priority: 'high',
    status: 'todo',
    dueDate: new Date('2024-01-21'),
    completedAt: null,
    assignee: 'Amina M.',
    relatedTo: { type: 'deal', name: 'Équipement Naftal Logistique', id: 'D006' },
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-18'),
    reminder: true,
  },

  // Medium Priority
  {
    id: 'T005',
    title: 'Suivi email Biopharm Export',
    description: 'Relancer Imane Zitouni concernant la proposition export Afrique. Voir si questions sur multi-devises.',
    type: 'email',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date('2024-01-23'),
    completedAt: null,
    assignee: 'Nadia C.',
    relatedTo: { type: 'deal', name: 'Export Biopharm Afrique', id: 'D010' },
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-18'),
    reminder: false,
  },
  {
    id: 'T006',
    title: 'Appel découverte ETEEB Solaire',
    description: 'Premier appel avec Reda Berrahma pour comprendre ses besoins en monitoring énergie.',
    type: 'call',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date('2024-01-24'),
    completedAt: null,
    assignee: 'Non assigné',
    relatedTo: { type: 'lead', name: 'Reda Berrahma - ETEEB', id: 'L10' },
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    reminder: false,
  },
  {
    id: 'T007',
    title: 'Réunion équipe commerciale hebdo',
    description: 'Point hebdomadaire sur le pipeline. Présenter les nouvelles opportunités et bloquants.',
    type: 'meeting',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date('2024-01-26'),
    completedAt: null,
    assignee: 'Équipe',
    relatedTo: { type: null, name: '', id: '' },
    createdat: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-15'),
    reminder: true,
  },
  {
    id: 'T008',
    title: 'Mettre à jour CRM Air Algérie',
    description: 'Ajouter les nouveaux contacts fournis par Mohamed Kaci. Mettre à jour les notes de la dernière réunion.',
    type: 'task',
    priority: 'medium',
    status: 'in_progress',
    dueDate: new Date('2024-01-25'),
    completedAt: null,
    assignee: 'Fatima Z.',
    relatedTo: { type: 'contact', name: 'Mohamed Kaci - Air Algérie', id: 'C8' },
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-18'),
    reminder: false,
  },
  {
    id: 'T009',
    title: 'Préparer rapport mensuel Q1',
    description: 'Compiler les statistiques de janvier: leads générés, affaires gagnées/perdues, taux de conversion.',
    type: 'task',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date('2024-01-29'),
    completedAt: null,
    assignee: 'Amina M.',
    relatedTo: { type: null, name: '', id: '' },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-18'),
    reminder: true,
  },
  {
    id: 'T010',
    title: 'Démo produit pour BIM Bank',
    description: 'Organiser une démo en ligne pour Abdelkrim Bensalah. Focus sur module banking et sécurité.',
    type: 'meeting',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date('2024-01-30'),
    completedAt: null,
    assignee: 'Youssef K.',
    relatedTo: { type: 'deal', name: 'Digitalisation BIM Bank', id: 'D007' },
    createdAt: new Date('2024-01-14'),
    updatedat: new Date('2024-01-17'),
    reminder: true,
  },

  // Low Priority
  {
    id: 'T011',
    title: 'Nettoyer base de contacts doublons',
    description: 'Identifier et fusionner les doublons dans la base de contacts. Prioriser les contacts actifs.',
    type: 'task',
    priority: 'low',
    status: 'todo',
    dueDate: new Date('2024-02-05'),
    completedAt: null,
    assignee: 'Mohamed B.',
    relatedTo: { type: null, name: '', id: '' },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
    reminder: false,
  },
  {
    id: 'T012',
    title: 'Créer templates emails prospection',
    description: 'Créer des templates d\'emails personnalisables pour la prospection: premier contact, relance, suivi.',
    type: 'task',
    priority: 'low',
    status: 'todo',
    dueDate: new Date('2024-02-10'),
    completedAt: null,
    assignee: 'Lina D.',
    relatedTo: { type: null, name: '', id: '' },
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-16'),
    reminder: false,
  },
  {
    id: 'T013',
    title: 'Former nouvelle commerciale Samia',
    description: 'Session de formation sur l\'utilisation du CRM et les processus commerciaux.',
    type: 'task',
    priority: 'low',
    status: 'todo',
    dueDate: new Date('2024-02-08'),
    completedAt: null,
    assignee: 'Karim T.',
    relatedTo: { type: null, name: '', id: '' },
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    reminder: false,
  },
  {
    id: 'T014',
    title: 'Rechercher contacts GEMA M\'sila',
    description: 'Trouver des contacts supplémentaires au sein du groupement PME de M\'sila pour élargir l\'opportunité.',
    type: 'task',
    priority: 'low',
    status: 'todo',
    dueDate: new Date('2024-02-12'),
    completedAt: null,
    assignee: 'Dalia K.',
    relatedTo: { type: 'lead', name: 'Tarek Boukerma - GEMA', id: 'L16' },
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-18'),
    reminder: false,
  },

  // Completed Tasks
  {
    id: 'T015',
    title: 'Envoyer contrat IFRI signé',
    description: 'Scanner et envoyer le contrat signé par IFRI au service juridique pour archivage.',
    type: 'email',
    priority: 'high',
    status: 'completed',
    dueDate: new Date('2024-01-18'),
    completedAt: new Date('2024-01-18'),
    assignee: 'Amina M.',
    relatedTo: { type: 'deal', name: 'Contrat Distribution IFRI', id: 'D001' },
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-18'),
    reminder: false,
  },
  {
    id: 'T016',
    title: 'Appel qualification Karim Benali',
    description: 'Premier appel avec Karim Benali pour qualifier son besoin en solution ERP.',
    type: 'call',
    priority: 'medium',
    status: 'completed',
    dueDate: new Date('2024-01-17'),
    completedAt: new Date('2024-01-17'),
    assignee: 'Youssef K.',
    relatedTo: { type: 'lead', name: 'Karim Benali - AlgerTech', id: 'L2' },
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-17'),
    reminder: false,
  },
  {
    id: 'T017',
    title: 'Mettre à jour fiche client Cevital',
    description: 'Ajouter les informations du dernier rendez-vous avec Omar Boudiaf.',
    type: 'task',
    priority: 'low',
    status: 'completed',
    dueDate: new Date('2024-01-16'),
    completedAt: new Date('2024-01-16'),
    assignee: 'Mohamed B.',
    relatedTo: { type: 'contact', name: 'Omar Boudiaf - Cevital', id: 'C4' },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16'),
    reminder: false,
  },
  {
    id: 'T018',
    title: 'Planifier démo Nedromy Pharma',
    description: 'Envoyer invitation calendrier à Samira Hadji pour la démo module qualité.',
    type: 'email',
    priority: 'medium',
    status: 'completed',
    dueDate: new Date('2024-01-15'),
    completedAt: new Date('2024-01-14'),
    assignee: 'Karim T.',
    relatedTo: { type: 'deal', name: 'Module Qualité Nedromy', id: 'D003' },
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-14'),
    reminder: false,
  },
]

const taskTypes: { value: TaskType; label: string; icon: React.ElementType }[] = [
  { value: 'call', label: 'Appel', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Réunion', icon: Users },
  { value: 'follow_up', label: 'Suivi', icon: RefreshCw },
  { value: 'task', label: 'Tâche', icon: CheckSquare },
  { value: 'other', label: 'Autre', icon: Star },
]

const priorities = [
  { value: 'all', label: 'Toutes priorités' },
  { value: 'high', label: 'Haute' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'low', label: 'Basse' },
]

const statuses = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'todo', label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminée' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Get unique assignees
  const assignees = useMemo(() => {
    return [...new Set(tasks.map(t => t.assignee))].sort()
  }, [tasks])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const now = new Date()
    
    return tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.assignee.toLowerCase().includes(query) ||
          (task.relatedTo.name && task.relatedTo.name.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false

      // Status filter
      if (statusFilter === 'completed') {
        if (task.status !== 'completed') return false
      } else if (statusFilter === 'todo') {
        if (task.status === 'completed') return false
        if (task.status === 'in_progress') return false
      } else if (statusFilter === 'in_progress') {
        if (task.status !== 'in_progress') return false
      }

      // Assignee filter
      if (assigneeFilter !== 'all' && task.assignee !== assigneeFilter) return false

      // Type filter
      if (typeFilter !== 'all' && task.type !== typeFilter) return false

      return true
    }).map(task => {
      // Determine if overdue
      const isOverdue = task.dueDate < now && !task.completedAt && task.status !== 'completed'
      return { ...task, status: isOverdue ? 'overdue' as TaskStatus : task.status }
    })
  }, [tasks, searchQuery, priorityFilter, statusFilter, assigneeFilter, typeFilter])

  // Sort by due date then priority
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed tasks go to bottom
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (b.status === 'completed' && a.status !== 'completed') return -1
    
    // Then sort by due date
    const dateCompare = a.dueDate.getTime() - b.dueDate.getTime()
    if (dateCompare !== 0) return dateCompare
    
    // Then by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  // Paginate
  const totalPages = Math.ceil(sortedTasks.length / pageSize)
  const paginatedTasks = sortedTasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const formatRelativeDate = (date: Date) => {
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `${Math.abs(diffDays)}j en retard`
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "Demain"
    if (diffDays <= 7) return `Dans ${diffDays} jours`
    return formatDate(date)
  }

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Haute
          </Badge>
        )
      case 'medium':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Moyenne
          </Badge>
        )
      case 'low':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Basse
          </Badge>
        )
    }
  }

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <Badge variant="secondary">À faire</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">En cours</Badge>
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Terminée
        </Badge>
      case 'overdue':
        return <Badge className="bg-red-500 text-white border-red-600 flex items-center gap-1 animate-pulse">
          <AlertTriangle className="h-3 w-3" />
          En retard!
        </Badge>
    }
  }

  const getTypeIcon = (type: TaskType) => {
    const config = taskTypes.find(t => t.value === type)
    return config ? <config.icon className="h-4 w-4" /> : <ListTodo className="h-4 w-4" />
  }

  const getTypeLabel = (type: TaskType) => {
    const config = taskTypes.find(t => t.value === type)
    return config?.label || type
  }

  const toggleTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: task.status === 'completed' ? 'todo' as TaskStatus : 'completed' as TaskStatus,
            completedAt: task.status === 'completed' ? null : new Date(),
            updatedAt: new Date()
          }
        : task
    ))
  }

  // Stats calculations
  const stats = {
    total: filteredTasks.length,
    todo: filteredTasks.filter(t => t.status === 'todo').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    overdue: filteredTasks.filter(t => t.status === 'overdue').length,
    highPriority: filteredTasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestion des Tâches</h1>
                <p className="text-sm text-gray-500">{stats.total} tâches • {stats.overdue} en retard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Tâche
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <ListTodo className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </CardContent>
          </Card>

          <Card className={stats.overdue > 0 ? 'border-red-200 bg-red-50/30' : ''}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <AlertTriangle className={`h-4 w-4 ${stats.overdue > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-600' : ''}`}>{stats.overdue}</p>
              <p className="text-xs text-gray-500">En Retard</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <Circle className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{stats.todo}</p>
              <p className="text-xs text-gray-500">À Faire</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <RefreshCw className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-xs text-gray-500">En Cours</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
              <p className="text-xs text-gray-500">Terminées</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <ArrowUpRight className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.highPriority}</p>
              <p className="text-xs text-gray-500">Priorité Haute</p>
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
                  placeholder="Rechercher une tâche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Assignee Filter */}
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Assigné à" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {assignees.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter Row */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500 mr-2">Type:</span>
                <Button
                  variant={typeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setTypeFilter('all')}
                >
                  Tous
                </Button>
                {taskTypes.map(type => (
                  <Button
                    key={type.value}
                    variant={typeFilter === type.value ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setTypeFilter(type.value)}
                  >
                    <type.icon className="h-3 w-3 mr-1" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Tâche</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Assigné à</TableHead>
                    <TableHead>Liée à</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.map((task) => (
                    <TableRow 
                      key={task.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        task.status === 'overdue' ? 'bg-red-50/30' :
                        task.status === 'completed' ? 'opacity-60' :
                        task.priority === 'high' ? 'border-l-4 border-l-red-400' : ''
                      }`}
                      onClick={() => {
                        setSelectedTask(task)
                        setShowDetailModal(true)
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={task.status === 'completed'}
                          onCheckedChange={() => toggleTaskComplete(task.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getTypeIcon(task.type)}
                          <span className="text-sm">{getTypeLabel(task.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>
                        <span className={`text-sm ${task.assignee === 'Non assigné' ? 'text-gray-400 italic' : ''}`}>
                          {task.assignee}
                        </span>
                      </TableCell>
                      <TableCell>
                        {task.relatedTo.name ? (
                          <Badge variant="outline" className="text-xs max-w-[120px] truncate block">
                            {task.relatedTo.name}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`h-3.5 w-3.5 ${
                            task.status === 'overdue' ? 'text-red-500' : 'text-gray-400'
                          }`} />
                          <span className={`text-sm ${
                            task.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-600'
                          }`}>
                            {formatRelativeDate(task.dueDate)}
                          </span>
                        </div>
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
                              setSelectedTask(task)
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
                              className="text-emerald-600"
                              onClick={() => toggleTaskComplete(task.id)}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              {task.status === 'completed' ? 'Rouvrir' : 'Marquer terminée'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {paginatedTasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <ListTodo className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">Aucune tâche trouvée</p>
                        <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres ou créez une nouvelle tâche</p>
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
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, sortedTasks.length)} sur {sortedTasks.length}
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

      {/* Task Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedTask && getTypeIcon(selectedTask.type)}
              <span className="truncate">{selectedTask?.title || 'Détails de la tâche'}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4 mt-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {getPriorityBadge(selectedTask.priority)}
                {getStatusBadge(selectedTask.status)}
                {selectedTask.reminder && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    Rappel actif
                  </Badge>
                )}
              </div>

              {/* Description */}
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600">{selectedTask.description}</p>
                </CardContent>
              </Card>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Assigné à:</span>
                    <span className="text-sm font-medium">{selectedTask.assignee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Échéance:</span>
                    <span className={`text-sm font-medium ${
                      selectedTask.status === 'overdue' ? 'text-red-600' : ''
                    }`}>
                      {formatDate(selectedTask.dueDate)} ({formatRelativeDate(selectedTask.dueDate)})
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Créée le:</span>
                    <span className="text-sm font-medium">{formatDate(selectedTask.createdAt)}</span>
                  </div>
                  {selectedTask.completedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-500">Terminée le:</span>
                      <span className="text-sm font-medium text-green-600">{formatDate(selectedTask.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Related To */}
              {selectedTask.relatedTo.name && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Liée à:</span>
                      <Badge variant="outline">{selectedTask.relatedTo.name}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button 
                  size="sm" 
                  variant={selectedTask.status === 'completed' ? 'outline' : 'default'}
                  className={selectedTask.status === 'completed' ? 'text-emerald-600' : ''}
                  onClick={() => {
                    toggleTaskComplete(selectedTask.id)
                    setSelectedTask({ ...selectedTask, status: selectedTask.status === 'completed' ? 'todo' : 'completed' })
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {selectedTask.status === 'completed' ? 'Rouvrir' : 'Marquer terminée'}
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button size="sm" variant="outline" className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Task Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nouvelle Tâche
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titre *</label>
              <Input placeholder="Titre de la tâche..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea placeholder="Description détaillée..." rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priorité</label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Échéance</label>
                <Input type="date" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assigné à</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="me">Moi</SelectItem>
                    {assignees.filter(a => a !== 'Non assigné' && a !== 'Équipe' && a !== 'Moi').map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Annuler
              </Button>
              <Button onClick={() => {
                alert('Tâche créée!')
                setShowAddModal(false)
              }}>
                Créer la tâche
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-white">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-green-600" />
              <span>AlgeriaTrade.dz - Gestion des Tâches</span>
            </div>
            
            <div className="flex items-center gap-6">
              <span>Taux complétion: {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
              <span>{stats.overdue} tâche(s) nécessitent attention</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
