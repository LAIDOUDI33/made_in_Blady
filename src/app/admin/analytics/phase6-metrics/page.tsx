'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/admin/StatsCard';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Lock,
  Video,
  ClipboardCheck,
  Calendar,
  Truck,
  Users,
  DollarSign,
  Eye,
  Star,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw
} from 'lucide-react';

// Types
interface MetricDataPoint {
  label: string;
  value: number;
  previousValue?: number;
}

interface VerificationFunnelData {
  stage: string;
  count: number;
  percentage: number;
}

interface EscrowVolumeData {
  month: string;
  volume: number;
  transactions: number;
}

interface ExhibitionStats {
  name: string;
  registrations: number;
  attendance: number;
  boothsSold: number;
  totalBooths: number;
}

interface ShippingPerformance {
  region: string;
  shipments: number;
  onTimeRate: number;
  avgDeliveryDays: number;
  revenue: number;
}

interface CategoryTrend {
  category: string;
  growth: number;
  listings: number;
  views: number;
  inquiries: number;
}

// Sample data for Phase 6 metrics
const verificationFunnelData: VerificationFunnelData[] = [
  { stage: 'Demandes soumises', count: 245, percentage: 100 },
  { stage: 'En cours de revue', count: 189, percentage: 77 },
  { stage: 'Documents validés', count: 156, percentage: 64 },
  { stage: 'Approuvées', count: 134, percentage: 55 },
  { stage: 'Badges attribués', count: 128, percentage: 52 },
];

const escrowVolumeData: EscrowVolumeData[] = [
  { month: 'Jan', volume: 12500000, transactions: 45 },
  { month: 'Fév', volume: 15800000, transactions: 52 },
  { month: 'Mar', volume: 19200000, transactions: 68 },
  { month: 'Avr', volume: 22100000, transactions: 75 },
  { month: 'Mai', volume: 19800000, transactions: 64 },
  { month: 'Juin', volume: 28500000, transactions: 89 },
  { month: 'Juil', volume: 31200000, transactions: 98 },
  { month: 'Août', volume: 27600000, transactions: 87 },
];

const exhibitionStats: ExhibitionStats[] = [
  { name: 'SIA 2024', registrations: 87, attendance: 0, boothsSold: 87, totalBooths: 150 },
  { name: 'FCB2B Méd.', registrations: 23, attendance: 0, boothsSold: 23, totalBooths: 80 },
  { name: 'Tech Expo', registrations: 48, attendance: 1200, boothsSold: 48, totalBooths: 50 },
  { name: 'Agro Algérie', registrations: 0, attendance: 850, boothsSold: 42, totalBooths: 45 },
];

const shippingPerformance: ShippingPerformance[] = [
  { region: 'Nord (Alger, Blida, Boumerdès)', shipments: 1245, onTimeRate: 92, avgDeliveryDays: 1.8, revenue: 2850000 },
  { region: 'Ouest (Oran, Tlemcen, Sidi Bel Abbès)', shipments: 876, onTimeRate: 88, avgDeliveryDays: 2.3, revenue: 1920000 },
  { region: 'Est (Constantine, Annaba, Skikda)', shipments: 654, onTimeRate: 85, avgDeliveryDays: 2.5, revenue: 1450000 },
  { region: 'Sud (Ouargla, Tamanrasset, Adrar)', shipments: 234, onTimeRate: 78, avgDeliveryDays: 4.2, revenue: 780000 },
  { region: 'Hauts Plateaux (Sétif, M\'sila, Djelfa)', shipments: 567, onTimeRate: 82, avgDeliveryDays: 2.8, revenue: 1230000 },
];

const categoryTrends: CategoryTrend[] = [
  { category: 'Électronique & Informatique', growth: 24.5, listings: 892, views: 45600, inquiries: 1234 },
  { category: 'Machines Industrielles', growth: 18.2, listings: 445, views: 28900, inquiries: 678 },
  { category: 'Agriculture & Agroalimentaire', growth: 15.8, listings: 334, views: 19800, inquiries: 512 },
  { category: 'Matériaux Construction', growth: 12.3, listings: 567, views: 32400, inquiries: 789 },
  { category: 'Textile & Habillement', growth: 9.7, listings: 678, views: 41200, inquiries: 934 },
  { category: 'Produits Chimiques', growth: 8.4, listings: 234, views: 15600, inquiries: 345 },
  { category: 'Santé & Médical', growth: -3.2, listings: 156, views: 8900, inquiries: 234 },
  { category: 'Automobile & Pièces', growth: -1.5, listings: 445, views: 26700, inquiries: 567 },
];

export default function Phase6MetricsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate summary stats
  const totalVerificationRequests = verificationFunnelData[0].count;
  const approvalRate = verificationFunnelData[verificationFunnelData.length - 1].percentage;
  
  const currentMonthEscrow = escrowVolumeData[escrowVolumeData.length - 1];
  const previousMonthEscrow = escrowVolumeData[escrowVolumeData.length - 2];
  const escrowGrowth = ((currentMonthEscrow.volume - previousMonthEscrow.volume) / previousMonthEscrow.volume * 100).toFixed(1);
  
  const totalExhibitionRegistrations = exhibitionStats.reduce((sum, e) => sum + e.registrations, 0);
  const averageFillRate = Math.round(
    exhibitionStats.reduce((sum, e) => sum + (e.boothsSold / e.totalBooths * 100), 0) / exhibitionStats.filter(e => e.totalBooths > 0).length
  );
  
  const totalShipments = shippingPerformance.reduce((sum, s) => sum + s.shipments, 0);
  const averageOnTimeRate = Math.round(
    shippingPerformance.reduce((sum, s) => sum + s.onTimeRate, 0) / shippingPerformance.length
  );
  
  const topGrowingCategory = categoryTrends.sort((a, b) => b.growth - a.growth)[0];

  // Format helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { 
      style: 'currency', 
      currency: 'DZD',
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Phase 6</h1>
          <p className="text-gray-500 mt-1">Métriques et statistiques des nouveaux modules</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="12m">12 mois</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exporter
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="verification">Vérifications</TabsTrigger>
          <TabsTrigger value="escrow">Escrow</TabsTrigger>
          <TabsTrigger value="exhibitions">Expos.</TabsTrigger>
          <TabsTrigger value="shipping">Expédition</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Taux approbation"
              value={`${approvalRate}%`}
              description={`${totalVerificationRequests} demandes ce mois`}
              icon={ShieldCheck}
              iconClassName="bg-green-100 text-green-600"
              trend={{ value: approvalRate > 50 ? 5 : -3, isPositive: approvalRate > 50 }}
            />
            <StatsCard
              title="Volume Escrow"
              value={formatCurrency(currentMonthEscrow.volume)}
              description={`${currentMonthEscrow.transactions} transactions`}
              icon={Lock}
              iconClassName="bg-blue-100 text-blue-600"
              trend={{ value: parseFloat(escrowGrowth), isPositive: parseFloat(escrowGrowth) > 0 }}
            />
            <StatsCard
              title="Inscriptions expos."
              value={totalExhibitionRegistrations}
              description={`Taux remplissage ${averageFillRate}%`}
              icon={Calendar}
              iconClassName="bg-purple-100 text-purple-600"
              trend={{ value: 18, isPositive: true }}
            />
            <StatsCard
              title="Ponctualité livraison"
              value={`${averageOnTimeRate}%`}
              description={`${formatNumber(totalShipments)} expéditions`}
              icon={Truck}
              iconClassName="bg-orange-100 text-orange-600"
              trend={{ value: averageOnTimeRate > 85 ? 2 : -4, isPositive: averageOnTimeRate > 85 }}
            />
          </div>

          {/* Quick Insights Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Top Growing Category */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Catégorie tendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-lg">{topGrowingCategory.category}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-100 text-green-800">
                    +{topGrowingCategory.growth}%
                  </Badge>
                  <span className="text-sm text-gray-500">croissance</span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Annonces:</span>
                    <span>{formatNumber(topGrowingCategory.listings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vues:</span>
                    <span>{formatNumber(topGrowingCategory.views)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Demandes:</span>
                    <span>{formatNumber(topGrowingCategory.inquiries)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Moderation Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-4 w-4 text-purple-600" />
                  Modération contenu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">En attente</span>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">12</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Approuvés aujourd&apos;hui</span>
                    <Badge className="bg-green-100 text-green-800">28</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Signalés</span>
                    <Badge variant="destructive">3</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Temps moyen traitement</span>
                    <span className="font-medium">4.2h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inspections Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-blue-600" />
                  Inspections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">En attente assignation</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Planifiées cette semaine</span>
                    <Badge className="bg-blue-100 text-blue-800">14</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Terminées ce mois</span>
                    <Badge className="bg-green-100 text-green-800">42</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Revenus du mois</span>
                    <span className="font-medium text-green-700">{formatCurrency(890000)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Trends Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Tendances par catégorie produit</CardTitle>
                  <CardDescription>Croissance et performance des catégories</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Package className="mr-2 h-4 w-4" /> Voir toutes les catégories
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Catégorie</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Annonces</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Vues</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Demandes</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Croissance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryTrends.map((cat, index) => (
                      <tr key={cat.category} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="py-3 px-4 font-medium">{cat.category}</td>
                        <td className="py-3 px-4 text-right">{formatNumber(cat.listings)}</td>
                        <td className="py-3 px-4 text-right">{formatNumber(cat.views)}</td>
                        <td className="py-3 px-4 text-right">{formatNumber(cat.inquiries)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className={`inline-flex items-center gap-1 ${
                            cat.growth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {cat.growth >= 0 ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                            <span className="font-medium">{Math.abs(cat.growth)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Entonnoir de vérification
                </CardTitle>
                <CardDescription>Taux de conversion à chaque étape</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {verificationFunnelData.map((stage, index) => (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{stage.stage}</span>
                        <span className="text-sm text-gray-600">{stage.count} ({stage.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ 
                            width: `${stage.percentage}%`,
                            background: `linear-gradient(to right, #3b82f6, #1d4ed8)`
                          }}
                        >
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">{approvalRate}%</p>
                    <p className="text-xs text-green-600">Taux d&apos;approbation global</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">2.4j</p>
                    <p className="text-xs text-blue-600">Temps moyen de traitement</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vérifications par type</CardTitle>
                <CardDescription>Répartition des demandes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'Identité', count: 98, approved: 87, color: 'bg-blue-500' },
                    { type: 'Entreprise', count: 72, approved: 58, color: 'bg-purple-500' },
                    { type: 'Professionnel', count: 45, approved: 38, color: 'bg-orange-500' },
                    { type: 'Premium', count: 30, accepted: 25, color: 'bg-yellow-500' },
                  ].map((item) => (
                    <div key={item.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{item.type}</span>
                        <span className="text-sm text-gray-600">
                          {item.approx || item.approved || item.accepted}/{item.count} approuvés
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`${item.color} h-full rounded-full transition-all`}
                          style={{ width: `${((item.approx || item.approved || item.accepted) / item.count) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium mb-3">Badges attribués ce mois</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-100 text-green-800 px-3 py-1">Identité Vérifiée ×87</Badge>
                    <Badge className="bg-blue-100 text-blue-800 px-3 py-1">Entreprise Vérifiée ×58</Badge>
                    <Badge className="bg-purple-100 text-purple-800 px-3 py-1">Pro Certifié ×38</Badge>
                    <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">Premium ×25</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Escrow Tab */}
        <TabsContent value="escrow" className="mt-6 space-y-6">
          {/* Volume Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Volume des transactions Escrow
              </CardTitle>
              <CardDescription>Évolution mensuelle du volume et nombre de transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simple Bar Chart Representation */}
              <div className="space-y-4">
                <div className="flex items-end gap-2 h-48">
                  {escrowVolumeData.map((data, index) => {
                    const maxValue = Math.max(...escrowVolumeData.map(d => d.volume));
                    const height = (data.volume / maxValue) * 100;
                    return (
                      <div key={data.month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full relative group">
                          <div 
                            className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-md transition-all hover:from-green-700 hover:to-green-500 cursor-pointer"
                            style={{ height: `${height * 1.5}px` }}
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              {formatCurrency(data.volume)}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 font-medium">{data.month}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Volume total (8 mois)</p>
                    <p className="text-xl font-bold text-green-700">
                      {formatCurrency(escrowVolumeData.reduce((sum, d) => sum + d.volume, 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total transactions</p>
                    <p className="text-xl font-bold">
                      {formatNumber(escrowVolumeData.reduce((sum, d) => sum + d.transactions, 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Panier moyen</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(escrowVolumeData.reduce((sum, d) => sum + d.volume, 0) / escrowVolumeData.reduce((sum, d) => sum + d.transactions, 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Croissance</p>
                    <p className="text-xl font-bold text-green-600">+{escrowGrowth}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dispute Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-3xl font-bold">12</p>
                <p className="text-sm text-gray-500">Litiges actifs</p>
                <p className="text-xs text-green-600 mt-1">-15% vs mois dernier</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-3xl font-bold">3.2j</p>
                <p className="text-sm text-gray-500">Résolution moyenne</p>
                <p className="text-xs text-green-600 mt-1">-0.8j vs mois dernier</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-3xl font-bold">94%</p>
                <p className="text-sm text-gray-500">Taux résolution</p>
                <p className="text-xs text-green-600 mt-1">+2% vs mois dernier</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Exhibitions Tab */}
        <TabsContent value="exhibitions" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exhibition Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance des expositions</CardTitle>
                <CardDescription>Inscriptions et taux de remplissage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exhibitionStats.map((exhibition) => (
                    <div key={exhibition.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{exhibition.name}</h4>
                        <Badge variant={exhibition.registrations > 0 ? 'default' : 'secondary'}>
                          {exhibition.attendance > 0 ? 'Terminé' : exhibition.registrations > 0 ? 'Actif' : 'À venir'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Inscriptions</p>
                          <p className="font-semibold">{exhibition.registrations}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Stands vendus</p>
                          <p className="font-semibold">{exhibition.boothsSold}/{exhibition.totalBooths}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Remplissage</p>
                          <p className="font-semibold text-green-600">
                            {exhibition.totalBooths > 0 ? Math.round(exhibition.boothsSold / exhibition.totalBooths * 100) : 0}%
                          </p>
                        </div>
                      </div>

                      {exhibition.attendance > 0 && (
                        <div className="mt-2 pt-2 border-t text-sm">
                          <span className="text-gray-500">Assistance: </span>
                          <span className="font-medium">{exhibition.attendance.toLocaleString()} visiteurs</span>
                        </div>
                      )}

                      {/* Progress bar */}
                      {exhibition.totalBooths > 0 && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full"
                              style={{ width: `${(exhibition.boothsSold / exhibition.totalBooths) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Registration Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistiques globales</CardTitle>
                <CardDescription>Agrégations sur toutes les expositions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold">{totalExhibitionRegistrations}</p>
                    <p className="text-sm text-blue-700">Inscriptions totales</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <Calendar className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold">{averageFillRate}%</p>
                    <p className="text-sm text-green-700">Taux remplissage moyen</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <Star className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <p className="text-2xl font-bold">4.7</p>
                    <p className="text-sm text-purple-700">Satisfaction exposants</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <DollarSign className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                    <p className="text-2xl font-bold">{formatCurrency(12800000)}</p>
                    <p className="text-sm text-orange-700">Revenus stands</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium mb-3">Types de stands les plus populaires</h4>
                  <div className="space-y-2">
                    {[
                      { type: 'Standard (3×3m)', sold: 145, percent: 68 },
                      { type: 'Premium (4×4m)', sold: 48, percent: 22 },
                      { type: 'Coin (4×6m)', sold: 15, percent: 7 },
                      { type: 'Îlot (8×8m)', sold: 6, percent: 3 },
                    ].map((stand) => (
                      <div key={stand.type} className="flex items-center gap-3">
                        <span className="text-sm w-32 truncate">{stand.type}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${stand.percent}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-16 text-right">{stand.sold} vendus</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="mt-6 space-y-6">
          {/* Regional Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance par région</CardTitle>
              <CardDescription>Métriques de livraison par zone géographique</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Région</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Expéditions</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Ponctualité</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Délai moyen</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Revenus</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shippingPerformance.map((region) => (
                      <tr key={region.region} className="border-b hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium">{region.region}</td>
                        <td className="py-3 px-4 text-right">{formatNumber(region.shipments)}</td>
                        <td className="py-3 px-4 text-right">
                          <Badge 
                            variant={region.onTimeRate >= 90 ? 'default' : region.onTimeRate >= 80 ? 'secondary' : 'destructive'}
                            className={region.onTimeRate >= 90 ? 'bg-green-100 text-green-800' : region.onTimeRate >= 80 ? 'bg-yellow-100 text-yellow-800' : ''}
                          >
                            {region.onTimeRate}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">{region.avgDeliveryDays} jours</td>
                        <td className="py-3 px-4 text-right font-medium text-green-700">
                          {formatCurrency(region.revenue)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-full bg-gray-200 rounded-full h-2 mx-auto max-w-[80px]">
                            <div 
                              className={`h-2 rounded-full ${
                                region.onTimeRate >= 90 ? 'bg-green-500' :
                                region.onTimeRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${region.onTimeRate}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Truck className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-3xl font-bold">{formatNumber(totalShipments)}</p>
                <p className="text-sm text-gray-500">Expéditions totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-3xl font-bold">{averageOnTimeRate}%</p>
                <p className="text-sm text-gray-500">Taux ponctualité</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                <p className="text-3xl font-bold">2.6j</p>
                <p className="text-sm text-gray-500">Délai moyen livraison</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-3xl font-bold">{formatCurrency(shippingPerformance.reduce((sum, r) => sum + r.revenue, 0))}</p>
                <p className="text-sm text-gray-500">Revenus expédition</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
