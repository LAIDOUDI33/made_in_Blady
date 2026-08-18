'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Globe, Key, Shield, Eye, EyeOff, Database } from 'lucide-react'

// Types
interface ConnectionFormProps {
  erpType: string
  onSave: (config: any) => void
  initialData?: any
}

const PLACEHOLDERS: Record<string, { endpoint: string; database?: string }> = {
  SAP: {
    endpoint: 'https://sap-server.example.com:44300',
  },
  Odoo: {
    endpoint: 'https://odoo.example.com',
    database: 'production',
  },
  MicrosoftDynamics: {
    endpoint: 'https://org.crm.dynamics.com',
  },
  Custom: {
    endpoint: 'https://erp-api.example.com',
  },
}

export default function ConnectionForm({ erpType, onSave, initialData }: ConnectionFormProps) {
  const [formData, setFormData] = useState({
    endpoint: initialData?.endpoint || '',
    authType: initialData?.authType || 'API_KEY',
    apiKey: '',
    username: '',
    password: '',
    database: initialData?.database || '',
    clientId: '',
    clientSecret: '',
    useSSL: true,
    timeout: '30',
    ...initialData,
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Endpoint URL */}
      <div className="space-y-2">
        <Label htmlFor="endpoint" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          URL de l'endpoint *
        </Label>
        <div className="relative">
          <Input
            id="endpoint"
            placeholder={PLACEHOLDERS[erpType as keyof typeof PLACEHOLDERS]?.endpoint || 'https://erp.example.com'}
            value={formData.endpoint}
            onChange={(e) => updateField('endpoint', e.target.value)}
            required
            className="pl-10"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {formData.endpoint.startsWith('https') ? '🔒' : '🌐'}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          L'URL de base de l'API de votre système ERP
        </p>
      </div>

      {/* Authentication Type */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Méthode d'authentification
        </Label>
        <Select 
          value={formData.authType} 
          onValueChange={(v) => updateField('authType', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="API_KEY">Clé API</SelectItem>
            <SelectItem value="BASIC">Authentification Basic (User/Pass)</SelectItem>
            <SelectItem value="OAUTH2">OAuth 2.0</SelectItem>
            {erpType === 'Odoo' && (
              <SelectItem value="XMLRPC">XML-RPC (Odoo)</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* API Key Auth */}
      {(formData.authType === 'API_KEY') && (
        <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
          <Label htmlFor="apiKey" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Clé API *
          </Label>
          <div className="relative">
            <Input
              id="apiKey"
              type="password"
              placeholder="Entrez votre clé API"
              value={formData.apiKey}
              onChange={(e) => updateField('apiKey', e.target.value)}
              required={formData.authType === 'API_KEY'}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Basic Auth */}
      {(formData.authType === 'BASIC' || formData.authType === 'XMLRPC') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur *</Label>
            <Input
              id="username"
              placeholder="admin ou user@example.com"
              value={formData.username}
              onChange={(e) => updateField('username', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OAuth2 */}
      {formData.authType === 'OAUTH2' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID *</Label>
              <Input
                id="clientId"
                placeholder="Votre OAuth2 Client ID"
                value={formData.clientId}
                onChange={(e) => updateField('clientId', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret *</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecret ? 'text' : 'password'}
                  placeholder="Votre OAuth2 Client Secret"
                  value={formData.clientSecret}
                  onChange={(e) => updateField('clientSecret', e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Les tokens d'accès seront gérés automatiquement par la plateforme.
          </p>
        </div>
      )}

      {/* Odoo-specific: Database */}
      {erpType === 'Odoo' && (
        <div className="space-y-2">
          <Label htmlFor="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Base de données Odoo
          </Label>
          <Input
            id="database"
            placeholder={PLACEHOLDERS.Odoo.database || 'Nom de la base de données'}
            value={formData.database}
            onChange={(e) => updateField('database', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Requis pour l'authentification XML-RPC. Optionnel pour l'API REST.
          </p>
        </div>
      )}

      {/* Advanced Options */}
      <div className="border-t pt-4 space-y-4">
        <h4 className="font-medium text-sm text-gray-700">Options avancées</h4>
        
        <div className="flex items-center justify-between">
          <div>
            <Label>Utiliser SSL/TLS</Label>
            <p className="text-xs text-gray-500">Chiffrer la connexion</p>
          </div>
          <Switch
            checked={formData.useSSL}
            onCheckedChange={(checked) => updateField('useSSL', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeout">Timeout (secondes)</Label>
          <Select 
            value={formData.timeout} 
            onValueChange={(v) => updateField('timeout', v)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 secondes</SelectItem>
              <SelectItem value="30">30 secondes</SelectItem>
              <SelectItem value="60">1 minute</SelectItem>
              <SelectItem value="120">2 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full">
        Sauvegarder la configuration
      </Button>
    </form>
  )
}
