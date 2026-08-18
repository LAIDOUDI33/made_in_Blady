'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  FileText,
  ShoppingCart,
  PenTool,
  Shield,
  Wrench,
  Truck,
  Handshake,
  Lock,
  Eye,
  Settings,
  Plus,
  Search,
  Grid3X3,
  List,
  ArrowRight,
  CheckCircle2,
  Users,
  FileCheck
} from 'lucide-react'
import Link from 'next/link'

// Types
interface ContractTemplate {
  id: string
  name: string
  type: string
  description: string
  icon: React.ElementType
  color: string
  clausesCount: number
  usageCount: number
  lastUsed?: string
  isEnabled: boolean
  category: string
}

// Mock Data - Contract Templates
const mockTemplates: ContractTemplate[] = [
  {
    id: 'TPL-001',
    name: 'Contrat de Vente Standard',
    type: 'sales',
    description: 'Modèle de contrat de vente pour transactions B2B conformément au droit algérien. Inclut clauses de livraison, paiement et garanties.',
    icon: ShoppingCart,
    color: 'bg-blue-500',
    clausesCount: 24,
    usageCount: 156,
    lastUsed: '15/03/2024',
    isEnabled: true,
    category: 'Commercial'
  },
  {
    id: 'TPL-002',
    name: "Bon de Commande (PO)",
    type: 'po',
    description: "Format standard pour les commandes d'achat avec spécifications détaillées, conditions et délais de livraison.",
    icon: PenTool,
    color: 'bg-emerald-500',
    clausesCount: 18,
    usageCount: 234,
    lastUsed: '16/03/2024',
    isEnabled: true,
    category: 'Achat'
  },
  {
    id: 'TPL-003',
    name: 'Accord de Confidentialité (NDA)',
    type: 'nda',
    description: "Accord de non-divulgation bilatéral conforme à la législation algérienne. Protège les informations sensibles.",
    icon: Shield,
    color: 'bg-purple-500',
    clausesCount: 12,
    usageCount: 89,
    lastUsed: '14/03/2024',
    isEnabled: true,
    category: 'Juridique'
  },
  {
    id: 'TPL-004',
    name: 'Contrat de Prestation de Services',
    type: 'service',
    description: "Cadre contractuel pour la fourniture de services avec définition des livrables, KPIs et pénalités.",
    icon: Wrench,
    color: 'bg-orange-500',
    clausesCount: 28,
    usageCount: 67,
    lastUsed: '12/03/2024',
    isEnabled: true,
    category: 'Services'
  },
  {
    id: 'TPL-005',
    name: "Accord de Distribution Exclusive",
    type: 'distribution',
    description: "Contrat de distribution avec clause d'exclusivité territoriale, objectifs de vente et conditions commerciales.",
    icon: Truck,
    color: 'bg-cyan-500',
    clausesCount: 32,
    usageCount: 45,
    lastUsed: '10/03/2024',
    isEnabled: true,
    category: 'Commercial'
  },
  {
    id: 'TPL-006',
    name: 'Partenariat Stratégique',
    type: 'partnership',
    description: "Cadre de collaboration stratégique entre entreprises avec partage de ressources et responsabilités.",
    icon: Handshake,
    color: 'bg-pink-500',
    clausesCount: 36,
    usageCount: 23,
    lastUsed: '08/03/2024',
    isEnabled: true,
    category: 'Partenariat'
  },
  {
    id: 'TPL-007',
    name: "Contrat d'Exclusivité Commerciale",
    type: 'exclusivity',
    description: "Protection de l'exclusivité commerciale sur une zone géographique ou un segment de marché défini.",
    icon: Lock,
    color: 'bg-indigo-500',
    clausesCount: 20,
    usageCount: 34,
    lastUsed: '05/03/2024',
    isEnabled: true,
    category: 'Commercial'
  },
  {
    id: 'TPL-008',
    name: 'Contrat de Sous-traitance',
    type: 'service',
    description: "Modèle pour les relations de sous-traitance industrielle avec contrôle qualité et confidentialité.",
    icon: Wrench,
    color: 'bg-teal-500',
    clausesCount: 26,
    usageCount: 28,
    lastUsed: '01/03/2024',
    isEnabled: false,
    category: 'Industriel'
  },
  {
    id: 'TPL-009',
    name: "Accord de Licence",
    type: 'partnership',
    description: "Contrat de licence d'utilisation de propriété intellectuelle, brevets ou savoir-faire.",
    icon: FileText,
    color: 'bg-violet-500',
    clausesCount: 22,
    usageCount: 15,
    lastUsed: '25/02/2024',
    isEnabled: true,
    category: 'Propriété Intellectuelle'
  },
  {
    id: 'TPL-010',
    name: "Contrat d'Agence Commerciale",
    type: 'distribution',
    description: "Convention d'agence commerciale avec rémunération à la commission et territoire défini.",
    icon: Truck,
    color: 'bg-lime-600',
    clausesCount: 24,
    usageCount: 41,
    lastUsed: '18/02/2024',
    isEnabled: true,
    category: 'Commercial'
  },
  {
    id: 'TPL-011',
    name: "Memorandum of Understanding (MoU)",
    type: 'partnership',
    description: "Document d'intention préalable à un accord formel, définissant les grandes lignes de collaboration.",
    icon: Handshake,
    color: 'bg-amber-500',
    clausesCount: 10,
    usageCount: 56,
    lastUsed: '20/02/2024',
    isEnabled: true,
    category: 'Partenariat'
  },
  {
    id: 'TPL-012',
    name: "Contrat de Location Équipement",
    type: 'service',
    description: "Bail de matériel industriel avec maintenance, assurance et options d'achat en fin de contrat.",
    icon: Wrench,
    color: 'bg-rose-500',
    clausesCount: 20,
    usageCount: 19,
    lastUsed: '15/02/2024',
    isEnabled: false,
    category: 'Location'
  }
]

export default function ContractTemplatesPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>(mockTemplates)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  // Get unique categories
  const categories = [...new Set(templates.map(t => t.category))].sort()

  // Toggle template enabled state
  const toggleTemplate = (id: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, isEnabled: !t.isEnabled } : t
    ))
  }

  // Stats
  const stats = {
    total: templates.length,
    enabled: templates.filter(t => t.isEnabled).length,
    totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0),
    avgClauses: Math.round(templates.reduce((sum, t) => sum + t.clausesCount, 0) / templates.length)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Modèles de Contrats</h1>
                <p className="text-xs text-gray-500">AlgeriaTrade.dz - Bibliothèque de modèles</p>
              </div>
            </div>
            
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Modèle
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xl font-bold">{stats.total}</p>
                  <p className="text-xs text-gray-500">Modèles totaux</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xl font-bold">{stats.enabled}</p>
                  <p className="text-xs text-gray-500">Activés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-xl font-bold">{stats.totalUsage.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Utilisations totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xl font-bold">{stats.avgClauses}</p>
                  <p className="text-xs text-gray-500">Clauses moy./mod.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & View Controls */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un modèle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                >
                  <option value="all">Toutes catégories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <div className="flex border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-purple-100 text-purple-700' : 'bg-white text-gray-500'}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-purple-100 text-purple-700' : 'bg-white text-gray-500'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const Icon = template.icon
              
              return (
                <Card 
                  key={template.id} 
                  className={`hover:shadow-lg transition-all duration-300 ${!template.isEnabled ? 'opacity-70' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl ${template.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <Switch
                        checked={template.isEnabled}
                        onCheckedChange={() => toggleTemplate(template.id)}
                      />
                    </div>
                    
                    <CardTitle className="text-base mt-3">{template.name}</CardTitle>
                    <Badge variant="secondary" className="w-fit">{template.category}</Badge>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-3">{template.description}</p>
                    
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="text-lg font-semibold text-gray-800">{template.clausesCount}</p>
                        <p className="text-xs text-gray-500">Clauses</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="text-lg font-semibold text-gray-800">{template.usageCount}</p>
                        <p className="text-xs text-gray-500">Utilisations</p>
                      </div>
                    </div>
                    
                    {template.lastUsed && (
                      <p className="text-xs text-gray-400">
                        Dernière utilisation: {template.lastUsed}
                      </p>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="mr-1 h-3 w-3" />
                        Aperçu
                      </Button>
                      <Button size="sm" className="flex-1" disabled={!template.isEnabled}>
                        Utiliser
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* List View */
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredTemplates.map((template) => {
                  const Icon = template.icon
                  
                  return (
                    <div key={template.id} className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${!template.isEnabled ? 'opacity-60' : ''}`}>
                      <div className={`w-10 h-10 rounded-lg ${template.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{template.name}</h3>
                          <Badge variant="secondary" className="shrink-0">{template.category}</Badge>
                          {!template.isEnabled && (
                            <Badge variant="outline" className="shrink-0 text-gray-500">Désactivé</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">{template.description}</p>
                      </div>
                      
                      <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
                        <div className="text-center">
                          <p className="font-medium text-gray-700">{template.clausesCount}</p>
                          <p className="text-xs">clauses</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-700">{template.usageCount}</p>
                          <p className="text-xs">utilisations</p>
                        </div>
                        {template.lastUsed && (
                          <span>{template.lastUsed}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={template.isEnabled}
                          onCheckedChange={() => toggleTemplate(template.id)}
                        />
                        
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Settings className="h-4 w-4" />
                        </Button>
                        
                        <Button size="sm" disabled={!template.isEnabled} className="shrink-0">
                          Utiliser
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {filteredTemplates.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Aucun modèle trouvé</p>
              <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos critères de recherche</p>
            </CardContent>
          </Card>
        )}

        {/* Custom Clauses Management Link */}
        <Card className="border-dashed border-2 border-purple-300 bg-purple-50/30">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">Gestion des clauses personnalisées</h3>
                  <p className="text-sm text-purple-700">Créez et gérez votre bibliothèque de clauses réutilisables</p>
                </div>
              </div>
              
              <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                Gérer les clauses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
