'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowUpDown, Download, Upload, Settings, Info } from 'lucide-react'

// Types
interface SyncConfigurationProps {
  erpType?: string
  onSave: (config: any) => void
  initialData?: any
}

const ENTITY_TYPES = [
  { id: 'PRODUCTS', label: 'Produits', icon: '📦' },
  { id: 'INVENTORY', label: 'Stock / Inventaire', icon: '📊' },
  { id: 'ORDERS', label: 'Commandes', icon: '🛒' },
  { id: 'CUSTOMERS', label: 'Clients', icon: '👥' },
  { id: 'PRICES', label: 'Prix', icon: '💰' },
]

const DIRECTION_OPTIONS = [
  { value: 'PULL', label: 'Récupération uniquement', description: 'Importer les données depuis l\'ERP', icon: <Download className="h-4 w-4" /> },
  { value: 'PUSH', label: 'Envoi uniquement', description: 'Envoyer les données vers l\'ERP', icon: <Upload className="h-4 w-4" /> },
  { value: 'BIDIRECTIONAL', label: 'Bidirectionnel', description: 'Synchroniser dans les deux sens', icon: <ArrowUpDown className="h-4 w-4" /> },
]

const CONFLICT_RESOLUTIONS = [
  { value: 'ERP_WINS', label: 'L\'ERP gagne', description: 'Les données de l\'ERP sont prioritaires' },
  { value: 'PLATFORM_WINS', label: 'La plateforme gagne', description: 'Les données locales sont prioritaires' },
  { value: 'LATEST_WINS', label: 'Le plus récent gagne', description: 'Basé sur la date de modification' },
  { value: 'MANUAL', label: 'Révision manuelle', description: 'Conflicts signalés pour résolution manuelle' },
]

export default function SyncConfiguration({ erpType, onSave, initialData }: SyncConfigurationProps) {
  const [config, setConfig] = useState({
    frequency: initialData?.frequency || 'DAILY',
    direction: initialData?.direction || 'BIDIRECTIONAL',
    entityTypes: initialData?.entityTypes || ['PRODUCTS', 'INVENTORY'],
    conflictResolution: initialData?.conflictResolution || 'ERP_WINS',
    enableDeltaSync: initialData?.enableDeltaSync ?? true,
    syncTime: initialData?.syncTime || '00:00',
    autoRetry: initialData?.autoRetry ?? true,
    ...initialData,
  })

  const handleSave = () => {
    onSave(config)
  }

  const toggleEntityType = (entityType: string) => {
    setConfig(prev => ({
      ...prev,
      entityTypes: prev.entityTypes.includes(entityType)
        ? prev.entityTypes.filter(t => t !== entityType)
        : [...prev.entityTypes, entityType],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Sync Direction */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Direction de synchronisation</CardTitle>
          <CardDescription>Comment les données doivent circuler entre la plateforme et l'ERP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DIRECTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, direction: option.value }))}
                className={`p-4 rounded-lg border text-left transition-all ${
                  config.direction === option.value
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 text-blue-600">
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className="text-xs text-gray-500">{option.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entity Types */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Entités à synchroniser</CardTitle>
          <CardDescription>Sélectionnez les types de données à synchroniser</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {ENTITY_TYPES.map((entity) => (
              <button
                key={entity.id}
                type="button"
                onClick={() => toggleEntityType(entity.id)}
                className={`p-3 rounded-lg border text-center transition-all ${
                  config.entityTypes.includes(entity.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl mb-1 block">{entity.icon}</span>
                <span className="text-sm font-medium">{entity.label}</span>
                {config.entityTypes.includes(entity.id) && (
                  <Badge variant="default" className="mt-1 text-xs">Actif</Badge>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule & Frequency */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Planification
          </CardTitle>
          <CardDescription>Quand et à quelle fréquence synchroniser</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fréquence de synchronisation</Label>
              <Select 
                value={config.frequency} 
                onValueChange={(v) => setConfig(prev => ({ ...prev, frequency: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REALTIME">Temps réel (toutes les 5 min)</SelectItem>
                  <SelectItem value="EVERY_15_MIN">Toutes les 15 minutes</SelectItem>
                  <SelectItem value="EVERY_30_MIN">Toutes les 30 minutes</SelectItem>
                  <SelectItem value="HOURLY">Chaque heure</SelectItem>
                  <SelectItem value="DAILY">Quotidien</SelectItem>
                  <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                  <SelectItem value="MANUEL">Manuel uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(config.frequency === 'DAILY' || config.frequency === 'WEEKLY') && (
              <div className="space-y-2">
                <Label>Heure de synchronisation</Label>
                <Input
                  type="time"
                  value={config.syncTime}
                  onChange={(e) => setConfig(prev => ({ ...prev, syncTime: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label>Sync delta (incrémentale)</Label>
              <p className="text-xs text-gray-500">Ne synchroniser que les modifications depuis la dernière sync</p>
            </div>
            <Switch
              checked={config.enableDeltaSync}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableDeltaSync: checked }))}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label>Réessai automatique en cas d'échec</Label>
              <p className="text-xs text-gray-500">Réessayer automatiquement si une synchronisation échoue</p>
            </div>
            <Switch
              checked={config.autoRetry}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoRetry: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Conflict Resolution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Résolution des conflits
          </CardTitle>
          <Description>Que faire lorsque les données diffèrent entre la plateforme et l'ERP</Description>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {CONFLICT_RESOLUTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, conflictResolution: option.value }))}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  config.conflictResolution === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                La résolution "Manuelle" créera des alertes pour chaque conflit détecté, 
                vous permettant de choisir quelle version conserver.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full">
        Sauvegarder la configuration
      </Button>
    </div>
  )
}

// Helper component for Description
function Description({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}
