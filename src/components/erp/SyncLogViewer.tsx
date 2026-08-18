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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
} from 'lucide-react'

// Types
interface SyncLogEntry {
  id: string
  erpConfigId: string
  entityType: string
  direction: 'PUSH' | 'PULL'
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'PENDING' | 'SKIPPED'
  recordsProcessed: number
  recordsSuccess: number
  recordsFailed: number
  errors: Array<{
    recordId?: string
    message: string
    code?: string
  }>
  startedAt: Date
  completedAt?: Date
  durationMs?: number
}

interface SyncLogViewerProps {
  erpConfigId: string
  limit?: number
}

// Sample data
const sampleLogs: SyncLogEntry[] = [
  {
    id: '1',
    erpConfigId: 'config1',
    entityType: 'PRODUCTS',
    direction: 'PULL',
    status: 'SUCCESS',
    recordsProcessed: 245,
    recordsSuccess: 245,
    recordsFailed: 0,
    errors: [],
    startedAt: new Date(Date.now() - 30 * 60 * 1000),
    completedAt: new Date(Date.now() - 28 * 60 * 1000),
    durationMs: 120000,
  },
  {
    id: '2',
    erpConfigId: 'config1',
    entityType: 'INVENTORY',
    direction: 'BIDIRECTIONAL',
    status: 'SUCCESS',
    recordsProcessed: 89,
    recordsSuccess: 87,
    recordsFailed: 2,
    errors: [
      { recordId: 'PROD_123', message: 'Product not found in ERP', code: 'NOT_FOUND' },
      { recordId: 'PROD_456', message: 'Invalid quantity value', code: 'VALIDATION_ERROR' },
    ],
    startedAt: new Date(Date.now() - 15 * 60 * 1000),
    completedAt: new Date(Date.now() - 14 * 60 * 1000),
    durationMs: 60000,
  },
  {
    id: '3',
    erpConfigId: 'config1',
    entityType: 'ORDERS',
    direction: 'PULL',
    status: 'FAILED',
    recordsProcessed: 0,
    recordsSuccess: 0,
    recordsFailed: 0,
    errors: [{ message: 'Connection timeout to SAP server', code: 'TIMEOUT' }],
    startedAt: new Date(Date.now() - 60 * 60 * 1000),
    durationMs: 30000,
  },
  {
    id: '4',
    erpConfigId: 'config1',
    entityType: 'CUSTOMERS',
    direction: 'PULL',
    status: 'PARTIAL',
    recordsProcessed: 50,
    recordsSuccess: 48,
    recordsFailed: 2,
    errors: [
      { message: '2 records failed validation' },
    ],
    startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 5.9 * 60 * 60 * 1000),
    durationMs: 360000,
  },
]

export default function SyncLogViewer({ erpConfigId, limit = 20 }: SyncLogViewerProps) {
  const [logs, setLogs] = useState<SyncLogEntry[]>(sampleLogs.slice(0, limit))
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterEntity, setFilterEntity] = useState<string>('all')
  const [filterDirection, setFilterDirection] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<SyncLogEntry | null>(null)

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filterStatus !== 'all' && log.status !== filterStatus) return false
    if (filterEntity !== 'all' && log.entityType !== filterEntity) return false
    if (filterDirection !== 'all' && log.direction !== filterDirection) return false
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        log.entityType.toLowerCase().includes(query) ||
        log.errors.some(e => e.message.toLowerCase().includes(query)) ||
        log.id.includes(query)
      )
    }
    
    return true
  })

  // Stats
  const totalLogs = filteredLogs.length
  const successCount = filteredLogs.filter(l => l.status === 'SUCCESS').length
  const failedCount = filteredLogs.filter(l => l.status === 'FAILED').length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'PARTIAL':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'SKIPPED':
        return <XCircle className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">Succès</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Échec</Badge>
      case 'PARTIAL':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">Partiel</Badge>
      case 'PENDING':
        return <Badge variant="outline" className="border-blue-300 text-blue-600">En cours</Badge>
      case 'SKIPPED':
        return <Badge variant="secondary">Ignoré</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getDirectionBadge = (direction: string) => {
    switch (direction) {
      case 'PULL':
        return <Badge variant="outline" className="gap-1"><span>↓</span> Récupération</Badge>
      case 'PUSH':
        return <Badge variant="outline" className="gap-1"><span>↑</span> Envoi</Badge>
      case 'BIDIRECTIONAL':
        return <Badge variant="outline" className="gap-1"><span>↔</span> Bidirectionnel</Badge>
      default:
        return <Badge variant="secondary">{direction}</Badge>
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}min`
    
    return `${(ms / 3600000).toFixed(1)}h`
  }

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleRetry = async (logId: string) => {
    console.log('Retrying sync for:', logId)
    // In production, would call API to retry sync
  }

  const handleExportLogs = () => {
    const headers = ['ID', 'Entité', 'Direction', 'Statut', 'Traités', 'Réussis', 'Échecs', 'Durée', 'Date']
    const rows = filteredLogs.map(log => [
      log.id,
      log.entityType,
      log.direction,
      log.status,
      log.recordsProcessed.toString(),
      log.recordsSuccess.toString(),
      log.recordsFailed.toString(),
      formatDuration(log.durationMs),
      formatDateTime(log.startedAt),
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sync-history-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Historique de synchronisation</h3>
          <p className="text-sm text-gray-500">
            Consultez les logs des opérations de synchronisation récentes
          </p>
        </div>

        <Button variant="outline" onClick={handleExportLogs}>
          <Download className="mr-2 h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold">{totalLogs}</p>
            <p className="text-xs text-gray-500">Total opérations</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold text-green-600">{successCount}</p>
            <p className="text-xs text-gray-500">Réussies</p>
          </CardContent>
        </Card>

        <Card className={failedCount > 0 ? 'border-red-300 bg-red-50/30' : ''}>
          <CardContent className="pt-4 pb-3">
            <p className={`text-xl font-bold ${failedCount > 0 ? 'text-red-600' : ''}`}>{failedCount}</p>
            <p className="text-xs text-gray-500">Échouées</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold">
              {totalLogs > 0 ? Math.round((successCount / totalLogs) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-500">Taux de réussite</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher dans les logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="SUCCESS">Succès</SelectItem>
            <SelectItem value="FAILED">Échec</SelectItem>
            <SelectItem value="PARTIAL">Partiel</SelectItem>
            <SelectItem value="PENDING">En cours</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Entité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes entités</SelectItem>
            <SelectItem value="PRODUCTS">Produits</SelectItem>
            <SelectItem value="INVENTORY">Stock</SelectItem>
            <SelectItem value="ORDERS">Commandes</SelectItem>
            <SelectItem value="CUSTOMERS">Clients</SelectItem>
            <SelectItem value="PRICES">Prix</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterDirection} onValueChange={setFilterDirection}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes directions</SelectItem>
            <SelectItem value="PULL">Récupération</SelectItem>
            <SelectItem value="PUSH">Envoi</SelectItem>
            <SelectItem value="BIDIRECTIONAL">Bidirectionnel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Enregistrements</TableHead>
                  <TableHead className="text-right">Durée</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow 
                    key={log.id}
                    className={`cursor-pointer ${log.status === 'FAILED' ? 'bg-red-50/30' : ''}`}
                    onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm">{formatDateTime(log.startedAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.entityType}</Badge>
                    </TableCell>
                    <TableCell>{getDirectionBadge(log.direction)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm">
                        <span>{log.recordsProcessed}</span>
                        {log.recordsFailed > 0 && (
                          <span className="text-red-500 ml-1">(-{log.recordsFailed})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-500">
                      {formatDuration(log.durationMs)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="sr-only">Actions</span>
                            ⋮
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => console.log('View details', log.id)}>
                            <Eye className="mr-2 h-4 w-4" /> Voir détails
                          </DropdownMenuItem>
                          {log.status === 'FAILED' && (
                            <DropdownMenuItem onClick={() => handleRetry(log.id)}>
                              <RotateCcw className="mr-2 h-4 w-4" /> Réessayer
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => console.log('Download report')}>
                            <Download className="mr-2 h-4 w-4" /> Télécharger rapport
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <RefreshCw className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Aucun log de synchronisation</h3>
              <p className="text-sm text-gray-500">
                {searchQuery || filterStatus !== 'all' || filterEntity !== 'all'
                  ? 'Aucun résultat pour ces filtres'
                  : 'Les logs de synchronisation apparaîtront ici'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Log Details */}
      {selectedLog && (
        <Card className="border-blue-300 bg-blue-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {getStatusIcon(selectedLog.status)}
                Détails de la synchronisation
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Fermer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500">ID</p>
                <p className="font-mono text-sm">{selectedLog.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Entité</p>
                <p className="font-medium">{selectedLog.entityType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Direction</p>
                {getDirectionBadge(selectedLog.direction)}
              </div>
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                {getStatusBadge(selectedLog.status)}
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progression</span>
                <span>{selectedLog.recordsSuccess}/{selectedLog.recordsProcessed} réussis</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    selectedLog.status === 'SUCCESS' ? 'bg-green-500' :
                    selectedLog.status === 'FAILED' ? 'bg-red-500' :
                    selectedLog.status === 'PARTIAL' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${selectedLog.recordsProcessed > 0 ? (selectedLog.recordsSuccess / selectedLog.recordsProcessed) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Errors if any */}
            {selectedLog.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-700 mb-2">
                  Erreurs ({selectedLog.errors.length})
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedLog.errors.map((error, idx) => (
                    <div key={idx} className="p-3 bg-red-50 rounded border border-red-200 text-sm">
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-red-600">{error.code || 'ERROR'}</span>
                        {error.recordId && (
                          <span className="text-xs text-gray-500">ID: {error.recordId}</span>
                        )}
                      </div>
                      <p className="mt-1 text-red-800">{error.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timing info */}
            <div className="flex items-center gap-6 text-sm text-gray-500 pt-4 border-t">
              <div>
                <span>Début:</span>
                <strong className="ml-1 text-gray-700">{formatDateTime(selectedLog.startedAt)}</strong>
              </div>
              {selectedLog.completedAt && (
                <div>
                  <span>Fin:</span>
                  <strong className="ml-1 text-gray-700">{formatDateTime(selectedLog.completedAt)}</strong>
                </div>
              )}
              <div>
                <span>Durée:</span>
                <strong className="ml-1 text-gray-700">{formatDuration(selectedLog.durationMs)}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {filteredLogs.length > limit && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} sur {Math.ceil(filteredLogs.length / limit)}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            disabled={page >= Math.ceil(filteredLogs.length / limit)}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
