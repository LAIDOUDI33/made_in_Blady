'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Calculator,
  Scale,
  FileCheck,
  DollarSign,
  TrendingUp,
  Handshake,
  Shield,
  ArrowRight,
  ExternalLink,
  Package,
  Users,
  BarChart3,
  Receipt,
  ClipboardList,
  Calendar
} from 'lucide-react'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AlgeriaTrade.dz Admin</h1>
              <p className="text-sm text-gray-500">Invoice, Negotiation & Contracts Administration</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-700">28</p>
                  <p className="text-xs text-gray-500">Factures</p>
                </div>
                <Receipt className="h-8 w-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-700">2.17M</p>
                  <p className="text-xs text-gray-500">TVA Totale (د.ج)</p>
                </div>
                <Calculator className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-amber-700">22</p>
                  <p className="text-xs text-gray-500">Négociations</p>
                </div>
                <Scale className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-violet-500">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-violet-700">18</p>
                  <p className="text-xs text-gray-500">Contrats</p>
                </div>
                <FileCheck className="h-8 w-8 text-violet-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1">
            <TabsTrigger value="invoices" className="gap-2 py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <FileText className="w-5 h-5" />
              <span className="font-medium">Factures</span>
            </TabsTrigger>
            <TabsTrigger value="negotiations" className="gap-2 py-3 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Handshake className="w-5 h-5" />
              <span className="font-medium">Négociations</span>
            </TabsTrigger>
            <TabsTrigger value="contracts" className="gap-2 py-3 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              <ClipboardList className="w-5 h-5" />
              <span className="font-medium">Contrats</span>
            </TabsTrigger>
          </TabsList>

          {/* Invoices Section */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Invoice List Card */}
              <Link href="/admin/invoices">
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group h-full border-t-4 border-t-emerald-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                        <FileText className="w-8 h-8 text-emerald-600" />
                      </div>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                        28 factures
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-4 group-hover:text-emerald-700 transition-colors">
                      Liste des Factures
                    </CardTitle>
                    <CardDescription>
                      Gestion complète des factures avec filtres, recherche et actions groupées
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Tableau avec pagination (10/page)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Filtres: Statut, Date, Montant
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Actions: Export CSV, Avoirs
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Format DZD avec séparateurs
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full group-hover:bg-emerald-50 group-hover:border-emerald-300 group-hover:text-emerald-700 transition-colors">
                      Accéder
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* TVA Reports Card */}
              <Link href="/admin/invoices/tva-reports">
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group h-full border-t-4 border-t-purple-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
                        <Calculator className="w-8 h-8 text-purple-600" />
                      </div>
                      <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                        DGI Ready
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-4 group-hover:text-purple-700 transition-colors">
                      Rapports TVA
                    </CardTitle>
                    <CardDescription>
                      Déclarations fiscales algériennes conformes à la réglementation DGI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                        Périodes: Mensuel/Trimestriel/Annuel
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                        Taux: 19%, 9%, 0%, Exonéré
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                        Graphiques comparatifs
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                        Export PDF pour DGI
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full group-hover:bg-purple-50 group-hover:border-purple-300 group-hover:text-purple-700 transition-colors">
                      Accéder
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* Quick Stats Card */}
              <Card className="border-t-4 border-t-teal-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-teal-600" />
                    Résumé Factures
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-lg font-bold text-green-700">12</p>
                      <p className="text-xs text-green-600">Payées</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-lg font-bold text-blue-700">7</p>
                      <p className="text-xs text-blue-600">Émises</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-center">
                      <p className="text-lg font-bold text-red-700">4</p>
                      <p className="text-xs text-red-600">En retard</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-lg font-bold text-gray-700">5</p>
                      <p className="text-xs text-gray-600">Autres</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total TTC</p>
                    <p className="text-xl font-bold text-emerald-700">142,847,550 د.ج</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Negotiations Section */}
          <TabsContent value="negotiations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Negotiations List Card */}
              <Link href="/admin/negotiations">
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group h-full border-t-4 border-t-amber-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-amber-100 group-hover:bg-amber-200 transition-colors">
                        <Scale className="w-8 h-8 text-amber-600" />
                      </div>
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                        22 actives
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-4 group-hover:text-amber-700 transition-colors">
                      Négociations Actives
                    </CardTitle>
                    <CardDescription>
                      Vue d'ensemble de toutes les négociations en cours avec alertes d'expiration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        Alertes expiration &lt;24h
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        Taux de réussite en temps réel
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        Économies potentielles calculées
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        Actions: Médier, Prolonger
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full group-hover:bg-amber-50 group-hover:border-amber-300 group-hover:text-amber-700 transition-colors">
                      Accéder
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* Sample Detail Link Card */}
              <Link href="/admin/negotiations/NEG-001">
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group h-full border-t-4 border-t-orange-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-orange-100 group-hover:bg-orange-200 transition-colors">
                        <Handshake className="w-8 h-8 text-orange-600" />
                      </div>
                      <Badge variant="secondary" className="bg-orange-50 text-orange-700">
                        Exemple
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-4 group-hover:text-orange-700 transition-colors">
                      Détail Négociation
                    </CardTitle>
                    <CardDescription>
                      Vue détaillée d'une négociation avec timeline et panel admin
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        Timeline des offres/contre-offres
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        Calculateur de marge bénéficiaire
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        Actions Admin: Proposer, Accepter
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        Lien vers commande associée
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full group-hover:bg-orange-50 group-hover:border-orange-300 group-hover:text-orange-700 transition-colors">
                      Voir l'exemple NEG-001
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* Negotiations Stats Card */}
              <Card className="border-t-4 border-t-yellow-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-600" />
                    Métriques Négociations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-lg font-bold text-green-700">7</p>
                      <p className="text-xs text-green-600">Acceptées</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg text-center">
                      <p className="text-lg font-bold text-yellow-700">3</p>
                      <p className="text-xs text-yellow-600">Expire bientôt</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-lg font-bold text-blue-700">31.8%</p>
                      <p className="text-xs text-blue-600">Taux réussite</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg text-center">
                      <p className="text-lg font-bold text-emerald-700">9.5%</p>
                      <p className="text-xs text-emerald-600">Économie moy.</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Économie totale potentielle</p>
                    <p className="text-xl font-bold text-amber-700">12,450,300 د.ج</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contracts Section */}
          <TabsContent value="contracts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Contracts List Card */}
              <Link href="/admin/contracts">
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group h-full border-t-4 border-t-violet-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-violet-100 group-hover:bg-violet-200 transition-colors">
                        <FileCheck className="w-8 h-8 text-violet-600" />
                      </div>
                      <Badge variant="secondary" className="bg-violet-50 text-violet-700">
                        18 contrats
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-4 group-hover:text-violet-700 transition-colors">
                      Liste des Contrats
                    </CardTitle>
                    <CardDescription>
                      Gestion complète des contrats avec types multiples et alertes d'expiration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                        7 types de contrats codés couleur
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                        Alertes expiration &lt;30 jours
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                        Téléchargement PDF signé
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                        Valeur totale des contrats
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full group-hover:bg-violet-50 group-hover:border-violet-300 group-hover:text-violet-700 transition-colors">
                      Accéder
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* Templates Gallery Card */}
              <Link href="/admin/contracts/templates">
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group h-full border-t-4 border-t-indigo-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                        <ClipboardList className="w-8 h-8 text-indigo-600" />
                      </div>
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                        12 modèles
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-4 group-hover:text-indigo-700 transition-colors">
                      Modèles de Contrats
                    </CardTitle>
                    <CardDescription>
                      Galerie de templates réutilisables avec gestion des clauses personnalisées
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                        Vue grille / liste
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                        Activation/désactivation rapide
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                        Stats d'utilisation par modèle
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                        Lien clauses personnalisées
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full group-hover:bg-indigo-50 group-hover:border-indigo-300 group-hover:text-indigo-700 transition-colors">
                      Accéder
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* Contract Types Legend Card */}
              <Card className="border-t-4 border-t-pink-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-pink-600" />
                    Types de Contrats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: 'Vente', color: 'bg-blue-500', count: 3 },
                    { name: 'Commande', color: 'bg-emerald-500', count: 2 },
                    { name: 'NDA', color: 'bg-purple-500', count: 3 },
                    { name: 'Service', color: 'bg-orange-500', count: 3 },
                    { name: 'Distribution', color: 'bg-cyan-500', count: 2 },
                    { name: 'Partenariat', color: 'bg-pink-500', count: 3 },
                    { name: 'Exclusivité', color: 'bg-indigo-500', count: 2 },
                  ].map((type) => (
                    <div key={type.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${type.color}`}></div>
                        <span className="text-sm">{type.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{type.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <footer className="mt-12 pt-8 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Format DZD</p>
                <p>Tous les montants sont affichés en Dinar Algérien avec le symbole د.ج et séparateurs de milliers.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Format Date</p>
                <p>Les dates utilisent le format français DD/MM/YYYY conforme aux standards algériens.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Conformité DGI</p>
                <p>Les rapports TVA respectent le Code des Impôts Directs et Taxes Assimilées algérien.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t text-center text-xs text-gray-400">
            <p>AlgeriaTrade.dz - Plateforme B2B Algérie | Module Administration Factures, Négociations & Contrats</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
