'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Bot,
  TrendingUp,
  Users,
  MousePointerClick,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Eye,
  ShoppingCart,
  Download,
  RefreshCw,
} from 'lucide-react';

// Mock data for demonstration - in real app would come from API
const mockData = {
  recommendations: {
    totalGenerated: 45678,
    totalClicked: 5623,
    clickThroughRate: 12.3,
    conversionRate: 4.2,
    bySource: [
      { source: 'collaborative_filtering', count: 15234, clicked: 1890, ctr: 12.4 },
      { source: 'content_based', count: 18456, clicked: 2345, ctr: 12.7 },
      { source: 'trending', count: 7890, clicked: 890, ctr: 11.3 },
      { source: 'popular', count: 4098, clicked: 498, ctr: 12.1 },
      { source: 'cold_start', count: 0, clicked: 0, ctr: 0 },
    ],
    topRecommendedProducts: [
      { name: 'Panneau solaire 300W', clicks: 456, conversions: 23 },
      { name: 'Pompe immergée 5HP', clicks: 389, conversions: 18 },
      { name: 'Ciment Portland CPJ', clicks: 345, conversions: 15 },
      { name: 'Tube PVC 110mm', clicks: 298, conversions: 12 },
      { name: 'Câble électrique 4mm²', clicks: 267, conversions: 10 },
    ],
    dailyTrend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      generated: Math.floor(Math.random() * 2000 + 1000),
      clicked: Math.floor(Math.random() * 300 + 100),
    })),
  },
  chatbot: {
    totalSessions: 12345,
    activeToday: 234,
    totalMessages: 67890,
    avgMessagesPerSession: 5.5,
    satisfactionRate: 87,
    topIntents: [
      { intent: 'greeting', count: 4567, percentage: 37 },
      { intent: 'search_products', count: 2890, percentage: 23 },
      { intent: 'post_rfq', count: 1567, percentage: 13 },
      { intent: 'pricing_info', count: 987, percentage: 8 },
      { intent: 'payment_help', count: 765, percentage: 6 },
      { intent: 'shipping_info', count: 654, percentage: 5 },
      { intent: 'account_help', count: 432, percentage: 3 },
      { intent: 'fallback', count: 328, percentage: 3 },
    ],
    feedback: {
      positive: 8923,
      negative: 1234,
      neutral: 567,
    },
    hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      messages: i >= 8 && i <= 18 ? Math.floor(Math.random() * 500 + 200) : Math.floor(Math.random() * 100 + 20),
    })),
  },
  search: {
    totalSearches: 98765,
    uniqueQueries: 12345,
    avgResultsPerSearch: 15.6,
    spellCorrectionUsed: 12345,
    queryExpansionUsed: 8765,
    topSearches: [
      { term: 'panneau solaire', count: 4567, results: 234 },
      { term: 'pompe', count: 3456, results: 189 },
      { term: 'ciment', count: 2345, results: 156 },
      { term: 'acier', count: 1987, results: 145 },
      { term: 'engrais', count: 1654, results: 98 },
      { term: 'tube pvc', count: 1432, results: 87 },
      { term: 'cable electrique', count: 1234, results: 76 },
      { term: 'moteur', count: 1098, counts: 65 },
    ],
    noResultSearches: [
      { term: 'produit inexistant', count: 45 },
      { term: 'xyz abc', count: 32 },
      { term: 'test 123', count: 28 },
    ],
  },
};

export default function AIPerformancePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(mockData);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-[#006233]" />
            Performance IA
          </h1>
          <p className="text-gray-500 mt-1">
            Analyse des performances de l'intelligence artificielle
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button className="bg-[#006233] hover:bg-[#007a3f]">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Recommandations
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Chatbot
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recherche
          </TabsTrigger>
        </TabsList>

        {/* Recommendations Analytics */}
        <TabsContent value="recommendations" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Recommandations générées</p>
                    <p className="text-2xl font-bold">{data.recommendations.totalGenerated.toLocaleString('fr-FR')}</p>
                  </div>
                  <Sparkles className="h-10 w-10 text-purple-400 bg-purple-50 rounded-lg p-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Clics sur recommandations</p>
                    <p className="text-2xl font-bold">{data.recommendations.totalClicked.toLocaleString('fr-FR')}</p>
                  </div>
                  <MousePointerClick className="h-10 w-10 text-blue-400 bg-blue-50 rounded-lg p-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Taux de clic (CTR)</p>
                    <p className="text-2xl font-bold text-green-600">{data.recommendations.clickThroughRate}%</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-green-400 bg-green-50 rounded-lg p-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Taux de conversion</p>
                    <p className="text-2xl font-bold text-orange-600">{data.recommendations.conversionRate}%</p>
                  </div>
                  <ShoppingCart className="h-10 w-10 text-orange-400 bg-orange-50 rounded-lg p-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Source */}
            <Card>
              <CardHeader>
                <CardTitle>Performance par source</CardTitle>
                <CardDescription>Efficacité de chaque algorithme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recommendations.bySource.map((source) => (
                    <div key={source.source} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">
                          {source.source.replace('_', ' ')}
                        </span>
                        <span className="text-gray-500">CTR: {source.ctr}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#006233] h-2 rounded-full transition-all"
                          style={{ width: `${(source.clicked / source.count) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{source.count.toLocaleString()} générées</span>
                        <span>{source.clicked.toLocaleString()} cliquées</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Produits les plus recommandés</CardTitle>
                <CardDescription>Clics et conversions par produit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recommendations.topRecommendedProducts.map((product, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <span className="w-8 h-8 rounded-full bg-[#006233] text-white flex items-center justify-center font-bold text-sm">
                        #{index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <div className="flex gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="h-3 w-3" />
                            {product.clicks} clics
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="h-3 w-3" />
                            {product.conversions} conversions
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-50 text-green-700">
                        {((product.conversions / product.clicks) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Chatbot Analytics */}
        <TabsContent value="chatbot" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Sessions totales</p>
                    <p className="text-2xl font-bold">{data.chatbot.totalSessions.toLocaleString('fr-FR')}</p>
                  </div>
                  <MessageSquare className="h-10 w-10 text-blue-400 bg-blue-50 rounded-lg p-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Sessions aujourd'hui</p>
                    <p className="text-2xl font-bold text-green-600">{data.chatbot.activeToday}</p>
                  </div>
                  <Users className="h-10 w-10 text-green-400 bg-green-50 rounded-lg p-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Messages / session</p>
                    <p className="text-2xl font-bold">{data.chatbot.avgMessagesPerSession}</p>
                  </div>
                  <Eye className="h-10 w-10 text-purple-400 bg-purple-50 rounded-lg p-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Satisfaction</p>
                    <p className="text-2xl font-bold text-green-600">{data.chatbot.satisfactionRate}%</p>
                  </div>
                  <ThumbsUp className="h-10 w-10 text-green-400 bg-green-50 rounded-lg p-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Intents */}
            <Card>
              <CardHeader>
                <CardTitle>Intents les plus utilisés</CardTitle>
                <CardDescription>Distribution des types de questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.chatbot.topIntents.map((item) => (
                    <div key={item.intent} className="flex items-center gap-3">
                      <span className="w-28 text-sm font-medium capitalize truncate">
                        {item.intent.replace('_', ' ')}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-[#006233] to-emerald-400 h-3 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="w-16 text-right text-sm text-gray-600">
                        {item.count.toLocaleString()}
                      </span>
                      <Badge variant="secondary" className="w-12 justify-center">
                        {item.percentage}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Feedback Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Retours utilisateurs</CardTitle>
                <CardDescription>Satisfaction des réponses du chatbot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-around text-center">
                    <div>
                      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                        <ThumbsUp className="h-10 w-10 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">{data.chatbot.feedback.positive.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Positifs</p>
                    </div>
                    
                    <div>
                      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                        <ThumbsDown className="h-10 w-10 text-red-600" />
                      </div>
                      <p className="text-2xl font-bold text-red-600">{data.chatbot.feedback.negative.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Négatifs</p>
                    </div>
                    
                    <div>
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                        <MessageSquare className="h-10 w-10 text-gray-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-600">{data.chatbot.feedback.neutral.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Neutres</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Taux de satisfaction global</span>
                      <span className="font-bold text-green-600">{data.chatbot.satisfactionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full"
                        style={{ width: `${data.chatbot.satisfactionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Search Analytics */}
        <TabsContent value="search" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Recherches totales</p>
                    <p className="text-2xl font-bold">{data.search.totalSearches.toLocaleString('fr-FR')}</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-blue-400 bg-blue-50 rounded-lg p-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Requêtes uniques</p>
                    <p className="text-2xl font-bold">{data.search.uniqueQueries.toLocaleString('fr-FR')}</p>
                  </div>
                  <Users className="h-10 w-10 text-purple-400 bg-purple-50 rounded-lg p-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Corrections auto</p>
                    <p className="text-2xl font-bold text-orange-600">{data.search.spellCorrectionUsed.toLocaleString('fr-FR')}</p>
                  </div>
                  <Sparkles className="h-10 w-10 text-orange-400 bg-orange-50 rounded-lg p-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Expansions utilisées</p>
                    <p className="text-2xl font-bold text-green-600">{data.search.queryExpansionUsed.toLocaleString('fr-FR')}</p>
                  </div>
                  <Eye className="h-10 w-10 text-green-400 bg-green-50 rounded-lg p-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Searches */}
            <Card>
              <CardHeader>
                <CardTitle>Recherches populaires</CardTitle>
                <CardDescription>Les termes les plus recherchés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.search.topSearches.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <span className="w-8 h-8 rounded-full bg-[#006233] text-white flex items-center justify-center font-bold text-sm">
                        #{index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{item.term}</p>
                        <p className="text-xs text-gray-500">{item.results} résultats</p>
                      </div>
                      <Badge variant="secondary">
                        {item.count.toLocaleString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* No Result Searches */}
            <Card>
              <CardHeader>
                <CardTitle>Recherches sans résultat</CardTitle>
                <CardDescription>Opportunités d'amélioration du catalogue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.search.noResultSearches.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div>
                        <p className="font-medium text-yellow-800">{item.term}</p>
                        <p className="text-xs text-yellow-600">{item.count} recherches</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                        Ajouter au catalogue
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Suggestion :</strong> Ces recherches pourraient représenter des opportunités 
                    pour élargir votre catalogue ou créer des alias de recherche.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
