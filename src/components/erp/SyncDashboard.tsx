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
import SyncLogViewer from './SyncLogViewer'
import {
  RefreshCw,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  Database,
  Download,
  Upload,
  Settings,
} from 'lucide-react'

// Types
interface SyncDashboardProps {
  erpConfigId: string
}

interface SyncStatus {
  entityType: string
  lastSync?: Date
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'NEVER'
  recordsCount?: number
  direction: string
}

// Sample data
const sampleSyncStatuses: SyncStatus[] = [
  { entityType: 'PRODUCTS', lastSync: new Date(Date.now() - 30 * 60 * 1000), status: 'SUCCESS', recordsCount: 245, direction: 'PULL' },
  { entityType: 'INVENTORY', lastSync: new Date(Date.now() - 15 * 60 * 1000), status: 'SUCCESS', recordsCount: 89, direction: 'BIDIRECTIONAL' },
  { entityType: 'ORDERS', lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000), status: 'SUCCESS', recordsCount: 12, direction: 'PULL' },
  { entityType: 'CUSTOMERS', lastSync: new Date(Date.now() - 6 * 60 * 60 * 1000), status: 'FAILED', recordsCount: 0, direction: 'PULL' },
  { entityTtype: 'PRICES', status: 'NEVER', direction: 'BIDIRECTIONAL' } as any,
]

export default function SyncDashboard({ erpConfigId }: SyncDashboardProps) {
  const [syncStatuses] = useState<SyncStatus[]>(sampleSyncStatuses)
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)

  const handleSyncAll = async () => {
    setIsSyncing(true)
    
    try {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 3000))
      console.log('Sync completed for all entities')
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSyncEntity = async (entityType: string) => {
    setSelectedEntity(entityType)
    
    try {
      // Simulate sync for specific entity
      console.log(`Syncing ${entityType}`)
    } catch (error) {
      console.error(`Failed to sync ${entityType}:`, error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'PENDING':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">Succès</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Échec</Badge>
      case 'PENDING':
        return <Badge variant="outline" className="border-blue-300 text-blue-600">En cours</Badge>
      default:
        return <Badge variant="secondary">Jamais synchronisé</Badge>
    }
  }

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'PULL':
        return <Download className="h-4 w-4" />
      case 'PUSH':
        return <Upload className="h-4 w-4" />
      case 'BIDIRECTIONAL':
        return <ArrowUpDown className="h-4 w-4" />
      default:
        return null
    }
  }

  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'PULL': return 'Récupération'
      case 'PUSH': return 'Envoi'
      case 'BIDIRECTIONAL': return 'Bidirectionnel'
      default: return direction
    }
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    return `Il y a ${diffDays}j`
  }

  // Calculate overall stats
  const totalEntities = syncStatuses.length
  const successCount = syncStatuses.filter(s => s.status === 'SUCCESS').length
  const failedCount = syncStatuses.filter(s => s.status === 'FAILED').length

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Synchronisation des données</h3>
          <p className="text-sm text-gray-500">Gérez la synchronisation entre la plateforme et l&apos;ERP</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-sync toggle */}
          <Button
            variant={autoSyncEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
          >
            {autoSyncEnabled ? (
              <>
                <Pause className="mr-2 h-4 w-4" /> Auto-sync ON
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Auto-sync OFF
              </>
            )}
          </Button>

          <Button 
            onClick={handleSyncAll}
            disabled={isSyncing}
            size="sm"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Synchronisation...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> Tout synchroniser
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalEntities}</p>
                <p className="text-xs text-gray-500">Entités configurées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{successCount}</p>
              <p className="text-xs text-gray-500">Synchronisées avec succès</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={failedCount > 0 ? 'border-red-300 bg-red-50/30' : ''}>
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-8 w-8 ${failedCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            <div>
              <p className="text-2xl font-bold">{failedCount}</p>
              <p className="text-xs text-gray-500">En erreur</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Entity Sync Status */}
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Statut de synchronisation par entité</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {syncStatuses.map((sync) => (
            <div key={sync.entityType} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={selectedEntity === sync.entityType ? 'bg-blue-50 p-2 rounded-lg' : ''}>
                    {getStatusIcon(sync.status)}
                  </div>

                  {/* Entity Info */}
                  <div>
                    <h4 className="font-medium">{sync.entityType}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      {getDirectionIcon(sync.direction)}
                      <span>{getDirectionLabel(sync.direction)}</span>
                      
                      {sync.recordsCount !== undefined && (
                        <span>• {sync.recordsCount} enregistrements</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-3">
                  {/* Last sync time */}
                  {sync.lastSync && (
                    <span className="text-sm text-gray-500 hidden sm:inline">
                      {formatRelativeTime(sync.lastSync)}
                    </span>
                  )}

                  {/* Status Badge */}
                  {getStatusBadge(sync.status)}

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncEntity(sync.entityType)}
                    disabled={isSyncing && selectedEntity === sync.entityType}
                  >
                    {isSyncing && selectedEntity === sync.entityType ? (
                      <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-1 h-4 w-4" />
                    )}
                    Synchro.
                  </Button>

                  {/* Settings */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Recent Sync Logs */}
    <SyncLogViewer erpConfigId={erpConfigId} limit={10} />

    {/* Schedule Configuration */}
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Configuration de synchronisation automatique</span>
          <Button variant="outline" size="sm">
            Modifier
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Fréquence de synchronisation
            </label>
            <Select defaultValue="hourly">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Temps réel (toutes les 5 min)</SelectItem>
                <SelectItem value="hourly">Chaque heure</SelectItem>
                <SelectItem value="daily">Quotidien à minuit</SelectItem>
                <SelectItem value="manual">Manuel uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              En cas de conflit de données
            </label>
            <Select defaultValue="erp_wins">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="erp_wins">L&apos;ERP gagne (données ERP prioritaires)</SelectItem>
                <SelectItem value="platform_wins">La plateforme gagne</SelectItem>
                <SelectItem value="latest_wins">Le plus récent gagne</SelectItem>
                <SelectItem value="manual">Révision manuelle requise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> La synchronisation automatique est actuellement activée. 
            Les données seront synchronisées selon la fréquence configurée pour toutes 
            les entités avec une direction de同步 définie.
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
