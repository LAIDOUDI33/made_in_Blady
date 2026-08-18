'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import ERPSetupWizard from '@/components/erp/ERPSetupWizard'
import SyncDashboard from '@/components/erp/SyncDashboard'
import ConnectorSelection from '@/components/erp/ConnectorSelection'
import InventoryStatus from '@/components/erp/InventoryStatus'
import {
  Server,
  Plug,
  Database,
  ArrowUpDown,
  RefreshCw,
  Plus,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  Zap,
  Globe,
  Package,
  Users,
  ShoppingCart,
} from 'lucide-react'

// Types
interface ERPConnectorSummary {
  id: string
  name: string
  type: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING'
  lastSyncAt?: Date
  entityCount: number
}

// Sample data for demo
const sampleConnectors: ERPConnectorSummary[] = [
  {
    id: '1',
    name: 'SAP Production',
    type: 'SAP',
    status: 'CONNECTED',
    lastSyncAt: new Date(Date.now() - 15 * 60 * 1000),
    entityCount: 4,
  },
  {
    id: '2',
    name: 'Odoo Staging',
    type: 'Odoo',
    status: 'SYNCING',
    lastSyncAt: new Date(Date.now() - 5 * 60 * 1000),
    entityCount: 3,
  },
  {
    id: '3',
    name: 'Custom REST API',
    type: 'REST',
    status: 'ERROR',
    entityCount: 2,
  },
]

const systemStats = {
  totalConnectors: 3,
  activeSyncs: 1,
  todaySyncCount: 24,
  successRate: 94.5,
  totalRecordsSynced: 12543,
  pendingConflicts: 2,
}

export default function ERPDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [connectors, setConnectors] = useState<ERPConnectorSummary[]>(sampleConnectors)
  const [selectedERPType, setSelectedERPType] = useState<string | null>(null)

  const handleSetupComplete = (config: any) => {
    console.log('ERP Setup completed:', config)
    setShowSetupWizard(false)
    // In production, would refresh connectors list
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'SYNCING':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      case 'ERROR':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Connecté</Badge>
      case 'SYNCING':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Synchronisation</Badge>
      case 'ERROR':
        return <Badge variant="destructive">Erreur</Badge>
      default:
        return <Badge variant="secondary">Déconnecté</Badge>
    }
  }

  const getERPTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sap':
        return <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><span className="text-purple-700 font-bold text-xs">SAP</span></div>
      case 'odoo':
        return <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><span className="text-orange-700 font-bold text-xs">ODOO</span></div>
      case 'rest':
        return <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><span className="text-gray-700 font-bold text-xs">API</span></div>
      default:
        return <Server className="h-8 w-8 text-gray-400" />
    }
  }

  if (showSetupWizard) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => setShowSetupWizard(false)}
            className="mb-6"
          >
            ← Retour au tableau de bord
          </Button>
          <ERPSetupWizard onComplete={handleSetupComplete} onCancel={() => setShowSetupWizard(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ERP Integration Hub</h1>
                <p className="text-xs text-gray-500">AlgeriaTrade.dz - Système de synchronisation inventaire</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
              <Button
                onClick={() => setShowSetupWizard(true)}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle intégration
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xl font-bold">{systemStats.totalConnectors}</p>
                  <p className="text-xs text-gray-500">Connecteurs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xl font-bold">{systemStats.activeSyncs}</p>
                  <p className="text-xs text-gray-500">Sync actives</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-xl font-bold">{systemStats.todaySyncCount}</p>
                  <p className="text-xs text-gray-500">Sync aujourd&apos;hui</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-xl font-bold">{systemStats.successRate}%</p>
                  <p className="text-xs text-gray-500">Taux réussite</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xl font-bold">{systemStats.totalRecordsSynced.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Enregistrements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={systemStats.pendingConflicts > 0 ? 'border-yellow-300 bg-yellow-50/30' : ''}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${systemStats.pendingConflicts > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
                <div>
                  <p className="text-xl font-bold">{systemStats.pendingConflicts}</p>
                  <p className="text-xs text-gray-500">Conflits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <Globe className="w-4 h-4" />
              <span>Aperçu</span>
            </TabsTrigger>
            <TabsTrigger value="connectors" className="gap-2">
              <Plug className="w-4 h-4" />
              <span>Connecteurs</span>
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <span>Synchronisation</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="w-4 h-4" />
              <span>Inventaire</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Connectors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Plug className="h-5 w-5 text-blue-500" />
                      Connecteurs actifs
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setShowSetupWizard(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {connectors.map((connector) => (
                    <div
                      key={connector.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setActiveTab('sync')}
                    >
                      <div className="flex items-center gap-3">
                        {getERPTypeIcon(connector.type)}
                        <div>
                          <p className="font-medium text-sm">{connector.name}</p>
                          <p className="text-xs text-gray-500">{connector.entityCount} entités configurées</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(connector.status)}
                        {getStatusBadge(connector.status)}
                      </div>
                    </div>
                  ))}
                  
                  {connectors.length === 0 && (
                    <div className="text-center py-8">
                      <Server className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 mb-4">Aucun connecteur configuré</p>
                      <Button onClick={() => setShowSetupWizard(true)}>
                        Configurer votre première intégration
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Activité récente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'Synchronisation produits', connector: 'SAP Production', time: 'Il y a 15 min', status: 'success', icon: Package },
                      { action: 'Mise à jour stock', connector: 'Odoo Staging', time: 'Il y a 30 min', status: 'success', icon: ShoppingCart },
                      { action: 'Import clients', connector: 'Odoo Staging', time: 'Il y a 1h', status: 'success', icon: Users },
                      { action: 'Sync commandes', connector: 'Custom REST API', time: 'Il y a 2h', status: 'error', icon: ShoppingCart },
                      { action: 'Synchronisation complète', connector: 'SAP Production', time: 'Il y a 3h', status: 'success', icon: RefreshCw },
                    ].map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          activity.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <activity.icon className={`h-4 w-4 ${
                            activity.status === 'success' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.action}</p>
                          <p className="text-xs text-gray-500">{activity.connector} • {activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Supported ERPs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  Systems ERP supportés
                </CardTitle>
                <CardDescription>AlgeriaTrade.dz s&apos;intègre avec les principales solutions ERP du marché</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      name: 'SAP S/4HANA',
                      description: 'Enterprise resource planning pour grandes organisations',
                      features: ['OData/REST API', 'OAuth2', 'BAPI Support'],
                      color: 'purple',
                      icon: '🏢',
                    },
                    {
                      name: 'Odoo',
                      description: 'Solution ERP open-source pour PME',
                      features: ['XML-RPC/JSON-RPC', 'REST API', 'Webhooks'],
                      color: 'orange',
                      icon: '📦',
                    },
                    {
                      name: 'Microsoft Dynamics 365',
                      description: 'Cloud business applications Microsoft',
                      features: ['Dataverse API', 'OAuth2', 'Azure AD'],
                      color: 'blue',
                      icon: '☁️',
                    },
                    {
                      name: 'REST API Générique',
                      description: 'Connectez n\'importe quelle API REST personnalisée',
                      features: ['OAuth2', 'Custom Endpoints', 'Webhooks'],
                      color: 'gray',
                      icon: '🔌',
                    },
                  ].map((erp, idx) => (
                    <div key={idx} className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group">
                      <div className="text-3xl mb-3">{erp.icon}</div>
                      <h3 className="font-semibold text-sm mb-1 group:text-blue-700">{erp.name}</h3>
                      <p className="text-xs text-gray-500 mb-3">{erp.description}</p>
                      <div className="space-y-1">
                        {erp.features.map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Zap className="h-3 w-3 text-green-500" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connectors Tab */}
          <TabsContent value="connectors" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Gestion des connecteurs</h2>
                <p className="text-sm text-gray-500">Configurez et gérez vos connexions ERP</p>
              </div>
              <Button onClick={() => setShowSetupWizard(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau connecteur
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {connectors.map((connector) => (
                <Card key={connector.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getERPTypeIcon(connector.type)}
                        <div>
                          <CardTitle className="text-base">{connector.name}</CardTitle>
                          <p className="text-xs text-gray-500">{connector.type} Connector</p>
                        </div>
                      </div>
                      {getStatusBadge(connector.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Statut</span>
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(connector.status)}
                          <span className="font-medium capitalize">{connector.status.toLowerCase()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Dernière sync</span>
                        <span className="font-medium">
                          {connector.lastSyncAt 
                            ? `Il y a ${Math.round((Date.now() - connector.lastSyncAt.getTime()) / 60000)} min`
                            : 'Jamais'
                          }
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Entités</span>
                        <span className="font-medium">{connector.entityCount} configurées</span>
                      </div>

                      <div className="flex gap-2 pt-3 border-t">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="mr-1 h-3 w-3" />
                          Configurer
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={connector.status !== 'CONNECTED'}
                          className="flex-1"
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Sync
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add New Connector Card */}
              <Card 
                className="border-dashed hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
                onClick={() => setShowSetupWizard(true)}
              >
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Plus className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-700">Ajouter un connecteur</p>
                  <p className="text-sm text-gray-500 mt-1">Configurer une nouvelle intégration ERP</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sync Tab */}
          <TabsContent value="sync" className="space-y-6">
            <SyncDashboard erpConfigId="default" />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <InventoryStatus connectorId="default" />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>AlgeriaTrade.dz ERP Integration Module</span>
            </div>
            
            <div className="flex items-center gap-6">
              <span>SAP • Odoo • Dynamics • Custom APIs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
