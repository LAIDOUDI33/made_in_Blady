'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Download,
  Calendar,
  MapPin,
  BarChart3,
  Users,
  ShoppingCart,
  DollarSign,
  Activity,
  Clock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

// Chart components
import { WilayaHeatMap } from './charts/WilayaHeatMap';
import { SectorPerformanceChart } from './charts/SectorPerformanceChart';
import { RevenueWaterfall } from './charts/RevenueWaterfall';
import { CohortAnalysisChart } from './charts/CohortAnalysisChart';
import { FunnelVisualization } from './charts/FunnelVisualization';

// Types
import { 
  KPIData, 
  WilayaAnalytics, 
  SectorAnalytics, 
  CohortData, 
  FunnelStage, 
  ActivityEvent 
} from '@/lib/analytics/engine';

// ============== KPI Card Component ==============

interface KPICardProps {
  data: KPIData;
  metricName: string;
  isLoading?: boolean;
}

const formatValue = (value: number, metricId: string): string => {
  const currencyMetrics = ['total_revenue', 'net_revenue', 'avg_order_value', 'revenue_per_user', 'monthly_recurring_revenue', 'commission_earned', 'escrow_balance'];
  
  if (currencyMetrics.includes(metricId)) {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B DZD`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M DZD`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K DZD`;
    return `${value.toLocaleString()} DZD`;
  }
  
  const percentMetrics = ['conversion_rate', 'order_completion_rate', 'user_retention_rate', 'inquiry_rate', 'payment_success_rate', 'gross_margin'];
  
  if (percentMetrics.includes(metricId)) {
    return `${value.toFixed(1)}%`;
  }
  
  return value.toLocaleString();
};

const getMetricIcon = (metricId: string): React.ReactNode => {
  switch (metricId) {
    case 'total_revenue':
    case 'net_revenue':
    case 'commission_earned':
      return <DollarSign className="w-5 h-5" />;
    case 'total_orders':
    case 'completed_orders':
      return <ShoppingCart className="w-5 h-5" />;
    case 'active_users':
    case 'new_registrations':
    case 'buyer_count':
    case 'seller_count':
    case 'verified_companies':
      return <Users className="w-5 h-5" />;
    default:
      return <BarChart3 className="w-5 h-5" />;
  }
};

function KPICard({ data, metricName, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.changeDirection === 'up';
  const isNeutral = data.changeDirection === 'neutral';

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{metricName}</p>
          <div className={`p-2 rounded-lg ${
            isPositive ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' :
            isNeutral ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
            'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400'
          }`}>
            {getMetricIcon(data.metricId)}
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {formatValue(data.currentValue, data.metricId)}
          </p>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={isPositive ? 'default' : isNeutral ? 'secondary' : 'destructive'}
              className="gap-1 text-xs"
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : isNeutral ? (
                <Minus className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(data.changePercent)}%
            </Badge>
            <span className="text-xs text-muted-foreground">vs previous period</span>
          </div>
        </div>

        {/* Mini Sparkline */}
        {data.sparklineData && data.sparklineData.length > 0 && (
          <div className="mt-3 h-10 flex items-end gap-0.5">
            {data.sparklineData.slice(-14).map((val, idx) => {
              const maxVal = Math.max(...data.sparklineData.slice(-14));
              const minVal = Math.min(...data.sparklineData.slice(-14));
              const range = maxVal - minVal || 1;
              const height = ((val - minVal) / range) * 100;
              
              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-sm transition-all ${
                    isPositive ? 'bg-emerald-500/60' : isNeutral ? 'bg-gray-400/60' : 'bg-red-500/60'
                  }`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============== Activity Feed Component ==============

interface ActivityFeedProps {
  activities: ActivityEvent[];
  isLoading?: boolean;
}

function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'order_placed': return 'bg-blue-500';
      case 'user_registered': return 'bg-green-500';
      case 'company_verified': return 'bg-purple-500';
      case 'rfq_submitted': return 'bg-orange-500';
      case 'deal_closed': return 'bg-emerald-500';
      case 'payment_received': return 'bg-cyan-500';
      case 'product_listed': return 'bg-pink-500';
      case 'message_sent': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Real-Time Activity Feed
          </CardTitle>
          <Badge variant="outline" className="text-xs gap-1">
            <Clock className="w-3 h-3" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px] px-4 pb-4">
          <div className="space-y-1">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 py-2.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${getActivityColor(activity.type)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{activity.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Wilaya {activity.wilayaCode.toString().padStart(2, '0')}
                    </span>
                    {activity.amount && (
                      <span className="text-xs font-medium text-foreground">
                        {(activity.amount / 1000).toFixed(0)}K DZD
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ============== Main Executive Dashboard ==============

interface ExecutiveDashboardProps {
  className?: string;
}

export function ExecutiveDashboard({ className }: ExecutiveDashboardProps) {
  // State for all dashboard data
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [wilayaData, setWilayaData] = useState<WilayaAnalytics[]>([]);
  const [sectorData, setSectorData] = useState<SectorAnalytics[]>([]);
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Parallel fetch all data
      const [
        kpiRes,
        wilayaRes,
        sectorRes,
        cohortRes,
        funnelRes,
        activityRes
      ] = await Promise.all([
        fetch(`/api/analytics/executive?forceRefresh=${forceRefresh}`),
        fetch(`/api/analytics/geographic?topN=58`),
        fetch('/api/analytics/custom'),
        fetch('/api/analytics/trends?months=12'),
        fetch('/api/analytics/export?type=funnel'),
        fetch('/api/analytics/export?type=activity&limit=25')
      ]);

      // Check for errors
      if (!kpiRes.ok) throw new Error('Failed to fetch KPIs');
      
      // Parse responses
      const [kpiResult, wilayaResult, sectorResult, , funnelResult, activityResult] = await Promise.all([
        kpiRes.json(),
        wilayaRes.json(),
        sectorRes.json(),
        cohortRes.json(),
        funnelRes.json(),
        activityRes.json()
      ]);

      setKpiData(kpiResult.data || []);
      setWilayaData(wilayaResult.data || []);
      
      // Extract sectors from custom report config or use mock
      if (sectorResult.data?.metrics) {
        // Would need to call build report - using engine directly for now
        const { analyticsEngine } = await import('@/lib/analytics/engine');
        setSectorData(await analyticsEngine.getSectorAnalytics());
      } else {
        const { analyticsEngine } = await import('@/lib/analytics/engine');
        setSectorData(await analyticsEngine.getSectorAnalytics());
      }
      
      setCohortData((await import('@/lib/analytics/engine')).analyticsEngine.generateCohortAnalysis());
      setFunnelData(funnelResult.data || []);
      setActivityFeed(activityResult.data || []);
      
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Primary KPIs to display prominently
  const primaryKPIs = [
    { id: 'total_revenue', name: 'Total Revenue' },
    { id: 'total_orders', name: 'Total Orders' },
    { id: 'active_users', name: 'Active Users' },
    { id: 'new_registrations', name: 'New Signups' }
  ];

  const secondaryKPIs = [
    { id: 'completed_orders', name: 'Completed Orders' },
    { id: 'avg_order_value', name: 'Avg Order Value' },
    { id: 'seller_count', name: 'Active Sellers' },
    { id: 'buyer_count', name: 'Active Buyers' },
    { id: 'product_views', name: 'Product Views' },
    { id: 'conversion_rate', name: 'Conversion Rate' },
    { id: 'commission_earned', name: 'Commission Earned' },
    { id: 'verified_companies', name: 'Verified Companies' }
  ];

  if (error && !isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Failed to Load Dashboard</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">{error}</p>
            <Button onClick={() => fetchDashboardData(true)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Executive Analytics Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AlgeriaTrade.dz Business Intelligence Overview
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs gap-1">
            <Clock className="w-3 h-3" />
            Updated: {lastRefresh.toLocaleTimeString()}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryKPIs.map(kpi => {
          const kpiDatum = kpiData.find(k => k.metricId === kpi.id);
          return kpiDatum ? (
            <KPICard 
              key={kpi.id} 
              data={kpiDatum} 
              metricName={kpi.name}
              isLoading={isLoading}
            />
          ) : (
            <KPICard 
              key={kpi.id} 
              data={
                { metricId: kpi.id, currentValue: 0, previousValue: 0, changePercent: 0, changeDirection: 'neutral' as const, trend: [], sparklineData: [] }
              } 
              metricName={kpi.name}
              isLoading={isLoading}
            />
          );
        })}
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {secondaryKPIs.map(kpi => {
          const kpiDatum = kpiData.find(k => k.metricId === kpi.id);
          return kpiDatum ? (
            <KPICard 
              key={kpi.id} 
              data={kpiDatum} 
              metricName={kpi.name}
              isLoading={isLoading}
            />
          ) : null;
        }).filter(Boolean)}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="geographic" className="text-xs sm:text-sm">Geographic</TabsTrigger>
          <TabsTrigger value="sectors" className="text-xs sm:text-sm">Sectors</TabsTrigger>
          <TabsTrigger value="revenue" className="text-xs sm:text-sm">Revenue</TabsTrigger>
          <TabsTrigger value="retention" className="text-xs sm:text-sm hidden sm:inline-flex">Retention</TabsTrigger>
          <TabsTrigger value="funnel" className="text-xs sm:text-sm hidden md:inline-flex">Funnel</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs sm:text-sm hidden lg:inline-flex">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Geographic Summary */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Top Wilayas by Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {wilayaData
                      .sort((a, b) => b.totalRevenue - a.totalRevenue)
                      .slice(0, 5)
                      .map((wilaya, idx) => (
                        <div key={wilaya.code} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-yellow-500 text-white' :
                            idx === 1 ? 'bg-gray-400 text-white' :
                            idx === 2 ? 'bg-orange-600 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              {wilaya.name}
                              <span className="text-muted-foreground ml-1">({wilaya.code})</span>
                            </p>
                            <p className="text-xs text-muted-foreground">{wilaya.region} Region</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm text-foreground">
                              {(wilaya.totalRevenue / 1e6).toFixed(1)}M DZD
                            </p>
                            <p className={`text-xs ${wilaya.growthRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {wilaya.growthRate >= 0 ? '+' : ''}{wilaya.growthRate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <ActivityFeed activities={activityFeed} isLoading={isLoading} />
          </div>

          {/* Sector Quick View */}
          <SectorPerformanceChart data={sectorData} height={300} showDetails={false} />
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="mt-6">
          <WilayaHeatMap 
            data={wilayaData} 
            height={450}
            onWilayaClick={(code) => console.log('Wilaya clicked:', code)}
          />
        </TabsContent>

        {/* Sectors Tab */}
        <TabsContent value="sectors" className="mt-6">
          <SectorPerformanceChart data={sectorData} height={450} showDetails={true} />
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="mt-6">
          <RevenueWaterfall />
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="mt-6">
          <CohortAnalysisChart data={cohortData} height={400} showTable={true} />
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="mt-6">
          <FunnelVisualization data={funnelData} height={380} showProgressBars={true} />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <ActivityFeed activities={activityFeed} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ExecutiveDashboard;
