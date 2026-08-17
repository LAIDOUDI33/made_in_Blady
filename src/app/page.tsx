'use client'

import React, { useState } from 'react'
import CRMDashboard from '@/components/crm/CRMDashboard'
import ERPAdminPage from '@/components/erp/ERPConfigForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  Server,
  RefreshCw,
  BarChart3,
  Activity,
  ArrowRightLeft,
  ArrowRightRight,
} from 'lucide-react'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'crm' | 'erp'>('crm')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                AT
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AlgeriaTrade.dz</h1>
                <p className="text-xs text-gray-500">Plateforme B2B Intégrée</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">
                Accueil
              </a>
              <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">
                Produits
              </a>
              <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">
                Fournisseurs
              </a>
              <a href="#" className="font-medium text-orange-600">
                Admin
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Centre d'Administration
              </h2>
              <p className="text-gray-600 mt-2 max-w-2xl">
                Gérez votre plateforme B2B avec les modules CRM et d'intégration ERP
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-5 w-5 text-orange-500" />
                    <span className="text-2xl font-bold text-gray-900">248</span>
                  </div>
                  <p className="text-xs text-gray-500">Contacts CRM</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    <span className="text-2xl font-bold text-gray-900">47</span>
                  </div>
                  <p className="text-xs text-gray-500">Prospects actifs</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Server className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold text-gray-900">2</span>
                  </div>
                  <p className="text xs text-gray-500">Intégrations ERP</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-bold text-gray-900">98%</span>
                  </div>
                  <p className="text-xs text-gray-500">Uptime système</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="w-full justify-start lg:w-auto">
              <TabsTrigger 
                value="crm" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Module CRM
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="erp" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Intégrations ERP
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* CRM Tab Content */}
          <TabsContent value="crm" className="mt-6">
            <CRMDashboard 
              companyId="admin_company"
              userId="admin_user"
            />
          </TabsContent>

          {/* ERP Tab Content */}
          <TabsContent value="erp" className="mt-6">
            <ERPAdminPage />
          </TabsContent>
        </main>

        {/* Footer Info */}
        <footer className="mt-16 py-8 border-t border-gray-200">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-500">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Module CRM (8I)</h4>
                <ul className="space-y-1 mt-2">
                  <li>• Gestion des contacts et prospects</li>
                  <li>Pipeline de ventes Kanban</li>
                  <li>Scoring automatique des leads</li>
                  <li>Historique des interactions</li>
                  <li>Gestion des tâches et suivis</li>
                  <li>Règles d&apos;automatisation</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Intégration ERP (8J)</h4>
                <ul className="space-y-1 mt-2">
                  <li>• Connecteur SAP S/4HANA</li>
                  <li>• Connecteur Odoo (XML-RPC/REST)</li>
                  <li>• Synchronisation inventaire temps réel</li>
                  <li>Webhooks bidirectionnels</li>
                  <li>Résolution de conflits</li>
                  <li>Alertes de stock basse</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">APIs Disponibles</h4>
                <ul className="space-y-1 mt-2">
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/crm/*</code></li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/erp/configs/*</code></li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/erp/sync-history</code></li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/erp/webhook/[id]</code></li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
              <p>
                AlgeriaTrade.dz B2B Platform • Phase 8I + 8J • 
                <span className="font-medium text-gray-600">CRM &amp; ERP Integration</span>
              </p>
              <p className="mt-1">
                Construit avec Next.js 16 • TypeScript • Tailwind CSS • Prisma ORM • shadcn/ui
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
