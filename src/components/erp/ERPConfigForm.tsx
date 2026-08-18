'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Server,
  Database,
  Key,
  Shield,
  Globe,
  Info,
} from 'lucide-react'

// Types
interface ERPConfigFormData {
  name: string
  type: 'SAP' | 'ODOO' | 'DYNAMICS' | 'CUSTOM'
  endpoint: string
  authType: 'API_KEY' | 'BASIC' | 'OAUTH2' | 'CERTIFICATE'
  apiKey?: string
  username?: string
  password?: string
  database?: string  // For Odoo
  clientId?: string   // For OAuth2
  clientSecret?: string
  enabled: boolean
  defaultSyncFreq: 'REALTIME' | 'EVERY_5_MIN' | 'HOURLY' | 'DAILY' | 'MANUAL'
}

interface ERPConfigFormProps {
  config?: any
  isEditing?: boolean
  onSubmit?: (data: ERPConfigFormData) => void
  onCancel?: () => void
}

const erpTypeOptions = [
  { value: 'SAP', label: 'SAP S/4HANA / Business One', description: 'Enterprise resource planning for large organizations' },
  { value: 'ODOO', label: 'Odoo (Community/Enterprise)', description: 'Open-source ERP solution for SMBs' },
  { value: 'DYNAMICS', label: 'Microsoft Dynamics 365', description: 'Microsoft cloud-based business applications' },
  { value: 'CUSTOM', label: 'Custom ERP Integration', description: 'Custom integration via REST API or webhook' },
]

const authTypeOptions = [
  { value: 'API_KEY', label: 'API Key', description: 'Simple key-based authentication' },
  { value: 'BASIC', label: 'Basic Auth', description: 'Username and password authentication' },
  { value: 'OAUTH2', label: 'OAuth 2.0', description: 'Secure token-based authentication' },
  { value: 'CERTIFICATE', label: 'Client Certificate', description: 'X.509 certificate authentication' },
]

const syncFreqOptions = [
  { value: 'REALTIME', label: 'Temps réel (5 min)' },
  { value: 'EVERY_5_MIN', label: 'Toutes les 5 minutes' },
  { value: 'HOURLY', label: 'Chaque heure' },
  { value: 'DAILY', label: 'Quotidien' },
  { value: 'MANUAL', label: 'Manuel uniquement' },
]

export default function ERPConfigForm({ 
  config, 
  isEditing = false, 
  onSubmit,
  onCancel 
}: ERPConfigFormProps) {
  const [formData, setFormData] = useState<ERPConfigFormData>({
    name: config?.name || '',
    type: config?.type || 'ODOO',
    endpoint: config?.endpoint || '',
    authType: config?.authType || 'API_KEY',
    apiKey: '',
    username: '',
    password: '',
    database: config?.database || '',
    clientId: '',
    clientSecret: '',
    enabled: config?.enabled ?? true,
    defaultSyncFreq: config?.defaultSyncFreq || 'DAILY',
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
  }

  const updateField = (field: keyof ERPConfigFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nom de la configuration *</Label>
          <Input
            id="name"
            placeholder="ex: Odoo Production, SAP Test"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
          />
        </div>

        {/* ERP Type */}
        <div className="space-y-2">
          <Label>Type d&apos;ERP *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(v) => updateField('type', v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {erpTypeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-gray-500">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Endpoint URL */}
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="endpoint">URL de l&apos;endpoint *</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="endpoint"
              className="pl-10"
              placeholder={
                formData.type === 'SAP' ? 'https://sap.example.com:44300' :
                formData.type === 'ODOO' ? 'https://odoo.example.com' :
                formData.type === 'DYNAMICS' ? 'https://example.crm.dynamics.com' :
                'https://erp.example.com/api'
              }
              value={formData.endpoint}
              onChange={(e) => updateField('endpoint', e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Authentication */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentification
          </CardTitle>
          <CardDescription>
            Configurez comment la plateforme s&apos;authentifie auprès de l&apos;ERP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auth Type */}
          <div className="space-y-2">
            <Label>Méthode d&apos;authentification</Label>
            <Select 
              value={formData.authType} 
              onValueChange={(v) => updateField('authType', v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {authTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key Auth */}
          {(formData.authType === 'API_KEY') && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">Clé API *</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="apiKey"
                  className="pl-10"
                  type="password"
                  placeholder="Entrez votre clé API"
                  value={formData.apiKey}
                  onChange={(e) => updateField('apiKey', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Basic Auth */}
          {(formData.authType === 'BASIC') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d&apos;utilisateur *</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={formData.username}
                  onChange={(e) => updateField('username', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* OAuth2 */}
          {(formData.authType === 'OAUTH2') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID *</Label>
                <Input
                  id="clientId"
                  placeholder="Votre OAuth2 Client ID"
                  value={formData.clientId}
                  onChange={(e) => updateField('clientId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret *</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  placeholder="Votre OAuth2 Client Secret"
                  value={formData.clientSecret}
                  onChange={(e) => updateField('clientSecret', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Odoo-specific: Database */}
          {formData.type === 'ODOO' && (
            <div className="space-y-2">
              <Label htmlFor="database">Base de données Odoo</Label>
              <Input
                id="database"
                placeholder="Nom de la base de données Odoo"
                value={formData.database}
                onChange={(e) => updateField('database', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Requis pour l&apos;authentification XML-RPC. Optionnel pour l&apos;API REST.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-5 w-5" />
            Paramètres de synchronisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Activer cette intégration</Label>
              <p className="text-sm text-gray-500">
                Désactiver pour suspendre toutes les synchronisations
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => updateField('enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Fréquence de synchronisation par défaut</Label>
            <Select 
              value={formData.defaultSyncFreq} 
              onValueChange={(v) => updateField('defaultSyncFreq', v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {syncFreqOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options Toggle */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full"
      >
        <Settings className="mr-2 h-4 w-4" />
        Options avancées
      </Button>

      {showAdvanced && (
        <Card className="bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configuration avancée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Options avancées disponibles:</p>
                  <ul className="list-disc list-inside space-y-1 opacity-90">
                    <li>Configuration des webhooks (push depuis l&apos;ERP)</li>
                    <li>Mappages de champs personnalisés par entité</li>
                    <li>Règles de transformation de données</li>
                    <li>Configuration du proxy pour les environnements restreints</li>
                    <li>Timeouts et retry policies personnalisés</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 text-center py-4">
              Les options avancées sont configurables depuis la page de détail de l&apos;intégration.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit">
          {isEditing ? 'Enregistrer les modifications' : 'Créer l\'intégration'}
        </Button>
      </div>
    </form>
  )
}

// Helper component for the settings icon
function Settings({ className }: { className?: string }) {
  // Using a simple SVG for settings icon
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  )
}
