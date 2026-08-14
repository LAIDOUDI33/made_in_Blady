'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  KPICard,
  TimeSeriesChart,
  FunnelChart,
  DataTable,
  GeoHeatmap,
  RealTimeDashboard,
} from '@/components/analytics';
import {
  DollarSign,
  Users,
  TrendingUp,
  ShoppingCart,
  UserPlus,
  FileText,
  Package,
  Building2,
  Eye,
  Activity,
  RefreshCw,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Funnel,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface KPIData {
  [key: string]: {
    value: number | string;
    change?: string | null;
    prefix?: string;
    suffix?: string;
    format?: 'number' | 'currency' | 'percentage' | 'decimal';
    sparklineData?: number[];
  };
}

interface TrafficDataPoint {
  date: string;
  pageViews: number;
  uniquePageViews: number;
  newUsers: number;
  returningUsers: number;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
  cib: number;
  ccp: number;
  baridiMob: number;
  bankTransfer: number;
  cod: number;
}

interface FunnelStage {
  name: string;
  nameFr: string;
  value: number;
  percentage: number;
  conversionRate?: number;
  dropOffRate?: number;
}

interface TopProduct {
  id: string;
  name: string;
  category: string;
  views: number;
  change: number;
}

interface TopSupplier {
  id: string;
  name: string;
  wilaya: string;
  responseRate: number;
  rating: number;
  quotationsSent: number;
  ordersReceived: number;
}

interface TopCategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  rfqCount: number;
  growth: number;
}

interface SearchTerm {
  term: string;
  count: number;
  results: number;
  clickThroughRate: number;
  trend: 'up' | 'down' | 'stable';
}

// ============================================
// Main Analytics Dashboard Component
// ============================================

export default function AdminAnalyticsDashboard() {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [kpiData, setKpiData] = useState<KPIData>({});
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [buyerFunnel, setBuyerFunnel] = useState<FunnelStage[]>([]);
  const [supplierFunnel, setSupplierFunnel] = useState<FunnelStage[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<TopSupplier[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [topSearches, setTopSearches] = useState<SearchTerm[]>([]);
  const [wilayaData, setWilayaData] = useState<Array<{ code: string; name: string; value: number; change?: number }>>([]);

  // Fetch all data
  const fetchAllData = useCallback(async (range: string) => {
    setIsLoading(true);

    try {
      // Fetch all data in parallel
      const [
        overviewRes,
        trafficRes,
        revenueRes,
        funnelsRes,
        topListsRes,
      ] = await Promise.all([
        fetch(`/api/admin/analytics/overview?range=${range}`),
        fetch(`/api/admin/analytics/traffic?range=${range}`),
        fetch(`/api/admin/analytics/revenue?range=${range}`),
        fetch('/api/admin/analytics/funnels?type=all'),
        fetch('/api/admin/analytics/top-lists'),
      ]);

      const [overview, traffic, revenue, funnels, topLists] = await Promise.all([
        overviewRes.json(),
        trafficRes.json(),
        revenueRes.json(),
        funnelsRes.json(),
        topListsRes.json(),
      ]);

      if (overview.success) setKpiData(overview.data);
      if (traffic.success) setTrafficData(traffic.data);
      if (revenue.success) setRevenueData(revenue.data.byPeriod);
      if (funnels.success) {
        const buyerJourney = funnels.data.buyerJourney as { stages: FunnelStage[] } | undefined;
        const supplierOnboarding = funnels.data.supplierOnboarding as { stages: FunnelStage[] } | undefined;
        setBuyerFunnel(buyerJourney?.stages || []);
        setSupplierFunnel(supplierOnboarding?.stages || []);
      }
      if (topLists.success) {
        setTopProducts(topLists.data.topProducts || []);
        setTopSuppliers(topLists.data.topSuppliers || []);
        setTopCategories(topLists.data.topCategories || []);
        setTopSearches(topLists.data.topSearches || []);
      }

      // Generate mock wilaya data for Algeria
      generateWilayaData();
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchAllData(selectedRange);
  }, [fetchAllData, selectedRange]);

  // Handle refresh
  const handleRefresh = () => {
    fetchAllData(selectedRange);
  };

  // Generate mock wilaya data for Algeria
  const generateWilayaData = () => {
    const algerianWilayas = [
      { code: '16', name: 'Alger' },
      { code: '31', name: 'Oran' },
      { code: '06', name: 'Béjaïa' },
      { code: '15', name: 'Tizi Ouzou' },
      { code: '19', name: 'Sétif' },
      { code: '13', name: 'Tlemcen' },
      { code: '25', name: 'Constantine' },
      { code: '40', name: 'Khenchela' },
      { code: '28', name: 'Mostaganem' },
      { code: '44', name: 'Aïn Defla' },
      { code: '34', name: 'Bordj Bou Arréridj' },
      { code: '12', name: 'Tébessa' },
      { code: '43', name: 'Mila' },
      { code: '23', name: 'Annaba' },
      { code: '18', name: 'Jijel' },
      { code: '35', name: 'Boumerdès' },
      { code: '09', name: 'Blida' },
      { code: '10', name: 'Bouira' },
      { code: '14', name: 'Tiaret' },
      { code: '21', name: 'Skikda' },
      { code: '42', name: 'Tipaza' },
      { code: '29', name: 'Mascara' },
      { code: '46', name: 'Relizane' },
      { code: '24', name: 'Guelma' },
      { code: '17', name: 'Djelfa' },
      { code: '05', name: 'Batna' },
      { code: '20', name: "Saïda" },
      { code: '22', name: 'Sidi Bel Abbès' },
      { code: '08', name: 'Béchar' },
      { code: '07', name: 'Biskra' },
      { code: '30', name: 'Ouargla' },
      { code: '33', name: 'Illizi' },
      { code: '39', name: 'El Oued' },
      { code: '41', name: 'Souk Ahras' },
      { code: '36', name: 'El Tarf' },
      { code: '37', name: 'Tindouf' },
      { code: '38', name: 'Tissemsilt' },
      { code: '45', name: "Naâma" },
      { code: '47', name: 'Ghardaïa' },
      { code: '48', name: 'Timimoun' },
      { code: '11', name: 'Tamanrasset' },
      { code: '49', name: 'Bordj Badji Mokhtar' },
      { code: '51', name: 'Béni Abbès' },
      { code: '52', name: 'In Salah' },
      { code: '53', name: 'In Guezzam' },
      { code: '54', name: 'Touggourt' },
      { code: '55', name: 'Djanet' },
      { code: '56', name: 'El M\'Ghair' },
      { code: '57', name: 'El Menia' },
    ];

    const data = algerianWilayas.map(wilaya => ({
      ...wilaya,
      value: Math.floor(Math.random() * 2000) + 100,
      change: parseFloat((Math.random() * 30 - 10).toFixed(1)),
    })).sort((a, b) => b.value - a.value);

    setWilayaData(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                Tableau de Bord Analytique
              </h1>
              <p className="text-muted-foreground mt-1">
                Vue d&apos;ensemble complète des performances d&apos;AlgeriaTrade.dz
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Range Selector */}
              <div className="flex items-center border rounded-lg p-1">
                {['7d', '30d', '90d', '1y'].map((range) => (
                  <Button
                    key={range}
                    variant={selectedRange === range ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedRange(range)}
                    className="text-xs"
                  >
                    {range === '7d' ? '7 jours' : 
                     range === '30d' ? '30 jours' : 
                     range === '90d' ? '90 jours' : '1 an'}
                  </Button>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Section 1: KPI Cards */}
        <section aria-label="Indicateurs clés de performance">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <KPICard
              title="Chiffre d'Affaires"
              value={kpiData.revenue?.value ?? 0}
              change={kpiData.revenue?.change ? parseFloat(kpiData.revenue.change) : undefined}
              icon={DollarSign}
              color="green"
              sparklineData={kpiData.revenue?.sparklineData}
              suffix=" DZD"
              format="currency"
              isLoading={isLoading}
            />

            <KPICard
              title="Utilisateurs Actifs"
              value={kpiData.activeUsers?.value ?? 0}
              change={kpiData.activeUsers?.change ? parseFloat(kpiData.activeUsers.change) : undefined}
              icon={Users}
              color="blue"
              sparklineData={kpiData.activeUsers?.sparklineData}
              isLoading={isLoading}
            />

            <KPICard
              title="Taux de Conversion"
              value={kpiData.conversionRate?.value ?? 0}
              change={kpiData.conversionRate?.change ? parseFloat(kpiData.conversionRate.change) : undefined}
              icon={TrendingUp}
              color="purple"
              suffix="%"
              format="percentage"
              isLoading={isLoading}
            />

            <KPICard
              title="Panier Moyen"
              value={kpiData.avgOrderValue?.value ?? 0}
              change={kpiData.avgOrderValue?.change ? parseFloat(kpiData.avgOrderValue.change) : undefined}
              icon={ShoppingCart}
              color="orange"
              suffix=" DZD"
              format="currency"
              isLoading={isLoading}
            />

            <KPICard
              title="Nouveaux Inscrits"
              value={kpiData.newSignups?.value ?? 0}
              change={kpiData.newSignups?.change ? parseFloat(kpiData.newSignups.change) : undefined}
              icon={UserPlus}
              color="green"
              isLoading={isLoading}
            />

            <KPICard
              title="RFQs Postés"
              value={kpiData.rfqsPosted?.value ?? 0}
              change={kpiData.rfqsPosted?.change ? parseFloat(kpiData.rfqsPosted.change) : undefined}
              icon={FileText}
              color="blue"
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* Additional KPI Row */}
        <section aria-label="Statistiques supplémentaires">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard
              title="Total Produits"
              value={kpiData.totalProducts?.value ?? 0}
              change={kpiData.totalProducts?.change ? parseFloat(kpiData.totalProducts.change) : undefined}
              icon={Package}
              color="default"
              isLoading={isLoading}
            />

            <KPICard
              title="Fournisseurs Vérifiés"
              value={kpiData.verifiedSuppliers?.value ?? 0}
              change={kpiData.verifiedSuppliers?.change ? parseFloat(kpiData.verifiedSuppliers.change) : undefined}
              icon={Building2}
              color="green"
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* Real-time Counter */}
        <section aria-label="Données en temps réel">
          <RealTimeDashboard />
        </section>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d&apos;ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="traffic" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Trafic</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Revenus</span>
            </TabsTrigger>
            <TabsTrigger value="funnels" className="gap-2">
              <Funnel className="h-4 w-4" />
              <span className="hidden sm:inline">Tunnels</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Détails</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Traffic Overview Chart */}
              <TimeSeriesChart
                title="Évolution du Trafic"
                data={trafficData}
                series={[
                  { key: 'pageViews', name: 'Pages Vues', color: '#006233' },
                  { key: 'uniquePageViews', name: 'Visiteurs Uniques', color: '#2563eb' },
                  { key: 'newUsers', name: 'Nouveaux Utilisateurs', color: '#9333ea' },
                ]}
                height={300}
                defaultRange={selectedRange as '7d' | '30d' | '90d' | '1y'}
                allowExport
              />

              {/* Revenue Overview Chart */}
              <TimeSeriesChart
                title="Évolution des Revenus"
                data={revenueData}
                series={[
                  { key: 'revenue', name: 'Revenus (DZD)', color: '#006233' },
                  { key: 'orders', name: 'Commandes', color: '#ea580c' },
                ]}
                height={300}
                chartType="bar"
                defaultRange={selectedRange as '7d' | '30d' | '90d' | '1y'}
                allowExport
                valueFormatter={(value) => `${value.toLocaleString('fr-DZ')} DZD`}
              />
            </div>

            {/* Wilaya Heatmap */}
            <GeoHeatmap
              data={wilayaData}
              onWilayaClick={(wilaya) => console.log('Wilaya clicked:', wilaya)}
              showValues
            />
          </TabsContent>

          {/* Tab: Traffic */}
          <TabsContent value="traffic" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <TimeSeriesChart
                title="Analyse Détaillée du Trafic"
                data={trafficData}
                series={[
                  { key: 'pageViews', name: 'Pages Vues', color: '#006233' },
                  { key: 'uniquePageViews', name: 'Visiteurs Uniques', color: '#2563eb' },
                  { key: 'newUsers', name: 'Nouveaux', color: '#16a34a' },
                  { key: 'returningUsers', name: 'Retours', color: '#ea580c' },
                ]}
                height={350}
                defaultRange={selectedRange as '7d' | '30d' | '90d' | '1y'}
                showGrid
                showLegend
                allowExport
              />

              <TimeSeriesChart
                title="Sources de Trafic"
                data={trafficData.map(d => ({
                  ...d,
                  organic: d.pageViews * 0.45,
                  direct: d.pageViews * 0.30,
                  referral: d.pageViews * 0.25,
                }))}
                series={[
                  { key: 'organic', name: 'Recherche Organique', color: '#22c55e' },
                  { key: 'direct', name: 'Accès Direct', color: '#3b82f6' },
                  { key: 'referral', name: 'Référence', color: '#f59e0b' },
                ]}
                height={250}
                chartType="area"
                stacked
                defaultRange={selectedRange as '7d' | '30d' | '90d' | '1y'}
              />
            </div>
          </TabsContent>

          {/* Tab: Revenue */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <TimeSeriesChart
                title="Revenus par Période"
                data={revenueData}
                series={[
                  { key: 'revenue', name: 'Revenus Totaux', color: '#006233' },
                ]}
                height={300}
                chartType="bar"
                defaultRange={selectedRange as '7d' | '30d' | '90d' | '1y'}
                valueFormatter={(value) => `${value.toLocaleString('fr-DZ')} DZD`}
                allowExport
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-muted-foreground" />
                    Répartition par Moyen de Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentMethodDistribution />
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Payment Method Over Time */}
            <TimeSeriesChart
              title="Revenus par Moyen de Paiement"
              data={revenueData.filter(d => d.revenue > 0)}
              series={[
                { key: 'cib', name: 'CIB (Carte)', color: '#006233' },
                { key: 'ccp', name: 'CCP (Poste)', color: '#2563eb' },
                { key: 'baridiMob', name: 'BaridiMob', color: '#ea580c' },
                { key: 'bankTransfer', name: 'Virement', color: '#9333ea' },
                { key: 'cod', name: 'Paiement Livraison', color: '#6b7280' },
              ]}
              height={280}
              chartType="area"
              stacked
              defaultRange={selectedRange as '7d' | '30d' | '90d' | '1y'}
            />
          </TabsContent>

          {/* Tab: Funnels */}
          <TabsContent value="funnels" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Buyer Journey Funnel */}
              <FunnelChart
                title="Tunnel de Conversion - Acheteur"
                stages={buyerFunnel}
                color="#006233"
                showPercentages
                showConversionRates
                onStageClick={(stage) => console.log('Buyer stage clicked:', stage)}
              />

              {/* Supplier Onboarding Funnel */}
              <FunnelChart
                title="Tunnel d&apos;Onboarding - Fournisseur"
                stages={supplierFunnel}
                color="#2563eb"
                showPercentages
                showConversionRates
                onStageClick={(stage) => console.log('Supplier stage clicked:', stage)}
              />
            </div>

            {/* Funnel Comparison Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Comparaison des Tunnels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Métrique</th>
                        <th className="text-right py-3 px-4 font-medium">Acheteur</th>
                        <th className="text-right py-3 px-4 font-medium">Fournisseur</th>
                        <th className="text-right py-3 px-4 font-medium">Différence</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">Conversion Totale</td>
                        <td className="text-right py-3 px-4 font-mono">
                          {buyerFunnel.length > 0 ? buyerFunnel[buyerFunnel.length - 1]?.percentage.toFixed(1) : '-'}%
                        </td>
                        <td className="text-right py-3 px-4 font-mono">
                          {supplierFunnel.length > 0 ? supplierFunnel[supplierFunnel.length - 1]?.percentage.toFixed(1) : '-'}%
                        </td>
                        <td className="text-right py-3 px-4">
                          <Badge variant={((buyerFunnel[buyerFunnel.length - 1]?.percentage || 0) > (supplierFunnel[supplierFunnel.length - 1]?.percentage || 0)) ? 'default' : 'secondary'}>
                            {Math.abs(((buyerFunnel[buyerFunnel.length - 1]?.percentage || 0) - (supplierFunnel[supplierFunnel.length - 1]?.percentage || 0))).toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">Plus Grosse Perte</td>
                        <td className="text-right py-3 px-4 font-mono">
                          {buyerFunnel.reduce((max, s) => (s.dropOffRate || 0) > max ? s.dropOffRate || 0 : max, 0).toFixed(1)}%
                        </td>
                        <td className="text-right py-3 px-4 font-mono">
                          {supplierFunnel.reduce((max, s) => (s.dropOffRate || 0) > max ? s.dropOffRate || 0 : max, 0).toFixed(1)}%
                        </td>
                        <td className="text-right py-3 px-4">-</td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="py-3 px-4">Nombre d&apos;Étapes</td>
                        <td className="text-right py-3 px-4 font-mono">{buyerFunnel.length}</td>
                        <td className="text-right py-3 px-4 font-mono">{supplierFunnel.length}</td>
                        <td className="text-right py-3 px-4">{Math.abs(buyerFunnel.length - supplierFunnel.length)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Details (Tables) */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Top Products Table */}
              <DataTable
                title="Top Produits par Vues"
                columns={[
                  { key: 'name', header: 'Produit', render: (val) => <span className="font-medium">{String(val)}</span> },
                  { key: 'category', header: 'Catégorie' },
                  { key: 'views', header: 'Vues', sortable: true, render: (val) => Number(val).toLocaleString('fr-DZ') },
                  { key: 'change', header: 'Tendance', sortable: true },
                ]}
                data={topProducts as Record<string, unknown>[]}
                searchable
                searchPlaceholder="Rechercher un produit..."
                pageSize={8}
                trendKey="change"
              />

              {/* Top Suppliers Table */}
              <DataTable
                title="Meilleurs Fournisseurs"
                columns={[
                  { key: 'name', header: 'Fournisseur', render: (val) => <span className="font-medium">{String(val)}</span> },
                  { key: 'wilaya', header: 'Wilaya' },
                  { key: 'responseRate', header: 'Taux Réponse', sortable: true, render: (val) => `${Number(val).toFixed(1)}%` },
                  { key: 'rating', header: 'Note', sortable: true },
                  { key: 'quotationsSent', header: 'Devis Envoyés', sortable: true },
                ]}
                data={topSuppliers as Record<string, unknown>[]}
                searchable
                searchPlaceholder="Rechercher un fournisseur..."
                pageSize={8}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Top Categories Table */}
              <DataTable
                title="Catégories Populaires"
                columns={[
                  { key: 'name', header: 'Catégorie', render: (val) => <span className="font-medium">{String(val)}</span> },
                  { key: 'productCount', header: 'Produits', sortable: true },
                  { key: 'rfqCount', header: 'RFQs', sortable: true },
                  { key: 'growth', header: 'Croissance', sortable: true, trendKey: 'growth' },
                ]}
                data={topCategories as Record<string, unknown>[]}
                pageSize={8}
              />

              {/* Top Search Terms Table */}
              <DataTable
                title="Termes de Recherche Populaires"
                columns={[
                  { key: 'term', header: 'Terme de Recherche', render: (val) => <span className="font-medium">{String(val)}</span> },
                  { key: 'count', header: 'Recherches', sortable: true },
                  { key: 'results', header: 'Résultats' },
                  { key: 'clickThroughRate', header: 'CTR', sortable: true, render: (val) => `${Number(val).toFixed(1)}%` },
                  { key: 'trend', header: 'Tendance', render: (val) => (
                    <Badge variant={
                      val === 'up' ? 'default' :
                      val === 'down' ? 'destructive' : 'secondary'
                    }>
                      {val === 'up' ? '↑ Hausse' : val === 'down' ? '↓ Baisse' : '→ Stable'}
                    </Badge>
                  )},
                ]}
                data={topSearches as Record<string, unknown>[]}
                searchable
                searchPlaceholder="Rechercher un terme..."
                pageSize={8}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer with timestamp */}
        <footer className="text-center text-sm text-muted-foreground py-4 border-t">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Dernière mise à jour: {new Date().toLocaleString('fr-DZ')}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ============================================
// Payment Method Distribution Component
// ============================================

function PaymentMethodDistribution() {
  const methods = [
    { name: 'CIB (Carte Bancaire)', percentage: 42, color: '#006233', amount: 2450000 },
    { name: 'BaridiMob', percentage: 28, color: '#2563eb', amount: 1630000 },
    { name: 'Virement Bancaire', percentage: 15, color: '#9333ea', amount: 875000 },
    { name: 'CCP (Chèque Postal)', percentage: 10, color: '#ea580c', amount: 583000 },
    { name: 'Paiement à la Livraison', percentage: 5, color: '#6b7280', amount: 292000 },
  ];

  return (
    <div className="space-y-4">
      {methods.map((method) => (
        <div key={method.name} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{method.name}</span>
            <span className="font-medium">{method.percentage}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${method.percentage}%`,
                backgroundColor: method.color,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {(method.amount / 1000).toLocaleString('fr-DZ')} kDZD
          </p>
        </div>
      ))}
    </div>
  );
}
