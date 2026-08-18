'use client'

import React, { useState, useEffect } from 'react'
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
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Phone,
  Mail,
  MessageSquare,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'

// Types
interface TaskData {
  id: string
  leadId?: string
  contactId?: string
  companyId: string
  title: string
  description: string
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'FOLLOW_UP' | 'PROPOSAL' | 'DEMO' | 'REMINDER' | 'OTHER'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DEFERRED'
  dueDate: Date
  dueTime?: string
  completedAt?: Date
  assignedTo: string
  createdBy: string
  resultNotes?: string
  outcome?: string
  createdAt: Date
  leadName?: string
  contactName?: string
}

interface TaskListProps {
  userId?: string
  showFilters?: boolean
}

// Sample data
const sampleTasks: TaskData[] = [
  {
    id: '1',
    leadId: 'lead1',
    title: 'Appeler SARL Technologie Algerienne',
    description: 'Suivi après envoi de la proposition commerciale',
    type: 'CALL',
    priority: 'HIGH',
    status: 'TODO',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    dueTime: '10:00',
    assignedTo: 'user1',
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    leadName: 'SARL Technologie Algerienne',
  },
  {
    id: '2',
    contactId: 'contact1',
    title: 'Envoyer email de suivi à Ahmed Benali',
    description: 'Envoyer les informations complémentaires demandées',
    type: 'EMAIL',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    dueDate: new Date(),
    assignedTo: 'user1',
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    contactName: 'Ahmed Benali',
  },
  {
    id: '3',
    leadId: 'lead2',
    title: 'Réunion de négociation - EURL Industrie Moderne',
    description: 'Discuter des conditions finales du contrat',
    type: 'MEETING',
    priority: 'URGENT',
    status: 'TODO',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    dueTime: '14:00',
    assignedTo: 'user1',
    createdBy: 'user2',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    leadName: 'EURL Industrie Moderne',
  },
  {
    id: '4',
    title: 'Préparer proposition pour SPA Distribution Plus',
    type: 'PROPOSAL',
    priority: 'HIGH',
    status: 'TODO',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    assignedTo: 'user2',
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    leadName: 'SPA Distribution Plus',
  },
  {
    id: '5',
    leadId: 'lead3',
    title: 'Suivi post-vente - Sarl Agro Solutions',
    description: 'Vérifier satisfaction client et opportunités futures',
    type: 'FOLLOW_UP',
    priority: 'LOW',
    status: 'COMPLETED',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    assignedTo: 'user1',
    createdBy: 'system',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    leadName: 'Sarl Agro Solutions',
    outcome: 'Client satisfait, intérêt pour nouveau projet',
  },
]

export default function TaskList({ userId, showFilters = true }: TaskListProps) {
  const [tasks, setTasks] = useState<TaskData[]>(sampleTasks)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        (task.leadName && task.leadName.toLowerCase().includes(query)) ||
        (task.contactName && task.contactName.toLowerCase().includes(query))
      )
    }
    
    return true
  })

  // Sort tasks: overdue first, then by due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed and cancelled go to bottom
    if (a.status === 'COMPLETED' || a.status === 'CANCELLED') return 1
    if (b.status === 'COMPLETED' || b.status === 'CANCELLED') return -1
    
    // Overdue tasks first
    const aOverdue = new Date(a.dueDate) < new Date() && a.status !== 'COMPLETED'
    const bOverdue = new Date(b.dueDate) < new Date() && b.status !== 'COMPLETED'
    
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    
    // Then by due date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  // Stats
  const totalTasks = tasks.length
  const todoTasks = tasks.filter(t => t.status === 'TODO').length
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const completedToday = tasks.filter(t => 
    t.status === 'COMPLETED' && 
    t.completedAt && 
    new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length
  const overdueTasks = tasks.filter(t => 
    new Date(t.dueDate) < new Date() && 
    !['COMPLETED', 'CANCELLED'].includes(t.status)
  ).length

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CALL': return <Phone className="h-4 w-4" />
      case 'EMAIL': return <Mail className="h-4 w-4" />
      case 'MEETING': return <Calendar className="h-4 w-4" />
      case 'FOLLOW_UP': return <RefreshCw className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CALL': return 'Appel'
      case 'EMAIL': return 'Email'
      case 'MEETING': return 'Réunion'
      case 'FOLLOW_UP': return 'Suivi'
      case 'PROPOSAL': return 'Proposition'
      case 'DEMO': return 'Démo'
      case 'REMINDER': return 'Rappel'
      default: return 'Autre'
    }
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-300', dotColor: 'bg-red-500' }
      case 'HIGH':
        return { label: 'Haute', color: 'bg-orange-100 text-orange-700 border-orange-300', dotColor: 'bg-orange-500' }
      case 'MEDIUM':
        return { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', dotColor: 'bg-yellow-500' }
      case 'LOW':
        return { label: 'Basse', color: 'bg-gray-100 text-gray-700 border-gray-300', dotColor: 'bg-gray-400' }
      default:
        return { label: priority, color: '', dotColor: '' }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'TODO':
        return { label: 'À faire', variant: 'outline' as const, icon: <Clock className="h-3 w-3" /> }
      case 'IN_PROGRESS':
        return { label: 'En cours', variant: 'default' as const, icon: <RefreshCw className="h-3 w-3 animate-spin" /> }
      case 'COMPLETED':
        return { label: 'Terminée', variant: 'secondary' as const, icon: <CheckCircle2 className="h-3 w-3" /> }
      case 'CANCELLED':
        return { label: 'Annulée', variant: 'destructive' as const, icon: null }
      case 'DEFERRED':
        return { label: 'Reportée', variant: 'outline' as const, icon: null }
      default:
        return { label: status, variant: 'outline' as const, icon: null }
    }
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (d.toDateString() === tomorrow.toDateString()) return 'Demain'
    
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const isOverdue = (date: Date, status: string) => {
    return new Date(date) < new Date() && !['COMPLETED', 'CANCELLED'].includes(status)
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, status: 'COMPLETED' as const, completedAt: new Date() }
          : task
      ))
      
      // In production, call API
      console.log('Completing task:', taskId)
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Tâches</h2>
          <p className="text-sm text-gray-500">Gérez vos activités et suivis</p>
        </div>
        
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nouvelle tâche
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold">{totalTasks}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold text-blue-600">{todoTasks}</p>
            <p className="text-xs text-gray-500">À faire</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold text-orange-600">{inProgressTasks}</p>
            <p className="text-xs text-gray-500">En cours</p>
          </CardContent>
        </Card>
        
        <Card className={overdueTasks > 0 ? 'border-red-300 bg-red-50/30' : ''}>
          <CardContent className="pt-4 pb-3">
            <p className={`text-xl font-bold ${overdueTasks > 0 ? 'text-red-600' : ''}`}>{overdueTasks}</p>
            <p className="text-xs text-gray-500">En retard</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold text-green-600">{completedToday}</p>
            <p className="text-xs text-gray-500">Terminées aujourd&apos;hui</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une tâche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="TODO">À faire</SelectItem>
              <SelectItem value="IN_PROGRESS">En cours</SelectItem>
              <SelectItem value="COMPLETED">Terminées</SelectItem>
              <SelectItem value="CANCELLED">Annulées</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">Haute</SelectItem>
              <SelectItem value="MEDIUM">Moyenne</SelectItem>
              <SelectItem value="LOW">Basse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Task List */}
      <Card>
        <CardContent className="p-0">
          {sortedTasks.length > 0 ? (
            <div className="divide-y">
              {sortedTasks.map((task) => {
                const priorityConfig = getPriorityConfig(task.priority)
                const statusConfig = getStatusConfig(task.status)
                const overdue = isOverdue(task.dueDate, task.status)
                
                return (
                  <div
                    key={task.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      overdue ? 'bg-red-50/50' : ''
                    } ${task.status === 'COMPLETED' ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox for completion */}
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={task.status === 'COMPLETED'}
                        className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          task.status === 'COMPLETED'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {task.status === 'COMPLETED' && (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                      </button>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''}`}>
                              {task.title}
                            </h3>
                            
                            {task.description && (
                              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
                            )}

                            {/* Related entity */}
                            {(task.leadName || task.contactName) && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <User className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-blue-600 cursor-pointer hover:underline">
                                  {task.leadName || task.contactName}
                                </span>
                                <ChevronRight className="h-3 w-3 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Modifier</DropdownMenuItem>
                              <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {task.status !== 'COMPLETED' && (
                                <DropdownMenuItem onClick={() => handleCompleteTask(task.id)}>
                                  Marquer comme terminée
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {/* Type */}
                          <Badge variant="outline" className="gap-1 text-xs">
                            {getTypeIcon(task.type)}
                            {getTypeLabel(task.type)}
                          </Badge>

                          {/* Priority */}
                          <Badge variant="outline" className={`gap-1 text-xs ${priorityConfig.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dotColor}`} />
                            {priorityConfig.label}
                          </Badge>

                          {/* Status */}
                          <Badge variant={statusConfig.variant} className="gap-1 text-xs">
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>

                          {/* Due date */}
                          <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            <Clock className="h-3 w-3" />
                            {overdue && <AlertTriangle className="h-3 w-3" />}
                            {formatDate(task.dueDate)}
                            {task.dueTime && ` à ${task.dueTime}`}
                          </span>
                        </div>

                        {/* Outcome if completed */}
                        {task.outcome && (
                          <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                            <CheckCircle2 className="inline h-4 w-4 mr-1" />
                            {task.outcome}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Aucune tâche trouvée</h3>
              <p className="text-sm text-gray-500">
                {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Commencez par créer une nouvelle tâche'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
