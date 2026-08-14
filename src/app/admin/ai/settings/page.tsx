'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Bot,
  Sparkles,
  Search,
  BarChart3,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function AdminAISettingsPage() {
  // Recommendation settings state
  const [recSettings, setRecSettings] = useState({
    enabled: true,
    collaborativeFiltering: true,
    contentBased: true,
    trending: true,
    popular: true,
    cfWeight: 30,
    cbWeight: 35,
    trendingWeight: 20,
    popularWeight: 15,
    maxRecommendations: 20,
    minScoreThreshold: 0.1,
    abTestingEnabled: false,
    showToPercentage: 50,
  });

  // Chatbot settings state
  const [chatSettings, setChatSettings] = useState({
    enabled: true,
    greetingMessage: "Bonjour ! Je suis l'assistant AlgeriaTrade. Comment puis-je vous aider ?",
    businessHoursStart: '08:00',
    businessHoursEnd: '17:30',
    fallbackEmail: 'support@algeriatrade.dz',
    enableHumanHandoff: true,
    collectFeedback: true,
  });

  // Search settings state
  const [searchSettings, setSearchSettings] = useState({
    spellCorrection: true,
    queryExpansion: true,
    trackSearches: true,
    maxSuggestions: 8,
    blacklistWords: '',
    promotedResults: '',
  });

  const handleSave = (section: string) => {
    console.log(`Saving ${section} settings...`);
    // In real app, would save to database
    alert(`Paramètres ${section} sauvegardés avec succès !`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-[#006233]" />
            Configuration IA
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez les paramètres de l'intelligence artificielle de la plateforme
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Recommandations
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Chatbot
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Recherche
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Recommendations Settings */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#006233]" />
                Moteur de Recommandations
              </CardTitle>
              <CardDescription>
                Configurez l'algorithme de recommandation pour personnaliser l'expérience utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Activer les recommandations</Label>
                  <p className="text-sm text-gray-500">Afficher les produits et fournisseurs recommandés aux utilisateurs</p>
                </div>
                <Switch 
                  checked={recSettings.enabled}
                  onCheckedChange={(v) => setRecSettings({...recSettings, enabled: v})}
                />
              </div>

              <Separator />

              {/* Algorithm Toggles */}
              <div className="space-y-4">
                <h3 className="font-semibold">Algorithmes activés</h3>
                
                {[
                  { key: 'collaborativeFiltering', label: 'Filtrage collaboratif', desc: '"Les utilisateurs similaires ont aussi aimé"' },
                  { key: 'contentBased', label: 'Filtrage basé sur le contenu', desc: '"Similaire à vos recherches précédentes"' },
                  { key: 'trending', label: 'Tendances', desc: '"Populaire en ce moment"' },
                  { key: 'popular', label: 'Popularité', desc: '"Les plus consultés sur la plateforme"' },
                ].map(algo => (
                  <div key={algo.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <Label className="font-medium">{algo.label}</Label>
                      <p className="text-sm text-gray-500">{algo.desc}</p>
                    </div>
                    <Switch 
                      checked={recSettings[algo.key as keyof typeof recSettings] as boolean}
                      onCheckedChange={(v) => setRecSettings({...recSettings, [algo.key]: v})}
                    />
                  </div>
                ))}
              </div>

              <Separator />

              {/* Algorithm Weights */}
              <div className="space-y-4">
                <h3 className="font-semibold">Pondération des algorithmes</h3>
                <p className="text-sm text-gray-500">Ajustez le poids de chaque algorithme (doit totaliser 100%)</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: 'cfWeight', label: 'Collaboratif' },
                    { key: 'cbWeight', label: 'Contenu' },
                    { key: 'trendingWeight', label: 'Tendance' },
                    { key: 'popularWeight', label: 'Popularité' },
                  ].map(weight => (
                    <div key={weight.key}>
                      <Label>{weight.label}</Label>
                      <div className="flex items-center mt-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={recSettings[weight.key as keyof typeof recSettings]}
                          onChange={(e) => setRecSettings({...recSettings, [weight.key]: parseInt(e.target.value) || 0})}
                          className="w-20"
                        />
                        <span className="ml-2 text-gray-500">%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`p-3 rounded-lg ${
                  recSettings.cfWeight + recSettings.cbWeight + recSettings.trendingWeight + recSettings.popularWeight === 100
                    ? 'bg-green-50 text-green-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}>
                  Total: {recSettings.cfWeight + recSettings.cbWeight + recSettings.trendingWeight + recSettings.popularWeight}%
                  {recSettings.cfWeight + recSettings.cbWeight + recSettings.trendingWeight + recSettings.popularWeight !== 100 && (
                    <span className="ml-2">(doit être 100%)</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* A/B Testing */}
              <div className="space-y-4">
                <h3 className="font-semibold">Test A/B</h3>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <Label>Activer les tests A/B</Label>
                    <p className="text-sm text-gray-500">Montrer les recommandations à un pourcentage d'utilisateurs</p>
                  </div>
                  <Switch 
                    checked={recSettings.abTestingEnabled}
                    onCheckedChange={(v) => setRecSettings({...recSettings, abTestingEnabled: v})}
                  />
                </div>

                {recSettings.abTestingEnabled && (
                  <div>
                    <Label>Pourcentage d'affichage</Label>
                    <div className="flex items-center mt-1">
                      <Input
                        type="range"
                        min="10"
                        max="100"
                        step="10"
                        value={recSettings.showToPercentage}
                        onChange={(e) => setRecSettings({...recSettings, showToPercentage: parseInt(e.target.value)})}
                        className="flex-1 mr-3"
                      />
                      <span className="font-medium w-12 text-right">{recSettings.showToPercentage}%</span>
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={() => handleSave('recommandations')} className="bg-[#006233] hover:bg-[#007a3f]">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chatbot Settings */}
        <TabsContent value="chatbot" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#006233]" />
                Assistant Chatbot IA
              </CardTitle>
              <CardDescription>
                Configurez le comportement du chatbot d'assistance virtuelle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Activer le chatbot</Label>
                  <p className="text-sm text-gray-500">Afficher le widget de chat sur le site</p>
                </div>
                <Switch 
                  checked={chatSettings.enabled}
                  onCheckedChange={(v) => setChatSettings({...chatSettings, enabled: v})}
                />
              </div>

              <Separator />

              {/* Greeting Message */}
              <div className="space-y-2">
                <Label>Message d'accueil</Label>
                <textarea
                  value={chatSettings.greetingMessage}
                  onChange={(e) => setChatSettings({...chatSettings, greetingMessage: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
                  placeholder="Message affiché quand un utilisateur ouvre le chat..."
                />
              </div>

              <Separator />

              {/* Business Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Heure d'ouverture</Label>
                  <Input
                    type="time"
                    value={chatSettings.businessHoursStart}
                    onChange={(e) => setChatSettings({...chatSettings, businessHoursStart: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Heure de fermeture</Label>
                  <Input
                    type="time"
                    value={chatSettings.businessHoursEnd}
                    onChange={(e) => setChatSettings({...chatSettings, businessHoursEnd: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              <Separator />

              {/* Fallback & Handoff */}
              <div className="space-y-4">
                <h3 className="font-semibold">Transfert vers un humain</h3>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <Label>Permettre le transfert</Label>
                    <p className="text-sm text-gray-500">L'utilisateur peut demander à parler à un agent</p>
                  </div>
                  <Switch 
                    checked={chatSettings.enableHumanHandoff}
                    onCheckedChange={(v) => setChatSettings({...chatSettings, enableHumanHandoff: v})}
                  />
                </div>

                <div>
                  <Label>Email de secours</Label>
                  <Input
                    type="email"
                    value={chatSettings.fallbackEmail}
                    onChange={(e) => setChatSettings({...chatSettings, fallbackEmail: e.target.value})}
                    placeholder="support@example.com"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">Email utilisé pour les requêtes complexes hors horaires</p>
                </div>
              </div>

              <Separator />

              {/* Feedback Collection */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <Label>Collecter les retours utilisateurs</Label>
                  <p className="text-sm text-gray-500">Afficher les boutons "Utile/Pas utile" après chaque réponse</p>
                </div>
                <Switch 
                  checked={chatSettings.collectFeedback}
                  onCheckedChange={(v) => setChatSettings({...chatSettings, collectFeedback: v})}
                />
              </div>

              <Button onClick={() => handleSave('chatbot')} className="bg-[#006233] hover:bg-[#007a3f]">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>

          {/* Intent Management Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Intents configurés</CardTitle>
              <CardDescription>Liste des intentions reconnues par le chatbot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'greeting', name: 'Salutations', examples: 'Bonjour, Salut...' },
                  { id: 'search_products', name: 'Recherche produit', examples: 'Je cherche...' },
                  { id: 'post_rfq', name: 'Appel d\'offres', examples: 'Comment poster un AO...' },
                  { id: 'pricing_info', name: 'Tarification', examples: 'Combien ça coûte...' },
                  { id: 'payment_help', name: 'Paiement', examples: 'Comment payer...' },
                  { id: 'shipping_info', name: 'Livraison', examples: 'Délai de livraison...' },
                  { id: 'account_help', name: 'Compte', examples: 'Mot de passe oublié...' },
                  { id: 'verification_help', name: 'Vérification', documents: 'Documents requis...' },
                  { id: 'contact_human', name: 'Contact humain', examples: 'Parler à un agent...' },
                  { id: 'thanks', name: 'Remerciements', examples: 'Merci...' },
                ].map(intent => (
                  <div key={intent.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="bg-green-50 text-[#006233]">
                        {intent.id}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{intent.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{intent.examples || intent.documents}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Settings */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-[#006233]" />
                Recherche Intelligente
              </CardTitle>
              <CardDescription>
                Paramètres de correction orthographique et d'expansion de requête
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Spell Correction */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Correction orthographique</Label>
                  <p className="text-sm text-gray-500">Corriger automatiquement les fautes de frappe courantes</p>
                </div>
                <Switch 
                  checked={searchSettings.spellCorrection}
                  onCheckedChange={(v) => setSearchSettings({...searchSettings, spellCorrection: v})}
                />
              </div>

              {/* Query Expansion */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Expansion de requête</Label>
                  <p className="text-sm text-gray-500">Ajouter automatiquement des synonymes et termes connexes</p>
                </div>
                <Switch 
                  checked={searchSettings.queryExpansion}
                  onCheckedChange={(v) => setSearchSettings({...searchSettings, queryExpansion: v})}
                />
              </div>

              {/* Track Searches */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Suivi des recherches</Label>
                  <p className="text-sm text-gray-500">Enregistrer les recherches pour améliorer les suggestions</p>
                </div>
                <Switch 
                  checked={searchSettings.trackSearches}
                  onCheckedChange={(v) => setSearchSettings({...searchSettings, trackSearches: v})}
                />
              </div>

              <Separator />

              {/* Max Suggestions */}
              <div>
                <Label>Nombre maximum de suggestions</Label>
                <Input
                  type="number"
                  min="3"
                  max="20"
                  value={searchSettings.maxSuggestions}
                  onChange={(e) => setSearchSettings({...searchSettings, maxSuggestions: parseInt(e.target.value) || 8})}
                  className="mt-1 w-32"
                />
              </div>

              <Button onClick={() => handleSave('recherche')} className="bg-[#006233] hover:bg#[#007a3f]">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Sessions chat</p>
                    <p className="text-2xl font-bold text-gray-900">1,234</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">+12% cette semaine</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Taux de satisfaction</p>
                    <p className="text-2xl font-bold text-gray-900">87%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">+5% ce mois</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Recommandations cliquées</p>
                    <p className="text-2xl font-bold text-gray-900">5.6K</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">+18% cette semaine</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Taux de conversion IA</p>
                    <p className="text-2xl font-bold text-gray-900">4.2%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">+0.8% ce mois</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Intents */}
          <Card>
            <CardHeader>
              <CardTitle>Intents les plus utilisées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { intent: 'greeting', count: 456, percentage: 37 },
                  { intent: 'search_products', count: 289, percentage: 23 },
                  { intent: 'post_rfq', count: 156, percentage: 13 },
                  { intent: 'pricing_info', count: 98, percentage: 8 },
                  { intent: 'payment_help', count: 78, percentage: 6 },
                  { intent: 'shipping_info', count: 65, percentage: 5 },
                  { intent: 'fallback', count: 48, percentage: 4 },
                ].map((item, index) => (
                  <div key={item.intent} className="flex items-center gap-4">
                    <span className="w-6 text-sm text-gray-500">#{index + 1}</span>
                    <span className="flex-1 font-medium capitalize">{item.intent.replace('_', ' ')}</span>
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#006233] h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-16 text-right text-sm text-gray-500">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
